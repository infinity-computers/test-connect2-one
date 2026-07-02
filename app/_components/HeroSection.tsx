"use client";

import { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { Wifi, ArrowRight, Zap, Shield, Headphones } from "lucide-react";
import FiberCanvas from "../../components/ui/FiberCanvas";

// ─── Types ───────────────────────────────────────────────────────────────────
interface HeroSectionProps {
  onNavigate: (path: string) => void;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const trustStats = [
  { value: "500+", unit: "", label: "Customers served" },
  { value: "40–300", unit: "Mbps", label: "Fiber speeds" },
  { value: "3.5", unit: "TB", label: "Monthly FUP" },
  { value: "0", unit: "", label: "Hidden charges" },
];

const rotatingWords = [
  "streaming",
  "gaming",
  "working",
  "learning",
  "creating",
];

const features = [
  { icon: Zap, text: "Up to 300 Mbps" },
  { icon: Shield, text: "Clear FUP terms" },
  { icon: Headphones, text: "Human support" },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useIsLowEndDevice() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const cpuCores = navigator.hardwareConcurrency;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;

    const hasLowCoreCount = typeof cpuCores === "number" && cpuCores <= 4;
    const hasLowMemory = typeof deviceMemory === "number" && deviceMemory <= 2;

    setIsLowEnd(hasLowCoreCount || hasLowMemory);
  }, []);

  return isLowEnd;
}

