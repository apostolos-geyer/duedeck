from __future__ import annotations

import asyncio
import os
import tempfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

# MinerU expects a USERNAME env var; Windows may not set one in all contexts
if "USERNAME" not in os.environ and "USER" not in os.environ:
    os.environ["USERNAME"] = os.getenv("COMPUTERNAME", "duedeck")

import boto3
import httpx
from botocore.exceptions import ClientError
from fastapi import BackgroundTasks, FastAPI, HTTPException
from pydantic import BaseModel, ByteSize
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ("../../.env", ".env"), "extra": "ignore"}

    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "duedeck"
    s3_secret_key: str = "duedeck123"
    s3_bucket: str = "uploads"
    s3_region: str = "us-east-1"
    max_document_size: ByteSize = "50MB"

    # GPU / device settings
    gpu_memory_gb: int = 64  # PyTorch max memory allocation in GB
    device: str = "mps"  # "mps" for Apple Silicon, "cuda" for NVIDIA, "cpu" to disable
    max_parse_workers: int = 4  # concurrent parse jobs


settings = Settings()

# Configure GPU memory before any torch import
if settings.device == "mps":
    # Apple Silicon: allow PyTorch to use up to the full unified memory
    os.environ.setdefault("PYTORCH_MPS_HIGH_WATERMARK_RATIO", "0.0")  # no limit
elif settings.device == "cuda":
    os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", f"max_split_size_mb:{settings.gpu_memory_gb * 1024}")

app = FastAPI(title="Hermes", version="0.1.0")
_parse_pool: ProcessPoolExecutor | None = None


@app.on_event("startup")
async def _startup():
    global _parse_pool
    _parse_pool = ProcessPoolExecutor(max_workers=settings.max_parse_workers)


@app.on_event("shutdown")
async def _shutdown():
    if _parse_pool:
        _parse_pool.shutdown(wait=False)

s3 = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
    region_name=settings.s3_region,
)


class ParseRequest(BaseModel):
    s3_key: str
    webhook_url: str
    webhook_token: str
    lang: str = "en"
    backend: str = "pipeline"
    parse_method: str = "auto"


class ParseAccepted(BaseModel):
    status: str = "accepted"
    s3_key: str


class ErrorDetail(BaseModel):
    detail: str


class ParseResult(BaseModel):
    s3_key: str
    output_s3_key: str = ""
    content_list_s3_key: str = ""
    status: str  # "completed" | "failed"
    error: str | None = None


@app.post(
    "/parse",
    status_code=202,
    response_model=ParseAccepted,
    responses={
        404: {"model": ErrorDetail, "description": "S3 object not found"},
        413: {"model": ErrorDetail, "description": "Document exceeds size limit"},
    },
)
async def parse(req: ParseRequest, background_tasks: BackgroundTasks):
    # Check file exists and isn't too large before accepting
    try:
        head = s3.head_object(Bucket=settings.s3_bucket, Key=req.s3_key)
    except ClientError as e:
        if e.response["Error"]["Code"] == "404":
            raise HTTPException(status_code=404, detail=f"Object {req.s3_key} not found in bucket")
        raise

    size = head["ContentLength"]
    if size > settings.max_document_size:
        raise HTTPException(
            status_code=413,
            detail=f"Document size ({size} bytes) exceeds limit ({settings.max_document_size} bytes)",
        )

    background_tasks.add_task(_do_parse, req)
    return {"status": "accepted", "s3_key": req.s3_key}


@app.get("/health")
async def health():
    return {"status": "ok"}


