"use client";

import { useEffect } from "react";
import { clearFormDraft } from "@/lib/form-draft";

// Rendered once a form's submission has succeeded, to drop its saved draft.
export function ClearFormDraft({ draftKey }: { draftKey: string }) {
  useEffect(() => {
    clearFormDraft(draftKey);
  }, [draftKey]);
  return null;
}
