"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { fetchDashboard, fetchLocations } from "@/lib/api";
import RainHero from "@/components/RainHero";
import KeralamGeoMap from "@/components/KeralamGeoMap";
import MapEmergence from "@/components/MapEmergence";
import RainfallOverlay from "@/components/RainfallOverlay";
import DistrictIntelligencePanel from "@/components/DistrictIntelligencePanel";
import { ArrowDown, ShieldAlert, CloudRain } from "lucide-react";

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapRevealed, setMapRevealed] = useState(false);
  const [showRainfall, setShowRainfall] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const mapSectionInView = useInView(mapSectionRef, {
    once: true,
    margin: "-120px",
  });

  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: Infinity,
  });

  const { data: dashboard, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const districts = locationsData?.districts ?? [];
  const predictionsById: Record<string, any> = {};
  dashboard?.districts.forEach((d) => {
    predictionsById[d.district_id] = d;
  });

  const selectedDistrict = districts.find((d) => d.id === selectedId);

  return (
    <div>
      <RainHero>
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aqua-400/80">
          RiverGuard AI
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
          Rain becomes water.
          <br />
          <span className="text-aqua-400">Water becomes understanding.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-slate-300">
          RiverGuard AI turns live rainfall and river data across Keralam into
          a clear, district-level picture of flood risk — before it becomes
          an emergency.
        </p>
        <a
          href="#water-section"
          className="mt-10 flex flex-col items-center text-xs text-slate-400 transition hover:text-aqua-400"
        >
          Scroll to find your district
          <ArrowDown className="mt-2 h-4 w-4 animate-bounce" />
        </a>
      </RainHero>

      <section id="water-section" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            How much water is in your district?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Select any district on the real map of Keralam to see its current
            rainfall, river level, and flood risk — explained in plain
            language by RiverGuard AI.
          </p>
          <div className="mt-3 text-xs text-slate-500">
            {dataUpdatedAt
              ? `Live data updated ${new Date(dataUpdatedAt).toLocaleTimeString()}${
                  isFetching ? " · refreshing…" : ""
                }`
              : "Loading live data…"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3" ref={mapSectionRef}>
            {districts.length > 0 && mapSectionInView ? (
              mapRevealed ? (
                <div className="relative">
                  <KeralamGeoMap
                    districts={districts}
                    predictions={predictionsById}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                  {showRainfall && <RainfallOverlay />}
                  <button
                    onClick={() => setShowRainfall((v) => !v)}
                    className={`absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium backdrop-blur transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua-400 ${
                      showRainfall
                        ? "border-aqua-400/50 bg-aqua-500/20 text-aqua-300"
                        : "border-aqua-500/25 bg-navy-950/80 text-slate-300 hover:border-aqua-400/40"
                    }`}
                  >
                    <CloudRain className="h-3.5 w-3.5" />
                    Live rainfall overlay
                  </button>
                </div>
              ) : (
                <div className="relative h-[640px] w-full overflow-hidden rounded-3xl border border-aqua-500/15 bg-navy-950">
                  <MapEmergence
                    height={640}
                    onComplete={() => setMapRevealed(true)}
                  />
                  <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-500">
                    Forming the map of Keralam from live rainfall data…
                  </p>
                </div>
              )
            ) : (
              <div className="flex h-[640px] items-center justify-center rounded-3xl border border-aqua-500/15 bg-navy-950 text-slate-500">
                Loading the map of Keralam…
              </div>
            )}
            {showRainfall && mapRevealed && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Live rainfall intensity sampled across Keralam via Open-Meteo — a real-time approximation, not raw satellite imagery.
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedDistrict ? (
              <DistrictIntelligencePanel
                district={selectedDistrict}
                prediction={predictionsById[selectedDistrict.id]}
                allPredictions={dashboard?.districts ?? []}
              />
            ) : (
              <div className="glass-panel flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl p-8 text-center text-slate-400">
                <p>Select a district on the map to see its current flood risk.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="glass-panel rounded-3xl border border-aqua-500/15 p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-aqua-400/80">
            History
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Know more about the 2018 Kerala Floods
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            The event that showed Keralam why real-time, district-level flood
            intelligence matters. Step through what happened, how it unfolded,
            and what was learned.
          </p>
          <Link
            href="/floods-2018"
            className="mt-8 inline-block rounded-full bg-aqua-500 px-8 py-3 font-semibold text-navy-950 transition hover:bg-aqua-400"
          >
            Enter the 2018 Kerala Floods story
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-4xl px-6 pb-16">
        <div className="flex items-start gap-3 rounded-2xl border border-aqua-500/10 bg-navy-900/50 p-5 text-xs leading-relaxed text-slate-500">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-aqua-500/70" />
          <p>
            Risk predictions are generated from a machine learning model
            trained on physics-informed synthetic data modelled after
            historical flood patterns. This platform is a decision-support
            tool and does not replace official warnings issued by the Kerala
            State Disaster Management Authority.
          </p>
        </div>
      </footer>
    </div>
  );
}
