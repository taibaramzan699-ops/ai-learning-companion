import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sendChatMessage,
  listConversations,
  getConversationMessages,
  type ChatMessage,
} from "@/services/chat";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () => getConversationMessages(conversationId as string),
    enabled: !!conversationId,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      message: string;
      documentId?: string | null;
      conversationId?: string | null;
      useDocuments?: boolean;
    }) => sendChatMessage(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", data.conversation_id] });
    },
  });
}

/** Optimistic local message shape used before the server round-trip resolves. */
export function makeUserMessage(content: string): ChatMessage {
  return {
    role: "user",
    content,
    sources: [],
    created_at: new Date().toISOString(),
  };
}