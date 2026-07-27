import uuid
import logging
import asyncio
from openai import OpenAI, RateLimitError, APIError, BadRequestError
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.services.embedding_service import embed_query
from app.services.pinecone_service import query_similar
from app.models.chat import SourceChunk, ChatMessageInDB

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_INSTRUCTION = (
    "You are a knowledgeable study assistant helping a student understand their course material. "
    "Answer naturally and directly, the way a helpful tutor would — do NOT start every answer with "
    "phrases like 'Based on the provided documents/context'. Just answer the question.\n\n"
    "Ground specific facts, definitions, and examples in the context chunks given to you when they're "
    "relevant, and mention the page number inline only when it adds value (e.g. 'as shown on page 14'), "
    "not as a constant habit. If the student asks a basic, well-known concept that isn't explicitly "
    "spelled out in the context but is fair, common knowledge in the same subject area as their material, "
    "you may answer it directly using your own knowledge — just don't contradict or override anything the "
    "context says. Only say the material doesn't cover something if the question is genuinely about a "
    "specific detail unique to their document that you can't find anywhere.\n\n"
    "The context chunks you're given are internally labeled with page numbers only, for your reference. "
    "Never write '(Source 1)', '(Source 2)', 'Sources 4 and 6', or any other chunk/source index in your "
    "answer — the student never sees those labels, so they'd be meaningless to them. If you want to point "
    "to where something came from, refer to the page number naturally (e.g. 'on page 14') or just describe "
    "the material itself, never a source number.\n\n"
    "Keep answers concise, well-organized, and written in clear prose or short bullet points. Use "
    "markdown formatting (bold, bullet lists) since it will be rendered properly."
)

MAX_HISTORY_MESSAGES = 6  # last 3 user+assistant turns, kept small to control token usage
MIN_RELEVANCE_SCORE = 0.55  # chunks below this similarity score are dropped as noise


class GenerationBlocked(Exception):
    """Raised when OpenAI's content filter blocks the response instead of a real error."""


class GenerationRateLimited(Exception):
    """Raised when the API rate limit or quota is hit."""


async def get_recent_history(db: AsyncIOMotorDatabase, conversation_id: str, owner_id: str) -> list[dict]:
    cursor = (
        db.chat_messages.find({"conversation_id": conversation_id, "owner_id": owner_id})
        .sort("created_at", -1)
        .limit(MAX_HISTORY_MESSAGES)
    )
    messages = [msg async for msg in cursor]
    messages.reverse()  # chronological order for the prompt
    return messages


def _build_messages(question: str, context_chunks: list[dict], history: list[dict], use_documents: bool) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]

    for m in history:
        messages.append({"role": m["role"], "content": m["content"]})

    if not use_documents:
        messages.append(
            {
                "role": "user",
                "content": (
                    "(General chat mode — no document context provided. Just help me using your own "
                    f"knowledge.)\n\n{question}"
                ),
            }
        )
        return messages

    context_block = "\n\n".join(
        f"[Excerpt from page {c['page_number']}]\n{c['text']}" for c in context_chunks
    ) or "(no closely relevant context found in the uploaded materials — feel free to answer from your own knowledge if it's a fair, well-known concept)"

    messages.append(
        {
            "role": "user",
            "content": f"--- Context from my documents ---\n{context_block}\n\n--- My question ---\n{question}",
        }
    )
    return messages


def _generate(messages: list[dict]) -> str:
    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=messages,
            temperature=0.4,
        )
    except RateLimitError as exc:
        raise GenerationRateLimited() from exc
    except BadRequestError as exc:
        raise GenerationBlocked(str(exc)) from exc
    except APIError:
        raise

    choice = response.choices[0]
    if choice.finish_reason == "content_filter":
        raise GenerationBlocked("content_filter")

    return choice.message.content


async def answer_question(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    question: str,
    document_id: str | None,
    conversation_id: str | None,
    use_documents: bool = True,
) -> tuple[str, str, list[SourceChunk]]:
    conversation_id = conversation_id or str(uuid.uuid4())
    matches: list[dict] = []

    if use_documents:
        query_vector = await asyncio.to_thread(embed_query, question)
        raw_matches = await asyncio.to_thread(query_similar, owner_id, query_vector, 6, document_id)
        matches = [m for m in raw_matches if m["score"] >= MIN_RELEVANCE_SCORE]

    history = await get_recent_history(db, conversation_id, owner_id)
    messages = _build_messages(question, matches, history, use_documents)

    try:
        answer_text = await asyncio.to_thread(_generate, messages)
    except GenerationBlocked as exc:
        logger.warning("OpenAI blocked a response for conversation %s: %s", conversation_id, exc)
        answer_text = (
            "I'm not able to answer that one directly — it may touch on a sensitive topic my "
            "safety filters flagged. Try rephrasing, or ask something else about your studies."
        )
    except GenerationRateLimited:
        logger.warning("OpenAI rate limit/quota hit for conversation %s", conversation_id)
        answer_text = (
            "I'm getting a lot of requests right now (or the API quota is exhausted). "
            "Please wait a moment and try again, or check your OpenAI billing/usage."
        )
    except Exception:
        logger.exception("OpenAI generation failed for conversation %s", conversation_id)
        answer_text = "Sorry, I ran into an issue generating a response. Please try again."

    sources = [
        SourceChunk(
            document_id=m["document_id"],
            page_number=m["page_number"],
            text=m["text"],
            score=m["score"],
        )
        for m in matches
    ]

    user_msg = ChatMessageInDB(
        conversation_id=conversation_id,
        owner_id=owner_id,
        document_id=document_id,
        role="user",
        content=question,
    )
    assistant_msg = ChatMessageInDB(
        conversation_id=conversation_id,
        owner_id=owner_id,
        document_id=document_id,
        role="assistant",
        content=answer_text,
        sources=sources,
    )
    await db.chat_messages.insert_many([user_msg.model_dump(), assistant_msg.model_dump()])

    return conversation_id, answer_text, sources