from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

NoteSource = Literal["manual", "document", "chat"]


class Flashcard(BaseModel):
    """Auto-generated study flashcard"""
    id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    question: str
    answer: str
    mastery: int = 0  # 0=new, 1=learning, 2=familiar, 3=mastered


class QuizQuestion(BaseModel):
    """Auto-generated quiz question"""
    id: str = Field(default_factory=lambda: str(datetime.now().timestamp()))
    question: str
    options: list[str]
    correct_answer: int  # index of correct option
    explanation: str = ""


class ChatMessage(BaseModel):
    """Chat message with note"""
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class AIMetadata(BaseModel):
    """AI-generated metadata for a note"""
    summary: Optional[str] = None
    key_points: list[str] = Field(default_factory=list)
    explanation: Optional[str] = None
    ai_suggestions: list[str] = Field(default_factory=list)
    flashcards: list[Flashcard] = Field(default_factory=list)
    quiz_questions: list[QuizQuestion] = Field(default_factory=list)
    last_ai_update: Optional[datetime] = None


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    tags: list[str] = Field(default_factory=list)
    source: NoteSource = "manual"
    category: Optional[str] = None
    document_id: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[list[str]] = None
    category: Optional[str] = None
    is_favorite: Optional[bool] = None


class NotePublic(BaseModel):
    id: str
    title: str
    content: str
    tags: list[str]
    source: NoteSource
    category: Optional[str] = None
    document_id: Optional[str] = None
    is_favorite: bool = False
    ai_metadata: Optional[AIMetadata] = None
    created_at: datetime
    updated_at: datetime


# AI Feature Request Models
class SummarizeRequest(BaseModel):
    """Request to summarize a note"""
    note_id: str


class ExplainRequest(BaseModel):
    """Request to explain complex parts of a note"""
    note_id: str
    topic: Optional[str] = None


class FlashcardsRequest(BaseModel):
    """Request to generate flashcards"""
    note_id: str
    count: int = 10


class QuizRequest(BaseModel):
    """Request to generate quiz"""
    note_id: str
    count: int = 5


class ChatRequest(BaseModel):
    """Request to chat with note"""
    note_id: str
    message: str


class ChatResponse(BaseModel):
    """Response from note chat"""
    message: str
    messages: list[ChatMessage] = Field(default_factory=list)


# Chat -> Note conversion models
class ChatMessageInput(BaseModel):
    """A single message passed in from the frontend chat when converting to a note"""
    role: Literal["user", "assistant"]
    content: str


class NoteFromMessageRequest(BaseModel):
    """Convert a single AI chat response into a formatted note"""
    content: str
    document_id: Optional[str] = None


class NoteFromConversationRequest(BaseModel):
    """Convert a full chat conversation into a formatted note"""
    messages: list[ChatMessageInput]
    document_id: Optional[str] = None