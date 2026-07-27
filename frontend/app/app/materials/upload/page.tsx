import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadDropzone } from "@/features/documents/upload-dropzone";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl py-12">
      <Link href="/app/materials" className="mb-6 flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-950">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>
      <h1 className="font-display mb-2 text-2xl font-semibold">Upload material</h1>
      <p className="mb-8 text-ink-400">
        We&apos;ll extract the text, chunk it, and index it so you can ask questions grounded in this document.
      </p>
      <UploadDropzone />
    </div>
  );
}
