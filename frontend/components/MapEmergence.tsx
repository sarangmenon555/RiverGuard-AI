"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  opacity: number;
}

export default function MapEmergence({
  height = 640,
  onComplete,
}: {
  height?: number;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;

    const particles: Particle[] = Array.from({ length: 90 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 260;
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY - height * 0.35 + Math.random() * 60,
        targetX: centerX + (Math.random() - 0.5) * 200,
        targetY: centerY + (Math.random() - 0.5) * 300,
        speed: 0.02 + Math.random() * 0.02,
        opacity: 0.4 + Math.random() * 0.4,
      };
    });

    let raf: number;
    const start = performance.now();
    const duration = 1600;

    function frame(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        const x = p.x + (p.targetX - p.x) * (1 - Math.pow(1 - t, 3));
        const y = p.y + (p.targetY - p.y) * (1 - Math.pow(1 - t, 3));
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(45, 212, 191, ${p.opacity * (1 - t)})`;
        ctx!.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        onComplete();
      }
    }
    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ height }}
      aria-hidden="true"
    />
  );
}
