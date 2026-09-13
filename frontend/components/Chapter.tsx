"use client";

import { motion } from "framer-motion";

export default function Chapter({
  number,
  title,
  children,
  className = "",
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto max-w-4xl px-6 py-24 ${className}`}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-aqua-400/70">
        Chapter {number}
      </div>
      <h2 className="mb-8 text-3xl font-bold text-white md:text-4xl">{title}</h2>
      {children}
    </motion.section>
  );
}
