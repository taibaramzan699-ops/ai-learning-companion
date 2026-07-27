from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_current_user, FirebaseUser
from app.db.mongodb import get_db
from app.models.flashcard import (
    FlashcardGenerateRequest,
    FlashcardDeckSummary,
    FlashcardPublic,
    FlashcardReviewSubmitRequest,
    FlashcardReviewResult,
    FlashcardsPageData,
)
from app.services.flashcard_service_enhanced import (
    generate_flashcards,
    list_decks,
    get_deck_review_cards,
    submit_review,
    get_page_data,
    delete_deck,
)

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_flashcards_route(
    payload: FlashcardGenerateRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        deck_id = await generate_flashcards(
            db,
            user.uid,
            payload.document_id,
            payload.num_cards,
            payload.difficulty,
            payload.card_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {"deck_id": deck_id}


@router.get("", response_model=list[FlashcardDeckSummary])
async def list_decks_route(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await list_decks(db, user.uid)


@router.get("/page-data", response_model=FlashcardsPageData)
async def get_page_data_route(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Single call that powers the flashcards landing page: continue-learning
    card, deck grid, and every right-sidebar widget in one response."""
    return await get_page_data(db, user.uid)


@router.get("/{deck_id}/review", response_model=list[FlashcardPublic])
async def get_deck_review_route(
    deck_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    cards = await get_deck_review_cards(db, user.uid, deck_id)
    if cards is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return cards


@router.post("/{deck_id}/review", response_model=FlashcardReviewResult)
async def submit_review_route(
    deck_id: str,
    payload: FlashcardReviewSubmitRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        return await submit_review(db, user.uid, deck_id, payload.card_id, payload.outcome)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck_route(
    deck_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    deleted = await delete_deck(db, user.uid, deck_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Deck not found")