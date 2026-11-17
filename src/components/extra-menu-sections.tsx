"use client";

import { useState, type ComponentProps } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MenuEditor } from "@/components/menu-editor";
import { MenuSectionIcon } from "@/components/menu-section-icon";
import { MENU_SECTION_KINDS, type MenuSectionKind } from "@/lib/menu-types";
import type { MenuSectionInput } from "@/lib/digital-menu";
import { availableSectionKinds, menuSectionLabel, menuSectionsEditorStrings } from "@/lib/menu-sections";

// Extra catalogs on the establishment's single QR code — e.g. a hotel's
// restaurant, spa, hair salon — each with its own full menu editor (scan,
// categories, prices). The pro picks each section's type; visitors scanning
// the QR then choose between them as tabs.
export function ExtraMenuSections({
  locale,
  categoryType,
  defaultSections = [],
  editorLabels,
}: {
  locale: string;
  categoryType: string | undefined | null;
  defaultSections?: MenuSectionInput[];
  editorLabels: Omit<ComponentProps<typeof MenuEditor>, "name" | "defaultItems">;
}) {
  const t = menuSectionsEditorStrings(locale);
  const [enabled, setEnabled] = useState<MenuSectionKind[]>(() => defaultSections.map((s) => s.kind));
  const available = availableSectionKinds(categoryType);
  const ordered = MENU_SECTION_KINDS.filter((k) => enabled.includes(k));
  const missing = available.filter((k) => !enabled.includes(k));
  const [picked, setPicked] = useState<MenuSectionKind | "">("");
  const toAdd = picked && missing.includes(picked) ? picked : missing[0];

  return (
    <div className="mt-6 border-t border-ocean-dark/10 pt-5">
      <input type="hidden" name="menuSectionsPresent" value="1" />
      <p className="text-sm font-semibold text-ocean-dark">{t.title}</p>
      <p className="mb-3 mt-1 text-xs text-foreground/60">{t.intro}</p>

      <div className="space-y-4">
        {ordered.map((kind) => (
          <div key={kind} className="rounded-xl border border-ocean-dark/20 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ocean-dark">
                <MenuSectionIcon kind={kind} size={16} /> {menuSectionLabel(kind, locale)}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(t.removeConfirm)) return;
                  setEnabled((list) => list.filter((k) => k !== kind));
                }}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <Trash2 size={13} /> {t.remove}
              </button>
            </div>
            <MenuEditor
              name={`menuSection_${kind}`}
              defaultItems={defaultSections.find((s) => s.kind === kind)?.items ?? []}
              {...editorLabels}
            />
          </div>
        ))}
      </div>

      {toAdd && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="menu-section-type">
            {t.typeLabel}
          </label>
          <select
            id="menu-section-type"
            value={toAdd}
            onChange={(e) => setPicked(e.target.value as MenuSectionKind)}
            className="rounded-full border border-ocean-dark/30 bg-white px-3 py-2 text-xs font-medium text-ocean-dark outline-none"
          >
            {missing.map((kind) => (
              <option key={kind} value={kind}>
                {menuSectionLabel(kind, locale)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setEnabled((list) => [...list, toAdd]);
              setPicked("");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ocean-dark px-4 py-2 text-xs font-semibold text-white hover:bg-ocean"
          >
            <Plus size={14} /> {t.add}
          </button>
        </div>
      )}
    </div>
  );
}
