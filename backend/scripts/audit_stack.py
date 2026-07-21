"""Idempotent infrastructure readiness audit for the Echoes stack.

Run from ``backend/`` with ``python scripts/audit_stack.py``. The script never
prints secrets, only creates an ``audit-`` prefixed DynamoDB item, and removes
that item in a ``finally`` block. It intentionally does not call Replicate.
"""
from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

import aioboto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import dotenv_values

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
FRONTEND_ROOT = REPO_ROOT / "frontend"
DEFAULT_API_URL = "http://127.0.0.1:8000/api/v1"
PLACEHOLDERS = {"", "your_access_key_here", "your_secret_access_key_here", "your_token_here", "replace_with_a_long_random_secret"}


@dataclass(slots=True)
class Result:
    """One non-secret audit outcome."""

    name: str
    state: str
    detail: str


class Audit:
    """Collect results while keeping terminal output concise and actionable."""

    def __init__(self) -> None:
        self.results: list[Result] = []

    def add(self, name: str, state: str, detail: str) -> None:
        self.results.append(Result(name, state, detail))
        print(f"[{state:<4}] {name}: {detail}")

    def passed(self, name: str, detail: str) -> None:
        self.add(name, "PASS", detail)

    def warned(self, name: str, detail: str) -> None:
        self.add(name, "WARN", detail)

    def failed(self, name: str, detail: str) -> None:
        self.add(name, "FAIL", detail)

    def exit_code(self) -> int:
        return 1 if any(result.state == "FAIL" for result in self.results) else 0


def configured_value(values: dict[str, str | None], key: str) -> str | None:
    """Read an environment value without treating empty placeholders as configured."""
    value = os.environ.get(key, values.get(key))
    return value if value and value.strip() not in PLACEHOLDERS else None


