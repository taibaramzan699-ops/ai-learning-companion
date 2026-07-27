from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_current_user, FirebaseUser
from app.db.mongodb import get_db
from app.models.quiz_enhanced import (
    QuizGenerateRequest,
    QuizSummary,
    QuizIntro,
    QuizDetail,
    QuizSubmitRequest,
    QuizResult,
)
from app.services.quiz_service_enhanced import (
    generate_quiz,
    list_quizzes,
    get_quiz_intro,
    get_quiz_detail,
    submit_quiz,
    delete_quiz,
)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_quiz_route(
    payload: QuizGenerateRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        quiz_id = await generate_quiz(
            db,
            user.uid,
            payload.document_id,
            payload.note_id,
            payload.num_questions,
            payload.difficulty,
            payload.question_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {"quiz_id": quiz_id}


@router.get("", response_model=list[QuizSummary])
async def list_quizzes_route(
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await list_quizzes(db, user.uid)


@router.get("/{quiz_id}/intro", response_model=QuizIntro)
async def get_quiz_intro_route(
    quiz_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    intro = await get_quiz_intro(db, user.uid, quiz_id)
    if intro is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return intro


@router.get("/{quiz_id}", response_model=QuizDetail)
async def get_quiz_detail_route(
    quiz_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    detail = await get_quiz_detail(db, user.uid, quiz_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return detail


@router.post("/{quiz_id}/submit", response_model=QuizResult)
async def submit_quiz_route(
    quiz_id: str,
    payload: QuizSubmitRequest,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        return await submit_quiz(db, user.uid, quiz_id, payload.answers, payload.time_taken_seconds)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz_route(
    quiz_id: str,
    user: FirebaseUser = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    deleted = await delete_quiz(db, user.uid, quiz_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Quiz not found")