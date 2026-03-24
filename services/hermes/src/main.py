from __future__ import annotations

import os
import tempfile
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


settings = Settings()

app = FastAPI(title="Hermes", version="0.1.0")

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


async def _do_parse(req: ParseRequest):
    """Download PDF from S3, parse with MinerU, upload result, call webhook."""
    # Lazy import so the server starts fast and /health works without models
    from mineru.cli.fast_api import aio_do_parse, read_fn

    result: ParseResult
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # 1. Download PDF from S3
            pdf_path = Path(tmpdir) / "input.pdf"
            s3.download_file(settings.s3_bucket, req.s3_key, str(pdf_path))

            # 2. Read and convert to PDF bytes (handles images too)
            pdf_bytes = read_fn(pdf_path)
            pdf_name = Path(req.s3_key).stem

            # 3. Parse with MinerU
            output_dir = str(Path(tmpdir) / "output")
            await aio_do_parse(
                output_dir=output_dir,
                pdf_file_names=[pdf_name],
                pdf_bytes_list=[pdf_bytes],
                p_lang_list=[req.lang],
                backend=req.backend,
                parse_method=req.parse_method,
                formula_enable=True,
                table_enable=True,
                f_draw_layout_bbox=False,
                f_draw_span_bbox=False,
                f_dump_md=True,
                f_dump_middle_json=False,
                f_dump_model_output=False,
                f_dump_orig_pdf=False,
                f_dump_content_list=False,
            )

            # 4. Find the generated markdown
            md_content = _find_markdown(output_dir, pdf_name, req.backend, req.parse_method)

            # 5. Upload parsed markdown to S3
            output_key = req.s3_key.rsplit(".", 1)[0] + ".parsed.md"
            s3.put_object(Bucket=settings.s3_bucket, Key=output_key, Body=md_content.encode("utf-8"))

            result = ParseResult(
                s3_key=req.s3_key,
                output_s3_key=output_key,
                status="completed",
            )
    except Exception as e:
        result = ParseResult(
            s3_key=req.s3_key,
            status="failed",
            error=str(e),
        )

    # 6. Call webhook to resume workflow
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
