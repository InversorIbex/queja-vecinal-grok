"use client";

import { MapContainer, TileLayer, Circle, CircleMarker, useMapEvents } from "react-leaflet";
import type { GeoPosition } from "@/types";
import "leaflet/dist/leaflet.css";

function PinPicker({
  onPick,
}: {
  onPick: (pos: GeoPosition) => void;
}) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MiniMap({
  center,
  radiusM,
  pin,
  onPinChange,
}: {
  center: GeoPosition;
  radiusM: number;
  /** Pin del problema (dentro del círculo de 10 km). */
  pin?: GeoPosition;
  onPinChange?: (pos: GeoPosition) => void;
}) {
  const marker = pin ?? center;
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      className="h-full min-h-[240px] w-full"
      dragging
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {onPinChange && <PinPicker onPick={onPinChange} />}
      <CircleMarker
        center={[center.lat, center.lng]}
        radius={6}
        pathOptions={{ color: "#0284c7", fillColor: "#0ea5e9", fillOpacity: 0.9 }}
      />
      <CircleMarker
        center={[marker.lat, marker.lng]}
        radius={9}
        pathOptions={{ color: "#c2410c", fillColor: "#ea580c", fillOpacity: 1 }}
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
