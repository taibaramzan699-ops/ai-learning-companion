from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field

FlashcardDifficulty = Literal["easy", "medium", "hard"]

# The format requested at generation time. "mixed" produces a blend of
# definition / qa / concept cards; each stored card still carries its own
# concrete card_type since "mixed" is never a per-card value — same pattern
# as QuizQuestionType / question_type in quiz_enhanced.py.
FlashcardTypeRequest = Literal["definition", "qa", "concept", "mixed"]
FlashcardCardType = Literal["definition", "qa", "concept"]

# Backend-derived only. The frontend never sends this — it's computed from
# leitner_box / review history in flashcard_service_enhanced.py.
MasteryStatus = Literal["new", "learning", "reviewing", "mastered"]

ReviewOutcome = Literal["know", "review_again", "difficult"]


class FlashcardGenerateRequest(BaseModel):
    document_id: str
    difficulty: FlashcardDifficulty = "medium"
    card_type: FlashcardTypeRequest = "mixed"
    num_cards: int = Field(20, ge=5, le=100)


class FlashcardCardDB(BaseModel):
    """Single card, embedded inside FlashcardDeckInDB.cards."""

    id: str
    card_type: FlashcardCardType
    front: str
    back: str
    tags: list[str] = Field(default_factory=list)
    confidence_score: Optional[float] = None  # 0-1, AI confidence in generated content

    # --- Spaced repetition state (simple Leitner system, box 1-5) ---
    leitner_box: int = 1
    mastery_status: MasteryStatus = "new"
    next_review_at: Optional[datetime] = None
    times_reviewed: int = 0


class FlashcardReviewLog(BaseModel):
    """Append-only entry recorded each time a card is reviewed. Used to
    recompute streaks and today's goal — never trust a client-sent count."""

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
    source_label: str  # e.g. "HTML Chapter 4 Forms.pdf"
    difficulty: FlashcardDifficulty
    requested_card_type: FlashcardTypeRequest
    cards: list[FlashcardCardDB] = Field(default_factory=list)
    review_log: list[FlashcardReviewLog] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FlashcardDeckSummary(BaseModel):
    """One row in the 'My Flashcard Sets' grid — mirrors QuizSummary."""

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
    """'Continue Learning' hero card on the flashcards page."""

    deck: FlashcardDeckSummary
    last_question_preview: str
    cards_reviewed_in_session: int


class FlashcardPublic(BaseModel):
    """Single card sent during a review session (front + back both included
    — unlike quiz answers, there's nothing to hide here)."""

    id: str
    card_type: FlashcardCardType
    front: str
    back: str
    mastery_status: MasteryStatus
    leitner_box: int


class FlashcardReviewSubmitRequest(BaseModel):
    card_id: str
    outcome: ReviewOutcome


class FlashcardReviewResult(BaseModel):
    card_id: str
    new_leitner_box: int
    new_mastery_status: MasteryStatus
    next_review_at: Optional[datetime]
    deck_mastery_percent: int


class FlashcardOverview(BaseModel):
    """Right-sidebar 'Your Flashcard Overview' widget, aggregated across
    all of the user's decks."""

    total_cards: int
    mastered: int
    need_review: int
    new_cards: int


class StudyGoal(BaseModel):
    target_cards: int
    completed_cards: int
    date: str  # ISO date


class WeekActivityDay(BaseModel):
    day: Literal["M", "T", "W", "T", "F", "S", "S"]
    active: bool


class StudyStreak(BaseModel):
    current_streak_days: int
    week_activity: list[WeekActivityDay]


class AiTip(BaseModel):
    id: str
    message: str


class FlashcardsPageData(BaseModel):
    """Everything the flashcards landing page needs in one response."""

    continue_learning: Optional[ContinueLearningItem]
    decks: list[FlashcardDeckSummary]
    overview: FlashcardOverview
    goal: StudyGoal
    streak: StudyStreak
    tip: Optional[AiTip]