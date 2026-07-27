"""Quiz service — generation, taking, and AI-scored results, built on the same
ai_service singleton used by Notes for consistency."""
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.quiz_enhanced import (
    QuizInDB,
    QuizQuestionDB,
    QuizAttempt,
    QuizSummary,
    QuizIntro,
    QuizDetail,
    QuizQuestionPublic,
    QuestionResult,
    QuizResult,
    QuizDifficulty,
    QuizQuestionType,
)
from app.services.ai_service import ai_service

MAX_CONTEXT_CHARS = 12000

DIFFICULTY_GUIDANCE = {
    "easy": "Keep questions straightforward, testing basic recall and definitions.",
    "medium": "Mix recall with applied understanding — some questions should require connecting concepts.",
    "hard": "Favor applied/analytical questions, edge cases, and questions that require synthesizing multiple concepts.",
}

# Controls the shape of "options"/"correct_answer" the model must produce.
# true_false questions always use options exactly ["True", "False"] so the
# service can tell them apart from mcq questions by counting options later.
TYPE_GUIDANCE = {
    "mcq": "Every question must be multiple-choice with exactly 4 options.",
    "true_false": (
        'Every question must be True/False. Set "options" to exactly ["True", "False"] '
        'and "correct_answer" to 0 if the statement is true, 1 if it is false.'
    ),
    "mixed": (
        "Mix both formats across the set: some questions multiple-choice (exactly 4 options), "
        'others True/False (set "options" to exactly ["True", "False"] and "correct_answer" '
        "to 0 for true / 1 for false). Aim for a roughly even split."
    ),
}

QUIZ_SYSTEM_PROMPT = """You are a quiz generator for a study platform. Using ONLY the material given to you, create quiz questions.

{difficulty_note}

{type_note}

Tag each question with a short "topic" label (1-3 words, e.g. "Colors", "Flexbox", "Margin") representing the specific concept it tests — these are used later to show the student which topics they're strong/weak in, so keep them short, consistent, and reusable across questions (multiple questions can share a topic).

Respond with a JSON object of this exact shape:
{{"questions": [{{"question": "string", "options": ["a","b","c","d"], "correct_answer": 0, "explanation": "one sentence", "topic": "string"}}]}}"""


def _to_summary(doc: dict) -> QuizSummary:
    attempts = doc.get("attempts", [])
    completed = [a for a in attempts if a.get("completed_at")]
    best_pct = max((a["percentage"] for a in completed if a.get("percentage") is not None), default=None)
    last_attempt_at = max((a["completed_at"] for a in completed), default=None) if completed else None

    return QuizSummary(
        id=str(doc["_id"]),
        title=doc["title"],
        category=doc["category"],
        source_label=doc["source_label"],
        difficulty=doc["difficulty"],
        question_type=doc.get("question_type", "mcq"),
        question_count=len(doc["questions"]),
        best_score_pct=best_pct,
        attempts_count=len(completed),
        last_attempt_at=last_attempt_at,
        created_at=doc["created_at"],
    )


def _to_intro(doc: dict) -> QuizIntro:
    attempts = doc.get("attempts", [])
    completed = [a for a in attempts if a.get("completed_at")]
    best_pct = max((a["percentage"] for a in completed if a.get("percentage") is not None), default=None)

    return QuizIntro(
        id=str(doc["_id"]),
        title=doc["title"],
        source_label=doc["source_label"],
        category=doc["category"],
        question_count=len(doc["questions"]),
        difficulty=doc["difficulty"],
        question_type=doc.get("question_type", "mcq"),
        estimated_minutes=max(1, round(len(doc["questions"]) * 0.8)),
        topics=doc.get("topics", []),
        best_score_pct=best_pct,
        attempts_count=len(completed),
    )


def _to_detail(doc: dict) -> QuizDetail:
    return QuizDetail(
        id=str(doc["_id"]),
        title=doc["title"],
        difficulty=doc["difficulty"],
        questions=[
            QuizQuestionPublic(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                question_type=q.get("question_type", "mcq"),
            )
            for q in doc["questions"]
        ],
    )


