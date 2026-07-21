"""FastAPI application entry point for Echoes."""
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import biography, chat, health, upload


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Reserve a lifecycle hook for future connection warm-up and telemetry."""
    yield


settings = get_settings()
app = FastAPI(title=settings.project_name, version="1.0.0", description="A secure archive for living legacies.", openapi_url=f"{settings.api_v1_str}/openapi.json", docs_url=f"{settings.api_v1_str}/docs", redoc_url=f"{settings.api_v1_str}/redoc", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.backend_cors_origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])
app.include_router(health.router, prefix=settings.api_v1_str)
app.include_router(biography.router, prefix=settings.api_v1_str)
app.include_router(upload.router, prefix=settings.api_v1_str)
app.include_router(chat.router, prefix=settings.api_v1_str)


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    """Provide an unversioned service discovery response."""
    return {"message": "Welcome to the Echoes API", "docs": f"{settings.api_v1_str}/docs"}
