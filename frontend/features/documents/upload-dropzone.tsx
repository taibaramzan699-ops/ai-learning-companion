"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadDocument } from "@/features/documents/use-documents";

// Only modern OOXML formats (.docx / .pptx) are included — legacy binary
// .doc / .ppt need a different parser (e.g. antiword/textract) on the backend
// and aren't supported yet. If the backend adds that, extend this list too.
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
];

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useUploadDocument();

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      setError(null);
      const file = files?.[0];
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only PDF, Word (.docx), PowerPoint (.pptx), PNG, or JPEG files are supported.");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError("File is too large — the limit is 25MB.");
        return;
      }

      try {
        // Just kick off the upload — do NOT navigate anywhere. The new
        // document shows up in the Recent Files list on its own (the
        // useUploadDocument mutation invalidates the documents query, and
        // useDocuments polls every 3s while anything is "processing"),
        // moving from "Processing" to "Ready" without any redirect here.
        // Opening a file in the AI Tutor / chat is a deliberate action the
        // user takes by clicking the ready DocumentCard — never something
        // that should happen automatically right after upload.
        await uploadMutation.mutateAsync(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    },
    [uploadMutation]
  );

  return (
    <div className="flex flex-col gap-3">
      <motion.label
        htmlFor="document-upload-input"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-12 text-center transition-colors",
          isDragging ? "border-highlight bg-highlight/5" : "hover:border-ink-400"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {uploadMutation.isPending ? (
          <Loader2 className="h-8 w-8 animate-spin text-ink-400" />
        ) : (
          <UploadCloud className="h-8 w-8 text-ink-400" />
        )}
        <div>
          <p className="font-medium">
            {uploadMutation.isPending ? "Uploading…" : "Drag a file here, or click to browse"}
          </p>
          <p className="text-sm text-ink-400">PDF, Word, PowerPoint, PNG, or JPEG — up to 25MB</p>
        </div>
        <input
          id="document-upload-input"
          type="file"
          accept={`${ACCEPTED_TYPES.join(",")},.pdf,.png,.jpg,.jpeg,.docx,.pptx`}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploadMutation.isPending}
        />
      </motion.label>
      {error && <p className="text-sm text-signal-error">{error}</p>}
    </div>
  );
}