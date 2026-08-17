"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

const ESSAOUIRA_CENTER = { lat: 31.5085, lng: -9.7595 };
const ESSAOUIRA_BOUNDS = { north: 31.6, south: 31.4, east: -9.65, west: -9.9 };

type PointInput = { label: string; lat: number | null; lng: number | null };
type Status = "loading" | "ready" | "error" | "missing-key";

export function MapPointsEditor({
  name,
  defaultPoints = [],
  labelPlaceholder,
  addressPlaceholder,
  addLabel,
  notLocatedText,
  missingKeyText,
  errorText,
  dragHint,
}: {
  name: string;
  defaultPoints?: { label: string; lat: number; lng: number }[];
  labelPlaceholder: string;
  addressPlaceholder: string;
  addLabel: string;
  notLocatedText: string;
  missingKeyText: string;
  errorText: string;
  dragHint: string;
}) {
  const [points, setPoints] = useState<PointInput[]>(
    defaultPoints.length > 0 ? defaultPoints.map((p) => ({ ...p })) : [{ label: "", lat: null, lng: null }]
  );
  const [status, setStatus] = useState<Status>("loading");

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<(google.maps.Marker | null)[]>([]);
  const searchRefs = useRef<(HTMLInputElement | null)[]>([]);
  const boundSearchInputs = useRef<Set<HTMLInputElement>>(new Set());

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setStatus("missing-key");
      return;
    }
    loadGoogleMaps(apiKey)
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  function updatePoint(i: number, patch: Partial<PointInput>) {
    setPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  // Initialize the map once.
  useEffect(() => {
    if (status !== "ready" || !mapDivRef.current || mapRef.current || !window.google) return;
    const firstWithCoords = points.find((p) => p.lat != null && p.lng != null);
    const center = firstWithCoords ? { lat: firstWithCoords.lat as number, lng: firstWithCoords.lng as number } : ESSAOUIRA_CENTER;
    mapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center,
      zoom: firstWithCoords ? 14 : 13,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Keep draggable markers in sync with the points list.
  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.google) return;
    const map = mapRef.current;

    markersRef.current.slice(points.length).forEach((m) => m?.setMap(null));
    markersRef.current = markersRef.current.slice(0, points.length);

    points.forEach((p, i) => {
      if (p.lat == null || p.lng == null) {
        markersRef.current[i]?.setMap(null);
        markersRef.current[i] = null;
        return;
      }
      const pos = { lat: p.lat, lng: p.lng };
      const existing = markersRef.current[i];
      if (existing) {
        existing.setPosition(pos);
        existing.setMap(map);
      } else {
        const marker = new window.google.maps.Marker({ position: pos, map, draggable: true });
        marker.addListener("dragend", () => {
          const newPos = marker.getPosition();
          if (newPos) updatePoint(i, { lat: newPos.lat(), lng: newPos.lng() });
        });
        markersRef.current[i] = marker;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, points]);

  // Wire Places autocomplete on each row's search box (once per input).
  useEffect(() => {
    if (status !== "ready" || !window.google) return;
    searchRefs.current.forEach((input, i) => {
      if (!input || boundSearchInputs.current.has(input)) return;
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: "ma" },
        fields: ["formatted_address", "geometry"],
        bounds: ESSAOUIRA_BOUNDS,
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;
        if (!location) return;
        const lat = location.lat();
        const lng = location.lng();
        updatePoint(i, { lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(16);
      });
      boundSearchInputs.current.add(input);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, points.length]);

  function addPoint() {
    setPoints((prev) => [...prev, { label: "", lat: null, lng: null }]);
  }
  function removePoint(i: number) {
    setPoints((prev) => prev.filter((_, idx) => idx !== i));
  }

  const validPoints = points.filter(
    (p): p is { label: string; lat: number; lng: number } => p.label.trim().length > 0 && p.lat != null && p.lng != null
  );
  const serialized = JSON.stringify(validPoints.map((p) => ({ label: p.label.trim(), lat: p.lat, lng: p.lng })));

  return (
    <div>
      <div className="space-y-2">
        {points.map((p, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              value={p.label}
              onChange={(e) => updatePoint(i, { label: e.target.value })}
              placeholder={labelPlaceholder}
              className="w-44 shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
            />
            <input
              ref={(el) => {
                searchRefs.current[i] = el;
              }}
              placeholder={addressPlaceholder}
              autoComplete="off"
              className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
            />
            <span className={"shrink-0 text-xs " + (p.lat != null ? "text-emerald-600" : "text-foreground/40")}>
              {p.lat != null && p.lng != null ? `✓ ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : notLocatedText}
            </span>
            <button
              type="button"
              onClick={() => removePoint(i)}
              className="shrink-0 rounded-full p-1.5 text-foreground/50 hover:bg-sand/50 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPoint}
        className="mt-2 flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-4 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/50"
      >
        <Plus size={14} /> {addLabel}
      </button>

      {status === "missing-key" && <p className="mt-1 text-xs text-red-600">{missingKeyText}</p>}
      {status === "error" && <p className="mt-1 text-xs text-red-600">{errorText}</p>}

      <div ref={mapDivRef} className="mt-3 h-64 w-full overflow-hidden rounded-lg border border-black/10 bg-sand" />
      {status === "ready" && <p className="mt-1 text-xs text-foreground/50">{dragHint}</p>}

      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}
