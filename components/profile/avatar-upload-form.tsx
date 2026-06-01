"use client";

import { useRef, useState } from "react";
import { uploadAvatar } from "@/app/profile/actions";

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
        className="cursor-pointer rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
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
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Uploading…" : "Upload"}
        </button>
      )}
    </form>
  );
}
