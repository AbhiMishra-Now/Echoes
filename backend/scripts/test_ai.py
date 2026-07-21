"""Manual DeepSeek-R1/Replicate smoke test; run from the backend directory."""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.ai_service import structure_narrative, stream_chat_response  # noqa: E402


async def main() -> None:
    """Print streamed chat text then verify narrative JSON fields."""
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    if not os.getenv("REPLICATE_API_TOKEN") or os.getenv("REPLICATE_API_TOKEN") == "your_token_here":
        raise RuntimeError("Set REPLICATE_API_TOKEN in backend/.env before running this test.")
    history = [{"role": "user", "content": "When I was ten, I learned to ride a crimson bicycle during one bright summer."}]
    print("Royal Biographer: ", end="", flush=True)
    async for token in stream_chat_response(history, "local-test-user"):
        if token:
            print(token, end="", flush=True)
    print("\n\nStructuring chapter…")
    narrative = await structure_narrative(history, "The Crimson Bicycle")
    required = {"chapter_title", "narrative_text", "key_themes", "suggested_media_tags"}
    assert required.issubset(narrative), "Narrative response is missing required keys"
    print("Valid narrative JSON:")
    print(narrative)


if __name__ == "__main__":
    asyncio.run(main())
