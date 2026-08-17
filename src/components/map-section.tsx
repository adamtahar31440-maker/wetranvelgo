"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./map-view";

const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sand" />,
});

export function MapSection({ points, zoom }: { points: MapPoint[]; zoom?: number }) {
  return <MapView points={points} zoom={zoom} />;
}
