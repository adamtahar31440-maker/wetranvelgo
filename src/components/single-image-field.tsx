"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { isUnsupportedImageFile, uploadImageFile } from "@/lib/image-upload";

// A single-photo upload field (unlike ImageUploader, which manages a whole
// gallery array) — used for the digital menu's dedicated profile photo and
// banner, kept deliberately separate from the fiche's general `images` list.
export function SingleImageField({
  name,
  label,
  defaultValue,
  shape = "square",
  unsupportedFormatText,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  shape?: "square" | "banner";
  unsupportedFormatText?: string;
}) {
  const [url, setUrl] = useState<string | null>(defaultValue ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (isUnsupportedImageFile(file)) {
      setError(unsupportedFormatText ?? "Format non supporté");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const uploadedUrl = await uploadImageFile(file);
      setUrl(uploadedUrl);
    } catch {
      setError("Échec de l'envoi");
    } finally {
      setUploading(false);
    }
  }

  const boxClass = shape === "banner" ? "aspect-[3/1] w-full" : "h-20 w-20";

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-foreground/60">{label}</label>
      <div className={`relative ${boxClass} overflow-hidden rounded-xl border border-black/10 bg-sand/30`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-foreground/30">
            <ImagePlus size={18} />
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files)}
              className="hidden"
            />
          </label>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 size={16} className="animate-spin text-white" />
          </div>
        )}
        {url && !uploading && (
          <button
            type="button"
            onClick={() => setUrl(null)}
            className="absolute right-1.5 top-1.5 rounded-full bg-white p-1 text-foreground/60 shadow hover:text-red-600"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      <input type="hidden" name={name} value={url ?? ""} />
    </div>
  );
}
