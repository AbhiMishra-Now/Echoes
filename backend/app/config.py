"""Application configuration loaded from environment variables."""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Annotated

from pydantic import AliasChoices, BeforeValidator, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_origins(value: object) -> list[str]:
    """Accept JSON (recommended) or comma-separated CORS origin settings."""
    if isinstance(value, list):
        return [str(origin) for origin in value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(origin) for origin in parsed]
        except json.JSONDecodeError:
            pass
        return [origin.strip() for origin in value.split(",") if origin.strip()]
    raise ValueError("BACKEND_CORS_ORIGINS must be a JSON array or comma-separated string")


CorsOrigins = Annotated[list[str], BeforeValidator(parse_origins)]


class Settings(BaseSettings):
    """Validated runtime configuration; secrets are supplied only by the environment."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    aws_region: str = Field(default="us-east-1", alias="AWS_REGION")
    aws_access_key_id: str | None = Field(default=None, alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str | None = Field(default=None, alias="AWS_SECRET_ACCESS_KEY")
    dynamodb_biography_table: str = Field(default="echoes_biographies", validation_alias=AliasChoices("DYNAMODB_TABLE", "DYNAMODB_BIOGRAPHY_TABLE"))
    s3_bucket_name: str = Field(default="echoes-media-bucket", validation_alias=AliasChoices("S3_BUCKET", "S3_BUCKET_NAME"))
    api_v1_str: str = Field(default="/api/v1", alias="API_V1_STR")
    project_name: str = Field(default="Echoes Backend", alias="PROJECT_NAME")
    debug: bool = Field(default=False, alias="DEBUG")
    secret_key: str | None = Field(default=None, alias="SECRET_KEY")
    backend_cors_origins: CorsOrigins = Field(default=["http://localhost:3000"], alias="BACKEND_CORS_ORIGINS")
    # The token is optional so the API can start and provide its graceful chat fallback before AI is configured.
    replicate_api_token: str | None = Field(default=None, alias="REPLICATE_API_TOKEN")
    replicate_model: str = Field(default="deepseek-ai/deepseek-r1", alias="REPLICATE_MODEL")


@lru_cache
def get_settings() -> Settings:
    """Return one cached settings object for the process lifetime."""
    return Settings()
