"use client";

import { useState } from "react";

type Option = { slug: string; name: Record<string, string> };

// Serializes to the same newline-per-item text the server already parses for
// "otherActivities" — only the input UI changed from a free textarea to a
// clickable tag picker, so pro-actions.ts/admin-actions.ts needed no changes.
export function ActivityTagsPicker({
  options,
  locale,
  defaultValues = [],
  otherLabel,
  otherPlaceholder,
  name = "otherActivities",
}: {
  options: Option[];
  locale: string;
  defaultValues?: string[];
  otherLabel: string;
  otherPlaceholder: string;
  name?: string;
}) {
  const isKnown = (v: string) => options.some((o) => o.name.fr === v || o.name[locale] === v);
  const matchedSlugs = defaultValues
    .map((v) => options.find((o) => o.name.fr === v || o.name[locale] === v)?.slug)
    .filter((s): s is string => !!s);
  const unmatched = defaultValues.filter((v) => !isKnown(v));

  const [selected, setSelected] = useState<Set<string>>(new Set(matchedSlugs));
  const [otherActive, setOtherActive] = useState(unmatched.length > 0);
  const [otherText, setOtherText] = useState(unmatched.join("\n"));

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "border-ocean-dark bg-ocean-dark text-white"
        : "border-black/15 text-foreground/70 hover:bg-sand/50"
    }`;

  const otherLines = otherActive
    ? otherText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const serialized = [
    ...options.filter((o) => selected.has(o.slug)).map((o) => o.name[locale] ?? o.name.fr),
    ...otherLines,
  ].join("\n");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.slug}
            type="button"
            onClick={() => toggle(o.slug)}
            className={chipClass(selected.has(o.slug))}
          >
            {o.name[locale] ?? o.name.fr}
          </button>
        ))}
        <button type="button" onClick={() => setOtherActive((v) => !v)} className={chipClass(otherActive)}>
          {otherLabel}
        </button>
      </div>
      {otherActive && (
        <textarea
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          rows={2}
          placeholder={otherPlaceholder}
          required
          className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark"
        />
      )}
      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}
