import time
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

# Free tier allows ~100 embed requests/minute. Spacing calls out by ~0.7s
# keeps us safely under that even for large documents with many chunks,
# instead of bursting all chunks at once and tripping the rate limit.
MIN_INTERVAL_SECONDS = 0.7

_last_call_time = 0.0


def _throttle():
    global _last_call_time
    elapsed = time.monotonic() - _last_call_time
    if elapsed < MIN_INTERVAL_SECONDS:
        time.sleep(MIN_INTERVAL_SECONDS - elapsed)
    _last_call_time = time.monotonic()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embeds a list of chunk strings using Gemini's embedding model,
    throttled to stay under the free-tier rate limit."""
    if not texts:
        return []

    vectors: list[list[float]] = []
    for text in texts:
        _throttle()
        result = genai.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            content=text,
            task_type="retrieval_document",
        )
        vectors.append(result["embedding"])
    return vectors


def embed_query(text: str) -> list[float]:
    _throttle()
    result = genai.embed_content(
        model=settings.GEMINI_EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]