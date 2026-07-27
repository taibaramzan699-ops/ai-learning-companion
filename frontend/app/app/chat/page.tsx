"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Loader2, FileText, Lightbulb, ListChecks, Sparkles, BookOpen, MessageCircle, StickyNote, Check } from "lucide-react";
import { useSendChatMessage, makeUserMessage } from "@/features/chat/use-chat";
import { useDocuments, useUploadDocument } from "@/features/documents/use-documents";
import type { ChatMessage } from "@/services/chat";
import { notesAPI } from "@/services/notes_ai";

import { Logo } from "@/features/chat/premium/Logo";
import { BackgroundEffects } from "@/features/chat/premium/BackgroundEffects";
import { ChatInput } from "@/features/chat/premium/ChatInput";
import { TopBar } from "@/features/chat/premium/TopBar";
import { EmptyState } from "@/features/chat/premium/EmptyState";
import { PremiumChatBubble } from "@/features/chat/premium/PremiumChatBubble";
import { lightPalette } from "@/features/chat/premium/theme";
const GENERAL_MODE = "general";
const ALL_DOCS_MODE = "all";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
const [conversationId, setConversationId] = useState<string | null>(null);
const [input, setInput] = useState("");
const [selectedScope, setSelectedScope] = useState<string>(ALL_DOCS_MODE);
const [isRecording, setIsRecording] = useState(false);
const [voiceSupported, setVoiceSupported] = useState(true);
const [saveConvoState, setSaveConvoState] = useState<"idle" | "saving" | "saved" | "error">("idle");

const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();
const initializedRef = useRef(false);

const palette = lightPalette;
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const { data: documents } = useDocuments();
  const readyDocuments = documents?.filter((d) => d.status === "ready") ?? [];

