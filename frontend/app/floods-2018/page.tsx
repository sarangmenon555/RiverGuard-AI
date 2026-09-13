"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Chapter from "@/components/Chapter";
import RainfallTimeline from "@/components/RainfallTimeline";
import HydrologyChain from "@/components/HydrologyChain";
import AnimatedCounter from "@/components/AnimatedCounter";
import FloodStoryCanvas, { type FloodStoryFrameData } from "@/components/FloodStoryCanvas";
import { getFloodSceneData } from "@/lib/floodScrollProfile";
import { ArrowDown, ShieldAlert } from "lucide-react";

const TIMELINE_EVENTS = [
  {
    date: "Early August 2018",
    text: "Sustained monsoon rainfall across Keralam pushes reservoir levels steadily upward.",
  },
  {
    date: "August 8–9",
    text: "Rainfall intensifies sharply over the Western Ghats catchments feeding Keralam's major rivers.",
  },
  {
    date: "Mid-August",
    text: "Water levels in the Pamba river and several other rivers rise well beyond danger levels within a very short window.",
  },
  {
    date: "August 15–17",
    text: "Reservoirs across the state approach or reach full capacity. Dam authorities open shutters at a large number of dams in close succession, releasing water downstream.",
  },
  {
    date: "August 17–20",
    text: "Widespread flooding affects all 14 districts of Keralam simultaneously. Rescue and relief operations scale up across the state.",
  },
];

