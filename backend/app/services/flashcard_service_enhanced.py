"""Flashcard service — generation and spaced-repetition review, built on the
same ai_service singleton and document-context pattern used by Quiz."""
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.flashcard import (
    FlashcardDeckInDB,
    FlashcardCardDB,
    FlashcardReviewLog,
    FlashcardDeckSummary,
    ContinueLearningItem,
    FlashcardPublic,
    FlashcardReviewResult,
    FlashcardOverview,
    StudyGoal,
    StudyStreak,
    WeekActivityDay,
    AiTip,
    FlashcardsPageData,
    FlashcardDifficulty,
    FlashcardTypeRequest,
    MasteryStatus,
)
from app.services.ai_service import ai_service

MAX_CONTEXT_CHARS = 12000
DAILY_GOAL_CARDS = 40

# Leitner box -> days until next review. Box 1 is due immediately (same/next
# session); higher boxes get progressively longer spacing.
INTERVAL_DAYS = {1: 0, 2: 1, 3: 3, 4: 7, 5: 14}


def _utcnow() -> datetime:
    """Naive UTC 'now' — Motor/PyMongo returns datetimes without tzinfo by
    default, so every datetime we create or compare against must also be
    naive, or comparisons raise TypeError: can't compare offset-naive and
    offset-aware datetimes."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

DIFFICULTY_GUIDANCE = {
    "easy": "Keep cards simple, testing basic recall of a single fact or term.",
    "medium": "Mix straightforward recall with cards that require a short explanation.",
    "hard": "Favor cards that require applied understanding, edge cases, or connecting concepts.",
}

TYPE_GUIDANCE = {
    "definition": 'Every card should test a term or concept. Set "card_type" to "definition" for all cards, front = the term, back = its definition.',
    "qa": 'Every card should be phrased as a question with a direct answer. Set "card_type" to "qa" for all cards.',
    "concept": 'Every card should test understanding of a broader concept, not just a single term. Set "card_type" to "concept" for all cards.',
    "mixed": 'Mix all three formats across the set — "definition", "qa", and "concept" — aim for a roughly even split, and set each card\'s "card_type" accordingly.',
}

FLASHCARD_SYSTEM_PROMPT = """You are a flashcard generator for a study platform. Using ONLY the material given to you, create flashcards.

{difficulty_note}

{type_note}

Tag each card with short "tags" (1-3 lowercase keywords) representing the concept it covers, so cards can be grouped and searched later.

