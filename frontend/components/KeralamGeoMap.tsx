"use client";

import { useMemo, useState } from "react";
import { type GeoPermissibleObjects } from "d3-geo";
import { motion, useReducedMotion } from "framer-motion";
import type { District, DistrictPrediction } from "@/lib/api";
import {
  getDistrictFeatureCollection,
  createMapProjection,
} from "@/lib/keralaGeoJSON";

const RISK_COLOR: Record<string, string> = {
  Low: "#2dd4bf",
  Medium: "#fbbf24",
  High: "#f87171",
};

export const MAP_VIEW_W = 420;
export const MAP_VIEW_H = 680;
export const MAP_PADDING = 20;

interface Props {
  districts: District[];
  predictions: Record<string, DistrictPrediction>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function KeralamGeoMap({
  districts,
  predictions,
  selectedId,
  onSelect,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { districtCollection, pathGenerator, stateFeature } = useMemo(() => {
    const districtCollection = getDistrictFeatureCollection();
    const { pathGenerator, stateFeature } = createMapProjection(
      MAP_VIEW_W,
      MAP_VIEW_H,
      MAP_PADDING
    );
    return { districtCollection, pathGenerator, stateFeature };
  }, []);

  const transform = useMemo(() => {
    if (!selectedId) return "translate(0px, 0px) scale(1)";
    const feature = districtCollection.features.find(
      (f) => f.properties.id === selectedId
    );
    if (!feature) return "translate(0px, 0px) scale(1)";

    const bounds = pathGenerator.bounds(feature as GeoPermissibleObjects);
    const [[x0, y0], [x1, y1]] = bounds;
    const bw = Math.max(x1 - x0, 1);
    const bh = Math.max(y1 - y0, 1);
    const scale = Math.min((MAP_VIEW_W * 0.72) / bw, (MAP_VIEW_H * 0.72) / bh, 6);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const tx = MAP_VIEW_W / 2 - scale * cx;
    const ty = MAP_VIEW_H / 2 - scale * cy;
    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, [selectedId, districtCollection, pathGenerator]);

  function handleKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-aqua-500/15 bg-navy-950">
      {selectedId && (
        <button
          onClick={() => onSelect(null)}
          className="absolute left-4 top-4 z-20 rounded-full border border-aqua-400/40 bg-navy-950/80 px-4 py-2 text-xs font-medium text-aqua-300 backdrop-blur transition hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua-400"
        >
          Select another district
        </button>
      )}

      <svg
        viewBox={`0 0 ${MAP_VIEW_W} ${MAP_VIEW_H}`}
        className="h-[640px] w-full"
        role="img"
        aria-label="Interactive geographic map of Keralam and its 14 districts. Use the district list below for keyboard and screen reader navigation."
      >
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#0f1e3a" />
            <stop offset="100%" stopColor="#050b16" />
          </radialGradient>
        </defs>
        <rect width={MAP_VIEW_W} height={MAP_VIEW_H} fill="url(#mapGlow)" />

        <g
          style={{
            transform,
            transformOrigin: "0px 0px",
            transition: prefersReducedMotion
              ? "none"
              : "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <motion.path
            d={pathGenerator(stateFeature as GeoPermissibleObjects) ?? ""}
            fill="none"
            stroke="rgba(45,212,191,0.25)"
            strokeWidth={1 / (selectedId ? 3 : 1)}
            initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1.4, ease: "easeInOut" }}
          />

          {districtCollection.features.map((feature, i) => {
            const id = feature.properties.id;
            const district = districts.find((d) => d.id === id);
            if (!district) return null;
            const pred = predictions[id];
            const risk = pred?.risk_class ?? "Low";
            const color = RISK_COLOR[risk];
            const isSelected = selectedId === id;
            const isHovered = hovered === id || focused === id;
            const isDimmed = selectedId !== null && !isSelected;
            const targetOpacity = isDimmed ? 0.08 : isHovered || isSelected ? 0.6 : 0.32;

            return (
              <motion.path
                key={id}
                d={pathGenerator(feature as GeoPermissibleObjects) ?? ""}
                fill={color}
                stroke={color}
                strokeOpacity={isDimmed ? 0.15 : 0.9}
                strokeWidth={(isSelected ? 1.6 : 0.8) / (selectedId ? 3 : 1)}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.5,
                  delay: prefersReducedMotion ? 0 : 0.3 + i * 0.03,
                }}
                style={{
                  fillOpacity: targetOpacity,
                  cursor: "pointer",
                  transition: "fill-opacity 0.2s ease, stroke-opacity 0.2s ease",
                }}
                onClick={() => onSelect(id)}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setFocused(id)}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => handleKeyDown(e, id)}
                tabIndex={0}
                role="button"
                aria-label={`${district.name}, ${risk} flood risk. Press Enter to view details.`}
              />
            );
          })}
        </g>

        {!selectedId &&
          districtCollection.features.map((feature) => {
            const id = feature.properties.id;
            const district = districts.find((d) => d.id === id);
            if (!district) return null;
            const [x, y] = pathGenerator.centroid(feature as GeoPermissibleObjects);
            const isActive = hovered === id || focused === id;
            if (!isActive) return null;

            return (
              <g key={`${id}-label`} transform={`translate(${x}, ${y})`} style={{ pointerEvents: "none" }}>
                <rect
                  x={-district.name.length * 3}
                  y={-26}
                  width={district.name.length * 6}
                  height={18}
                  rx={5}
                  fill="#0a1428"
                  stroke="rgba(45,212,191,0.4)"
                />
                <text
                  x={0}
                  y={-13}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#e2f4f1"
                  fontFamily="Inter, sans-serif"
                >
                  {district.name}
                </text>
              </g>
            );
          })}
      </svg>

      <DistrictListFallback
        districts={districts}
        predictions={predictions}
        onSelect={onSelect}
      />
    </div>
  );
}

function DistrictListFallback({
  districts,
  predictions,
  onSelect,
}: {
  districts: District[];
  predictions: Record<string, DistrictPrediction>;
  onSelect: (id: string) => void;
}) {
  return (
    <details className="border-t border-aqua-500/10 px-4 py-3">
      <summary className="cursor-pointer text-xs text-slate-400 hover:text-aqua-400">
        Browse all districts as a list
      </summary>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {districts.map((d) => {
          const risk = predictions[d.id]?.risk_class ?? "Low";
          return (
            <li key={d.id}>
              <button
                onClick={() => onSelect(d.id)}
                className="w-full rounded-lg border border-aqua-500/15 bg-navy-900/60 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-aqua-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua-400"
              >
                {d.name}
                <span className="ml-1 text-slate-500">· {risk}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
