from fastapi import APIRouter
from app.api.v1 import auth, documents, chat, notes, quiz, flashcard

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(documents.router)
api_router.include_router(chat.router)
api_router.include_router(notes.router)
api_router.include_router(quiz.router)
api_router.include_router(flashcard.router)

# Registered in later phases as each module is built:
# api_router.include_router(planner.router)
# api_router.include_router(analytics.router)