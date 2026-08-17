"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";

// FormData has no built-in equality check — this turns one into a stable
// string so two snapshots can be compared with ===. Every field in this
// app's forms ends up as a plain string by the time it's submitted (async
// uploads write their resulting URL into a hidden input rather than
// submitting a File), so .toString() never loses information here.
function snapshotFormData(form: HTMLFormElement): string {
  return Array.from(new FormData(form).entries())
    .map(([key, value]) => `${key}=${value.toString()}`)
    .sort()
    .join("\n");
}

// Translation itself happens server-side in a handful of batched API calls, not one
// call per language, so this step-through is a simulated (not literally real-time)
// indicator — its purpose is purely to reassure the pro that the save is progressing
// language by language and hasn't frozen, so they don't navigate away mid-save.
const STEP_INTERVAL_MS = 700;

export function SubmitButton({
  label,
  pendingLabel,
  translatingLocales,
  requireChangesToEnable,
}: {
  label: string;
  pendingLabel: string;
  translatingLocales?: string[];
  // Keeps the button disabled until the owning form actually differs from
  // its initial values — for an edit form where submitting with nothing
  // changed is never useful. Opt-in: forms this isn't passed for (signup,
  // admin CRUD, delete confirmations, ...) keep the old always-enabled
  // behavior unchanged.
  requireChangesToEnable?: boolean;
}) {
  const { pending } = useFormStatus();
  const [step, setStep] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const initialSnapshot = useRef<string | null>(null);
  const [dirty, setDirty] = useState(!requireChangesToEnable);

  useEffect(() => {
    if (!pending) {
      setStep(0);
      return;
    }
    if (!translatingLocales || translatingLocales.length === 0) return;
    const interval = setInterval(() => {
      setStep((s) => (s < translatingLocales.length - 1 ? s + 1 : s));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pending, translatingLocales]);

  useEffect(() => {
    if (!requireChangesToEnable) return;
    const form = buttonRef.current?.form;
    if (!form) return;

    initialSnapshot.current = snapshotFormData(form);
    const checkDirty = () => setDirty(snapshotFormData(form) !== initialSnapshot.current);

    // "input"/"change" cover direct edits (typing, checkboxes, selects);
    // "click" also catches things like the map picker or a category reorder
    // that change a hidden field without a native input/change event. A few
    // fields (an async photo upload finishing, a scanned item appearing)
    // only update their hidden input well after the click that started
    // them, with no further event to hook — the poll underneath catches
    // those instead of trying to instrument every child component for it.
    form.addEventListener("input", checkDirty);
    form.addEventListener("change", checkDirty);
    form.addEventListener("click", checkDirty);
    const poll = setInterval(checkDirty, 1500);
    return () => {
      form.removeEventListener("input", checkDirty);
      form.removeEventListener("change", checkDirty);
      form.removeEventListener("click", checkDirty);
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireChangesToEnable]);

  return (
    <div>
      <button
        ref={buttonRef}
        type="submit"
        disabled={pending || !dirty}
        className="rounded-full bg-ocean-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? pendingLabel : label}
      </button>
      {pending && (
        <div className="mt-3 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full w-1/3 rounded-full bg-ocean-dark animate-progress-slide" />
          </div>
          {translatingLocales && translatingLocales.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
              {translatingLocales.map((name, i) => (
                <li
                  key={name}
                  className={
                    "flex items-center gap-1 " +
                    (i <= step ? "text-foreground" : "text-foreground/40")
                  }
                >
                  {i < step ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : i === step ? (
                    <Loader2 size={12} className="animate-spin text-ocean-dark" />
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-black/20" />
                  )}
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
