import { auth } from "@/lib/firebase";
import type { DocumentRecord } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/** Backend returns snake_case (Pydantic default); frontend types use camelCase. */
function mapDocument(raw: any): DocumentRecord {
  return {
    id: raw.id,
    ownerId: raw.owner_id,
    fileName: raw.file_name,
    fileUrl: raw.file_url,
    status: raw.status,
    pageCount: raw.page_count ?? undefined,
    chunkCount: raw.chunk_count ?? undefined,
    errorMessage: raw.error_message ?? undefined,
    createdAt: raw.created_at,
  };
}

export async function uploadDocument(file: File): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/documents`, {
    method: "POST",
    headers: await authHeader(),
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Upload failed");
  }
  return mapDocument(await res.json());
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const res = await fetch(`${API_BASE}/api/v1/documents`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to load documents");
  const raw = await res.json();
  return raw.map(mapDocument);
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  const res = await fetch(`${API_BASE}/api/v1/documents/${id}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to load document");
  return mapDocument(await res.json());
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/documents/${id}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok && res.status !== 204) throw new Error("Failed to delete document");
}