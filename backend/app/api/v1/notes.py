"""Notes API with AI features"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_current_user, FirebaseUser
from app.db.mongodb import get_db
from app.models.notes_enhanced import (
    NoteCreate,
    NoteUpdate,
    NotePublic,
    SummarizeRequest,
    ExplainRequest,
    FlashcardsRequest,
    QuizRequest,
    ChatRequest,
    ChatResponse,
    NoteFromMessageRequest,
    NoteFromConversationRequest,
)
from app.services import notes_service_enhanced

router = APIRouter(prefix="/notes", tags=["notes"])


# Original CRUD endpoints (enhanced)


@router.post("", response_model=NotePublic)
async def create_note(
    payload: NoteCreate,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new note"""
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    return await notes_service_enhanced.create_note(db, user.uid, payload)


@router.get("", response_model=list[NotePublic])
async def list_notes(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List all notes for the current user"""
    return await notes_service_enhanced.list_notes(db, user.uid)


# Chat -> Note conversion endpoints (must come before /{note_id} routes)


@router.post("/from-message", response_model=NotePublic)
async def create_note_from_message(
    payload: NoteFromMessageRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Convert a single AI chat response into a formatted note"""
    return await notes_service_enhanced.create_note_from_message(
        db, user.uid, payload.content, payload.document_id
    )


@router.post("/from-conversation", response_model=NotePublic)
async def create_note_from_conversation(
    payload: NoteFromConversationRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Convert a full chat conversation into a formatted note"""
    return await notes_service_enhanced.create_note_from_conversation(
        db, user.uid, payload.messages, payload.document_id
    )


@router.get("/search/{query}", response_model=list[NotePublic])
async def search_notes(
    query: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Search notes by title, tags, or content"""
    return await notes_service_enhanced.search_notes(db, user.uid, query)


@router.get("/{note_id}", response_model=NotePublic)
async def get_note(
    note_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get a specific note"""
    note = await notes_service_enhanced.get_note(db, user.uid, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.patch("/{note_id}", response_model=NotePublic)
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update a note"""
    note = await notes_service_enhanced.update_note(db, user.uid, note_id, payload)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=204)
async def delete_note(
    note_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete a note"""
    deleted = await notes_service_enhanced.delete_note(db, user.uid, note_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")


@router.post("/{note_id}/toggle-favorite", response_model=NotePublic)
async def toggle_favorite(
    note_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Toggle favorite status of a note"""
    note = await notes_service_enhanced.toggle_favorite(db, user.uid, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


# AI Feature Endpoints


@router.post("/{note_id}/summarize")
async def summarize_note(
    note_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Generate a summary of the note"""
    summary = await notes_service_enhanced.summarize_note(db, user.uid, note_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"summary": summary}


@router.post("/{note_id}/explain")
async def explain_note(
    note_id: str,
    payload: ExplainRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Generate an explanation for the note"""
    explanation = await notes_service_enhanced.explain_note(
        db, user.uid, note_id, payload.topic
    )
    if explanation is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"explanation": explanation}


@router.post("/{note_id}/flashcards")
async def generate_flashcards(
    note_id: str,
    payload: FlashcardsRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Generate flashcards from the note"""
    flashcards = await notes_service_enhanced.generate_flashcards(
        db, user.uid, note_id, payload.count
    )
    if flashcards is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"flashcards": flashcards}


@router.post("/{note_id}/quiz")
async def generate_quiz(
    note_id: str,
    payload: QuizRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Generate quiz questions from the note"""
    questions = await notes_service_enhanced.generate_quiz(
        db, user.uid, note_id, payload.count
    )
    if questions is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"quiz_questions": questions}


@router.post("/{note_id}/chat")
async def chat_with_note(
    note_id: str,
    payload: ChatRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Chat with the note content"""
    response = await notes_service_enhanced.chat_with_note(
        db, user.uid, note_id, payload.message
    )
    if response is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return ChatResponse(message=response)


@router.post("/{note_id}/ai/update")
async def update_ai_metadata(
    note_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Generate all AI metadata for a note (summary, explanation, flashcards, quiz)"""
    note = await notes_service_enhanced.update_ai_metadata(db, user.uid, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note
from fastapi.responses import Response
from app.services import notes_export_service


@router.get("/{note_id}/export")
async def export_note(
    note_id: str,
    format: str = "pdf",
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Download a note as PDF or Word (.docx)"""
    note = await notes_service_enhanced.get_note(db, user.uid, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if format == "docx":
        file_bytes, media_type, filename = notes_export_service.export_note_docx(
            note.title, note.content
        )
    else:
        file_bytes, media_type, filename = notes_export_service.export_note_pdf(
            note.title, note.content
        )

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )