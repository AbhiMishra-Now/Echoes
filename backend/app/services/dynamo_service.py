"""Async DynamoDB operations using Echoes' single-table key convention."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError
from fastapi import HTTPException, status

from app.config import get_settings


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _biography_response(item: dict[str, Any]) -> dict[str, Any]:
    return {"id": item["bio_id"], "user_id": item["user_id"], "title": item["title"], "is_public": item.get("is_public", False), "created_at": item["created_at"], "updated_at": item["updated_at"]}


def _chapter_response(item: dict[str, Any]) -> dict[str, Any]:
    return {"id": item["chapter_id"], "biography_id": item["bio_id"], "user_id": item["user_id"], "title": item["title"], "description": item.get("description", ""), "time_period": item.get("time_period"), "cover_image": item.get("cover_image"), "order": item.get("order", 0), "created_at": item["created_at"], "updated_at": item["updated_at"], "layout": item.get("layout"), "messages": item.get("messages", [])}


async def create_biography(dynamodb: Any, user_id: str, title: str) -> dict[str, Any]:
    """Insert a BIO item with PK=USER#{user_id} and SK=BIO#{bio_id}."""
    bio_id, now = str(uuid4()), _now()
    item = {"PK": f"USER#{user_id}", "SK": f"BIO#{bio_id}", "entity_type": "BIOGRAPHY", "bio_id": bio_id, "user_id": user_id, "title": title, "is_public": False, "created_at": now, "updated_at": now}
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    await table.put_item(Item=item, ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)")
    return _biography_response(item)


async def list_biographies(dynamodb: Any, user_id: str) -> list[dict[str, Any]]:
    """Query one user partition and return items whose sort keys begin BIO#."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    response = await table.query(KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("BIO#"))
    return [_biography_response(item) for item in response.get("Items", [])]


async def get_biography(dynamodb: Any, user_id: str, bio_id: str) -> dict[str, Any]:
    """Read the exact biography item from its deterministic single-table keys."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    response = await table.get_item(Key={"PK": f"USER#{user_id}", "SK": f"BIO#{bio_id}"})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The magical scroll could not be found.")
    return _biography_response(item)


async def create_chapter(dynamodb: Any, user_id: str, bio_id: str, chapter_data: dict[str, Any]) -> dict[str, Any]:
    """Insert CHAPTER#{id} in the user partition; bio_id associates it with its scroll."""
    await get_biography(dynamodb, user_id, bio_id)
    chapter_id, now = str(uuid4()), _now()
    item = {"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}", "entity_type": "CHAPTER", "chapter_id": chapter_id, "bio_id": bio_id, "user_id": user_id, "created_at": now, "updated_at": now, **chapter_data}
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    await table.put_item(Item=item, ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)")
    return _chapter_response(item)


async def list_chapters(dynamodb: Any, user_id: str, bio_id: str) -> list[dict[str, Any]]:
    """Query CHAPTER# keys in the user partition then filter to the requested bio_id."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    response = await table.query(KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("CHAPTER#"), FilterExpression=Attr("bio_id").eq(bio_id))
    chapters = [_chapter_response(item) for item in response.get("Items", [])]
    return sorted(chapters, key=lambda chapter: chapter["order"])


async def update_chapter(dynamodb: Any, user_id: str, chapter_id: str, changes: dict[str, Any]) -> dict[str, Any]:
    """Update allowed chapter attributes while retaining PK=USER and SK=CHAPTER keys."""
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes were offered to the enchanted chapter.")
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    names, values, assignments = {"#updated_at": "updated_at"}, {":updated_at": _now()}, ["#updated_at = :updated_at"]
    for index, (key, value) in enumerate(changes.items()):
        name, token = f"#field{index}", f":value{index}"
        names[name], values[token] = key, value
        assignments.append(f"{name} = {token}")
    try:
        response = await table.update_item(Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}"}, UpdateExpression="SET " + ", ".join(assignments), ExpressionAttributeNames=names, ExpressionAttributeValues=values, ConditionExpression="attribute_exists(PK)", ReturnValues="ALL_NEW")
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The magical chapter could not be found.") from exc
        raise
    return _chapter_response(response["Attributes"])


async def save_chat_message(dynamodb: Any, user_id: str, bio_id: str, chapter_id: str, role: str, content: str) -> None:
    """Atomically append a turn to the chapter's messages list within its USER partition."""
    if role not in {"user", "assistant"}:
        raise ValueError("Chat roles must be user or assistant")
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    message = {"id": str(uuid4()), "role": role, "content": content, "created_at": _now()}
    try:
        await table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}"},
            UpdateExpression="SET messages = list_append(if_not_exists(messages, :empty), :message), updated_at = :updated",
            ConditionExpression="attribute_exists(PK) AND bio_id = :bio_id",
            ExpressionAttributeValues={":empty": [], ":message": [message], ":updated": _now(), ":bio_id": bio_id},
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The chapter for this memory could not be found.") from exc
        raise


