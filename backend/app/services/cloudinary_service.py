import cloudinary
import cloudinary.uploader
from app.core.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def upload_document(file_bytes: bytes, file_name: str, owner_id: str) -> dict:
    """
    Uploads a raw document (PDF/image) to Cloudinary under a per-user folder.
    Returns Cloudinary's response dict, which includes `secure_url` and `public_id`.
    """
    result = cloudinary.uploader.upload(
        file_bytes,
        resource_type="auto",
        folder=f"ai-learning-companion/{owner_id}",
        public_id=file_name.rsplit(".", 1)[0],
        overwrite=False,
        use_filename=True,
        unique_filename=True,
    )
    return result


def delete_document(public_id: str) -> None:
    cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
