"use client";

import { useRef, useState } from "react";
import { uploadAvatar } from "@/app/profile/actions";
import { Upload, ImageIcon } from "lucide-react";

export function AvatarUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    await uploadAvatar(formData);
    setPending(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
      <label
        htmlFor="avatar-input"
        className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        {fileName ?? "Choose image"}
        <input
          id="avatar-input"
          name="avatar"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>
      {fileName && (
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          {pending ? "Uploading…" : "Upload"}
        </button>
      )}
    </form>
  );
}