// ─── Soft Particles ──────────────────────────────────────────────────────────
function SoftParticles({ disabled }: { disabled: boolean }) {
  const [particles, setParticles] = useState<
    {
      id: number;
      left: number;
      size: number;
      duration: number;
      delay: number;
      drift: number;
    }[]
  >([]);

  useEffect(() => {
    if (disabled) return;

    setParticles(
      Array.from({ length: 10 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 9 + Math.random() * 6,
        delay: Math.random() * 6,
        drift: Math.random() * 90 - 45,
      })),
    );
  }, [disabled]);

  if (disabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute bottom-[-20px] rounded-full bg-cyan-200/35 blur-[1px]"
          style={{
            left: `${particle.left}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: ["0vh", "-110vh"],
            x: [0, particle.drift, particle.drift * -0.35],
            opacity: [0, 0.55, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Rotating Text ───────────────────────────────────────────────────────────
// The container is inline-block with a fixed width so layout doesn't shift.
// vertical-align: baseline (default for inline-block) ensures the word sits
// on exactly the same baseline as "built for". The inner absolute span is
// positioned relative to the container's own line box — no padding hacks,
// no overflow clipping. The dot is inside the gradient span so it never
// gets orphaned and never gets clipped.
function RotatingText() {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <span
      className="relative inline-block min-w-[9ch] text-left"
      aria-hidden="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={rotatingWords[currentIndex]}
          initial={
            shouldReduceMotion
              ? false
              : { y: 28, opacity: 0, filter: "blur(8px)" }
          }
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={
            shouldReduceMotion
              ? undefined
              : { y: -28, opacity: 0, filter: "blur(8px)" }
          }
          transition={{
            duration: shouldReduceMotion ? 0 : 0.48,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-300 bg-clip-text px-1 text-transparent"
        >
          {rotatingWords[currentIndex]}.
          <span className="absolute inset-x-1 -bottom-[0.03em] h-[0.18em] rounded-full bg-cyan-300/10 blur-md" />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── Feature Pills ───────────────────────────────────────────────────────────
function FeaturePills() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {features.map((feature, index) => {
        const Icon = feature.icon;

        return (
          <motion.div
            key={feature.text}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.35 + index * 0.08,
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
            className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-4 py-2 backdrop-blur transition duration-300 hover:border-cyan-200/25 hover:bg-white/[0.065] hover:shadow-[0_8px_28px_rgba(34,211,238,0.08)]"
          >
            <Icon
              size={14}
              className="text-cyan-300 transition duration-300 group-hover:text-cyan-100 group-hover:drop-shadow-[0_0_8px_rgba(103,232,249,0.55)]"
            />
            <span className="text-xs font-semibold text-slate-300 transition duration-300 group-hover:text-slate-100">
              {feature.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Trust Stats ─────────────────────────────────────────────────────────────
// Divider lines replaced with mid-dot separators — they float above the grid
// visually without merging into it, and scale down cleanly on mobile.
function TrustStats() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-wrap items-center justify-center">
      {trustStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.5 + index * 0.08,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          className="group flex items-center"
        >
          <div className="flex flex-col items-center px-6 py-2">
            <p className="text-2xl font-black tracking-tight text-white transition duration-300 group-hover:text-cyan-100 group-hover:drop-shadow-[0_0_12px_rgba(103,232,249,0.18)]">
              {stat.value}
              {stat.unit ? (
                <span className="ml-0.5 text-sm font-bold text-slate-400 transition duration-300 group-hover:text-cyan-300/70">
                  {stat.unit}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition duration-300 group-hover:text-slate-400">
              {stat.label}
            </p>
          </div>
          {index < trustStats.length - 1 && (
            <span className="text-slate-600 select-none" aria-hidden="true">
              ·
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
export default function HeroSection({ onNavigate }: HeroSectionProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const isLowEnd = useIsLowEndDevice();
  const disableBackgroundMotion = shouldReduceMotion || isLowEnd;
  const [isPrimaryHovering, setIsPrimaryHovering] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.09,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.68,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const scaleIn: Variants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      className="relative min-h-[calc(100svh-4rem)] overflow-hidden border-b border-white/10 bg-[#020617]"
      aria-label="Hero section — Connect One Networks fiber internet"
    >
      {/* Base */}
      <div className="absolute inset-0 z-0 bg-[#020617]" />

      {/* Premium gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.22),transparent_32%),radial-gradient(circle_at_82%_14%,rgba(59,130,246,0.20),transparent_34%),linear-gradient(135deg,#030913_0%,#071527_46%,#020617_100%)]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 z-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:74px_74px] [mask-image:radial-gradient(circle_at_center,black_0%,black_48%,transparent_82%)]" />

      {/* Top glow */}
      <div className="absolute left-1/2 top-0 z-0 h-px w-[72vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

      {/* Background motion */}
      <FiberCanvas
        disabled={disableBackgroundMotion}
        opacity={0.55}
        nodeCount={52}
        mobileNodeCount={28}
        connectionDistance={170}
        speed={0.65}
        lineAlpha={0.18}
        nodeRadius={1.35}
        nodeOpacity={0.48}
        className="z-0"
      />
      <SoftParticles disabled={disableBackgroundMotion} />

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-t from-[#020617] via-[#020617]/70 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-5xl flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.035 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100 shadow-lg shadow-cyan-950/30 backdrop-blur">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_3px_rgba(34,211,238,0.42)]" />
              </span>
              <Wifi size={14} aria-hidden="true" />
              Connect One Networks · Bharuch
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            aria-label="Bharuch's own fiber network. Built for streaming, gaming, working, and more."
            className="max-w-5xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Fast, honest internet
            <br />
            that actually works.
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-base leading-7 text-slate-200/85 sm:text-lg md:text-xl md:leading-8"
          >
            No hidden charges. Clear FUP terms. Just solid fiber from a
            team you can actually call — right here in Bharuch.
          </motion.p>

          {/* Feature Pills */}
          <motion.div variants={scaleIn} className="mt-8">
            <FeaturePills />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
          >
            <motion.button
              type="button"
              onClick={() => onNavigate("/plans")}
              onHoverStart={() => setIsPrimaryHovering(true)}
              onHoverEnd={() => setIsPrimaryHovering(false)}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.28)] ring-1 ring-cyan-200/25 transition duration-300 hover:bg-cyan-200 hover:shadow-[0_20px_68px_rgba(34,211,238,0.36)] hover:ring-cyan-100/45"
            >
              <span className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-cyan-950/10 opacity-70 transition duration-300 group-hover:opacity-100" />
              <span className="absolute inset-0 translate-x-[-110%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-[110%]" />

              <span className="relative z-10 flex items-center gap-2">
                <span>See Plans</span>
                <motion.span
                  animate={{
                    x: isPrimaryHovering && !shouldReduceMotion ? 3 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                >
                  <ArrowRight size={17} aria-hidden="true" />
                </motion.span>
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onNavigate("/new-connection")}
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.035] px-8 py-4 text-sm font-bold text-slate-200 backdrop-blur-sm transition duration-300 hover:border-cyan-200/25 hover:bg-cyan-300/[0.045] hover:text-white hover:shadow-[0_12px_36px_rgba(15,23,42,0.24)]"
            >
              Book a Connection
            </motion.button>
          </motion.div>

          {/* Trust Stats — clean divider row, no cards */}
          <motion.div variants={scaleIn} className="mt-14">
            <TrustStats />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
