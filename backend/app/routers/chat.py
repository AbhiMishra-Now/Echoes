"""SSE chat endpoints backed by the Replicate Royal Biographer."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.database import get_dynamodb
from app.models import ChatStreamRequest
from app.services.ai_service import structure_narrative, stream_chat_response
from app.services.dynamo_service import get_chapter_messages, save_chat_message, update_chapter_narrative

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)


async def _save_turns(dynamodb: Any, request: ChatStreamRequest, response: str) -> None:
    """Store both sides after streaming so partial client disconnects do not duplicate messages."""
    await save_chat_message(dynamodb, request.user_id, request.bio_id, request.chapter_id, "user", request.message)
    await save_chat_message(dynamodb, request.user_id, request.bio_id, request.chapter_id, "assistant", response)


@router.post("/chat/stream")
async def chat_stream(request: ChatStreamRequest, dynamodb: Any = Depends(get_dynamodb)) -> StreamingResponse:
    """Return Replicate text incrementally as SSE, retaining the completed exchange afterward."""
    async def events() -> Any:
        collected: list[str] = []
        history = [*request.chat_history, {"role": "user", "content": request.message}]
        async for chunk in stream_chat_response(history, request.user_id):
            if chunk == "":
                yield ": ping\n\n"
                continue
            collected.append(chunk)
            # One data line per token avoids malformed SSE when the model includes line breaks.
            for line in chunk.splitlines() or [""]:
                yield f"data: {line}\n"
            yield "\n"
        complete = "".join(collected)
        try:
            await _save_turns(dynamodb, request, complete)
        except Exception:
            logger.exception("Chat streamed but could not be persisted")
            yield "event: warning\ndata: The reply was delivered, but its archive needs another save.\n\n"
        yield "event: done\ndata: [DONE]\n\n"

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"})


@router.post("/biographies/{bio_id}/chapters/{chapter_id}/structure")
async def structure_chapter(bio_id: str, chapter_id: str, user_id: str, dynamodb: Any = Depends(get_dynamodb)) -> dict[str, Any]:
    """Generate and persist a structured narrative for the scroll preview."""
    history = await get_chapter_messages(dynamodb, user_id, bio_id, chapter_id)
    if not history:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Share a few memories before asking the biographer to form a chapter.")
    try:
        narrative = await structure_narrative(history, "Untitled Chapter")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="The magical quill could not shape that chapter yet. Please try again.") from exc
    await update_chapter_narrative(dynamodb, user_id, bio_id, chapter_id, narrative)
    return narrative
