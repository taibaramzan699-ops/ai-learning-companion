import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export interface SourceChunk {
  document_id: string;
  page_number: number | null;
  text: string;
  score: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources: SourceChunk[];
  created_at: string;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  sources: SourceChunk[];
}

export interface ConversationSummary {
  conversation_id: string;
  document_id: string | null;
  last_message: string;
  updated_at: string;
}

export async function sendChatMessage(params: {
  message: string;
  documentId?: string | null;
  conversationId?: string | null;
  useDocuments?: boolean;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/v1/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({
      message: params.message,
      document_id: params.documentId ?? null,
      conversation_id: params.conversationId ?? null,
      use_documents: params.useDocuments ?? true,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Failed to get a response");
  }
  return res.json();
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}