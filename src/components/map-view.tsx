"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
  href?: string;
};

export function MapView({ points, zoom = 14 }: { points: MapPoint[]; zoom?: number }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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
    if (status !== "ready" || !mapDivRef.current || points.length === 0 || !window.google) return;

    const center = { lat: points[0].lat, lng: points[0].lng };
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center,
        zoom,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const infoWindow = new window.google.maps.InfoWindow();
    points.forEach((p) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        title: p.label,
      });
      marker.addListener("click", () => {
        const container = document.createElement("div");
        if (p.href) {
          const a = document.createElement("a");
          a.href = p.href;
          a.textContent = p.label;
          container.appendChild(a);
        } else {
          container.textContent = p.label;
        }
        infoWindow.setContent(container);
        infoWindow.open(map, marker);
      });
      markersRef.current.push(marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, points, zoom]);

  if (points.length === 0) return null;

  return (
    <div className="relative h-full w-full">
      <div ref={mapDivRef} className="h-full w-full" />
      {status === "missing-key" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sand p-4 text-center text-xs text-red-600">
          Carte indisponible : clé API Google Maps non configurée.
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sand p-4 text-center text-xs text-red-600">
          Impossible de charger Google Maps.
        </div>
      )}
    </div>
  );
}
