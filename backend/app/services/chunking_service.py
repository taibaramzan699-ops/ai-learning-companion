import re


def chunk_text(pages: list[tuple[int, str]], target_tokens: int = 500) -> list[dict]:
    """
    Splits page text into ~target_tokens-sized chunks on paragraph/sentence
    boundaries (approximating tokens as ~4 chars each, which is close enough
    for chunk sizing — actual token counts are computed at embedding time).
    Keeps the source page number attached to every chunk for citations.
    """
    target_chars = target_tokens * 4
    chunks: list[dict] = []
    chunk_index = 0

    for page_number, text in pages:
        if not text:
            continue

        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        buffer = ""

        for para in paragraphs:
            if len(buffer) + len(para) > target_chars and buffer:
                chunks.append({"chunk_index": chunk_index, "page_number": page_number, "text": buffer.strip()})
                chunk_index += 1
                buffer = ""
            buffer += para + "\n\n"

        if buffer.strip():
            chunks.append({"chunk_index": chunk_index, "page_number": page_number, "text": buffer.strip()})
            chunk_index += 1

    return chunks
