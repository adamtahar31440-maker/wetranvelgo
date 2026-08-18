"use client";

import { useState } from "react";

type SubcategoryOption = { slug: string; name: Record<string, string> };

// Known-option checkboxes share one `name` — the browser's own multi-value
// form semantics (formData.getAll(name)) do the serialization. Custom "Autre"
// entries ride the same `name` via a hidden input per chip instead, so they
// end up in the same submitted array without needing a separate field.
export function SubcategoryMultiSelect({
  options,
  locale = "fr",
  defaultValues = [],
  label,
  name = "subcategories",
  otherLabel = "Autre",
  otherPlaceholder = "Précisez",
}: {
  options: SubcategoryOption[];
  locale?: string;
  defaultValues?: string[];
  label: string;
  name?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
}) {
  const knownSlugs = new Set(options.map((o) => o.slug));
  // A previously-saved value that isn't one of this category's known
  // subcategories was typed in via "Autre" — keep it as its own removable
  // chip instead of silently dropping it (it must stay visible/editable
  // in the pro's dashboard, not just on first submit).
  const [customValues, setCustomValues] = useState<string[]>(
    defaultValues.filter((v) => !knownSlugs.has(v))
  );
  const [addingCustom, setAddingCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  function addCustom() {
    const value = customInput.trim();
    if (value && !customValues.includes(value)) {
      setCustomValues((prev) => [...prev, value]);
    }
    setCustomInput("");
    setAddingCustom(false);
  }

  function removeCustom(value: string) {
    setCustomValues((prev) => prev.filter((v) => v !== value));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-foreground/60">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((o) => (
          <label
            key={o.slug}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/70 has-[:checked]:border-ocean-dark has-[:checked]:bg-ocean-dark/10 has-[:checked]:text-ocean-dark"
          >
            <input
              type="checkbox"
              name={name}
              value={o.slug}
              defaultChecked={defaultValues.includes(o.slug)}
              className="h-3.5 w-3.5 accent-ocean-dark"
            />
            {o.name[locale] ?? o.name.fr}
          </label>
        ))}

        {customValues.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1.5 rounded-full border border-ocean-dark/30 bg-ocean-dark/10 px-3 py-1.5 text-xs font-medium text-ocean-dark"
          >
            <input type="hidden" name={name} value={v} />
            {v}
            <button
              type="button"
              onClick={() => removeCustom(v)}
              aria-label={`Retirer ${v}`}
              className="text-ocean-dark/60 hover:text-ocean-dark"
            >
              ×
            </button>
          </span>
        ))}

        {addingCustom ? (
          <span className="flex items-center gap-1">
            <input
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                } else if (e.key === "Escape") {
                  setAddingCustom(false);
                  setCustomInput("");
                }
              }}
              placeholder={otherPlaceholder}
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs outline-none focus:border-ocean-dark"
            />
            <button
              type="button"
              onClick={addCustom}
              className="rounded-full bg-ocean-dark px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              +
            </button>
          </span>
        ) : (
          // Re-clicking "Autre" after adding one value lets the pro add
          // another — it never gets consumed/disabled.
          <button
            type="button"
            onClick={() => setAddingCustom(true)}
            className="rounded-full border border-dashed border-black/20 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:border-ocean-dark hover:text-ocean-dark"
          >
            + {otherLabel}
          </button>
        )}
      </div>
    </div>
  );
}