async def _get_document_context(db: AsyncIOMotorDatabase, document_id: str, owner_id: str) -> tuple[str, str]:
    """Returns (context_text, source_label)."""
    doc = await db.documents.find_one({"_id": ObjectId(document_id), "owner_id": owner_id})
    if doc is None:
        raise ValueError("Document not found")

    cursor = db.chunks.find({"document_id": document_id, "owner_id": owner_id}).sort("chunk_index", 1)
    chunks = [c async for c in cursor]
    if not chunks:
        raise ValueError("No processed content found for this document")

    text_parts, total_len = [], 0
    step = max(1, len(chunks) // 40)
    for c in chunks[::step]:
        piece = c["text"]
        if total_len + len(piece) > MAX_CONTEXT_CHARS:
            break
        text_parts.append(piece)
        total_len += len(piece)

    return "\n\n".join(text_parts), doc["file_name"]


async def _get_note_context(db: AsyncIOMotorDatabase, note_id: str, owner_id: str) -> tuple[str, str]:
    note = await db.notes.find_one({"_id": ObjectId(note_id), "owner_id": owner_id})
    if note is None:
        raise ValueError("Note not found")

    plain = re.sub(r"<[^>]*>", " ", note.get("content", ""))
    plain = re.sub(r"\s+", " ", plain).strip()
    return plain[:MAX_CONTEXT_CHARS], note["title"]


def _infer_question_format(options: list[str]) -> str:
    """true_false questions always carry exactly 2 options; everything else is mcq."""
    return "true_false" if len(options) == 2 else "mcq"


async def _generate_questions(
    context: str, num_questions: int, difficulty: QuizDifficulty, question_type: QuizQuestionType
) -> list[dict]:
    prompt = QUIZ_SYSTEM_PROMPT.format(
        difficulty_note=DIFFICULTY_GUIDANCE[difficulty],
        type_note=TYPE_GUIDANCE[question_type],
    )
    response = await ai_service.client.chat.completions.create(
        model=ai_service.model,
        response_format={"type": "json_object"},
        temperature=0.5,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Create exactly {num_questions} questions from this material:\n\n---\n{context}\n---"},
        ],
    )
    text = response.choices[0].message.content
    parsed = json.loads(text)
    questions = parsed.get("questions")
    if not isinstance(questions, list):
        raise ValueError("Model did not return a questions array")
    return questions


async def generate_quiz(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    document_id: Optional[str],
    note_id: Optional[str],
    num_questions: int,
    difficulty: QuizDifficulty,
    question_type: QuizQuestionType = "mcq",
) -> str:
    if document_id:
        context, source_name = await _get_document_context(db, document_id, owner_id)
        source_label = source_name
    elif note_id:
        context, source_name = await _get_note_context(db, note_id, owner_id)
        source_label = "Smart Note"
    else:
        raise ValueError("Either document_id or note_id is required")

    category = await ai_service.generate_category(context)

    try:
        raw_questions = await _generate_questions(context, num_questions, difficulty, question_type)
    except Exception as exc:
        raise ValueError("Couldn't generate a quiz from this material. Please try again.") from exc

    questions: list[QuizQuestionDB] = []
    topics_seen: list[str] = []
    for i, q in enumerate(raw_questions[:num_questions]):
        try:
            topic = q.get("topic")
            if topic and topic not in topics_seen:
                topics_seen.append(topic)
            options = q["options"]
            questions.append(
                QuizQuestionDB(
                    id=f"q{i + 1}",
                    question=q["question"],
                    options=options,
                    correct_answer=q["correct_answer"],
                    explanation=q.get("explanation", ""),
                    topic=topic,
                    question_type=_infer_question_format(options),
                )
            )
        except (KeyError, TypeError):
            continue

    if not questions:
        raise ValueError("The model didn't return any usable questions. Please try again.")

    quiz = QuizInDB(
        owner_id=owner_id,
        title=source_name if note_id else f"{source_name.rsplit('.', 1)[0]}",
        category=category,
        source_label=source_label,
        document_id=document_id,
        note_id=note_id,
        difficulty=difficulty,
        question_type=question_type,
        questions=questions,
        topics=topics_seen,
    )
    result = await db.quizzes.insert_one(quiz.model_dump())
    return str(result.inserted_id)


async def list_quizzes(db: AsyncIOMotorDatabase, owner_id: str) -> list[QuizSummary]:
    cursor = db.quizzes.find({"owner_id": owner_id}).sort("updated_at", -1)
    return [_to_summary(doc) async for doc in cursor]


