from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field

QuizDifficulty = Literal["easy", "medium", "hard"]

# The format requested at generation time. "mixed" produces a blend of mcq and
# true_false questions; each stored question still carries its own concrete
# question_type (mcq or true_false) since "mixed" is never a per-question value.
QuizQuestionType = Literal["mcq", "true_false", "mixed"]
QuizQuestionFormat = Literal["mcq", "true_false"]


class QuizGenerateRequest(BaseModel):
    document_id: Optional[str] = None
    note_id: Optional[str] = None
    num_questions: int = Field(10, ge=5, le=20)
    difficulty: QuizDifficulty = "medium"
    question_type: QuizQuestionType = "mcq"


class QuizQuestionDB(BaseModel):
    """Full question record, including the answer — stored in Mongo, never
    sent to the frontend until after submission."""

    id: str
    question: str
    options: list[str]
    correct_answer: int
    explanation: str = ""
    topic: Optional[str] = None  # short topic label, used for strong/weak feedback
    question_type: QuizQuestionFormat = "mcq"


class QuizAttempt(BaseModel):
    id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    answers: dict[str, int] = Field(default_factory=dict)
    score: Optional[int] = None
    total: Optional[int] = None
    percentage: Optional[int] = None
    time_taken_seconds: Optional[int] = None


class QuizInDB(BaseModel):
    owner_id: str
    title: str
    category: str
    source_label: str  # e.g. "CSS Properties.pdf" or "Smart Note"
    document_id: Optional[str] = None
    note_id: Optional[str] = None
    difficulty: QuizDifficulty
    question_type: QuizQuestionType = "mcq"
    questions: list[QuizQuestionDB]
    topics: list[str] = Field(default_factory=list)
    attempts: list[QuizAttempt] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QuizSummary(BaseModel):
    """One row in the 'My Quizzes' grid."""

    id: str
    title: str
    category: str
    source_label: str
    difficulty: QuizDifficulty
    question_type: QuizQuestionType = "mcq"
    question_count: int
    best_score_pct: Optional[int] = None
    attempts_count: int
    last_attempt_at: Optional[datetime] = None
    created_at: datetime


class QuizIntro(BaseModel):
    """Shown before starting/resuming a quiz."""

    id: str
    title: str
    source_label: str
    category: str
    question_count: int
    difficulty: QuizDifficulty
    question_type: QuizQuestionType = "mcq"
    estimated_minutes: int
    topics: list[str]
    best_score_pct: Optional[int] = None
    attempts_count: int = 0


class QuizQuestionPublic(BaseModel):
    """Question shape sent while taking the quiz — no answer included."""

    id: str
    question: str
    options: list[str]
    question_type: QuizQuestionFormat = "mcq"


class QuizDetail(BaseModel):
    id: str
    title: str
    difficulty: QuizDifficulty
    questions: list[QuizQuestionPublic]


class QuizSubmitRequest(BaseModel):
    answers: dict[str, int]  # question_id -> selected option index
    time_taken_seconds: Optional[int] = None


class QuestionResult(BaseModel):
    question_id: str
    question: str
    options: list[str]
    correct_answer: int
    selected_answer: Optional[int]
    is_correct: bool
    explanation: str
    topic: Optional[str] = None


class QuizResult(BaseModel):
    quiz_id: str
    score: int
    total: int
    percentage: int
    grade: str
    time_taken_seconds: Optional[int] = None
    results: list[QuestionResult]
    strong_topics: list[str]
    weak_topics: list[str]
    ai_feedback: Optional[str] = None