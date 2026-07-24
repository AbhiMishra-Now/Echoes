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


class DraftGenerationRequest(StrictSchema):
    user_message: str = Field(min_length=1, max_length=8000)
    image_description: str | None = Field(default=None, max_length=1000)


class DraftGenerationResponse(StrictSchema):
    original_text: str
    polished_caption: str
    suggested_position: str = "center"
    decorative_element: str = "none"


class MemoryLayoutInput(StrictSchema):
    id: str
    type: str = "text"
    polished_caption: str | None = None
    original_text: str | None = None
    image_url: str | None = None


class LayoutGenerationRequest(StrictSchema):
    memories: list[MemoryLayoutInput] = Field(default_factory=list)
    seed: int | None = None


class LayoutItemResponse(StrictSchema):
    memory_id: str
    page: str = "left"
    x_percent: int = 10
    y_percent: int = 10
    width_percent: int = 30
    rotation_deg: int = 0
    z_index: int = 1
    text_variant: str = "polished"


class BookExportRequest(StrictSchema):
    spreadIds: list[str] | None = Field(default=None)
    spreads: list[dict[str, Any]] | None = Field(default=None)
    chapterTitle: str | None = Field(default=None, max_length=180)


class BookExportResponse(StrictSchema):
    status: str = "success"
    pdf_url: str
    export_id: str

