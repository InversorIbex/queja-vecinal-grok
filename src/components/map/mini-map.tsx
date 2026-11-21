"use client";

import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { GeoPosition } from "@/types";
import "leaflet/dist/leaflet.css";

function PickPin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function MiniMap({
  center,
  pin,
  onPick,
}: {
  center: GeoPosition;
  pin: GeoPosition | null;
  onPick?: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full min-h-[280px] w-full"
      dragging
      scrollWheelZoom
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {onPick && <PickPin onPick={onPick} />}
      {pin && (
        <CircleMarker
          center={[pin.lat, pin.lng]}
          radius={11}
          pathOptions={{ color: "#9a3412", fillColor: "#f97316", fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
