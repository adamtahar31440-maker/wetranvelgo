"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

// Morocco-wide default — this picker is used from the global /pro signup
// form (no city context yet), not just Essaouira's. Once an address is picked,
// the map recenters on it regardless of this default.
export const MOROCCO_CENTER = { lat: 31.7917, lng: -7.0926 };
const MOROCCO_BOUNDS = { north: 35.95, south: 27.6, east: -0.9, west: -13.2 };
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type Suggestion = { text: string; prediction: google.maps.places.PlacePrediction };

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
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const [coords, setCoords] = useState({
    lat: defaultLat ?? MOROCCO_CENTER.lat,
    lng: defaultLng ?? MOROCCO_CENTER.lng,
  });
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing-key">(
    API_KEY ? "loading" : "missing-key"
  );
  // "new" = Places API (New) suggestions rendered by us; "legacy" = the old
  // google.maps.places.Autocomplete widget, which Google no longer enables on
  // new Cloud projects — kept only as a fallback for keys that still have it.
  const modeRef = useRef<"new" | "legacy" | null>(null);
  const listboxId = useId();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestError, setSuggestError] = useState(false);

  useEffect(() => {
    if (!API_KEY) return;
    loadGoogleMaps(API_KEY)
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  function moveTo(next: { lat: number; lng: number }) {
    setCoords(next);
    mapRef.current?.panTo(next);
    mapRef.current?.setZoom(16);
  }

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
    // Works even when no suggestion matches (new street, riad in the medina
    // without a proper address...): the pro just taps their spot on the map.
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    mapRef.current = map;
    markerRef.current = marker;

    const places = window.google.maps.places;
    if (places?.AutocompleteSuggestion) {
      modeRef.current = "new";
    } else if (places?.Autocomplete && inputRef.current) {
      modeRef.current = "legacy";
      const autocomplete = new places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "ma" },
        fields: ["formatted_address", "geometry"],
        bounds: MOROCCO_BOUNDS,
      });
      autocomplete.addListener("place_changed", () => {
        const location = autocomplete.getPlace().geometry?.location;
        if (location) moveTo({ lat: location.lat(), lng: location.lng() });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    markerRef.current?.setPosition(coords);
    onLocationChange?.(coords.lat, coords.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords]);

  function handleInput(value: string) {
    if (modeRef.current !== "new") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const places = window.google.maps.places;
      sessionTokenRef.current ??= new places.AutocompleteSessionToken();
      const requestId = ++requestIdRef.current;
      try {
        const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["ma"],
          locationBias: MOROCCO_BOUNDS,
          language: document.documentElement.lang || "fr",
        });
        if (requestId !== requestIdRef.current) return;
        setSuggestError(false);
        setSuggestions(
          results
            .filter((s) => s.placePrediction)
            .map((s) => ({ text: s.placePrediction!.text.toString(), prediction: s.placePrediction! }))
        );
        setActiveIndex(-1);
      } catch (err) {
        console.error("[AddressLocationPicker] Places autocomplete failed", err);
        if (requestId === requestIdRef.current) {
          setSuggestions([]);
          setSuggestError(true);
        }
      }
    }, 250);
  }

  async function select(s: Suggestion) {
    setSuggestions([]);
    const input = inputRef.current;
    if (input) {
      input.value = s.text;
      // Let forms that watch for changes (SubmitButton) notice the new value.
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    try {
      const place = s.prediction.toPlace();
      await place.fetchFields({ fields: ["location", "formattedAddress"] });
      if (input && place.formattedAddress) input.value = place.formattedAddress;
      if (place.location) moveTo({ lat: place.location.lat(), lng: place.location.lng() });
    } catch (err) {
      console.error("[AddressLocationPicker] Place details failed", err);
      setSuggestError(true);
    } finally {
      sessionTokenRef.current = null; // a session ends with the details call
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      // Enter would otherwise submit the whole signup form.
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  }

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          name="address"
          defaultValue={defaultAddress}
          className={className}
          dir={dir}
          autoComplete="off"
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
        />
        {suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.prediction.placeId}
                role="option"
                aria-selected={i === activeIndex}
                // mousedown (not click) fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(s);
                }}
                className={`flex cursor-pointer items-start gap-2 px-3 py-2 text-sm ${
                  i === activeIndex ? "bg-sand/60" : "hover:bg-sand/40"
                }`}
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-terracotta" />
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
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
      {suggestError && (
        <p className="mt-1 text-xs text-amber-700">
          Suggestions d&apos;adresse indisponibles pour le moment : tapez votre adresse puis cliquez sur la carte
          à l&apos;emplacement de votre établissement.
        </p>
      )}

      <div
        ref={mapDivRef}
        className="mt-2 h-56 w-full overflow-hidden rounded-lg border border-black/10 bg-sand"
      />
      {status === "ready" && (
        <p className="mt-1 text-xs text-foreground/50">
          Cliquez sur la carte ou faites glisser le repère pour ajuster précisément l&apos;emplacement.
        </p>
      )}
    </div>
  );
}
