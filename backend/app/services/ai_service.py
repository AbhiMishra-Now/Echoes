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


async def generate_memory_draft(user_message: str, image_description: str | None = None) -> dict[str, Any]:
    """Convert raw user memory input into an elegant biographer caption JSON."""
    img_context = image_description or "No image present"
    prompt = (
        "You are a Royal Biographer. Convert this raw memory into an elegant book caption.\n"
        f'Raw Input: "{user_message}"\n'
        f'Image Context: "{img_context}"\n\n'
        "Return ONLY valid JSON:\n"
        "{\n"
        f'  "original_text": "{user_message}",\n'
        '  "polished_caption": "Elegant 1-2 sentence description in Cormorant Garamond style",\n'
        '  "suggested_position": "left|right|center",\n'
        '  "decorative_element": "none|vintage_border|gold_frame|wax_seal"\n'
        "}"
    )
    try:
        output = await _collect_prompt(prompt)
        start, end = output.find("{"), output.rfind("}")
        if start >= 0 and end > start:
            data = json.loads(output[start : end + 1])
            return {
                "original_text": user_message,
                "polished_caption": str(data.get("polished_caption", user_message)),
                "suggested_position": str(data.get("suggested_position", "center")),
                "decorative_element": str(data.get("decorative_element", "none")),
            }
    except Exception as exc:
        logger.warning("Draft generation AI fallback invoked: %s", exc)

    # Fallback caption generator if AI output is unavailable
    words = user_message.strip().split()
    first_sentence = user_message.strip()
    if len(words) > 20:
        first_sentence = " ".join(words[:20]) + "..."
    polished = f"In quiet reflection: \"{first_sentence}\"—a treasured milestone woven into the tapestry of memory."
    return {
        "original_text": user_message,
        "polished_caption": polished,
        "suggested_position": "center",
        "decorative_element": "gold_frame" if image_description else "none",
    }


async def generate_chapter_layout(memories: list[dict[str, Any]], seed: int | None = None) -> list[dict[str, Any]]:
    """Generate an AI layout array for scrapbook spread elements."""
    if not memories:
        return []

    memories_summary = [
        {
            "id": m.get("id"),
            "type": m.get("type", "text"),
            "polished_caption": m.get("polished_caption") or m.get("original_text") or "",
            "image_url": m.get("image_url"),
        }
        for m in memories
    ]

    prompt = (
        "Generate a 2-page scrapbook spread layout for these memories.\n"
        f"Memories: {json.dumps(memories_summary)}\n"
        f"Seed hint: {seed or 0}\n\n"
        "Return ONLY valid JSON array:\n"
        "[\n"
        "  {\n"
        '    "memory_id": "xyz",\n'
        '    "page": "left|right",\n'
        '    "x_percent": 10-90,\n'
        '    "y_percent": 10-90,\n'
        '    "width_percent": 20-40,\n'
        '    "rotation_deg": -5 to 5,\n'
        '    "z_index": 1-10,\n'
        '    "text_variant": "original|polished"\n'
        "  }\n"
        "]"
    )

    try:
        output = await _collect_prompt(prompt)
        start, end = output.find("["), output.rfind("]")
        if start >= 0 and end > start:
            layout_data = json.loads(output[start : end + 1])
            if isinstance(layout_data, list) and len(layout_data) > 0:
                return layout_data
    except Exception as exc:
        logger.warning("Layout generation AI fallback invoked: %s", exc)

    # Deterministic Algorithmic Fallback Layout Generator
    seed_offset = (seed or 0) % 5
    fallback_items: list[dict[str, Any]] = []
    
    for i, m in enumerate(memories):
        page = "left" if (i + seed_offset) % 2 == 0 else "right"
        base_y = 12 + ((i // 2) * 28) % 70
        base_x = 15 + ((i * 25) + seed_offset * 10) % 55
        rot = (-4 + ((i * 3 + seed_offset * 2) % 9))
        
        fallback_items.append({
            "memory_id": str(m.get("id")),
            "page": page,
            "x_percent": base_x,
            "y_percent": base_y,
            "width_percent": 35 if m.get("type") == "image" else 45,
            "rotation_deg": rot,
            "z_index": i + 1,
            "text_variant": "polished"
        })

    return fallback_items

