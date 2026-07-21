"""Biography and chapter API routes."""
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status

from app.database import get_dynamodb
from app.models import BiographyCreate, BiographyResponse, ChapterCreate, ChapterResponse, ChapterUpdate
from app.services import dynamo_service

router = APIRouter(prefix="/biographies", tags=["biographies"])
DynamoDependency = Annotated[Any, Depends(get_dynamodb)]


@router.post("", response_model=BiographyResponse, status_code=status.HTTP_201_CREATED)
async def create_biography(payload: BiographyCreate, dynamodb: DynamoDependency) -> dict[str, Any]:
    """Create a new private biography for a user."""
    return await dynamo_service.create_biography(dynamodb, payload.user_id, payload.title)


@router.get("/{user_id}", response_model=list[BiographyResponse])
async def get_user_biographies(user_id: str, dynamodb: DynamoDependency) -> list[dict[str, Any]]:
    """List every biography held in the user's DynamoDB partition."""
    return await dynamo_service.list_biographies(dynamodb, user_id)


@router.post("/{bio_id}/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def add_chapter(bio_id: str, payload: ChapterCreate, dynamodb: DynamoDependency, user_id: str = Query(min_length=1)) -> dict[str, Any]:
    """Add a chapter; user_id is temporary until authentication supplies it from a token."""
    return await dynamo_service.create_chapter(dynamodb, user_id, bio_id, payload.model_dump())


@router.get("/{bio_id}/chapters", response_model=list[ChapterResponse])
async def get_chapters(bio_id: str, dynamodb: DynamoDependency, user_id: str = Query(min_length=1)) -> list[dict[str, Any]]:
    """List chapters belonging to one biography, ordered by their narrative position."""
    return await dynamo_service.list_chapters(dynamodb, user_id, bio_id)


@router.patch("/{bio_id}/chapters/{chapter_id}", response_model=ChapterResponse)
async def edit_chapter(bio_id: str, chapter_id: str, payload: ChapterUpdate, dynamodb: DynamoDependency, user_id: str = Query(min_length=1)) -> dict[str, Any]:
    """Update a chapter; bio_id remains in the route for clear resource ownership."""
    return await dynamo_service.update_chapter(dynamodb, user_id, chapter_id, payload.model_dump(exclude_unset=True))


@router.delete("/{bio_id}/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(bio_id: str, chapter_id: str, dynamodb: DynamoDependency, user_id: str = Query(min_length=1)) -> None:
    """Delete a chapter item and all of its associated records."""
    await dynamo_service.delete_chapter(dynamodb, user_id, chapter_id)


@router.delete("/{bio_id}/chapters/{chapter_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_message(bio_id: str, chapter_id: str, message_id: str, dynamodb: DynamoDependency, user_id: str = Query(min_length=1)) -> None:
    """Delete a specific message from a chapter's messages array."""
    await dynamo_service.delete_chat_message(dynamodb, user_id, chapter_id, message_id)
