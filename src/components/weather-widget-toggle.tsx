"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function WeatherWidgetToggle({
  badge,
  closeLabel,
  children,
}: {
  badge: React.ReactNode;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}
      <div className="fixed bottom-24 right-4 z-40 rtl:right-auto rtl:left-4 sm:bottom-24 sm:right-6 rtl:sm:right-auto rtl:sm:left-6">
      {open ? (
        <div className="w-72 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <div className="p-4">{children}</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-black/5 bg-sand/30 py-3 text-sm font-semibold text-foreground/70 hover:bg-sand/50"
          >
            <X size={16} />
            {closeLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-sand/40"
        >
          {badge}
        </button>
      )}
      </div>
    </>
  );
}
