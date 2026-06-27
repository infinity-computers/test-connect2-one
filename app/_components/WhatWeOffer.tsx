"use client";

import { motion } from "motion/react";
import {
  Wifi,
  ClipboardList,
  Tv2,
  Router,
  BadgeIndianRupee,
  Headphones,
} from "lucide-react";

const offerings = [
  {
    icon: Wifi,
    title: "High-Speed Internet",
    desc: "Fiber-backed plans from 40 to 300 Mbps — stable, fast, and built for homes and businesses in Bharuch.",
    accent: "cyan",
  },
  {
    icon: ClipboardList,
    title: "Online Service Requests",
    desc: "Raise, track, and follow up on service requests directly from the website — no calls, no waiting on hold.",
    accent: "blue",
  },
  {
    icon: Tv2,
    title: "OTT Subscriptions",
    desc: "Get popular streaming apps bundled with select plans — entertainment sorted alongside your connection.",
    accent: "violet",
  },
  {
    icon: Router,
    title: "Free Router",
    desc: "A dual-band router is yours to use at no extra cost for as long as your plan stays active.",
    accent: "cyan",
  },
  {
    icon: BadgeIndianRupee,
    title: "Affordable Plans",
    desc: "Transparent pricing with no hidden renewal fees. Pick a plan that fits your usage and budget.",
    accent: "blue",
  },
  {
    icon: Headphones,
    title: "Local Support",
    desc: "A Bharuch-based team handles onboarding, installation, and follow-ups — people who know the area.",
    accent: "violet",
  },
];

const accentMap = {
  cyan: {
    icon: "border-cyan-200/15 bg-cyan-300/[0.08] text-cyan-200",
    tag: "border-cyan-200/15 bg-cyan-300/[0.06] text-cyan-300",
    glow: "rgba(34,211,238,0.07)",
    hover:
      "hover:border-cyan-200/30 hover:shadow-[0_16px_48px_rgba(34,211,238,0.09)]",
  },
  blue: {
    icon: "border-blue-300/15 bg-blue-400/[0.08] text-blue-200",
    tag: "border-blue-300/15 bg-blue-400/[0.06] text-blue-300",
    glow: "rgba(59,130,246,0.09)",
    hover:
      "hover:border-blue-300/28 hover:shadow-[0_16px_48px_rgba(59,130,246,0.09)]",
  },
  violet: {
    icon: "border-violet-300/15 bg-violet-400/[0.08] text-violet-200",
    tag: "border-violet-300/15 bg-violet-400/[0.06] text-violet-300",
    glow: "rgba(139,92,246,0.08)",
    hover:
      "hover:border-violet-300/28 hover:shadow-[0_16px_48px_rgba(139,92,246,0.09)]",
  },
};

export default function WhatWeOffer() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(34,211,238,0.05),transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-14 max-w-xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
            What we offer
          </p>
          <h2 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            Everything you need,{" "}
            <span className="text-slate-400">nothing you don't.</span>
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400">
            Connect One keeps broadband simple — fast internet, honest pricing,
            and real local support in Bharuch.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((item, i) => {
            const a = accentMap[item.accent as keyof typeof accentMap];
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.07,
                  ease: "easeOut",
                }}
                className={`group relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#060f1c]/80 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${a.hover}`}
              >
                {/* Per-card glow */}
                <div
                  className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at 20% 20%, ${a.glow}, transparent 60%)`,
                  }}
                />

                {/* Icon */}
                <div
                  className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${a.icon}`}
                >
                  <Icon size={20} />
                </div>

                {/* Text */}
                <h3 className="text-base font-black tracking-[-0.02em] text-white">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-400">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
