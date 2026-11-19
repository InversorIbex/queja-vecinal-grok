"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import type { Complaint, GeoPosition } from "@/types";
import { CATEGORIES, MAX_DISTANCE_M } from "@/lib/constants";
import { useState } from "react";
import "leaflet/dist/leaflet.css";

type LayerKey = "none" | "ccaa" | "provincias" | "municipios";

function Recenter({ center }: { center: GeoPosition }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

export default function MapInner({
  center,
  complaints,
  heat,
  adminLayer,
  userPosition,
  onSelect,
  onLayerClick,
}: {
  center: GeoPosition;
  complaints: Complaint[];
  heat: boolean;
  adminLayer: LayerKey;
  userPosition: GeoPosition | null;
  onSelect: (c: Complaint) => void;
  onLayerClick: (name: string | null) => void;
}) {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    if (adminLayer === "none") {
      setGeo(null);
      onLayerClick(null);
      return;
    }
    const file =
      adminLayer === "ccaa"
        ? "/geojson/ccaa-sample.geojson"
        : adminLayer === "provincias"
          ? "/geojson/provincias-sample.geojson"
          : "/geojson/municipios-sample.geojson";
    void fetch(file)
      .then((r) => r.json())
      .then(setGeo)
      .catch(() => setGeo(null));
  }, [adminLayer, onLayerClick]);

  const heatBuckets = useMemo(() => {
    if (!heat) return [];
    return complaints.map((c) => ({
      ...c,
      intensity: Math.min(1, (c.votes_real + c.comments_count) / 30),
    }));
  }, [complaints, heat]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />

      {userPosition && (
        <>
          <CircleMarker
            center={[userPosition.lat, userPosition.lng]}
            radius={8}
            pathOptions={{ color: "#0284c7", fillColor: "#0ea5e9", fillOpacity: 1 }}
          >
            <Popup>Tu ubicación</Popup>
          </CircleMarker>
          <Circle
            center={[userPosition.lat, userPosition.lng]}
            radius={MAX_DISTANCE_M}
            pathOptions={{
              color: "#0ea5e9",
              fillColor: "#38bdf8",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6 6",
            }}
          />
        </>
      )}

      {geo && (
        <GeoJSON
          key={adminLayer}
          data={geo}
          style={() => ({
            color: "#0369a1",
            weight: 1.5,
            fillColor: "#7dd3fc",
            fillOpacity: 0.12,
          })}
          onEachFeature={(feature, layer) => {
            const name = (feature.properties as { name?: string })?.name ?? "Área";
            layer.on({
              click: () => onLayerClick(name),
              mouseover: () => onLayerClick(name),
            });
          }}
        />
      )}

      {heat
        ? heatBuckets.map((c) => (
            <Circle
              key={`h-${c.id}`}
              center={[c.lat, c.lng]}
              radius={200 + c.intensity * 600}
              pathOptions={{
                color: "transparent",
                fillColor: c.status === "resolved" ? "#10b981" : "#f97316",
                fillOpacity: 0.25 + c.intensity * 0.4,
              }}
              eventHandlers={{ click: () => onSelect(c) }}
            />
          ))
        : complaints.map((c) => (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lng]}
              radius={10}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor:
                  c.status === "resolved"
                    ? "#059669"
                    : CATEGORIES[c.category].color,
                fillOpacity: 0.95,
              }}
              eventHandlers={{ click: () => onSelect(c) }}
            >
              <Popup>
                <strong>{c.title}</strong>
                <br />
                {CATEGORIES[c.category].label}
              </Popup>
            </CircleMarker>
          ))}
    </MapContainer>
  );
}