async def get_quiz_intro(db: AsyncIOMotorDatabase, owner_id: str, quiz_id: str) -> Optional[QuizIntro]:
    if not ObjectId.is_valid(quiz_id):
        return None
    doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "owner_id": owner_id})
    return _to_intro(doc) if doc else None


async def get_quiz_detail(db: AsyncIOMotorDatabase, owner_id: str, quiz_id: str) -> Optional[QuizDetail]:
    if not ObjectId.is_valid(quiz_id):
        return None
    doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "owner_id": owner_id})
    return _to_detail(doc) if doc else None


def _compute_grade(pct: int) -> str:
    if pct >= 90:
        return "A+"
    if pct >= 85:
        return "A"
    if pct >= 80:
        return "B+"
    if pct >= 70:
        return "B"
    if pct >= 60:
        return "C"
    if pct >= 50:
        return "D"
    return "F"


async def _generate_ai_feedback(strong: list[str], weak: list[str], pct: int) -> str:
    strong_str = ", ".join(strong) if strong else "none identified"
    weak_str = ", ".join(weak) if weak else "none — solid across the board"
    response = await ai_service.client.chat.completions.create(
        model=ai_service.model,
        temperature=0.6,
        max_tokens=200,
        messages=[
            {
                "role": "system",
                "content": "You are an encouraging but honest tutor giving quiz performance feedback. Keep it to 2-3 short sentences, no headers, no markdown.",
            },
            {
                "role": "user",
                "content": f"Student scored {pct}%. Strong topics: {strong_str}. Weak topics: {weak_str}. Give brief, actionable feedback.",
            },
        ],
    )
    return response.choices[0].message.content.strip()


async def submit_quiz(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    quiz_id: str,
    answers: dict[str, int],
    time_taken_seconds: Optional[int],
) -> QuizResult:
    if not ObjectId.is_valid(quiz_id):
        raise ValueError("Invalid quiz id")

    doc = await db.quizzes.find_one({"_id": ObjectId(quiz_id), "owner_id": owner_id})
    if doc is None:
        raise ValueError("Quiz not found")

    results: list[QuestionResult] = []
    topic_correct: dict[str, int] = {}
    topic_total: dict[str, int] = {}
    score = 0

    for q in doc["questions"]:
        selected = answers.get(q["id"])
        is_correct = selected is not None and selected == q["correct_answer"]
        if is_correct:
            score += 1

        topic = q.get("topic")
        if topic:
            topic_total[topic] = topic_total.get(topic, 0) + 1
            if is_correct:
                topic_correct[topic] = topic_correct.get(topic, 0) + 1

        results.append(
            QuestionResult(
                question_id=q["id"],
                question=q["question"],
                options=q["options"],
                correct_answer=q["correct_answer"],
                selected_answer=selected,
                is_correct=is_correct,
                explanation=q.get("explanation", ""),
                topic=topic,
            )
        )

    total = len(results)
    percentage = round((score / total) * 100) if total else 0
    grade = _compute_grade(percentage)

    strong_topics = [t for t, correct in topic_correct.items() if correct == topic_total.get(t, 0)]
    weak_topics = [t for t in topic_total if topic_correct.get(t, 0) < topic_total[t]]

    try:
        ai_feedback = await _generate_ai_feedback(strong_topics, weak_topics, percentage)
    except Exception:
        ai_feedback = None

    attempt = QuizAttempt(
        id=str(uuid.uuid4()),
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        answers=answers,
        score=score,
        total=total,
        percentage=percentage,
        time_taken_seconds=time_taken_seconds,
    )
    await db.quizzes.update_one(
        {"_id": ObjectId(quiz_id)},
        {"$push": {"attempts": attempt.model_dump()}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )

    return QuizResult(
        quiz_id=quiz_id,
        score=score,
        total=total,
        percentage=percentage,
        grade=grade,
        time_taken_seconds=time_taken_seconds,
        results=results,
        strong_topics=strong_topics,
        weak_topics=weak_topics,
        ai_feedback=ai_feedback,
    )


async def delete_quiz(db: AsyncIOMotorDatabase, owner_id: str, quiz_id: str) -> bool:
    if not ObjectId.is_valid(quiz_id):
        return False
    result = await db.quizzes.delete_one({"_id": ObjectId(quiz_id), "owner_id": owner_id})
    return result.deleted_count > 0