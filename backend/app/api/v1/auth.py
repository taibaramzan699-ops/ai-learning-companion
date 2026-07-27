from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_current_user, FirebaseUser
from app.db.mongodb import get_db
from app.models.user import UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync", response_model=UserPublic)
async def sync_user(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Called once right after Firebase sign-in on the frontend.
    Creates the MongoDB user record on first login, otherwise returns the existing one.
    """
    existing = await db.users.find_one({"firebase_uid": user.uid})

    if existing is None:
        doc = {
            "firebase_uid": user.uid,
            "email": user.email or "",
            "display_name": user.claims.get("name", user.email or "New Student"),
            "photo_url": user.claims.get("picture"),
            "role": "student",
            "created_at": datetime.now(timezone.utc),
        }
        result = await db.users.insert_one(doc)
        doc["_id"] = result.inserted_id
        existing = doc

    return UserPublic(
        id=str(existing["_id"]),
        email=existing["email"],
        display_name=existing["display_name"],
        photo_url=existing.get("photo_url"),
        role=existing["role"],
        created_at=existing["created_at"],
    )


@router.get("/me", response_model=UserPublic)
async def get_me(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    existing = await db.users.find_one({"firebase_uid": user.uid})
    if existing is None:
        return await sync_user(user=user, db=db)

    return UserPublic(
        id=str(existing["_id"]),
        email=existing["email"],
        display_name=existing["display_name"],
        photo_url=existing.get("photo_url"),
        role=existing["role"],
        created_at=existing["created_at"],
    )
