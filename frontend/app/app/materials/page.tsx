"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { useDocuments, useUploadDocument } from "@/features/documents/use-documents";
import { DocumentCard } from "@/features/documents/document-card";
import { cn } from "@/lib/utils";

// Only modern OOXML formats (.docx / .pptx) — legacy binary .doc/.ppt need a
// different backend parser and aren't supported yet.
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.docx,.pptx";

export default function MaterialsPage() {
  const router = useRouter();
  const { data: documents, isLoading, isError } = useDocuments();
  const { mutate: uploadDoc, isPending: isUploading } = useUploadDocument();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setUploadError(null);
    uploadDoc(file, {
      onSuccess: (doc: { id: string }) => {
        // Straight to chat with this document — that's the actual point of
        // uploading, not just parking it in a list.
        router.push(`/app/chat?doc=${doc.id}`);
      },
      onError: (err: Error) => {
        setUploadError(err.message ?? "Upload failed. Please try again.");
      },
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-[#2d3d40] sm:text-2xl">Upload Material</h1>
        <p className="text-sm text-gray-500">Welcome back! Continue your learning journey.</p>
      </div>

      {/* Full-width upload box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors sm:px-6 sm:py-16",
          isDragging
            ? "border-ink-950 bg-ink-50 dark:border-ink-50 dark:bg-ink-800/40"
            : "border-border hover:border-ink-300 dark:hover:border-ink-600",
          isUploading && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={handleInputChange}
        />

        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
            <p className="font-medium text-ink-950 dark:text-ink-50">Uploading…</p>
            <p className="text-sm text-ink-400">We&apos;ll take you straight to chat once it&apos;s ready.</p>
          </>
        ) : (
          <>
            {/* Two-tone gradient treatment instead of a flat gray circle,
                so this reads as a branded action rather than a stock icon. */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full shadow-sm"
              style={{ background: "linear-gradient(135deg, #2D3D40 0%, #3C5256 100%)" }}
            >
              <UploadCloud className="h-6 w-6 text-white" strokeWidth={1.75} />
            </div>
            <p className="font-medium text-ink-950 dark:text-ink-50">Drag &amp; drop a file here, or click to browse</p>
            <p className="px-2 text-sm text-ink-400">PDF, Word, PowerPoint, PNG, or JPG — up to 25MB</p>
          </>
        )}
      </div>

      {uploadError && <p className="mt-3 text-sm text-red-900">{uploadError}</p>}

      {/* Recent Files */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[#2d3d40] sm:text-2xl">Recent Files</h2>

        {isLoading && <p className="text-ink-400">Loading your materials…</p>}
        {isError && <p className="text-red-900">Couldn&apos;t load your materials. Try refreshing.</p>}

        {documents && documents.length === 0 && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-14 text-center">
            <FileText className="h-6 w-6 text-ink-400" />
            <p className="font-medium text-ink-950 dark:text-ink-50">No file found</p>
            <p className="max-w-sm text-sm text-ink-400">Files you upload will show up here.</p>
          </div>
        )}

        {documents && documents.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}