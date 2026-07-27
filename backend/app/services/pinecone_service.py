from pinecone import Pinecone
from app.core.config import settings

_pc = Pinecone(api_key=settings.PINECONE_API_KEY)
_index = _pc.Index(settings.PINECONE_INDEX_NAME)


def upsert_chunks(document_id: str, owner_id: str, chunks: list[dict], vectors: list[list[float]]) -> list[str]:
    """
    Upserts one vector per chunk, namespaced by owner so one user's
    documents are never retrievable in another user's search.
    Returns the list of Pinecone vector IDs, one per chunk (same order).
    """
    pinecone_ids = [f"{document_id}-{c['chunk_index']}" for c in chunks]

    records = [
        {
            "id": pinecone_ids[i],
            "values": vectors[i],
            "metadata": {
                "document_id": document_id,
                "owner_id": owner_id,
                "chunk_index": chunks[i]["chunk_index"],
                "page_number": chunks[i]["page_number"],
                "text": chunks[i]["text"][:1000],  # metadata size cap
            },
        }
        for i in range(len(chunks))
    ]

    _index.upsert(vectors=records, namespace=owner_id)
    return pinecone_ids


def query_similar(owner_id: str, query_vector: list[float], top_k: int = 6, document_id: str | None = None) -> list[dict]:
    """Semantic search scoped to a single user's namespace, optionally filtered to one document."""
    filter_ = {"document_id": document_id} if document_id else None
    result = _index.query(
        vector=query_vector,
        top_k=top_k,
        namespace=owner_id,
        include_metadata=True,
        filter=filter_,
    )
    return [
        {
            "score": match.score,
            "document_id": match.metadata["document_id"],
            "page_number": match.metadata["page_number"],
            "text": match.metadata["text"],
        }
        for match in result.matches
    ]


def delete_document_vectors(owner_id: str, document_id: str) -> None:
    _index.delete(filter={"document_id": document_id}, namespace=owner_id)
