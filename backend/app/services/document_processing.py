import asyncio
import logging
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.ocr_service import (
    extract_text_from_pdf,
    extract_text_from_scanned_pdf,
    extract_text_from_image,
    needs_ocr,
)
from app.services.office_extraction_service import (
    extract_text_from_docx,
    extract_text_from_pptx,
)
from app.services.chunking_service import chunk_text
from app.services.embedding_service import embed_texts
from app.services.pinecone_service import upsert_chunks

logger = logging.getLogger(__name__)

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"


async def process_document(
    db: AsyncIOMotorDatabase,
    document_id: str,
    owner_id: str,
    file_bytes: bytes,
    content_type: str,
) -> None:
    """
    Full ingestion pipeline: text extraction (with real OCR fallback for
    scanned PDFs) -> chunking -> embeddings -> Pinecone upsert -> chunk
    metadata persisted in MongoDB.
    """
    try:
        await db.documents.update_one({"_id": ObjectId(document_id)}, {"$set": {"status": "processing"}})

        if content_type == "application/pdf":
            pages = await asyncio.to_thread(extract_text_from_pdf, file_bytes)
            if needs_ocr(pages):
                logger.info("Document %s looks scanned; running OCR fallback", document_id)
                pages = await asyncio.to_thread(extract_text_from_scanned_pdf, file_bytes)
        elif content_type.startswith("image/"):
            text = await asyncio.to_thread(extract_text_from_image, file_bytes)
            pages = [(1, text)]
        elif content_type == DOCX_MIME:
            pages = await asyncio.to_thread(extract_text_from_docx, file_bytes)
        elif content_type == PPTX_MIME:
            pages = await asyncio.to_thread(extract_text_from_pptx, file_bytes)
        else:
            raise ValueError(f"Unsupported content type: {content_type}")

        chunks = chunk_text(pages)
        if not chunks:
            raise ValueError("No extractable text found in document")

        vectors = await asyncio.to_thread(embed_texts, [c["text"] for c in chunks])
        pinecone_ids = await asyncio.to_thread(upsert_chunks, document_id, owner_id, chunks, vectors)

        chunk_docs = [
            {
                "document_id": document_id,
                "owner_id": owner_id,
                "chunk_index": c["chunk_index"],
                "page_number": c["page_number"],
                "text": c["text"],
                "pinecone_id": pinecone_ids[i],
            }
            for i, c in enumerate(chunks)
        ]
        if chunk_docs:
            await db.chunks.insert_many(chunk_docs)

        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "ready", "page_count": len(pages), "chunk_count": len(chunks)}},
        )

    except Exception as exc:
        logger.exception("Failed to process document %s", document_id)
        await db.documents.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": "failed", "error_message": str(exc)}},
        )