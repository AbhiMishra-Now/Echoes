"""Direct-to-S3 presigned URL helpers; the API never proxies media bytes."""
from __future__ import annotations

from urllib.parse import quote

from app.config import get_settings
from app.database import get_session


async def generate_presigned_upload_url(file_key: str, content_type: str) -> str:
    """Generate a 5-minute PUT URL so clients can upload without exposing AWS credentials."""
    settings = get_settings()
    session = get_session()
    async with session.client("s3") as client:
        return await client.generate_presigned_url("put_object", Params={"Bucket": settings.s3_bucket_name, "Key": file_key, "ContentType": content_type}, ExpiresIn=300)


async def generate_presigned_download_url(file_key: str) -> str:
    """Generate a 7-day authenticated read URL for private media."""
    settings = get_settings()
    session = get_session()
    async with session.client("s3") as client:
        return await client.generate_presigned_url("get_object", Params={"Bucket": settings.s3_bucket_name, "Key": file_key}, ExpiresIn=604800)


def object_url(file_key: str) -> str:
    """Return the canonical bucket object URL; keep the bucket private unless intentionally shared."""
    settings = get_settings()
    return f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{quote(file_key)}"
