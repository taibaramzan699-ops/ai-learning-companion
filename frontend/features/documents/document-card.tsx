"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DocumentRecord } from "@/types";
import { useDeleteDocument } from "@/features/documents/use-documents";

const statusConfig: Record<DocumentRecord["status"], { label: string; icon: React.ElementType; badgeClassName: string; iconClassName: string }> = {
  uploading: {
    label: "Uploading",
    icon: Loader2,
    badgeClassName: "bg-signal-info/10 text-signal-info",
    iconClassName: "animate-spin",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    badgeClassName: "bg-signal-info/10 text-signal-info",
    iconClassName: "animate-spin",
  },
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    badgeClassName: "bg-signal-success/10 text-signal-success",
    iconClassName: "",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    badgeClassName: "bg-signal-error/10 text-signal-error",
    iconClassName: "",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyErrorMessage(raw: string | undefined): string {
  if (!raw) return "Couldn't process this file. Try re-uploading, or use a clearer scan.";

  if (raw.includes("429") || raw.toLowerCase().includes("quota") || raw.toLowerCase().includes("rate limit")) {
    return "Hit an API rate limit while processing. Wait a minute, then delete and re-upload this file.";
  }

  return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
}

export function DocumentCard({ document }: { document: DocumentRecord }) {
  const router = useRouter();
  const deleteMutation = useDeleteDocument();
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;
  const isReady = document.status === "ready";

  function handleCardClick() {
    if (!isReady) return;
    router.push(`/app/chat?doc=${document.id}`);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    // Stop this from bubbling up to the card's own click handler, so
    // deleting a file never accidentally opens it in chat first.
    e.stopPropagation();
    deleteMutation.mutate(document.id);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        onClick={handleCardClick}
        className={cn(
          "group transition-shadow duration-200 hover:shadow-card-hover",
          isReady && "cursor-pointer"
        )}
        role={isReady ? "button" : undefined}
        tabIndex={isReady ? 0 : undefined}
        onKeyDown={
          isReady
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick();
                }
              }
            : undefined
        }
        aria-label={isReady ? `Open ${document.fileName} in chat` : undefined}
      >
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-100/70 dark:bg-ink-800/60">
              <FileText className="h-4.5 w-4.5 text-ink-400" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-ink-950 dark:text-ink-50" title={document.fileName}>
                {document.fileName}
              </h3>
              <p className="mt-0.5 text-xs text-ink-400">Uploaded {formatDate(document.createdAt)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${document.fileName}`}
            onClick={handleDeleteClick}
            disabled={deleteMutation.isPending}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4 text-ink-400 hover:text-signal-error" />
          </Button>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                status.badgeClassName
              )}
            >
              <StatusIcon className={cn("h-3.5 w-3.5", status.iconClassName)} />
              {status.label}
            </span>

            {/* "chunks" was a backend/RAG term with no user-facing meaning —
                dropped it. Page count alone is enough context here. */}
            {isReady && document.pageCount != null && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                <FileText className="h-3.5 w-3.5" />
                {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
              </span>
            )}
          </div>

          {document.status === "failed" && (
            <p className="mt-3 text-sm text-signal-error">
              {friendlyErrorMessage(document.errorMessage)}
            </p>
          )}

          {isReady && (
            <p className="mt-3 text-xs font-medium text-ink-400 opacity-0 transition-opacity group-hover:opacity-100">
              Click to chat with this file →
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}