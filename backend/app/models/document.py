from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field

DocumentStatus = Literal["uploading", "processing", "ready", "failed"]


class DocumentCreate(BaseModel):
    file_name: str
    content_type: str


class DocumentInDB(BaseModel):
    owner_id: str
    file_name: str
    file_url: str
    cloudinary_public_id: str
    status: DocumentStatus = "uploading"
    page_count: int | None = None
    chunk_count: int | None = None
    error_message: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DocumentPublic(BaseModel):
    id: str
    owner_id: str
    file_name: str
    file_url: str
    status: DocumentStatus
    page_count: int | None
    chunk_count: int | None
    error_message: str | None
    created_at: datetime


class ChunkRecord(BaseModel):
    """Metadata stored in MongoDB; the actual embedding vector lives in Pinecone,
    keyed by this chunk's id so we never duplicate large vectors in Mongo."""

    document_id: str
    owner_id: str
    chunk_index: int
    page_number: int | None
    text: str
    pinecone_id: str