Respond with a JSON object of this exact shape:
{{"cards": [{{"front": "string", "back": "string", "card_type": "definition|qa|concept", "tags": ["string"]}}]}}"""


def _mastery_status(box: int, times_reviewed: int) -> MasteryStatus:
    if times_reviewed == 0:
        return "new"
    if box <= 2:
        return "learning"
    if box <= 4:
        return "reviewing"
    return "mastered"


def _to_summary(doc: dict) -> FlashcardDeckSummary:
    cards = doc.get("cards", [])
    total = len(cards)
    reviewed = sum(1 for c in cards if c.get("times_reviewed", 0) > 0)
    mastered = sum(1 for c in cards if c.get("mastery_status") == "mastered")
    mastery_percent = round((mastered / total) * 100) if total else 0

    review_log = doc.get("review_log", [])
    last_reviewed_at = max((r["reviewed_at"] for r in review_log), default=None)

    return FlashcardDeckSummary(
        id=str(doc["_id"]),
        title=doc["title"],
        subject=doc["subject"],
        icon=doc.get("icon", "layers"),
        source_label=doc["source_label"],
        difficulty=doc["difficulty"],
        total_cards=total,
        cards_reviewed=reviewed,
        mastery_percent=mastery_percent,
        last_reviewed_at=last_reviewed_at,
        created_at=doc["created_at"],
    )


async def _get_document_context(db: AsyncIOMotorDatabase, document_id: str, owner_id: str) -> tuple[str, str]:
    """Returns (context_text, source_label). Same retrieval pattern as Quiz."""
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


async def _generate_cards(
    context: str, num_cards: int, difficulty: FlashcardDifficulty, card_type: FlashcardTypeRequest
) -> list[dict]:
    prompt = FLASHCARD_SYSTEM_PROMPT.format(
        difficulty_note=DIFFICULTY_GUIDANCE[difficulty],
        type_note=TYPE_GUIDANCE[card_type],
    )
    response = await ai_service.client.chat.completions.create(
        model=ai_service.model,
        response_format={"type": "json_object"},
        temperature=0.5,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Create exactly {num_cards} flashcards from this material:\n\n---\n{context}\n---"},
        ],
    )
    text = response.choices[0].message.content
    parsed = json.loads(text)
    cards = parsed.get("cards")
    if not isinstance(cards, list):
        raise ValueError("Model did not return a cards array")
    return cards


async def generate_flashcards(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    document_id: str,
    num_cards: int,
    difficulty: FlashcardDifficulty = "medium",
    card_type: FlashcardTypeRequest = "mixed",
) -> str:
    context, source_name = await _get_document_context(db, document_id, owner_id)
    subject = await ai_service.generate_category(context)

    try:
        raw_cards = await _generate_cards(context, num_cards, difficulty, card_type)
    except Exception as exc:
        raise ValueError("Couldn't generate flashcards from this material. Please try again.") from exc

    cards: list[FlashcardCardDB] = []
    for i, c in enumerate(raw_cards[:num_cards]):
        try:
            cards.append(
                FlashcardCardDB(
                    id=f"c{i + 1}",
                    card_type=c.get("card_type", "definition"),
                    front=c["front"],
                    back=c["back"],
                    tags=c.get("tags", []),
                )
            )
        except (KeyError, TypeError):
            continue

    if not cards:
        raise ValueError("The model didn't return any usable flashcards. Please try again.")

    deck = FlashcardDeckInDB(
        owner_id=owner_id,
        title=source_name.rsplit(".", 1)[0],
        subject=subject,
        source_document_id=document_id,
        source_label=source_name,
        difficulty=difficulty,
        requested_card_type=card_type,
        cards=cards,
    )
    result = await db.flashcard_decks.insert_one(deck.model_dump())
    return str(result.inserted_id)


async def list_decks(db: AsyncIOMotorDatabase, owner_id: str) -> list[FlashcardDeckSummary]:
    cursor = db.flashcard_decks.find({"owner_id": owner_id}).sort("updated_at", -1)
    return [_to_summary(doc) async for doc in cursor]


async def get_continue_learning(db: AsyncIOMotorDatabase, owner_id: str) -> Optional[ContinueLearningItem]:
    doc = await db.flashcard_decks.find_one(
        {"owner_id": owner_id, "review_log": {"$ne": []}},
        sort=[("updated_at", -1)],
    )
    if doc is None:
        return None

    review_log = doc.get("review_log", [])
    last_card_id = review_log[-1]["card_id"] if review_log else None
    last_card = next((c for c in doc["cards"] if c["id"] == last_card_id), None)

    return ContinueLearningItem(
        deck=_to_summary(doc),
        last_question_preview=last_card["front"] if last_card else doc["cards"][0]["front"],
        cards_reviewed_in_session=sum(1 for c in doc["cards"] if c.get("times_reviewed", 0) > 0),
    )


async def get_deck_review_cards(
    db: AsyncIOMotorDatabase, owner_id: str, deck_id: str
) -> Optional[list[FlashcardPublic]]:
    if not ObjectId.is_valid(deck_id):
        return None
    doc = await db.flashcard_decks.find_one({"_id": ObjectId(deck_id), "owner_id": owner_id})
    if doc is None:
        return None

    return [
        FlashcardPublic(
            id=c["id"],
            card_type=c["card_type"],
            front=c["front"],
            back=c["back"],
            mastery_status=c["mastery_status"],
            leitner_box=c["leitner_box"],
        )
        for c in doc["cards"]
    ]


async def submit_review(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    deck_id: str,
    card_id: str,
    outcome: str,
) -> FlashcardReviewResult:
    if not ObjectId.is_valid(deck_id):
        raise ValueError("Invalid deck id")

    doc = await db.flashcard_decks.find_one({"_id": ObjectId(deck_id), "owner_id": owner_id})
    if doc is None:
        raise ValueError("Deck not found")

    card = next((c for c in doc["cards"] if c["id"] == card_id), None)
    if card is None:
        raise ValueError("Card not found")

    box_before = card.get("leitner_box", 1)
    if outcome == "know":
        box_after = min(box_before + 1, 5)
    elif outcome == "difficult":
        box_after = 1
    else:  # review_again — held steady, needs another pass before advancing
        box_after = box_before

    times_reviewed = card.get("times_reviewed", 0) + 1
    mastery_status = _mastery_status(box_after, times_reviewed)
    next_review_at = _utcnow() + timedelta(days=INTERVAL_DAYS[box_after])

    now = _utcnow()
    review_entry = FlashcardReviewLog(
        card_id=card_id, outcome=outcome, box_before=box_before, box_after=box_after, reviewed_at=now
    )

    await db.flashcard_decks.update_one(
        {"_id": ObjectId(deck_id), "cards.id": card_id},
        {
            "$set": {
                "cards.$.leitner_box": box_after,
                "cards.$.mastery_status": mastery_status,
                "cards.$.next_review_at": next_review_at,
                "cards.$.times_reviewed": times_reviewed,
                "updated_at": now,
            },
            "$push": {"review_log": review_entry.model_dump()},
        },
    )

    updated_doc = await db.flashcard_decks.find_one({"_id": ObjectId(deck_id)})
    summary = _to_summary(updated_doc)

    return FlashcardReviewResult(
        card_id=card_id,
        new_leitner_box=box_after,
        new_mastery_status=mastery_status,
        next_review_at=next_review_at,
        deck_mastery_percent=summary.mastery_percent,
    )


async def get_overview(db: AsyncIOMotorDatabase, owner_id: str) -> FlashcardOverview:
    total = mastered = need_review = new_cards = 0
    async for doc in db.flashcard_decks.find({"owner_id": owner_id}):
        for c in doc.get("cards", []):
            total += 1
            status = c.get("mastery_status", "new")
            if status == "mastered":
                mastered += 1
            elif status == "new":
                new_cards += 1
            else:
                need_review += 1
    return FlashcardOverview(total_cards=total, mastered=mastered, need_review=need_review, new_cards=new_cards)


async def get_goal(db: AsyncIOMotorDatabase, owner_id: str) -> StudyGoal:
    today = _utcnow().date()
    start_of_day = datetime(today.year, today.month, today.day)

    completed_today = 0
    async for doc in db.flashcard_decks.find({"owner_id": owner_id}):
        for r in doc.get("review_log", []):
            reviewed_at = r["reviewed_at"]
            if reviewed_at >= start_of_day:
                completed_today += 1

    return StudyGoal(target_cards=DAILY_GOAL_CARDS, completed_cards=completed_today, date=today.isoformat())


async def get_streak(db: AsyncIOMotorDatabase, owner_id: str) -> StudyStreak:
    review_dates: set = set()
    async for doc in db.flashcard_decks.find({"owner_id": owner_id}):
        for r in doc.get("review_log", []):
            review_dates.add(r["reviewed_at"].date())

    today = _utcnow().date()
    streak = 0
    cursor_date = today
    while cursor_date in review_dates:
        streak += 1
        cursor_date -= timedelta(days=1)
    # Allow the streak to still count as "current" if today just hasn't
    # happened yet but yesterday was reviewed.
    if streak == 0 and (today - timedelta(days=1)) in review_dates:
        cursor_date = today - timedelta(days=1)
        while cursor_date in review_dates:
            streak += 1
            cursor_date -= timedelta(days=1)

    day_labels = ["M", "T", "W", "T", "F", "S", "S"]
    monday = today - timedelta(days=today.weekday())
    week_activity = [
        WeekActivityDay(day=day_labels[i], active=(monday + timedelta(days=i)) in review_dates)
        for i in range(7)
    ]

    return StudyStreak(current_streak_days=streak, week_activity=week_activity)


STATIC_TIPS = [
    "Review flashcards daily to improve retention by up to 80%!",
    "Cards you mark 'Difficult' come back sooner — trust the schedule.",
    "Short, frequent sessions beat one long cram session for long-term recall.",
]


async def get_tip(db: AsyncIOMotorDatabase, owner_id: str) -> AiTip:
    # TODO: personalize using weak-topic tags once tag-level analytics exist.
    overview = await get_overview(db, owner_id)
    index = overview.need_review % len(STATIC_TIPS)
    return AiTip(id=f"tip-{index}", message=STATIC_TIPS[index])


async def get_page_data(db: AsyncIOMotorDatabase, owner_id: str) -> FlashcardsPageData:
    return FlashcardsPageData(
        continue_learning=await get_continue_learning(db, owner_id),
        decks=await list_decks(db, owner_id),
        overview=await get_overview(db, owner_id),
        goal=await get_goal(db, owner_id),
        streak=await get_streak(db, owner_id),
        tip=await get_tip(db, owner_id),
    )


async def delete_deck(db: AsyncIOMotorDatabase, owner_id: str, deck_id: str) -> bool:
    if not ObjectId.is_valid(deck_id):
        return False
    result = await db.flashcard_decks.delete_one({"_id": ObjectId(deck_id), "owner_id": owner_id})
    return result.deleted_count > 0