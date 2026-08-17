"use client";

import { useState } from "react";
import { createLabelEvaluation } from "@/lib/admin-actions";
import { LABEL_CRITERIA } from "@/lib/label-criteria";

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function LabelEvaluationForm({ locale, establishmentId }: { locale: string; establishmentId: number }) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(LABEL_CRITERIA.map((c) => [c.key, 5]))
  );
  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-ocean-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean"
      >
        + Nouvelle évaluation
      </button>
    );
  }

  return (
    <form action={createLabelEvaluation} className="space-y-6 rounded-2xl border border-black/10 p-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="establishmentId" value={establishmentId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LABEL_CRITERIA.map((c) => (
          <div key={c.key}>
            <label className={labelClass}>
              {c.label} — <span className="font-semibold text-ocean-dark">{scores[c.key]}/10</span>
            </label>
            <input
              type="range"
              name={c.key}
              min={0}
              max={10}
              value={scores[c.key]}
              onChange={(e) => setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div>
        <label className={labelClass}>Commentaires internes</label>
        <textarea name="comments" rows={3} className={inputClass} placeholder="Observations, points à surveiller..." />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-sand/50 px-4 py-3">
        <span className="text-sm font-medium text-foreground/70">Score total</span>
        <span className="text-2xl font-bold text-ocean-dark">{total}/100</span>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded-full bg-ocean-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean">
          Enregistrer l&apos;évaluation
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-semibold text-foreground/70 hover:bg-black/5"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
