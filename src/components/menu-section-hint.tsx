import { Info } from "lucide-react";
import type { MenuSectionKind } from "@/lib/menu-types";
import { menuSectionHint } from "@/lib/menu-section-hints";

// "What goes in this section" box at the top of a QR section's editor.
export function MenuSectionHint({ kind, locale }: { kind: MenuSectionKind; locale: string }) {
  return (
    <p className="mb-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
      <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{menuSectionHint(kind, locale)}</span>
    </p>
  );
}
