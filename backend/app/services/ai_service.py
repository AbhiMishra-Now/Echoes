"""Replicate-powered Royal Biographer with async-friendly streamed text output."""
from __future__ import annotations

import asyncio
import json
import logging
import threading
from collections.abc import AsyncGenerator, Iterable
from pathlib import Path
from typing import Any

import replicate

from app.config import get_settings

logger = logging.getLogger(__name__)
FALLBACK_MESSAGE = "The magical quill has paused for a moment. Your memory is safe; shall we try weaving it again shortly?"
PROMPT_PATH = Path(__file__).resolve().parents[2] / "prompts" / "biographer_system_prompt.txt"


def _system_prompt() -> str:
    """Load the versioned biographer persona from the local prompt artifact."""
    return PROMPT_PATH.read_text(encoding="utf-8")


def _sanitize_history(messages: list[dict[str, Any]]) -> str:
    """Keep only short, role-labelled textual turns before passing them to a third party."""
    turns: list[str] = []
    for message in messages[-20:]:
        role, content = message.get("role"), message.get("content")
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            turns.append(f"{role.title()}: {content.strip()[:4000]}")
    return "\n".join(turns)


def _event_text(event: object) -> str | None:
    """Normalize Replicate stream events across SDK event representations."""
    if isinstance(event, str):
        return event
    name, data = getattr(event, "event", None), getattr(event, "data", None)
    if name not in {None, "output"}:
        return None
    if isinstance(data, str):
        return data
    return str(data) if data is not None else None


def _produce_events(prompt: str, loop: asyncio.AbstractEventLoop, queue: asyncio.Queue[object]) -> None:
    """Run blocking Replicate streaming in a worker thread and forward its events safely."""
    try:
        settings = get_settings()
        token = settings.replicate_api_token
        if not token or token == "your_token_here":
            raise replicate.exceptions.ReplicateError("REPLICATE_API_TOKEN is not configured")
        client = replicate.Client(api_token=token)
        events: Iterable[object] = client.stream(settings.replicate_model, input={"prompt": prompt, "temperature": 0.7, "max_tokens": 1024})
        for event in events:
            text = _event_text(event)
            if text:
                loop.call_soon_threadsafe(queue.put_nowait, text)
    except replicate.exceptions.ReplicateError as error:
        logger.warning("Replicate request failed (%s): %s", type(error).__name__, error)
        loop.call_soon_threadsafe(queue.put_nowait, error)
    except Exception as error:  # Network/SDK failures should never break an SSE response.
        logger.exception("Unexpected Replicate streaming failure")
        loop.call_soon_threadsafe(queue.put_nowait, error)
    finally:
        loop.call_soon_threadsafe(queue.put_nowait, None)


async def _stream_prompt(prompt: str) -> AsyncGenerator[str, None]:
    """Convert the SDK's blocking event iterator into text and 15-second heartbeat markers."""
    queue: asyncio.Queue[object] = asyncio.Queue()
    loop = asyncio.get_running_loop()
    threading.Thread(target=_produce_events, args=(prompt, loop, queue), daemon=True).start()
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=15)
        except TimeoutError:
            yield ""  # The router translates this to an SSE comment heartbeat.
            continue
        if event is None:
            return
        if isinstance(event, Exception):
            yield FALLBACK_MESSAGE
            return
        yield str(event)


async def stream_chat_response(messages: list[dict[str, Any]], user_id: str) -> AsyncGenerator[str, None]:
    """Stream an elegant reply from DeepSeek-R1, preserving low-latency SSE delivery."""
    history = _sanitize_history(messages)
    prompt = f"{_system_prompt()}\n\nConversation so far:\n{history}\n\nRoyal Biographer:"
    logger.info("Starting Replicate chat stream for user=%s turns=%d", user_id, len(messages))
    async for chunk in _stream_prompt(prompt):
        yield chunk


async def _collect_prompt(prompt: str) -> str:
    """Collect a streamed model response for internal JSON-only transformations."""
    chunks: list[str] = []
    async for chunk in _stream_prompt(prompt):
        if chunk:
            chunks.append(chunk)
    return "".join(chunks)


async def structure_narrative(chat_history: list[dict[str, Any]], chapter_title: str) -> dict[str, Any]:
    """Turn one chapter conversation into validated scroll data using streamed JSON output."""
    history = _sanitize_history(chat_history)
    prompt = (
        "You are an expert memoir editor. Transform this conversation into an elegant, faithful biography chapter. "
        "Do not invent facts. Return keys chapter_title, narrative_text, key_themes, suggested_media_tags. "
        f"Chapter title: {chapter_title}\n\nConversation:\n{history}\n\nOutput ONLY valid JSON."
    )
    output = await _collect_prompt(prompt)
    try:
        data = json.loads(output)
    except json.JSONDecodeError:
        # Some models wrap JSON in a code fence; extract the outer object once before failing gracefully.
        start, end = output.find("{"), output.rfind("}")
        try:
            data = json.loads(output[start : end + 1]) if start >= 0 and end > start else None
        except json.JSONDecodeError:
            data = None
        if data is None:
            repair = f"Repair this into ONLY one valid JSON object with chapter_title, narrative_text, key_themes, suggested_media_tags.\n\n{output}"
            data = json.loads(await _collect_prompt(repair))
    required = {"chapter_title", "narrative_text", "key_themes", "suggested_media_tags"}
    if not required.issubset(data) or not isinstance(data["narrative_text"], str):
        raise ValueError("The narrative response did not contain the required scroll fields.")
    return {"chapter_title": str(data["chapter_title"]), "narrative_text": data["narrative_text"], "key_themes": [str(item) for item in data["key_themes"]], "suggested_media_tags": [str(item) for item in data["suggested_media_tags"]]}
