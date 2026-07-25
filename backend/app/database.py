"""Async aioboto3 session and DynamoDB resource dependencies."""
from __future__ import annotations

from collections.abc import AsyncIterator

import aioboto3
from aioboto3.resources.base import ServiceResource

from app.config import get_settings


import os

def get_session() -> aioboto3.Session:
    """Create an AWS session without embedding credentials in source code."""
    settings = get_settings()
    if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        # Let boto3 resolve temporary role credentials + session token natively in Lambda
        return aioboto3.Session()
    return aioboto3.Session(
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


async def get_dynamodb() -> AsyncIterator[ServiceResource]:
    """Yield an async DynamoDB resource for a request and close it safely afterwards."""
    session = get_session()
    async with session.resource("dynamodb") as dynamodb:
        yield dynamodb
