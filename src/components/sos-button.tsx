"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LifeBuoy, X, Phone, MapPin } from "lucide-react";

type Contact = {
  id: number;
  name: Record<string, string>;
  phone: string | null;
};

export function SosButton({ contacts }: { contacts: Contact[] }) {
  const t = useTranslations("assistance");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  function shareLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      window.open(url, "_blank");
    });
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-4 right-4 z-[70] rtl:right-auto rtl:left-4">
        {open && (
          <div className="mb-3 w-72 rounded-2xl border border-black/10 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ocean-dark">{t("sosTitle")}</p>
              <button onClick={() => setOpen(false)} aria-label="close">
                <X size={18} className="text-foreground/50" />
              </button>
            </div>
            <div className="space-y-2">
              {contacts.map((c) => (
                <a
                  key={c.id}
                  href={`tel:${c.phone}`}
                  className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <span>{c.name[locale] ?? c.name.fr}</span>
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {c.phone}
                  </span>
                </a>
              ))}
              <button
                onClick={shareLocation}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-sand/40"
              >
                <MapPin size={14} /> {t("myLocation")}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={t("sos")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-red-700/30 bg-red-600 text-white transition hover:bg-red-700 active:scale-95"
        >
          <LifeBuoy size={26} />
        </button>
      </div>
    </>
  );
}