useEffect(() => {
  if (initializedRef.current) return;

  const docId = searchParams.get("doc");
  if (!docId) return;
  if (readyDocuments.length === 0) return;

  const exists = readyDocuments.some((d) => d.id === docId);
  if (!exists) return;

  initializedRef.current = true;

  setSelectedScope(docId);
  setMessages([]);
  setConversationId(null);

  router.replace(pathname);
}, [readyDocuments, searchParams, router, pathname]);

  const selectedDoc = readyDocuments.find((d) => d.id === selectedScope);
  const isGeneral = selectedScope === GENERAL_MODE;
  const isAllDocs = selectedScope === ALL_DOCS_MODE;

  const { mutate: sendMessage, isPending } = useSendChatMessage();
  const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending, isUploading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => (event.results[event.resultIndex].isFinal ? `${prev} ${transcript}`.trim() : prev));
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, []);

  function toggleVoiceInput() {
    if (!voiceSupported || !recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }

  function handleScopeChange(value: string) {
    setSelectedScope(value);
    setMessages([]);
    setConversationId(null);
    setSaveConvoState("idle");
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📎 Uploading "${file.name}"…`, sources: [], created_at: new Date().toISOString() },
    ]);

    uploadDocument(file, {
      onSuccess: (doc) => {
        setSelectedScope(doc.id);
setConversationId(null);
setMessages([]);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Got it — **${doc.fileName}** is uploaded and processing. Select it from the mode picker once it's ready.`,
            sources: [],
            created_at: new Date().toISOString(),
          },
        ]);
      },
      onError: (err: Error) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Sorry, the upload failed: ${err.message}`, sources: [], created_at: new Date().toISOString() },
        ]);
      },
    });
  }

  function submitMessage(text: string) {
    if (!text.trim() || isPending) return;

    setMessages((prev) => [...prev, makeUserMessage(text)]);
    setInput("");

    sendMessage(
      {
        message: text,
        conversationId,
        documentId: isAllDocs || isGeneral ? null : selectedScope,
        useDocuments: !isGeneral,
      },
      {
        onSuccess: (data) => {
          setConversationId(data.conversation_id);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.answer, sources: data.sources, created_at: new Date().toISOString() },
          ]);
        },
        onError: (err: Error) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Sorry, something went wrong: ${err.message}`, sources: [], created_at: new Date().toISOString() },
          ]);
        },
      }
    );
  }

  async function handleSaveConversation() {
    if (saveConvoState === "saving" || saveConvoState === "saved" || messages.length === 0) return;
    setSaveConvoState("saving");
    try {
      const docId = isAllDocs || isGeneral ? null : selectedScope;
      await notesAPI.createFromConversation(
        messages.map((m) => ({ role: m.role, content: m.content })),
        docId
      );
      setSaveConvoState("saved");
    } catch {
      setSaveConvoState("error");
      setTimeout(() => setSaveConvoState("idle"), 2000);
    }
  }

  const prompts = isGeneral
    ? [
        { icon: Lightbulb, title: "Explain a concept I'm stuck on", description: "Get a clear breakdown." },
        { icon: ListChecks, title: "Help me build a study plan", description: "Organize your revision." },
        { icon: Sparkles, title: "Quiz me on any topic", description: "Test your knowledge." },
        { icon: MessageCircle, title: "How do I memorize formulas?", description: "Practical techniques." },
      ]
    : selectedDoc
    ? [
        { icon: BookOpen, title: `Summarize "${selectedDoc.fileName}"`, description: "Get the key points." },
        { icon: Lightbulb, title: "What are the key takeaways?", description: "Core ideas distilled." },
        { icon: ListChecks, title: "List the main topics covered", description: "A quick outline." },
        { icon: Sparkles, title: "Explain this like I'm a beginner", description: "Simplified breakdown." },
      ]
    : [
        { icon: BookOpen, title: "Summarize everything I've uploaded", description: "Across all materials." },
        { icon: Lightbulb, title: "What topics should I focus on?", description: "Prioritize your study." },
        { icon: FileText, title: "Compare my documents", description: "Spot overlaps & gaps." },
        { icon: Sparkles, title: "Quiz me on a random topic", description: "Test your knowledge." },
      ];

  const subheading = isGeneral
    ? "Your personal AI study assistant. Ask me anything — no document needed."
    : "Upload notes, ask questions, generate quizzes and understand concepts faster.";

  return (
    <div
      className="fixed inset-y-0 right-0 left-72 z-30 flex flex-col overflow-hidden transition-colors duration-300"
      style={{ background: palette.bg, fontFamily: "var(--font-body)" }}
    >
      <BackgroundEffects palette={palette} />

      <div className="relative z-10 flex h-full flex-col px-6 sm:px-8">
        <TopBar
  selectedScope={selectedScope}
  onScopeChange={handleScopeChange}
  readyDocuments={readyDocuments.map((d) => ({
    id: d.id,
    fileName: d.fileName,
  }))}
  palette={palette}
/>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex min-h-full items-center justify-center">
              <EmptyState subheading={subheading} prompts={prompts} onPromptSelect={submitMessage} palette={palette} />
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4 py-6">
              <div className="flex justify-end">
                <button
                  onClick={saveConvoState === "saved" ? () => router.push("/app/notes") : handleSaveConversation}
                  disabled={saveConvoState === "saving"}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    borderColor: palette.border,
                    color: saveConvoState === "saved" ? palette.accentBg : palette.textMuted,
                  }}
                >
                  {saveConvoState === "saving" && (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving conversation…
                    </>
                  )}
                  {saveConvoState === "idle" && (
                    <>
                      <StickyNote className="h-3.5 w-3.5" />
                      Save conversation as Note
                    </>
                  )}
                  {saveConvoState === "saved" && (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      View Note
                    </>
                  )}
                  {saveConvoState === "error" && "Failed — retry"}
                </button>
              </div>

              {messages.map((m, i) => (
                <PremiumChatBubble key={i} message={m} palette={palette} />
              ))}
              {(isPending || isUploading) && (
                <div className="flex items-center gap-2 text-sm" style={{ color: palette.textMuted }}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading…" : "Thinking…"}
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-2xl pb-6 pt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileSelected}
          />
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => submitMessage(input.trim())}
            onAttach={handleAttachClick}
            onToggleVoice={toggleVoiceInput}
            isRecording={isRecording}
            voiceSupported={voiceSupported}
            isUploading={isUploading}
            isSending={isPending}
            palette={palette}
          />
        </div>
      </div>
    </div>
  );
}