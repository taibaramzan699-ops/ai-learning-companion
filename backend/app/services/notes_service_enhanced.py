"""Enhanced notes service with AI capabilities"""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.notes_enhanced import (
    NoteCreate,
    NoteUpdate,
    NotePublic,
    AIMetadata,
    ChatMessageInput,
)
from app.services.ai_service import ai_service


def _to_public(doc: dict) -> NotePublic:
    """Convert MongoDB document to public Note model"""
    ai_metadata_dict = doc.get("ai_metadata")
    ai_metadata = None
    if ai_metadata_dict:
        ai_metadata = AIMetadata(**ai_metadata_dict)

    return NotePublic(
        id=str(doc["_id"]),
        title=doc["title"],
        content=doc.get("content", ""),
        tags=doc.get("tags", []),
        source=doc.get("source", "manual"),
        category=doc.get("category"),
        document_id=doc.get("document_id"),
        is_favorite=doc.get("is_favorite", False),
        ai_metadata=ai_metadata,
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def create_note(db: AsyncIOMotorDatabase, owner_id: str, payload: NoteCreate) -> NotePublic:
    """Create a new note"""
    now = datetime.now(timezone.utc)
    doc = {
        "owner_id": owner_id,
        "title": payload.title,
        "content": payload.content,
        "tags": payload.tags,
        "source": payload.source,
        "category": payload.category,
        "document_id": payload.document_id,
        "is_favorite": False,
        "ai_metadata": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.notes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_public(doc)


async def list_notes(db: AsyncIOMotorDatabase, owner_id: str) -> list[NotePublic]:
    """List all notes for a user, sorted by update time"""
    cursor = (
        db.notes.find({"owner_id": owner_id})
        .sort([("is_favorite", -1), ("updated_at", -1)])
    )
    docs = [d async for d in cursor]
    return [_to_public(d) for d in docs]


async def get_note(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str
) -> Optional[NotePublic]:
    """Get a specific note"""
    if not ObjectId.is_valid(note_id):
        return None
    doc = await db.notes.find_one({"_id": ObjectId(note_id), "owner_id": owner_id})
    return _to_public(doc) if doc else None


async def update_note(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str, payload: NoteUpdate
) -> Optional[NotePublic]:
    """Update a note"""
    if not ObjectId.is_valid(note_id):
        return None

    updates = {
        k: v
        for k, v in payload.model_dump(exclude_unset=True).items()
        if v is not None
    }
    if not updates:
        return await get_note(db, owner_id, note_id)

    updates["updated_at"] = datetime.now(timezone.utc)
    result = await db.notes.find_one_and_update(
        {"_id": ObjectId(note_id), "owner_id": owner_id},
        {"$set": updates},
        return_document=True,
    )
    return _to_public(result) if result else None


async def delete_note(db: AsyncIOMotorDatabase, owner_id: str, note_id: str) -> bool:
    """Delete a note"""
    if not ObjectId.is_valid(note_id):
        return False
    result = await db.notes.delete_one(
        {"_id": ObjectId(note_id), "owner_id": owner_id}
    )
    return result.deleted_count > 0


async def toggle_favorite(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str
) -> Optional[NotePublic]:
    """Toggle favorite status of a note"""
    if not ObjectId.is_valid(note_id):
        return None

    doc = await db.notes.find_one({"_id": ObjectId(note_id), "owner_id": owner_id})
    if not doc:
        return None

    new_favorite_status = not doc.get("is_favorite", False)
    result = await db.notes.find_one_and_update(
        {"_id": ObjectId(note_id), "owner_id": owner_id},
        {
            "$set": {
                "is_favorite": new_favorite_status,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        return_document=True,
    )
    return _to_public(result) if result else None


async def search_notes(
    db: AsyncIOMotorDatabase, owner_id: str, query: str
) -> list[NotePublic]:
    """Search notes by title or tags"""
    cursor = db.notes.find(
        {
            "owner_id": owner_id,
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"tags": {"$in": [query]}},
                {"content": {"$regex": query, "$options": "i"}},
            ],
        }
    ).sort([("is_favorite", -1), ("updated_at", -1)])

    docs = [d async for d in cursor]
    return [_to_public(d) for d in docs]


# AI Feature Methods
async def summarize_note(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str
) -> Optional[str]:
    """Generate summary for a note"""
    note = await get_note(db, owner_id, note_id)
    if not note:
        return None

    return await ai_service.summarize_note(note.content, note.title)


async def explain_note(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str, topic: Optional[str] = None
) -> Optional[str]:
    """Generate explanation for a note"""
    note = await get_note(db, owner_id, note_id)
    if not note:
        return None

    return await ai_service.explain_note(note.content, note.title, topic)


async def generate_flashcards(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str, count: int = 10
):
    """Generate flashcards for a note"""
    note = await get_note(db, owner_id, note_id)
    if not note:
        return None

    flashcards = await ai_service.generate_flashcards(
        note.content, note.title, count
    )

    if flashcards:
        ai_metadata = note.ai_metadata or AIMetadata()
        ai_metadata.flashcards = flashcards
        ai_metadata.last_ai_update = datetime.now(timezone.utc)

        await db.notes.find_one_and_update(
            {"_id": ObjectId(note_id), "owner_id": owner_id},
            {"$set": {"ai_metadata": ai_metadata.model_dump()}},
        )

    return flashcards


async def generate_quiz(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str, count: int = 5
):
    """Generate quiz for a note"""
    note = await get_note(db, owner_id, note_id)
    if not note:
        return None

    quiz_questions = await ai_service.generate_quiz(note.content, note.title, count)

    if quiz_questions:
        ai_metadata = note.ai_metadata or AIMetadata()
        ai_metadata.quiz_questions = quiz_questions
        ai_metadata.last_ai_update = datetime.now(timezone.utc)

        await db.notes.find_one_and_update(
            {"_id": ObjectId(note_id), "owner_id": owner_id},
            {"$set": {"ai_metadata": ai_metadata.model_dump()}},
        )

    return quiz_questions


async def chat_with_note(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str, message: str
) -> Optional[str]:
    """Chat with a note"""
    note = await get_note(db, owner_id, note_id)
    if not note:
        return None

    return await ai_service.chat_with_note(note.content, note.title, message)


async def update_ai_metadata(
    db: AsyncIOMotorDatabase, owner_id: str, note_id: str
) -> Optional[NotePublic]:
    """Update all AI metadata for a note"""
    note = await get_note(db, owner_id, note_id)
    if not note:
        return None

    ai_metadata = await ai_service.generate_all_ai_metadata(
        note.content, note.title
    )

    result = await db.notes.find_one_and_update(
        {"_id": ObjectId(note_id), "owner_id": owner_id},
        {
            "$set": {
                "ai_metadata": ai_metadata.model_dump(),
                "updated_at": datetime.now(timezone.utc),
            }
        },
        return_document=True,
    )
    return _to_public(result) if result else None


# --- Chat -> Note conversion ---

def _format_conversation_transcript(messages: list[ChatMessageInput]) -> str:
    """Turn a list of chat messages into a readable Q&A transcript."""
    lines = []
    for m in messages:
        speaker = "You" if m.role == "user" else "AI"
        lines.append(f"{speaker}: {m.content}")
    return "\n\n".join(lines)


async def create_note_from_message(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    content: str,
    document_id: Optional[str] = None,
) -> NotePublic:
    """Convert a single AI chat response into a fully formatted note."""
    meta = await ai_service.generate_note_from_content(content)
    formatted_html = ai_service.render_professional_note_html(
        title=meta["title"],
        category=meta["category"],
        source_label="AI Chat",
        summary=meta["summary"],
        raw_content=content,
        key_points=meta["key_points"],
        suggestions=meta["suggestions"],
    )

    now = datetime.now(timezone.utc)
    doc = {
        "owner_id": owner_id,
        "title": meta["title"],
        "content": formatted_html,
        "tags": meta["tags"],
        "source": "chat",
        "category": meta["category"],
        "document_id": document_id,
        "is_favorite": False,
        "ai_metadata": AIMetadata(
            summary=meta["summary"],
            key_points=meta["key_points"],
            ai_suggestions=meta["suggestions"],
            last_ai_update=now,
        ).model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    result = await db.notes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_public(doc)


async def create_note_from_conversation(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    messages: list[ChatMessageInput],
    document_id: Optional[str] = None,
) -> NotePublic:
    """Convert a full chat conversation into a fully formatted note."""
    transcript = _format_conversation_transcript(messages)
    meta = await ai_service.generate_note_from_content(transcript)
    formatted_html = ai_service.render_professional_note_html(
        title=meta["title"],
        category=meta["category"],
        source_label="AI Chat",
        summary=meta["summary"],
        raw_content=transcript,
        key_points=meta["key_points"],
        suggestions=meta["suggestions"],
    )

    now = datetime.now(timezone.utc)
    doc = {
        "owner_id": owner_id,
        "title": meta["title"],
        "content": formatted_html,
        "tags": meta["tags"],
        "source": "chat",
        "category": meta["category"],
        "document_id": document_id,
        "is_favorite": False,
        "ai_metadata": AIMetadata(
            summary=meta["summary"],
            key_points=meta["key_points"],
            ai_suggestions=meta["suggestions"],
            last_ai_update=now,
        ).model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    result = await db.notes.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_public(doc)