"""Export a note as a downloadable PDF or Word (.docx) file."""
from io import BytesIO

from docx import Document
from htmldocx import HtmlToDocx
from xhtml2pdf import pisa


def _note_to_html_document(title: str, content_html: str) -> str:
    return f"""
    <html>
    <head>
    <style>
        body {{ font-family: Helvetica, Arial, sans-serif; color: #222; }}
        h1 {{ font-size: 22px; margin-bottom: 4px; }}
        h2, h3 {{ margin-top: 16px; }}
        table {{ border-collapse: collapse; width: 100%; }}
        td, th {{ border: 1px solid #ccc; padding: 6px; }}
    </style>
    </head>
    <body>
        <h1>{title}</h1>
        {content_html}
    </body>
    </html>
    """


def _safe_filename(title: str, extension: str) -> str:
    cleaned = "".join(c for c in (title or "note") if c.isalnum() or c in " -_").strip()
    return f"{cleaned or 'note'}.{extension}"


def export_note_pdf(title: str, content_html: str) -> tuple[bytes, str, str]:
    """Returns (file_bytes, media_type, filename)."""
    html = _note_to_html_document(title, content_html)
    buffer = BytesIO()
    pisa.CreatePDF(html, dest=buffer)
    return buffer.getvalue(), "application/pdf", _safe_filename(title, "pdf")


def export_note_docx(title: str, content_html: str) -> tuple[bytes, str, str]:
    """Returns (file_bytes, media_type, filename)."""
    html = _note_to_html_document(title, content_html)
    document = Document()
    parser = HtmlToDocx()
    parser.add_html_to_document(html, document)
    buffer = BytesIO()
    document.save(buffer)
    media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return buffer.getvalue(), media_type, _safe_filename(title, "docx")