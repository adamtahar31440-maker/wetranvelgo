"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export function DirectionsButton({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-sand/40"
      >
        <MapPin size={16} /> {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-sand/50"
            >
              Google Maps
            </a>
            <a
              href={`https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-foreground/80 hover:bg-sand/50"
            >
              Waze
            </a>
          </div>
        </>
      )}
    </div>
  );
}
