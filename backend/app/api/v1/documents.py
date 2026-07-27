from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_current_user, FirebaseUser
from app.db.mongodb import get_db
from app.models.document import DocumentPublic
from app.services.cloudinary_service import upload_document, delete_document
from app.services.pinecone_service import delete_document_vectors
from app.services.document_processing import process_document

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def _to_public(doc: dict) -> DocumentPublic:
    return DocumentPublic(
        id=str(doc["_id"]),
        owner_id=doc["owner_id"],
        file_name=doc["file_name"],
        file_url=doc["file_url"],
        status=doc["status"],
        page_count=doc.get("page_count"),
        chunk_count=doc.get("chunk_count"),
        error_message=doc.get("error_message"),
        created_at=doc["created_at"],
    )


@router.post("", response_model=DocumentPublic, status_code=status.HTTP_201_CREATED)
async def upload_new_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 25MB limit")

    cloudinary_result = upload_document(file_bytes, file.filename, user.uid)

    doc = {
        "owner_id": user.uid,
        "file_name": file.filename,
        "file_url": cloudinary_result["secure_url"],
        "cloudinary_public_id": cloudinary_result["public_id"],
        "status": "processing",
        "page_count": None,
        "chunk_count": None,
        "error_message": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.documents.insert_one(doc)
    doc["_id"] = result.inserted_id

    background_tasks.add_task(
        process_document,
        db=db,
        document_id=str(result.inserted_id),
        owner_id=user.uid,
        file_bytes=file_bytes,
        content_type=file.content_type,
    )

    return _to_public(doc)


@router.get("", response_model=list[DocumentPublic])
async def list_documents(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    cursor = db.documents.find({"owner_id": user.uid}).sort("created_at", -1)
    return [_to_public(doc) async for doc in cursor]


@router.get("/{document_id}", response_model=DocumentPublic)
async def get_document(
    document_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        oid = ObjectId(document_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid document id")

    doc = await db.documents.find_one({"_id": oid, "owner_id": user.uid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return _to_public(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_route(
    document_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        oid = ObjectId(document_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid document id")

    doc = await db.documents.find_one({"_id": oid, "owner_id": user.uid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    delete_document(doc["cloudinary_public_id"])
    delete_document_vectors(user.uid, document_id)
    await db.chunks.delete_many({"document_id": document_id})
    await db.documents.delete_one({"_id": oid})