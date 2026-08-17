"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { isUnsupportedImageFile, uploadImageFile } from "@/lib/image-upload";

type UploadItem = { id: string; url: string; uploading: boolean; error?: string };

export function ImageUploader({
  label,
  hint,
  defaultImages = [],
  max,
  limitReachedText,
  unsupportedFormatText,
  fieldName = "images",
}: {
  label: string;
  hint?: string;
  defaultImages?: string[];
  max?: number | null;
  limitReachedText?: string;
  unsupportedFormatText?: string;
  fieldName?: string;
}) {
  const [items, setItems] = useState<UploadItem[]>(
    defaultImages.map((url, i) => ({ id: `existing-${i}-${url}`, url, uploading: false }))
  );

  const readyCount = items.filter((it) => !it.uploading && !it.error).length;
  const limitReached = typeof max === "number" && readyCount >= max;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    let files = Array.from(fileList);
    if (typeof max === "number") {
      const remaining = Math.max(0, max - readyCount);
      files = files.slice(0, remaining);
    }
    if (files.length === 0) return;

    const pending = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      uploading: true,
    }));
    setItems((prev) => [...prev, ...pending]);

    await Promise.all(
      files.map(async (file, i) => {
        const item = pending[i];

        // iPhones save photos as HEIC by default, which browsers can't even display in
        // an <img> tag and which this upload flow doesn't accept — catch it up front
        // with a clear message instead of a generic failure after a network round-trip.
        if (isUnsupportedImageFile(file)) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, uploading: false, error: unsupportedFormatText ?? "Format non supporté" }
                : it
            )
          );
          return;
        }

        try {
          const url = await uploadImageFile(file);
          setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, url, uploading: false } : it)));
        } catch (err) {
          console.error("Image upload failed:", err);
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, uploading: false, error: "Échec de l'envoi" } : it))
          );
        }
      })
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const readyUrls = items.filter((it) => !it.uploading && !it.error).map((it) => it.url);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-semibold text-foreground/60">{label}</label>
        {typeof max === "number" && (
          <span className="text-xs text-foreground/50">
            {readyCount}/{max}
          </span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={limitReached}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm text-foreground/70 file:mr-3 file:rounded-full file:border-0 file:bg-ocean-dark file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-ocean disabled:cursor-not-allowed disabled:opacity-50 disabled:file:bg-foreground/30"
      />
      {limitReached && limitReachedText ? (
        <p className="mt-1 text-xs font-medium text-terracotta">{limitReachedText}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>
      )}
      <input type="hidden" name={fieldName} value={readyUrls.join("\n")} readOnly />

      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="" className="h-full w-full object-cover" />
              {it.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 size={20} className="animate-spin text-white" />
                </div>
              )}
              {it.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-600/70 p-1 text-center text-[10px] text-white">
                  {it.error}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
