"use client";

import type { District, DistrictPrediction } from "@/lib/api";
import { AlertTriangle, Droplets, TrendingUp } from "lucide-react";

const RISK_STYLES: Record<string, string> = {
  Low: "text-riskLow border-riskLow/40 bg-riskLow/10",
  Medium: "text-riskMedium border-riskMedium/40 bg-riskMedium/10",
  High: "text-riskHigh border-riskHigh/40 bg-riskHigh/10 shadow-glowRed",
};

export default function DistrictCard({
  district,
  prediction,
}: {
  district: District;
  prediction?: DistrictPrediction;
}) {
  if (!prediction) {
    return (
      <div className="glass-panel animate-pulse rounded-2xl p-6">
        <div className="h-6 w-40 rounded bg-navy-700" />
        <div className="mt-4 h-4 w-full rounded bg-navy-700" />
      </div>
    );
  }

  const style = RISK_STYLES[prediction.risk_class];

  return (
    <div className={`glass-panel rounded-2xl border p-6 ${style}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{district.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{district.risk_factor}</p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-sm font-bold ${style}`}>
          {prediction.risk_class}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Droplets className="h-4 w-4 text-aqua-400" />
          Rain 24h: {(prediction.raw_features.rain_24h as number).toFixed(1)} mm
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <TrendingUp className="h-4 w-4 text-aqua-400" />
          Rain 72h: {(prediction.raw_features.rain_72h as number).toFixed(1)} mm
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <AlertTriangle className="h-4 w-4 text-aqua-400" />
          River level: {((prediction.raw_features.river_level_ratio as number) * 100).toFixed(0)}%
        </div>
        <div className="text-slate-300">
          Confidence: {(prediction.confidence * 100).toFixed(0)}%
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
          Recommended actions
        </p>
        <ul className="space-y-1 text-sm text-slate-200">
          {prediction.recommended_actions.slice(0, 3).map((a, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-aqua-400">→</span>
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
