from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field


class ChatQuery(BaseModel):
    message: str
    document_id: str | None = None  # None = search across all of the user's documents
    conversation_id: str | None = None  # None = start a new conversation
    use_documents: bool = True  # False = skip retrieval entirely, answer as a general assistant


class SourceChunk(BaseModel):
    document_id: str
    page_number: int | None
    text: str
    score: float


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    sources: list[SourceChunk]


class ChatMessageInDB(BaseModel):
    conversation_id: str
    owner_id: str
    document_id: str | None
    role: Literal["user", "assistant"]
    content: str
    sources: list[SourceChunk] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatMessagePublic(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    sources: list[SourceChunk] = []
    created_at: datetime


class ConversationSummary(BaseModel):
    conversation_id: str
    document_id: str | None
    last_message: str
    updated_at: datetime