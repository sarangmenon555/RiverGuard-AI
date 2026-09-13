// One profile per chapter (8 chapters), describing where the 3D scene
// should sit emotionally and visually at that point in the story:
// intensity = rainfall visual intensity, water = how high the water plane
// rises, tint = the scene's color mood. Together these implement the
// deliberate calm -> rain -> escalation -> flood -> response -> reflection
// arc from the story brief, driven purely by scroll position.
export interface ChapterProfile {
  intensity: number;
  water: number;
  tint: string;
}

export const CHAPTER_PROFILES: ChapterProfile[] = [
  { intensity: 0.05, water: 0.0, tint: "#2dd4bf" }, // 01 Before the Water — calm
  { intensity: 0.35, water: 0.08, tint: "#38bdf8" }, // 02 The Rain Arrives
  { intensity: 0.5, water: 0.2, tint: "#38bdf8" }, // 03 Water Begins to Move
  { intensity: 0.7, water: 0.4, tint: "#fbbf24" }, // 04 August 2018 — escalation
  { intensity: 1.0, water: 0.9, tint: "#f87171" }, // 05 The Flood — peak
  { intensity: 0.55, water: 0.65, tint: "#fbbf24" }, // 06 People Respond — hope amid crisis
  { intensity: 0.3, water: 0.4, tint: "#94a3b8" }, // 07 The Scale of the Disaster — reflective
  { intensity: 0.08, water: 0.1, tint: "#2dd4bf" }, // 08 What We Learned — calm returns
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/**
 * Maps a 0..1 overall scroll progress across the whole story to the
 * current chapter index, fractional in-chapter progress, and
 * interpolated intensity/water/tint values.
 */
export function getFloodSceneData(scrollProgress: number) {
  const clamped = Math.min(Math.max(scrollProgress, 0), 0.9999);
  const chapterFloat = clamped * CHAPTER_PROFILES.length;
  const chapterIndex = Math.floor(chapterFloat);
  const pageProgress = chapterFloat - chapterIndex;

  const current = CHAPTER_PROFILES[chapterIndex];
  const next = CHAPTER_PROFILES[Math.min(chapterIndex + 1, CHAPTER_PROFILES.length - 1)];

  return {
    chapterIndex,
    pageProgress,
    intensity: current.intensity + (next.intensity - current.intensity) * pageProgress,
    waterLevel: current.water + (next.water - current.water) * pageProgress,
    tint: lerpColor(current.tint, next.tint, pageProgress),
  };
}
