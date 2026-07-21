"""Presigned S3 upload route."""
from pathlib import PurePath
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from app.models import PresignedUrlRequest, PresignedUrlResponse
from app.services.s3_service import generate_presigned_download_url, generate_presigned_upload_url

router = APIRouter(prefix="/upload", tags=["uploads"])


@router.post("/presigned-url", response_model=PresignedUrlResponse, status_code=status.HTTP_201_CREATED)
async def create_presigned_upload_url(payload: PresignedUrlRequest) -> PresignedUrlResponse:
    """Issue a short-lived direct S3 PUT URL; no media bytes pass through FastAPI."""
    filename = PurePath(payload.filename).name
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A memory needs a valid file name.")
    file_key = f"chapters/{payload.chapter_id}/{uuid4()}-{filename}"
    upload_url = await generate_presigned_upload_url(file_key, payload.content_type)
    # Keep the bucket private: the preview receives a short-lived authenticated GET URL instead of a public object URL.
    file_url = await generate_presigned_download_url(file_key)
    return PresignedUrlResponse(upload_url=upload_url, file_key=file_key, file_url=file_url)
