"use client";

import { useEffect, useRef } from "react";

interface Drop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export default function RainHero({ children }: { children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    const dropCount = prefersReducedMotion
      ? 0
      : Math.min(140, Math.floor((width * height) / 9000));

    const drops: Drop[] = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 10 + Math.random() * 18,
      speed: 4 + Math.random() * 5,
      opacity: 0.15 + Math.random() * 0.25,
    }));

    function addRipple(x: number, y: number, strength = 1) {
      ripplesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius: 40 + strength * 30,
        opacity: 0.35,
      });
      if (ripplesRef.current.length > 24) ripplesRef.current.shift();
    }

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      if (Math.random() > 0.85) {
        addRipple(e.clientX - rect.left, e.clientY - rect.top, 0.5);
      }
    }

    function handlePointerDown(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      addRipple(e.clientX - rect.left, e.clientY - rect.top, 1.5);
    }

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);

    let raf: number;
    let lastTime = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 16.67, 2.5);
      lastTime = now;

      ctx!.clearRect(0, 0, width, height);

      ctx!.strokeStyle = "rgba(94, 234, 212, 0.35)";
      ctx!.lineWidth = 1;
      for (const d of drops) {
        ctx!.globalAlpha = d.opacity;
        ctx!.beginPath();
        ctx!.moveTo(d.x, d.y);
        ctx!.lineTo(d.x - 1.5, d.y + d.length);
        ctx!.stroke();

        d.y += d.speed * dt;
        d.x -= 0.4 * dt;
        if (d.y > height) {
          d.y = -d.length;
          d.x = Math.random() * width;
          if (Math.random() > 0.97) {
            addRipple(d.x, height - 4, 0.2);
          }
        }
      }
      ctx!.globalAlpha = 1;

      ripplesRef.current = ripplesRef.current.filter((r) => r.opacity > 0.01);
      for (const r of ripplesRef.current) {
        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(45, 212, 191, ${r.opacity})`;
        ctx!.lineWidth = 1.4;
        ctx!.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx!.stroke();
        r.radius += 1.4 * dt;
        r.opacity *= 0.965;
        if (r.radius > r.maxRadius) r.opacity = 0;
      }

      raf = requestAnimationFrame(frame);
    }

    if (!prefersReducedMotion) {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to top, rgba(20,184,166,0.14), transparent)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {children}
      </div>
    </div>
  );
}