async def get_chapter_messages(dynamodb: Any, user_id: str, bio_id: str, chapter_id: str) -> list[dict[str, str]]:
    """Read stored chat turns for a chapter after validating its biography ownership."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    response = await table.get_item(Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}"})
    item = response.get("Item")
    if not item or item.get("bio_id") != bio_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The chapter for this memory could not be found.")
    return [{"role": str(message["role"]), "content": str(message["content"])} for message in item.get("messages", [])]


async def update_chapter_narrative(dynamodb: Any, user_id: str, bio_id: str, chapter_id: str, narrative_data: dict[str, Any]) -> None:
    """Persist generated prose and themes on the corresponding CHAPTER item."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    try:
        await table.update_item(
            Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}"},
            UpdateExpression="SET narrative_text = :text, themes = :themes, suggested_media_tags = :tags, updated_at = :updated",
            ConditionExpression="attribute_exists(PK) AND bio_id = :bio_id",
            ExpressionAttributeValues={":text": narrative_data["narrative_text"], ":themes": narrative_data["key_themes"], ":tags": narrative_data["suggested_media_tags"], ":updated": _now(), ":bio_id": bio_id},
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The chapter for this memory could not be found.") from exc
        raise


async def delete_chapter(dynamodb: Any, user_id: str, chapter_id: str) -> None:
    """Delete the chapter item from the partition."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    await table.delete_item(Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}"})


async def delete_chat_message(dynamodb: Any, user_id: str, chapter_id: str, message_id: str) -> None:
    """Delete a specific message by its UUID key inside the chapter's messages array."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    response = await table.get_item(Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}"})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The chapter could not be found.")
    messages = item.get("messages", [])
    filtered = [m for m in messages if m.get("id") != message_id]
    await table.update_item(
        Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{chapter_id}"},
        UpdateExpression="SET messages = :messages, updated_at = :updated",
        ExpressionAttributeValues={":messages": filtered, ":updated": _now()}
    )


async def soft_delete_memory(dynamodb: Any, user_id: str, memory_id: str) -> None:
    """Soft delete memory by marking deleted_at timestamp and cascading remove from active items."""
    table = await dynamodb.Table(get_settings().dynamodb_biography_table)
    response = await table.query(KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("CHAPTER#"))
    chapters = response.get("Items", [])
    now_str = _now()
    
    for ch in chapters:
        messages = ch.get("messages", [])
        modified = False
        new_messages = []
        for m in messages:
            if m.get("id") == memory_id:
                m["deleted_at"] = now_str
                modified = True
            else:
                new_messages.append(m)
        if modified:
            layout = ch.get("layout", [])
            new_layout = [el for el in layout if el.get("id") != memory_id and el.get("memory_id") != memory_id]
            await table.update_item(
                Key={"PK": f"USER#{user_id}", "SK": f"CHAPTER#{ch['chapter_id']}"},
                UpdateExpression="SET messages = :messages, layout = :layout, updated_at = :updated",
                ExpressionAttributeValues={":messages": new_messages, ":layout": new_layout, ":updated": now_str}
            )

