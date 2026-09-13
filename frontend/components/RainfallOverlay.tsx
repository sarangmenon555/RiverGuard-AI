"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRainfallGrid } from "@/lib/api";
import { createMapProjection } from "@/lib/keralaGeoJSON";
import { MAP_VIEW_W, MAP_VIEW_H, MAP_PADDING } from "./KeralamGeoMap";

function intensityColor(mm: number): string {
  if (mm < 5) return "rgba(45, 212, 191, 0.10)";
  if (mm < 20) return "rgba(45, 212, 191, 0.28)";
  if (mm < 50) return "rgba(59, 130, 246, 0.35)";
  if (mm < 90) return "rgba(251, 191, 36, 0.4)";
  return "rgba(248, 113, 113, 0.5)";
}

export default function RainfallOverlay() {
  const { data } = useQuery({
    queryKey: ["rainfall-grid"],
    queryFn: fetchRainfallGrid,
    refetchInterval: 10 * 60 * 1000,
  });

  const { projection } = useMemo(
    () => createMapProjection(MAP_VIEW_W, MAP_VIEW_H, MAP_PADDING),
    []
  );

  if (!data) return null;

  return (
    <svg
      viewBox={`0 0 ${MAP_VIEW_W} ${MAP_VIEW_H}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <filter id="rainBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <g filter="url(#rainBlur)">
        {data.points.map((p, i) => {
          const coords = projection([p.lon, p.lat]);
          if (!coords) return null;
          const [x, y] = coords;
          const radius = 26 + Math.min(p.rain_24h, 100) * 0.9;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={radius}
              fill={intensityColor(p.rain_24h)}
            />
          );
        })}
      </g>
    </svg>
  );
}
