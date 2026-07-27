from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_current_user, FirebaseUser
from app.db.mongodb import get_db
from app.models.chat import ChatQuery, ChatResponse, ChatMessagePublic, ConversationSummary
from app.services.chat_service import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", response_model=ChatResponse)
async def query_chat(
    payload: ChatQuery,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conversation_id, answer, sources = await answer_question(
        db=db,
        owner_id=user.uid,
        question=payload.message,
        document_id=payload.document_id,
        conversation_id=payload.conversation_id,
        use_documents=payload.use_documents,
    )

    return ChatResponse(conversation_id=conversation_id, answer=answer, sources=sources)


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    pipeline = [
        {"$match": {"owner_id": user.uid}},
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": "$conversation_id",
                "document_id": {"$first": "$document_id"},
                "last_message": {"$first": "$content"},
                "updated_at": {"$first": "$created_at"},
            }
        },
        {"$sort": {"updated_at": -1}},
    ]
    results = await db.chat_messages.aggregate(pipeline).to_list(length=100)
    return [
        ConversationSummary(
            conversation_id=r["_id"],
            document_id=r.get("document_id"),
            last_message=r["last_message"],
            updated_at=r["updated_at"],
        )
        for r in results
    ]


@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatMessagePublic])
async def get_conversation_messages(
    conversation_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    cursor = (
        db.chat_messages.find({"conversation_id": conversation_id, "owner_id": user.uid})
        .sort("created_at", 1)
    )
    messages = [msg async for msg in cursor]
    if not messages:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return [
        ChatMessagePublic(
            role=m["role"],
            content=m["content"],
            sources=m.get("sources", []),
            created_at=m["created_at"],
        )
        for m in messages
    ]