export default function Floods2018Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneDataRef = useRef<FloodStoryFrameData>({
    intensity: 0.05,
    pageProgress: 0,
    waterLevel: 0,
    tint: "#2dd4bf",
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const data = getFloodSceneData(v);
    sceneDataRef.current = data;
  });

  return (
    <div ref={containerRef} className="relative">
      <FloodStoryCanvas dataRef={sceneDataRef} />

      <div className="relative z-10">
        <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-aqua-400/80">
              An interactive history
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold text-white md:text-6xl">
              The 2018 Kerala Floods
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-slate-400">
              The event that showed Keralam, and the country, why understanding
              water in real time matters. Scroll to walk through what happened
              — the scene behind this story moves with you.
            </p>
            <ArrowDown className="mx-auto mt-8 h-5 w-5 animate-bounce text-aqua-400" />
          </motion.div>
        </section>

        <Chapter number="01" title="Before the Water">
          <p className="leading-relaxed text-slate-300">
            Keralam is a narrow strip of land wedged between the Arabian Sea
            and the Western Ghats, one of the wettest mountain ranges in the
            world. Its geography is defined by water: 44 rivers, most of them
            short and fast-flowing, drain the steep Ghats and rush toward the
            coast in a matter of hours rather than days.
          </p>
          <p className="mt-4 leading-relaxed text-slate-300">
            This geography supports dense settlement along riverbanks and
            low-lying backwater regions such as Kuttanad in Alappuzha, some of
            which lie at or below sea level. A network of dams and reservoirs —
            built over decades for irrigation and hydropower — sits upstream of
            these settlements, managing water that would otherwise reach
            populated areas almost immediately after heavy rain.
          </p>
          <p className="mt-4 leading-relaxed text-slate-300">
            Every monsoon season, Keralam receives enormous rainfall as a
            matter of course. In most years, this system holds. In 2018, it
            did not.
          </p>
        </Chapter>

        <Chapter number="02" title="The Rain Arrives" className="max-w-5xl">
          <p className="leading-relaxed text-slate-300">
            Through late July and into August 2018, rainfall across Keralam
            moved from heavy to extraordinary. Scrub through the period below
            to see how the situation intensified — and notice the rain
            behind this page picking up too.
          </p>
          <div className="mt-6">
            <RainfallTimeline />
          </div>
        </Chapter>

        <Chapter number="03" title="Water Begins to Move">
          <p className="leading-relaxed text-slate-300">
            Rainfall on the Western Ghats does not stay where it falls. It
            moves through a physical chain — from catchment, into streams,
            into rivers, and into reservoirs built to hold it back. When
            rainfall is too heavy for too long, every stage of that chain
            reaches its limit at nearly the same time.
          </p>
          <HydrologyChain />
          <p className="leading-relaxed text-slate-300">
            That is what made 2018 different from an ordinary monsoon: the
            entire chain, across nearly every river basin in the state, was
            pushed to its limit simultaneously.
          </p>
        </Chapter>

        <Chapter number="04" title="August 2018" className="max-w-5xl">
          <p className="mb-8 leading-relaxed text-slate-300">
            The critical period of the crisis unfolded over roughly two weeks.
            This is a general sequence of how the situation escalated.
          </p>
          <div className="space-y-6">
            {TIMELINE_EVENTS.map((event, i) => (
              <motion.div
                key={event.date}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex gap-4 border-l-2 border-aqua-500/30 pl-5"
              >
                <div>
                  <div className="text-sm font-semibold text-aqua-400">
                    {event.date}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{event.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Chapter>

        <Chapter number="05" title="The Flood">
          <p className="leading-relaxed text-slate-300">
            By the middle of August, flooding affected all 14 districts of
            Keralam simultaneously — an event of a scale not seen in the state
            in a century. Roads, railway lines, and the state's main airport in
            Kochi were disrupted or shut down. Entire settlements in low-lying
            districts such as Alappuzha, Kottayam, and Pathanamthitta were
            submerged. Communication networks in the worst-affected areas were
            badly disrupted, making coordination between agencies and affected
            communities far harder.
          </p>
          <p className="mt-4 leading-relaxed text-slate-300">
            This was not a single flood in a single place. It was a
            state-wide event unfolding across dozens of river systems at once
            — this is the peak of the story, and of the scene behind it.
          </p>
        </Chapter>

        <Chapter number="06" title="People Respond">
          <p className="leading-relaxed text-slate-300">
            What followed became one of the largest civilian rescue efforts in
            the country's recent history. Fishermen from Keralam's coastal
            communities brought their own boats inland, often at real personal
            risk, and are widely credited with rescuing a very large number of
            stranded people. The Indian Armed Forces, Coast Guard, National
            Disaster Response Force, and Keralam's own state agencies ran
            large-scale rescue and evacuation operations across the state.
          </p>
          <p className="mt-4 leading-relaxed text-slate-300">
            Alongside official response, an enormous volunteer effort emerged —
            community kitchens, relief camps organised by local residents and
            religious institutions, and a wave of donations and support from
            across India and the Keralam diaspora abroad.
          </p>
        </Chapter>

        <Chapter number="07" title="The Scale of the Disaster">
          <p className="mb-8 leading-relaxed text-slate-300">
            Widely reported figures from official assessments and contemporary
            coverage of the 2018 Kerala Floods give a sense of the scale.
            These are approximate figures as commonly reported, not
            precision-audited statistics.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatBlock value={483} label="Lives lost" />
            <StatBlock value={5400000} label="People displaced" suffix="" formatLarge />
            <StatBlock value={150000} label="Houses damaged or destroyed" suffix="+" />
            <StatBlock value={14} label="of 14 districts affected" />
            <StatBlock value={26} label="years since Idukki dam shutters had last opened" />
            <StatBlock value={31000} label="crore (INR) in estimated economic damage" prefix="₹" suffix=" Cr" />
          </div>
        </Chapter>

        <Chapter number="08" title="What We Learned">
          <p className="leading-relaxed text-slate-300">
            The 2018 Kerala Floods exposed a specific, fixable gap: the
            distance between raw weather and reservoir data on one side, and a
            clear, local, actionable warning on the other. Rainfall figures
            and dam-release notices existed. What was missing was a system
            that could translate them, quickly and in plain language, into
            something a family in a specific ward could act on.
          </p>
          <p className="mt-4 leading-relaxed text-slate-300">
            Keralam's hydrology has not changed since 2018. The Western Ghats
            still receive extraordinary monsoon rainfall. Low-lying districts
            still sit close to sea level. What can change is how early, how
            clearly, and how specifically people are warned — which is the gap
            RiverGuard AI is built to close.
          </p>

          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-aqua-500/10 bg-navy-900/50 p-5 text-xs leading-relaxed text-slate-500">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-aqua-500/70" />
            <p>
              Risk predictions are generated from a machine learning model
              trained on physics-informed synthetic data modelled after
              historical flood patterns. This platform is a decision-support
              tool and does not replace official warnings issued by the Kerala
              State Disaster Management Authority.
            </p>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-block rounded-full bg-aqua-500 px-8 py-3 font-semibold text-navy-950 transition hover:bg-aqua-400"
            >
              Return to RiverGuard AI
            </Link>
          </div>
        </Chapter>
      </div>
    </div>
  );
}

function StatBlock({
  value,
  label,
  suffix = "",
  prefix = "",
  formatLarge = false,
}: {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  formatLarge?: boolean;
}) {
  return (
    <div className="rounded-xl border border-aqua-500/15 bg-navy-900/60 p-4 text-center">
      <div className="text-2xl font-bold text-aqua-400">
        {formatLarge ? (
          "5.4M"
        ) : (
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        )}
      </div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
