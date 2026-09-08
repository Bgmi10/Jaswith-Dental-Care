    // src/components/admin/ImageUploadField.tsx
"use client";

import { useState } from "react";

export function ImageUploadField({
  name,
  folder,
  defaultValue,
}: {
  name: string;
  folder: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    setUrl(data.url);
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="border p-2 rounded w-full text-sm"
      />
      {uploading && <p className="text-xs text-gray-500">Uploading...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {url && !uploading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Preview" className="h-20 rounded border object-cover" />
      )}
    </div>
  );
}