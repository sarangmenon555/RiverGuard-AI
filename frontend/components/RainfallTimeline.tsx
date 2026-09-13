"use client";

import { useState } from "react";

const STAGES = [
  { label: "Early Aug 2018", intensity: 22, desc: "Normal monsoon rainfall across Keralam." },
  { label: "Aug 8", intensity: 40, desc: "Rainfall begins intensifying over the Western Ghats catchments." },
  { label: "Aug 9–10", intensity: 58, desc: "Reservoirs across the state approach full capacity." },
  { label: "Aug 15", intensity: 78, desc: "Extremely heavy rainfall recorded across multiple districts." },
  { label: "Aug 16–17", intensity: 100, desc: "Peak rainfall period — the most critical days of the crisis." },
];

export default function RainfallTimeline() {
  const [step, setStep] = useState(0);
  const stage = STAGES[step];

  return (
    <div className="glass-panel rounded-2xl border border-aqua-500/15 p-6">
      <div className="mb-4 flex h-28 items-end gap-1.5">
        {STAGES.map((s, i) => (
          <div
            key={s.label}
            className="flex-1 rounded-t transition-all duration-500"
            style={{
              height: `${s.intensity}%`,
              backgroundColor:
                i <= step ? "rgba(45, 212, 191, 0.7)" : "rgba(45, 212, 191, 0.12)",
            }}
          />
        ))}
      </div>

      <input
        type="range"
        min={0}
        max={STAGES.length - 1}
        step={1}
        value={step}
        onChange={(e) => setStep(Number(e.target.value))}
        className="w-full accent-aqua-400"
        aria-label="Scrub through the rainfall intensification timeline"
      />

      <div className="mt-4">
        <div className="text-sm font-semibold text-aqua-400">{stage.label}</div>
        <p className="mt-1 text-sm text-slate-300">{stage.desc}</p>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Illustrative representation of how rainfall intensified through
        August 2018, not exact measured values.
      </p>
    </div>
  );
}
