"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLocations, fetchHistorical } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function HistoryPage() {
  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: Infinity,
  });

  const [selected, setSelected] = useState("pta");

  const { data: history } = useQuery({
    queryKey: ["historical", selected],
    queryFn: () => fetchHistorical(selected, 7),
    enabled: !!selected,
  });

  const districts = locationsData?.districts ?? [];

  const chartData = history?.history?.map((h: any) => ({
    date: new Date(h.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    risk: Math.round(h.risk_score * 100),
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-white">7-Day Risk Trends</h1>
      <p className="mt-2 text-slate-400">
        Historical risk score movement per district across Keralam.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {districts.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelected(d.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              selected === d.id
                ? "border-aqua-400 bg-aqua-500/20 text-aqua-300"
                : "border-navy-600 text-slate-400 hover:border-aqua-500/40"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="glass-panel mt-6 rounded-2xl p-6">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,212,191,0.08)" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} unit="%" />
            <Tooltip
              contentStyle={{
                background: "#0a1428",
                border: "1px solid rgba(45,212,191,0.3)",
                borderRadius: 8,
                color: "#e2f4f1",
              }}
            />
            <Line
              type="monotone"
              dataKey="risk"
              stroke="#2dd4bf"
              strokeWidth={2.5}
              dot={{ fill: "#2dd4bf", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
