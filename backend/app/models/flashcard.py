from datetime import datetime, date, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field

FlashcardDifficulty = Literal["easy", "medium", "hard"]
FlashcardTypeRequest = Literal["definition", "qa", "concept", "mixed"]
CardType = Literal["definition", "qa", "concept"]  # a stored card is never "mixed" — that's request-only
MasteryStatus = Literal["new", "learning", "reviewing", "mastered"]
ReviewOutcome = Literal["know", "review_again", "difficult"]


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class FlashcardGenerateRequest(BaseModel):
    document_id: str
    num_cards: int = Field(15, ge=5, le=40)
    difficulty: FlashcardDifficulty = "medium"
    card_type: FlashcardTypeRequest = "mixed"


class FlashcardReviewSubmitRequest(BaseModel):
    card_id: str
    outcome: ReviewOutcome


# ---------------------------------------------------------------------------
# Stored (Mongo) shapes
# ---------------------------------------------------------------------------

class FlashcardCardDB(BaseModel):
    """A single card as stored inside a deck's `cards` array."""

    id: str
    card_type: CardType
    front: str
    back: str
    tags: list[str] = Field(default_factory=list)

    # Spaced-repetition state (Leitner system, box 1-5)
    leitner_box: int = 1
    mastery_status: MasteryStatus = "new"
    next_review_at: Optional[datetime] = None
    times_reviewed: int = 0


class FlashcardReviewLog(BaseModel):
    """Append-only entry pushed to a deck's `review_log` on every review tap."""

    card_id: str
    outcome: ReviewOutcome
    box_before: int
    box_after: int
    reviewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FlashcardDeckInDB(BaseModel):
    owner_id: str
    title: str
    subject: str
    icon: str = "layers"
    source_document_id: str
    source_label: str
    difficulty: FlashcardDifficulty
    requested_card_type: FlashcardTypeRequest
    cards: list[FlashcardCardDB]
    review_log: list[FlashcardReviewLog] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Public / response shapes
# ---------------------------------------------------------------------------

class FlashcardDeckSummary(BaseModel):
    """One card in the deck grid."""

    id: str
    title: str
    subject: str
    icon: str
    source_label: str
    difficulty: FlashcardDifficulty
    total_cards: int
    cards_reviewed: int
    mastery_percent: int
    last_reviewed_at: Optional[datetime] = None
    created_at: datetime


class ContinueLearningItem(BaseModel):
    deck: FlashcardDeckSummary
    last_question_preview: str
    cards_reviewed_in_session: int


class FlashcardPublic(BaseModel):
    """Card shape sent during a review session — includes both sides since
    the frontend flips the card locally, but never the internal review log."""

    id: str
    card_type: CardType
    front: str
    back: str
    mastery_status: MasteryStatus
    leitner_box: int


class FlashcardReviewResult(BaseModel):
    card_id: str
    new_leitner_box: int
    new_mastery_status: MasteryStatus
    next_review_at: Optional[datetime] = None
    deck_mastery_percent: int


class FlashcardOverview(BaseModel):
    total_cards: int
    mastered: int
    need_review: int
    new_cards: int


class StudyGoal(BaseModel):
    target_cards: int
    completed_cards: int
    date: str  # ISO date string, e.g. "2026-07-26"


class WeekActivityDay(BaseModel):
    day: str  # single-letter label, e.g. "M"
    active: bool


class StudyStreak(BaseModel):
    current_streak_days: int
    week_activity: list[WeekActivityDay]


class AiTip(BaseModel):
    id: str
    message: str


class FlashcardsPageData(BaseModel):
    """Single response that powers the entire Flashcards landing page."""

    continue_learning: Optional[ContinueLearningItem] = None
    decks: list[FlashcardDeckSummary]
    overview: FlashcardOverview
    goal: StudyGoal
    streak: StudyStreak
    tip: AiTip