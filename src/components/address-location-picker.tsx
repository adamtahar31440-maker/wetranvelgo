"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

// Morocco-wide default — this picker is used from the global /pro signup
// form (no city context yet), not just Essaouira's. Once an address is picked,
// the map recenters on it regardless of this default.
const MOROCCO_CENTER = { lat: 31.7917, lng: -7.0926 };
const MOROCCO_BOUNDS = { north: 35.95, south: 27.6, east: -0.9, west: -13.2 };

export function AddressLocationPicker({
  className,
  dir,
  defaultAddress,
  defaultLat,
  defaultLng,
  onLocationChange,
}: {
  className: string;
  dir?: "ltr" | "rtl";
  defaultAddress?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [coords, setCoords] = useState({
    lat: defaultLat ?? MOROCCO_CENTER.lat,
    lng: defaultLng ?? MOROCCO_CENTER.lng,
  });
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing-key">("loading");

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

  useEffect(() => {
    if (status !== "ready" || !mapDivRef.current || mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapDivRef.current, {
      center: coords,
      zoom: defaultLat ? 16 : 6,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    const marker = new window.google.maps.Marker({
      position: coords,
      map,
      draggable: true,
    });
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) setCoords({ lat: pos.lat(), lng: pos.lng() });
    });
    mapRef.current = map;
    markerRef.current = marker;

    if (inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "ma" },
        fields: ["formatted_address", "geometry"],
        bounds: MOROCCO_BOUNDS,
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;
        if (!location) return;
        const next = { lat: location.lat(), lng: location.lng() };
        setCoords(next);
        map.panTo(next);
        map.setZoom(16);
        marker.setPosition(next);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    markerRef.current?.setPosition(coords);
    onLocationChange?.(coords.lat, coords.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  return (
    <div>
      <input
        ref={inputRef}
        name="address"
        defaultValue={defaultAddress}
        className={className}
        dir={dir}
        autoComplete="off"
      />
      <input type="hidden" name="lat" value={coords.lat} readOnly />
      <input type="hidden" name="lng" value={coords.lng} readOnly />

      {status === "missing-key" && (
        <p className="mt-1 text-xs text-red-600">
          Carte indisponible : clé API Google Maps non configurée.
        </p>
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-red-600">Impossible de charger Google Maps.</p>
      )}

      <div
        ref={mapDivRef}
        className="mt-2 h-56 w-full overflow-hidden rounded-lg border border-black/10 bg-sand"
      />
      {status === "ready" && (
        <p className="mt-1 text-xs text-foreground/50">
          Faites glisser le repère sur la carte pour ajuster précisément l&apos;emplacement.
        </p>
      )}
    </div>
  );
}
