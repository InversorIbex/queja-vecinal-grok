"use client";

import { MapContainer, TileLayer, Circle, CircleMarker } from "react-leaflet";
import type { GeoPosition } from "@/types";
import "leaflet/dist/leaflet.css";

export default function MiniMap({
  center,
  radiusM,
}: {
  center: GeoPosition;
  radiusM: number;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      className="h-full min-h-[240px] w-full"
      dragging
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker
        center={[center.lat, center.lng]}
        radius={8}
        pathOptions={{ color: "#0284c7", fillColor: "#0ea5e9", fillOpacity: 1 }}
      />
      <Circle
        center={[center.lat, center.lng]}
        radius={radiusM}
        pathOptions={{
          color: "#f97316",
          fillColor: "#fb923c",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "4 6",
        }}
      />
    </MapContainer>
  );
}
