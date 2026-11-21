"use client";

import { useEffect } from "react";
import { latLng } from "leaflet";
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
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

function ZoneCircle({ center, radiusM }: { center: GeoPosition; radiusM: number }) {
  const map = useMap();
  useEffect(() => {
    let fitted = false;
    const fit = () => {
      const size = map.getSize();
      if (size.x < 80 || size.y < 80) return;
      map.fitBounds(latLng(center.lat, center.lng).toBounds(radiusM * 2), {
        padding: [18, 18],
        animate: false,
      });
      fitted = true;
    };
    map.whenReady(fit);
    const onResize = () => {
      if (!fitted) fit();
    };
    map.on("resize", onResize);
    const timer = window.setTimeout(fit, 120);
    return () => {
      map.off("resize", onResize);
      window.clearTimeout(timer);
    };
  }, [center.lat, center.lng, radiusM, map]);

  return (
    <Circle
      center={[center.lat, center.lng]}
      radius={radiusM}
      interactive={false}
      pathOptions={{
        color: "#0369a1",
        weight: 5,
        dashArray: "2 12",
        lineCap: "round",
        fillColor: "#38bdf8",
        fillOpacity: 0.12,
      }}
    />
  );
}

export default function MiniMap({
  center,
  pin,
  radiusM,
  onPick,
}: {
  center: GeoPosition;
  pin: GeoPosition | null;
  radiusM: number;
  onPick?: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={10}
      className="h-full min-h-[280px] w-full"
      dragging
      scrollWheelZoom
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {onPick && <PickPin onPick={onPick} />}
      <ZoneCircle center={center} radiusM={radiusM} />
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
