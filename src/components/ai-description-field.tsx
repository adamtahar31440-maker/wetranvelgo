"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export function AiDescriptionField({
  label,
  defaultValue,
  locale,
  businessName,
  category,
  generateLabel,
  generatePendingLabel,
  emptyErrorText,
  errorText,
  placeholder,
  labelClassName,
  inputClassName,
}: {
  label: string;
  defaultValue: string;
  locale: string;
  businessName?: string;
  category?: string;
  generateLabel: string;
  generatePendingLabel: string;
  emptyErrorText: string;
  errorText: string;
  placeholder?: string;
  labelClassName: string;
  inputClassName: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const keywords = textareaRef.current?.value.trim() ?? "";
    if (!keywords) {
      setError(emptyErrorText);
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/pro/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, locale, name: businessName, category }),
      });
      const data = await res.json();
      if (!res.ok || !data.description) throw new Error(data.error ?? "Generation failed");
      if (textareaRef.current) textareaRef.current.value = data.description;
    } catch (err) {
      console.error("AI description generation failed:", err);
      setError(errorText);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className={labelClassName}>{label}</label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex shrink-0 items-center gap-1 rounded-full bg-ocean-dark/10 px-3 py-1 text-xs font-semibold text-ocean-dark hover:bg-ocean-dark/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {generating ? generatePendingLabel : generateLabel}
        </button>
      </div>
      <textarea
        name="description"
        ref={textareaRef}
        defaultValue={defaultValue}
        rows={4}
        placeholder={placeholder}
        className={inputClassName}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
