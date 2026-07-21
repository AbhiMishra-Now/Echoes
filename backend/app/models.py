"""Strict request and response schemas for the Echoes API."""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class UserCreate(StrictSchema):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)


class UserResponse(UserCreate):
    id: str
    created_at: datetime


class BiographyCreate(StrictSchema):
    user_id: str = Field(min_length=1, max_length=128)
    title: str = Field(min_length=1, max_length=180)


class BiographyUpdate(StrictSchema):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    is_public: bool | None = None


class BiographyResponse(StrictSchema):
    id: str
    user_id: str
    title: str
    is_public: bool = False
    created_at: datetime
    updated_at: datetime


class ChapterCreate(StrictSchema):
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(default="", max_length=4000)
    time_period: str | None = Field(default=None, max_length=120)
    cover_image: str | None = Field(default=None, max_length=2048)
    order: int = Field(default=0, ge=0)
    layout: list | None = Field(default=None)


class ChapterUpdate(StrictSchema):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=4000)
    time_period: str | None = Field(default=None, max_length=120)
    cover_image: str | None = Field(default=None, max_length=2048)
    order: int | None = Field(default=None, ge=0)
    layout: list | None = Field(default=None)


class ChapterResponse(ChapterCreate):
    id: str
    biography_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class PresignedUrlRequest(StrictSchema):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=3, max_length=120)
    chapter_id: str = Field(min_length=1, max_length=128)


class PresignedUrlResponse(StrictSchema):
    upload_url: str
    file_key: str
    file_url: str


class ChatStreamRequest(StrictSchema):
    message: str = Field(min_length=1, max_length=8000)
    chat_history: list[dict[str, str]] = Field(default_factory=list, max_length=20)
    user_id: str = Field(min_length=1, max_length=128)
    bio_id: str = Field(min_length=1, max_length=128)
    chapter_id: str = Field(min_length=1, max_length=128)