def _sync_parse(req_data: dict, s3_config: dict) -> dict:
    """Run MinerU parsing in a separate process (CPU/GPU-heavy work)."""
    from mineru.cli.fast_api import aio_do_parse, read_fn

    s3_client = boto3.client(
        "s3",
        endpoint_url=s3_config["endpoint"],
        aws_access_key_id=s3_config["access_key"],
        aws_secret_access_key=s3_config["secret_key"],
        region_name=s3_config["region"],
    )

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            pdf_path = Path(tmpdir) / "input.pdf"
            s3_client.download_file(s3_config["bucket"], req_data["s3_key"], str(pdf_path))

            pdf_bytes = read_fn(pdf_path)
            pdf_name = Path(req_data["s3_key"]).stem

            output_dir = str(Path(tmpdir) / "output")
            # aio_do_parse is async — run it in a new event loop for this process
            asyncio.run(
                aio_do_parse(
                    output_dir=output_dir,
                    pdf_file_names=[pdf_name],
                    pdf_bytes_list=[pdf_bytes],
                    p_lang_list=[req_data["lang"]],
                    backend=req_data["backend"],
                    parse_method=req_data["parse_method"],
                    formula_enable=True,
                    table_enable=True,
                    f_draw_layout_bbox=False,
                    f_draw_span_bbox=False,
                    f_dump_md=True,
                    f_dump_middle_json=False,
                    f_dump_model_output=False,
                    f_dump_orig_pdf=False,
                    f_dump_content_list=True,
                )
            )

            md_content = _find_markdown(output_dir, pdf_name, req_data["backend"], req_data["parse_method"])

            stem = req_data["s3_key"].rsplit(".", 1)[0]
            output_key = stem + ".parsed.md"
            s3_client.put_object(Bucket=s3_config["bucket"], Key=output_key, Body=md_content.encode("utf-8"))

            # Upload content_list JSON if generated
            content_list_s3_key = ""
            content_list_json = _find_content_list(output_dir, pdf_name, req_data["backend"], req_data["parse_method"])
            if content_list_json is not None:
                content_list_s3_key = stem + ".content_list.json"
                s3_client.put_object(Bucket=s3_config["bucket"], Key=content_list_s3_key, Body=content_list_json.encode("utf-8"))

            return {"s3_key": req_data["s3_key"], "output_s3_key": output_key, "content_list_s3_key": content_list_s3_key, "status": "completed", "error": None}
    except Exception as e:
        return {"s3_key": req_data["s3_key"], "output_s3_key": "", "status": "failed", "error": str(e)}


async def _do_parse(req: ParseRequest):
    """Dispatch parse to process pool, then call webhook with result."""
    loop = asyncio.get_running_loop()

    s3_config = {
        "endpoint": settings.s3_endpoint,
        "access_key": settings.s3_access_key,
        "secret_key": settings.s3_secret_key,
        "bucket": settings.s3_bucket,
        "region": settings.s3_region,
    }

    result_data = await loop.run_in_executor(
        _parse_pool,
        _sync_parse,
        req.model_dump(),
        s3_config,
    )

    result = ParseResult(**result_data)

    async with httpx.AsyncClient() as client:
        await client.post(
            req.webhook_url,
            json={"token": req.webhook_token, **result.model_dump()},
            timeout=10,
        )


def _find_markdown(output_dir: str, pdf_name: str, backend: str, parse_method: str) -> str:
    """Locate the generated .md file in MinerU's output directory structure."""
    # MinerU outputs to: output_dir/pdf_name/<backend_subdir>/pdf_name.md
    if backend.startswith("pipeline"):
        subdir = parse_method
    elif backend.startswith("vlm"):
        subdir = "vlm"
    elif backend.startswith("hybrid"):
        subdir = "hybrid"
    else:
        subdir = parse_method

    md_path = Path(output_dir) / pdf_name / subdir / f"{pdf_name}.md"
    if md_path.exists():
        return md_path.read_text(encoding="utf-8")

    # Fallback: search for any .md file
    for md_file in Path(output_dir).rglob("*.md"):
        return md_file.read_text(encoding="utf-8")

    raise FileNotFoundError(f"No markdown output found in {output_dir}")


def _find_content_list(output_dir: str, pdf_name: str, backend: str, parse_method: str) -> str | None:
    """Locate the content_list.json generated by MinerU, if it exists."""
    if backend.startswith("pipeline"):
        subdir = parse_method
    elif backend.startswith("vlm"):
        subdir = "vlm"
    elif backend.startswith("hybrid"):
        subdir = "hybrid"
    else:
        subdir = parse_method

    cl_path = Path(output_dir) / pdf_name / subdir / f"{pdf_name}_content_list.json"
    if cl_path.exists():
        return cl_path.read_text(encoding="utf-8")

    # Fallback: search for any content_list.json
    for cl_file in Path(output_dir).rglob("*content_list*.json"):
        return cl_file.read_text(encoding="utf-8")

    return None
