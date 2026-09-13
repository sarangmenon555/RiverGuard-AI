"use client";

import { motion } from "framer-motion";
import { CloudRain, Mountain, Waves, Container, AlertTriangle } from "lucide-react";

const STEPS = [
  { icon: CloudRain, label: "Rainfall" },
  { icon: Mountain, label: "Catchments" },
  { icon: Waves, label: "Rivers" },
  { icon: Container, label: "Reservoirs" },
  { icon: AlertTriangle, label: "Flooding" },
];

export default function HydrologyChain() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-6">
      {STEPS.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: i * 0.15 }}
          className="flex items-center gap-2"
        >
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-aqua-500/20 bg-navy-900/60 px-5 py-4">
            <step.icon className="h-6 w-6 text-aqua-400" />
            <span className="text-xs text-slate-300">{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <span className="text-aqua-500/50">&rarr;</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
