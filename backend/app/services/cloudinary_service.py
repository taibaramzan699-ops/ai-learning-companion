import re
import time
import logging

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from app.core.config import settings

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

# Cloudinary returns this (no distinct HTTP status/code we can key off in the
# Python SDK) when its processing queue is briefly saturated. It's transient —
# retrying after a short pause almost always succeeds — so we don't want a
# momentary spike to surface as a hard 500 to the user.
_TRANSIENT_ERROR_MARKERS = (
    "slow down",
    "out of processing capacity",
    "too many requests",
    "rate limit",
)

_MAX_UPLOAD_ATTEMPTS = 4
_BASE_BACKOFF_SECONDS = 1.5  # 1.5s, 3s, 6s between retries


def _sanitize_public_id(name: str) -> str:
    """Replace any character that isn't alphanumeric, underscore, or hyphen with an underscore,
    so the resulting string is a valid Cloudinary public_id."""
    return re.sub(r"[^a-zA-Z0-9_-]", "_", name)


def _is_transient(error: CloudinaryError) -> bool:
    message = str(error).lower()
    return any(marker in message for marker in _TRANSIENT_ERROR_MARKERS)


def upload_document(file_bytes: bytes, file_name: str, owner_id: str) -> dict:
    """
    Uploads a raw document (PDF/image) to Cloudinary under a per-user folder.
    Returns Cloudinary's response dict, which includes `secure_url` and `public_id`.

    Retries with exponential backoff on transient "out of processing
    capacity" / rate-limit errors from Cloudinary, since these are momentary
    queue spikes rather than real failures. Any other error (bad file,
    auth, etc.) is raised immediately without retrying.
    """
    base_name = file_name.rsplit(".", 1)[0]
    safe_public_id = _sanitize_public_id(base_name)

    last_error: CloudinaryError | None = None

    for attempt in range(1, _MAX_UPLOAD_ATTEMPTS + 1):
        try:
            return cloudinary.uploader.upload(
                file_bytes,
                resource_type="auto",
                folder=f"ai-learning-companion/{owner_id}",
                public_id=safe_public_id,
                overwrite=False,
                use_filename=True,
                unique_filename=True,
            )
        except CloudinaryError as error:
            last_error = error

            if not _is_transient(error) or attempt == _MAX_UPLOAD_ATTEMPTS:
                raise

            wait_seconds = _BASE_BACKOFF_SECONDS * (2 ** (attempt - 1))
            logger.warning(
                "Cloudinary upload hit a transient error (attempt %d/%d): %s — retrying in %.1fs",
                attempt,
                _MAX_UPLOAD_ATTEMPTS,
                error,
                wait_seconds,
            )
            time.sleep(wait_seconds)

    # Unreachable in practice — the loop always returns or raises — but keeps
    # type checkers happy and guards against future refactors.
    raise last_error  # type: ignore[misc]


def delete_document(public_id: str) -> None:
    cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)