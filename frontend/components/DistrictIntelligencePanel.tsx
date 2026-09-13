"use client";

import { useEffect, useState } from "react";
import type { District, DistrictPrediction } from "@/lib/api";
import { getReportUrl } from "@/lib/api";
import {
  Droplets,
  Waves,
  Gauge,
  ChevronDown,
  ChevronUp,
  Bell,
  BellRing,
  FileDown,
  Container,
} from "lucide-react";
import ChatAssistant from "@/components/ChatAssistant";
import {
  followDistrict,
  unfollowDistrict,
  getFollowedDistricts,
} from "@/lib/push";

const RISK_STYLES: Record<string, { text: string; border: string; bg: string }> = {
  Low: { text: "text-riskLow", border: "border-riskLow/40", bg: "bg-riskLow/10" },
  Medium: { text: "text-riskMedium", border: "border-riskMedium/40", bg: "bg-riskMedium/10" },
  High: { text: "text-riskHigh", border: "border-riskHigh/50", bg: "bg-riskHigh/10" },
};

export default function DistrictIntelligencePanel({
  district,
  prediction,
  allPredictions,
}: {
  district: District;
  prediction?: DistrictPrediction;
  allPredictions: DistrictPrediction[];
}) {
  const [actionsOpen, setActionsOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followMessage, setFollowMessage] = useState<string | null>(null);

  useEffect(() => {
    setFollowing(getFollowedDistricts().includes(district.id));
    setFollowMessage(null);
  }, [district.id]);

  async function handleFollowToggle() {
    if (following) {
      unfollowDistrict(district.id);
      setFollowing(false);
      setFollowMessage(null);
      return;
    }
    const result = await followDistrict(district.id);
    if (result.ok) {
      setFollowing(true);
      setFollowMessage(null);
    } else {
      setFollowMessage(result.reason ?? "Could not enable notifications.");
    }
  }

  if (!prediction) {
    return (
      <div className="glass-panel animate-pulse rounded-2xl p-6">
        <div className="h-6 w-40 rounded bg-navy-700" />
        <div className="mt-4 h-32 w-full rounded bg-navy-700" />
      </div>
    );
  }

  const style = RISK_STYLES[prediction.risk_class];
  const rain24 = prediction.raw_features.rain_24h as number;
  const rain72 = prediction.raw_features.rain_72h as number;
  const riverLevel = prediction.raw_features.river_level_ratio as number;
  const reservoirPct = prediction.raw_features.reservoir_pct as number;
  const reservoirIsLive = Boolean(prediction.raw_features.reservoir_pct_is_live);

  const rain24Pct = Math.min((rain24 / 150) * 100, 100);
  const rain72Pct = Math.min((rain72 / 350) * 100, 100);
  const riverPct = Math.min(riverLevel * 100, 100);

  const activeAlerts = allPredictions.filter((p) => p.risk_class !== "Low");

  return (
    <div className="space-y-4">
      <div className={`glass-panel rounded-2xl border p-6 ${style.border} ${style.bg}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">{district.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{district.risk_factor}</p>
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-sm font-bold ${style.text} ${style.border}`}
          >
            {prediction.risk_class}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <BarStat
            icon={<Droplets className="h-4 w-4 text-aqua-400" />}
            label="Rainfall — last 24 hours"
            value={`${rain24.toFixed(1)} mm`}
            percent={rain24Pct}
          />
          <BarStat
            icon={<Droplets className="h-4 w-4 text-aqua-400" />}
            label="Rainfall — last 72 hours"
            value={`${rain72.toFixed(1)} mm`}
            percent={rain72Pct}
          />
          <BarStat
            icon={<Waves className="h-4 w-4 text-aqua-400" />}
            label="River level (estimated)"
            value={`${riverPct.toFixed(0)}% of bank-full`}
            percent={riverPct}
          />
          <BarStat
            icon={<Container className="h-4 w-4 text-aqua-400" />}
            label={`Nearest reservoir storage — ${reservoirIsLive ? "live" : "estimated"}`}
            value={`${reservoirPct.toFixed(0)}% of capacity`}
            percent={Math.min(reservoirPct, 100)}
          />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Gauge className="h-4 w-4 text-aqua-400" />
            Model confidence: {(prediction.confidence * 100).toFixed(0)}%
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          <button
            onClick={handleFollowToggle}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua-400 ${
              following
                ? "border-aqua-400/60 bg-aqua-500/20 text-aqua-300"
                : "border-aqua-500/25 text-slate-300 hover:border-aqua-400/40"
            }`}
          >
            {following ? (
              <BellRing className="h-3.5 w-3.5" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
            {following ? "Following this district" : "Follow this district"}
          </button>

          <a
            href={getReportUrl(district.id)}
            className="flex items-center gap-1.5 rounded-full border border-aqua-500/25 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-aqua-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua-400"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download PDF report
          </a>
        </div>
        {followMessage && (
          <p className="mt-2 text-xs text-slate-500">{followMessage}</p>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <button
          onClick={() => setActionsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-semibold text-white">Recommended actions</span>
          {actionsOpen ? (
            <ChevronUp className="h-4 w-4 text-aqua-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-aqua-400" />
          )}
        </button>
        {actionsOpen && (
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {prediction.recommended_actions.map((a, i) => (
              <li key={i} className="flex gap-2 border-l-2 border-aqua-400/60 pl-3">
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <h3 className="mb-2 font-semibold text-white">Live Alert Feed</h3>
        {activeAlerts.length === 0 ? (
          <p className="text-sm text-slate-400">
            No active medium or high risk alerts across Keralam right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeAlerts.map((a) => (
              <li
                key={a.district_id}
                className={`rounded-lg border-l-4 px-3 py-2 text-sm ${
                  a.risk_class === "High"
                    ? "border-riskHigh bg-riskHigh/10 text-red-200"
                    : "border-riskMedium bg-riskMedium/10 text-amber-100"
                }`}
              >
                <span className="font-semibold">{a.district_name}</span> —{" "}
                {a.risk_class} risk
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-semibold text-white">Ask RiverGuard AI</span>
          {chatOpen ? (
            <ChevronUp className="h-4 w-4 text-aqua-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-aqua-400" />
          )}
        </button>
        {!chatOpen && (
          <p className="mt-2 text-sm text-slate-400">
            Ask about current flood risk anywhere in Keralam — for example,
            &quot;why is {district.name} at {prediction.risk_class.toLowerCase()} risk?&quot;
          </p>
        )}
        {chatOpen && (
          <div className="mt-3">
            <ChatAssistant
              districtName={district.name}
              dashboard={{
                generated_at: prediction.timestamp,
                summary: {
                  high_risk_count: allPredictions.filter((p) => p.risk_class === "High").length,
                  medium_risk_count: allPredictions.filter((p) => p.risk_class === "Medium").length,
                  low_risk_count: allPredictions.filter((p) => p.risk_class === "Low").length,
                },
                districts: allPredictions,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function BarStat({
  icon,
  label,
  value,
  percent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-slate-200">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-navy-700/60">
        <div
          className="h-full rounded-full bg-aqua-400 transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
