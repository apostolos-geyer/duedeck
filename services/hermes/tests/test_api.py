"""Tests for the Hermes document parsing service."""

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from src.main import settings


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _upload_dummy(s3_client, bucket, key: str, body: bytes = b"fake pdf"):
    """Upload a dummy file to S3 so head_object succeeds."""
    s3_client.put_object(Bucket=bucket, Key=key, Body=body)


def _cleanup(s3_client, bucket, *keys: str):
    for key in keys:
        s3_client.delete_object(Bucket=bucket, Key=key)


# ---------------------------------------------------------------------------
# 1. Health endpoint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# 2. /parse returns 202 with valid request
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_returns_202(client, s3_client, bucket):
    _upload_dummy(s3_client, bucket, "test.pdf")
    with patch("src.main._do_parse", new_callable=AsyncMock):
        resp = await client.post("/parse", json={
            "s3_key": "test.pdf",
            "webhook_url": "http://localhost:9999/hook",
            "webhook_token": "tok_123",
        })
        assert resp.status_code == 202
        body = resp.json()
        assert body["status"] == "accepted"
        assert body["s3_key"] == "test.pdf"
    _cleanup(s3_client, bucket, "test.pdf")


# ---------------------------------------------------------------------------
# 3. /parse rejects missing fields
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_rejects_missing_fields(client):
    resp = await client.post("/parse", json={"s3_key": "test.pdf"})
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 4. /parse with optional fields
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_accepts_optional_fields(client, s3_client, bucket):
    _upload_dummy(s3_client, bucket, "test.pdf")
    with patch("src.main._do_parse", new_callable=AsyncMock):
        resp = await client.post("/parse", json={
            "s3_key": "test.pdf",
            "webhook_url": "http://localhost:9999/hook",
            "webhook_token": "tok_123",
            "lang": "ch",
            "backend": "pipeline",
            "parse_method": "ocr",
        })
        assert resp.status_code == 202
    _cleanup(s3_client, bucket, "test.pdf")


# ---------------------------------------------------------------------------
# 5. /parse rejects missing S3 key
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_rejects_missing_s3_object(client):
    resp = await client.post("/parse", json={
        "s3_key": "does-not-exist.pdf",
        "webhook_url": "http://localhost:9999/hook",
        "webhook_token": "tok_123",
    })
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 6. /parse rejects oversized documents
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_rejects_oversized_document(client, s3_client, bucket):
    key = "too-big.pdf"
    # Upload a file and patch settings to have a tiny limit
    _upload_dummy(s3_client, bucket, key, body=b"x" * 1000)
    original = settings.max_document_size
    settings.max_document_size = 100  # 100 bytes
    try:
        resp = await client.post("/parse", json={
            "s3_key": key,
            "webhook_url": "http://localhost:9999/hook",
            "webhook_token": "tok_123",
        })
        assert resp.status_code == 413
    finally:
        settings.max_document_size = original
        _cleanup(s3_client, bucket, key)


# ---------------------------------------------------------------------------
# 7. S3 integration: upload and download roundtrip via MinIO
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_s3_roundtrip(s3_client, bucket):
    key = "test-roundtrip.txt"
    body = b"hello from test"

    s3_client.put_object(Bucket=bucket, Key=key, Body=body)
    obj = s3_client.get_object(Bucket=bucket, Key=key)
    data = obj["Body"].read()
    assert data == body

    _cleanup(s3_client, bucket, key)


# ---------------------------------------------------------------------------
# 8. End-to-end: upload a real PDF, parse it, verify markdown in S3
# ---------------------------------------------------------------------------

def _make_simple_pdf() -> bytes:
    """Create a minimal PDF with text content using reportlab (already a mineru dep)."""
    import io

    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.setFont("Helvetica", 14)
    c.drawString(100, 700, "DueDeck Test Document")
    c.drawString(100, 670, "Assignment 1 is due on March 15, 2026.")
    c.drawString(100, 640, "Midterm exam on April 2, 2026.")
    c.save()
    return buf.getvalue()


class WebhookHandler(BaseHTTPRequestHandler):
    """Tiny HTTP server to capture the webhook callback."""

    received = []

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        WebhookHandler.received.append(body)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, format, *args):
        pass  # Suppress request logging


@pytest.mark.asyncio
async def test_e2e_parse_pdf(s3_client, bucket, client):
    """Full end-to-end: upload PDF to S3 -> POST /parse -> verify webhook + S3 output."""
    WebhookHandler.received.clear()

    # 1. Start a webhook receiver
    server = HTTPServer(("127.0.0.1", 0), WebhookHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.handle_request, daemon=True)
    thread.start()

    # 2. Upload a test PDF to MinIO
    pdf_bytes = _make_simple_pdf()
    s3_key = "e2e-test-doc.pdf"
    s3_client.put_object(Bucket=bucket, Key=s3_key, Body=pdf_bytes)

    # 3. Call /parse (this triggers background processing)
    resp = await client.post("/parse", json={
        "s3_key": s3_key,
        "webhook_url": f"http://127.0.0.1:{port}/webhook",
        "webhook_token": "e2e_tok_456",
        "lang": "en",
        "backend": "pipeline",
        "parse_method": "auto",
    })
    assert resp.status_code == 202

    # 4. Wait for background task + webhook (up to 120s for model download on first run)
    thread.join(timeout=120)

    # 5. Verify webhook was called
    assert len(WebhookHandler.received) == 1, f"Expected 1 webhook call, got {len(WebhookHandler.received)}"
    hook_data = WebhookHandler.received[0]
    assert hook_data["token"] == "e2e_tok_456"
    assert hook_data["s3_key"] == s3_key
    assert hook_data["status"] == "completed", f"Parse failed: {hook_data.get('error')}"

    # 6. Verify parsed markdown exists in S3
    output_key = hook_data["output_s3_key"]
    assert output_key == "e2e-test-doc.parsed.md"

    obj = s3_client.get_object(Bucket=bucket, Key=output_key)
    md_content = obj["Body"].read().decode("utf-8")
    assert len(md_content) > 0, "Parsed markdown is empty"

    print(f"\n--- Parsed markdown ({len(md_content)} chars) ---")
    print(md_content[:500])

    # 7. Cleanup
    _cleanup(s3_client, bucket, s3_key, output_key)