def load_environment(audit: Audit) -> dict[str, str | None]:
    """Validate local configuration without loading or displaying secret values."""
    env_path = BACKEND_ROOT / ".env"
    if not env_path.exists():
        audit.failed("Backend .env", f"Missing {env_path}. Copy .env.example and supply AWS values.")
        values: dict[str, str | None] = {}
    else:
        audit.passed("Backend .env", "Local backend environment file exists.")
        values = dict(dotenv_values(env_path))

    expected = ["AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]
    missing = [key for key in expected if not configured_value(values, key)]
    table = configured_value(values, "DYNAMODB_TABLE") or configured_value(values, "DYNAMODB_BIOGRAPHY_TABLE")
    bucket = configured_value(values, "S3_BUCKET") or configured_value(values, "S3_BUCKET_NAME")
    if not table:
        missing.append("DYNAMODB_TABLE (or DYNAMODB_BIOGRAPHY_TABLE)")
    if not bucket:
        missing.append("S3_BUCKET (or S3_BUCKET_NAME)")
    if missing:
        audit.failed("Required backend variables", "Missing or placeholder: " + ", ".join(missing))
    else:
        audit.passed("Required backend variables", "AWS region, credentials, DynamoDB table, and S3 bucket are configured.")

    frontend_env = FRONTEND_ROOT / ".env.local"
    frontend_values = dict(dotenv_values(frontend_env)) if frontend_env.exists() else {}
    frontend_api = frontend_values.get("NEXT_PUBLIC_API_URL")
    if frontend_api:
        audit.passed("Frontend API URL", "NEXT_PUBLIC_API_URL is present in frontend/.env.local.")
    else:
        audit.failed("Frontend API URL", "frontend/.env.local lacks NEXT_PUBLIC_API_URL.")
    return values


def aws_settings(values: dict[str, str | None]) -> tuple[str, str | None, str | None, str | None, str | None]:
    """Resolve supported legacy/current resource variable names."""
    return (
        configured_value(values, "AWS_REGION") or "us-east-1",
        configured_value(values, "AWS_ACCESS_KEY_ID"),
        configured_value(values, "AWS_SECRET_ACCESS_KEY"),
        configured_value(values, "DYNAMODB_TABLE") or configured_value(values, "DYNAMODB_BIOGRAPHY_TABLE"),
        configured_value(values, "S3_BUCKET") or configured_value(values, "S3_BUCKET_NAME"),
    )


async def audit_aws(audit: Audit, values: dict[str, str | None]) -> None:
    """Test table, billing, bucket, CORS, and public-access configuration."""
    region, key, secret, table_name, bucket_name = aws_settings(values)
    if not key or not secret or not table_name or not bucket_name:
        audit.warned("AWS connectivity", "Skipped because required local AWS configuration is incomplete.")
        return
    session = aioboto3.Session(region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    try:
        async with session.client("dynamodb") as dynamodb:
            table = (await dynamodb.describe_table(TableName=table_name))["Table"]
            if table.get("TableStatus") == "ACTIVE":
                audit.passed("DynamoDB table", f"{table_name} is ACTIVE.")
            else:
                audit.failed("DynamoDB table", f"{table_name} status is {table.get('TableStatus', 'unknown')}.")
            billing = table.get("BillingModeSummary", {}).get("BillingMode")
            if billing == "PAY_PER_REQUEST":
                audit.passed("DynamoDB billing", "On-Demand PAY_PER_REQUEST is enabled.")
            else:
                audit.failed("DynamoDB billing", f"Expected PAY_PER_REQUEST; found {billing or 'not reported'}.")
    except (ClientError, BotoCoreError) as error:
        audit.failed("DynamoDB connectivity", f"{type(error).__name__}: check region, IAM, and table name.")

    try:
        async with session.client("s3") as s3:
            await s3.head_bucket(Bucket=bucket_name)
            await s3.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
            audit.passed("S3 bucket", f"{bucket_name} exists and is accessible.")
            try:
                cors = await s3.get_bucket_cors(Bucket=bucket_name)
                origins = {origin for rule in cors.get("CORSRules", []) for origin in rule.get("AllowedOrigins", [])}
                expected = {"http://localhost:3000", "http://localhost:8000"}
                if expected.issubset(origins):
                    audit.passed("S3 CORS", "CORS permits both local frontend and backend origins.")
                else:
                    audit.failed("S3 CORS", "Missing required origins: " + ", ".join(sorted(expected - origins)))
            except ClientError as error:
                audit.failed("S3 CORS", f"Could not read CORS configuration ({error.response['Error']['Code']}).")
            try:
                block = (await s3.get_public_access_block(Bucket=bucket_name))["PublicAccessBlockConfiguration"]
                if all(block.get(flag, False) for flag in ("BlockPublicAcls", "IgnorePublicAcls", "BlockPublicPolicy", "RestrictPublicBuckets")):
                    audit.passed("S3 public access", "All Block Public Access controls are enabled.")
                else:
                    audit.failed("S3 public access", "One or more Block Public Access controls are disabled.")
            except ClientError as error:
                audit.failed("S3 public access", f"Could not read public-access settings ({error.response['Error']['Code']}).")
    except (ClientError, BotoCoreError) as error:
        audit.failed("S3 connectivity", f"{type(error).__name__}: check region, IAM, and bucket name.")


def http_json(method: str, url: str, payload: dict[str, Any] | None = None) -> tuple[int, dict[str, Any]]:
    """Use only the standard library for API calls, avoiding an extra audit dependency."""
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(url, data=data, method=method, headers={"Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=12) as response:  # noqa: S310 - URL comes from local config.
            return response.status, json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        try:
            return error.code, json.loads(body)
        except json.JSONDecodeError:
            return error.code, {"detail": "non-JSON response"}
    except URLError as error:
        raise ConnectionError(str(error.reason)) from error


async def audit_api(audit: Audit, values: dict[str, str | None]) -> None:
    """Exercise health, write/read/delete, and presigned-url routes against a running API."""
    api_url = os.environ.get("AUDIT_API_URL", DEFAULT_API_URL).rstrip("/")
    try:
        health_status, health = await asyncio.to_thread(http_json, "GET", f"{api_url}/health/")
    except ConnectionError:
        audit.failed("FastAPI health", f"Cannot reach {api_url}. Start uvicorn before running this audit.")
        return
    expected_health = health_status == 200 and health.get("status") == "Echoes Backend is Magical" and "version" in health
    if expected_health:
        audit.passed("FastAPI health", "Health endpoint returned the expected Echoes status payload.")
    else:
        audit.failed("FastAPI health", f"Unexpected status/payload ({health_status}).")
        return

    _, key, secret, table_name, _ = aws_settings(values)
    if not key or not secret or not table_name:
        audit.warned("API mutation tests", "Skipped biography write/read/cleanup because the audit process lacks AWS credentials or table name.")
        audit.warned("Presigned upload URL", "Skipped because upload readiness depends on the same incomplete AWS configuration.")
        return
    audit_id = f"audit-{uuid.uuid4()}"
    biography_id: str | None = None
    try:
        status, biography = await asyncio.to_thread(http_json, "POST", f"{api_url}/biographies", {"user_id": audit_id, "title": "Integration audit — safe to delete"})
        biography_id = str(biography.get("id", ""))
        if status != 201 or not biography_id:
            audit.failed("Biography API write", f"Expected 201 with biography id; got {status}.")
        else:
            audit.passed("Biography API write", "Created an isolated audit biography through FastAPI.")
            if key and secret and table_name:
                region = aws_settings(values)[0]
                session = aioboto3.Session(region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
                async with session.client("dynamodb") as dynamodb:
                    item = await dynamodb.get_item(TableName=table_name, Key={"PK": {"S": f"USER#{audit_id}"}, "SK": {"S": f"BIO#{biography_id}"}})
                if "Item" in item:
                    audit.passed("Biography DynamoDB read-back", "API-created audit item was found in DynamoDB.")
                else:
                    audit.failed("Biography DynamoDB read-back", "API returned success but the audit item was not found.")
            else:
                audit.warned("Biography DynamoDB read-back", "Skipped because AWS credentials/table are unavailable to the audit process.")

        upload_status, upload = await asyncio.to_thread(http_json, "POST", f"{api_url}/upload/presigned-url", {"filename": "audit.txt", "content_type": "text/plain", "chapter_id": audit_id})
        required = {"upload_url", "file_key", "file_url"}
        parsed = urlparse(str(upload.get("upload_url", "")))
        expires = parse_qs(parsed.query).get("X-Amz-Expires", [""])[0]
        if upload_status == 201 and required.issubset(upload) and parsed.scheme == "https" and expires == "300":
            audit.passed("Presigned upload URL", "URL contains all fields, uses HTTPS, and has a 300-second expiry.")
        else:
            audit.failed("Presigned upload URL", f"Expected 201/HTTPS/300-second expiry; got status {upload_status}.")
    except ConnectionError as error:
        audit.failed("API integration", f"API request failed: {error}")
    finally:
        if biography_id and key and secret and table_name:
            try:
                region = aws_settings(values)[0]
                session = aioboto3.Session(region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
                async with session.client("dynamodb") as dynamodb:
                    await dynamodb.delete_item(TableName=table_name, Key={"PK": {"S": f"USER#{audit_id}"}, "SK": {"S": f"BIO#{biography_id}"}})
                audit.passed("Audit cleanup", "Deleted the generated audit biography from DynamoDB.")
            except (ClientError, BotoCoreError) as error:
                audit.failed("Audit cleanup", f"Could not remove audit item ({type(error).__name__}). Delete USER#{audit_id} manually.")


def audit_frontend_and_ai(audit: Audit) -> None:
    """Statically verify client integration and no-token AI fallback wiring."""
    api_client = (FRONTEND_ROOT / "lib" / "api.ts").read_text(encoding="utf-8")
    sse = (FRONTEND_ROOT / "lib" / "sse.ts").read_text(encoding="utf-8")
    chat_hook = (FRONTEND_ROOT / "hooks" / "useChatStream.ts").read_text(encoding="utf-8")
    backend_example = (BACKEND_ROOT / ".env.example").read_text(encoding="utf-8")
    ai_service = (BACKEND_ROOT / "app" / "services" / "ai_service.py").read_text(encoding="utf-8")
    chat_router = (BACKEND_ROOT / "app" / "routers" / "chat.py").read_text(encoding="utf-8")
    main_app = (BACKEND_ROOT / "app" / "main.py").read_text(encoding="utf-8")
    api_ok = all(token in api_client for token in ("NEXT_PUBLIC_API_URL", "axios.create", "timeout: 30_000", "Content-Type"))
    (audit.passed if api_ok else audit.failed)("Frontend Axios configuration", "Base URL, JSON headers, and a 30-second timeout are configured." if api_ok else "api.ts is missing a required base URL, timeout, or header.")
    sse_ok = all(token in sse for token in ("createParser", "response.body", "AbortSignal"))
    (audit.passed if sse_ok else audit.failed)("Frontend SSE parser", "SSE parser uses eventsource-parser and supports aborts." if sse_ok else "lib/sse.ts lacks required streaming parser behavior.")
    chat_ok = "useChatStream" in chat_hook and "fallback" in chat_hook.lower()
    (audit.passed if chat_ok else audit.warned)("Chat fallback UX", "Chat hook contains fallback handling." if chat_ok else "Verify useChatStream handles a non-streaming fallback response.")
    ai_ok = all(token in ai_service for token in ("stream_chat_response", "structure_narrative", "FALLBACK_MESSAGE", "REPLICATE_API_TOKEN")) and "/chat/stream" in chat_router
    (audit.passed if ai_ok else audit.failed)("Pre-Replicate fallback", "AI service and chat route provide a graceful no-token fallback." if ai_ok else "Missing AI fallback function, token check, or chat endpoint.")
    (audit.passed if "REPLICATE_API_TOKEN=" in backend_example else audit.failed)("Replicate placeholder", "Template contains REPLICATE_API_TOKEN placeholder." if "REPLICATE_API_TOKEN=" in backend_example else ".env.example is missing REPLICATE_API_TOKEN.")
    gitignores = "\n".join(path.read_text(encoding="utf-8") for path in (REPO_ROOT / ".gitignore", BACKEND_ROOT / ".gitignore", FRONTEND_ROOT / ".gitignore") if path.exists())
    (audit.passed if re.search(r"(^|\n)\.env(\.|\n|$)", gitignores) else audit.failed)("Secret gitignore", ".env is ignored by Git." if re.search(r"(^|\n)\.env(\.|\n|$)", gitignores) else "Add .env and .env.local to an applicable .gitignore.")
    source_files = [*BACKEND_ROOT.joinpath("app").rglob("*.py"), *FRONTEND_ROOT.rglob("*.ts"), *FRONTEND_ROOT.rglob("*.tsx")]
    exposed = [str(path.relative_to(REPO_ROOT)) for path in source_files if re.search(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b", path.read_text(encoding="utf-8", errors="ignore"))]
    (audit.failed if exposed else audit.passed)("Hardcoded AWS access keys", "Potential access-key pattern found in: " + ", ".join(exposed) if exposed else "No AWS access-key identifiers found in application source.")
    cors_ok = "allow_origins=settings.backend_cors_origins" in main_app and "allow_origins=[\"*\"]" not in main_app and "allow_origins=['*']" not in main_app
    (audit.passed if cors_ok else audit.failed)("Restricted API CORS", "FastAPI reads explicit origins from configuration." if cors_ok else "CORS must use configured localhost origins, never wildcard *.")


async def main() -> int:
    """Run all independent checks and return non-zero if any required check fails."""
    print("\nEchoes Integration Audit — Replicate-free infrastructure verification\n")
    audit = Audit()
    values = load_environment(audit)
    await audit_aws(audit, values)
    await audit_api(audit, values)
    audit_frontend_and_ai(audit)
    passed = sum(result.state == "PASS" for result in audit.results)
    warned = sum(result.state == "WARN" for result in audit.results)
    failed = sum(result.state == "FAIL" for result in audit.results)
    print(f"\nSummary: {passed} passed, {warned} warnings, {failed} failed.")
    return audit.exit_code()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
