"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

// Autosaved drafts for long forms (the pro signup) kept in this browser only.
// On phones the OS often kills the browser tab while the pro switches apps
// (e.g. to copy their Google reviews link) and reloads it on return — without
// this, everything typed so far would be gone.

export type FormDraft = Record<string, string[]>;

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Never restored: consent must be given again explicitly, and "$ACTION_..."
// fields are Next.js server-action internals.
const SKIPPED = (name: string) => name === "acceptTerms" || name.startsWith("$");

function read(key: string): FormDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { savedAt, fields } = JSON.parse(raw) as { savedAt: number; fields: FormDraft };
    if (!fields || Date.now() - savedAt > MAX_AGE_MS) return null;
    return Object.keys(fields).length > 0 ? fields : null;
  } catch {
    return null;
  }
}

export function saveFormDraft(key: string, form: HTMLFormElement, extraSkipped: string[] = []) {
  const fields: FormDraft = {};
  for (const [name, value] of new FormData(form).entries()) {
    if (typeof value !== "string" || SKIPPED(name) || extraSkipped.includes(name)) continue;
    (fields[name] ??= []).push(value);
  }
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), fields }));
  } catch {
    // Storage full or blocked (private mode) — the form still works, just unsaved.
  }
}

export function clearFormDraft(key: string) {
  initialDrafts.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {}
}

// The draft as it was when the page loaded — read once per key and frozen, so
// autosaving while the pro types never re-renders/remounts the form.
const initialDrafts = new Map<string, FormDraft | null>();
const noSubscribe = () => () => {};

export function useInitialFormDraft(key: string): FormDraft | null {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      if (!initialDrafts.has(key)) initialDrafts.set(key, read(key));
      return initialDrafts.get(key)!;
    },
    () => null
  );
}

// Saves on every edit (debounced), every few seconds (uploads and editors
// update hidden inputs without firing input events) and — the case that
// matters most — the moment the page is hidden because the pro left the app.
// Nothing is stored until the pro actually edits something (or a draft was
// already restored), so merely opening the form never leaves a draft behind.
export function useFormDraftAutosave(
  key: string,
  formRef: RefObject<HTMLFormElement | null>,
  { extraSkipped = [], hasDraft = false }: { extraSkipped?: string[]; hasDraft?: boolean } = {}
) {
  const skippedKey = extraSkipped.join(",");
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const skipped = skippedKey ? skippedKey.split(",") : [];
    let dirty = hasDraft;
    const save = () => {
      if (dirty) saveFormDraft(key, form, skipped);
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onEdit = () => {
      dirty = true;
      clearTimeout(timer);
      timer = setTimeout(save, 400);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    const interval = setInterval(save, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      form.removeEventListener("input", onEdit);
      form.removeEventListener("change", onEdit);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
    };
  }, [key, formRef, skippedKey, hasDraft]);
}
