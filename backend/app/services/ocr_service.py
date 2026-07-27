import io
from pypdf import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
from PIL import Image


def extract_text_from_pdf(file_bytes: bytes) -> list[tuple[int, str]]:
    """
    Returns a list of (page_number, text) tuples using the PDF's embedded
    text layer. Call needs_ocr() on the result to detect scanned PDFs with
    no usable text layer, then fall back to extract_text_from_scanned_pdf().
    """
    reader = PdfReader(io.BytesIO(file_bytes))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        pages.append((i + 1, text.strip()))
    return pages


def extract_text_from_scanned_pdf(file_bytes: bytes) -> list[tuple[int, str]]:
    """
    OCR fallback for scanned PDFs with no embedded text layer.
    Rasterizes each page to an image (requires the poppler system binary,
    via pdf2image) and runs Tesseract OCR on each page image.
    """
    images = convert_from_bytes(file_bytes)
    pages: list[tuple[int, str]] = []
    for i, image in enumerate(images):
        text = pytesseract.image_to_string(image).strip()
        pages.append((i + 1, text))
    return pages


def extract_text_from_image(image_bytes: bytes) -> str:
    """OCR a single scanned image (e.g. a photographed page of notes) via Tesseract."""
    image = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(image).strip()


def needs_ocr(pages: list[tuple[int, str]]) -> bool:
    """Heuristic: if extracted text is suspiciously short, the PDF is likely scanned."""
    total_chars = sum(len(text) for _, text in pages)
    avg_chars_per_page = total_chars / max(len(pages), 1)
    return avg_chars_per_page < 20