"use client";

import { useEffect, useRef, useState, memo } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Wifi,
  ArrowRight,
  Zap,
  Shield,
  Headphones,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface HeroSectionProps {
  onNavigate: (path: string) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CONFIG = {
  FIBER: {
    NODE_COUNT: 52,
    MAX_DISTANCE: 170,
    NODE_RADIUS: 1.35,
    OPACITY: 0.18,
    LINE_WIDTH: 0.5,
    SPEED: 0.65,
  },
} as const;

// ─── Data ────────────────────────────────────────────────────────────────────
const trustStats = [
  { value: "40–300", label: "Mbps Fiber" },
  { value: "3.5 TB", label: "Monthly FUP" },
  { value: "2 Mbps", label: "Post-FUP" },
  { value: "Local", label: "Support Team" },
];

const rotatingWords = [
  "streaming",
  "gaming",
  "working",
  "learning",
  "creating",
];

const features = [
  { icon: Zap, text: "Fast fiber plans" },
  { icon: Shield, text: "Transparent pricing" },
  { icon: Headphones, text: "Local support" },
];

// ─── Fiber Canvas ────────────────────────────────────────────────────────────
const FiberCanvas = memo(function FiberCanvas({
  disabled,
}: {
  disabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (disabled) return;

    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!context) return;

    let animId = 0;
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;

    const NODE_COUNT = CONFIG.FIBER.NODE_COUNT;
    const MAX_DIST = CONFIG.FIBER.MAX_DISTANCE;
    const NODE_RADIUS = CONFIG.FIBER.NODE_RADIUS;
    const OPACITY = CONFIG.FIBER.OPACITY;
    const LINE_WIDTH = CONFIG.FIBER.LINE_WIDTH;
    const SPEED = CONFIG.FIBER.SPEED;

    type NodePoint = {
      x: number;
      y: number;
      vx: number;
      vy: number;
    };

    let nodes: NodePoint[] = [];
    let width = 0;
    let height = 0;

    function createNodes() {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
      }));
    }

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createNodes();
    }

    function draw() {
      if (!isVisible) {
        animId = requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MAX_DIST) {
            const alpha = (1 - distance / MAX_DIST) * OPACITY;

            context.beginPath();
            context.moveTo(nodes[i].x, nodes[i].y);
            context.lineTo(nodes[j].x, nodes[j].y);
            context.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            context.lineWidth = LINE_WIDTH;
            context.stroke();
          }
        }
      }

      for (const node of nodes) {
        context.beginPath();
        context.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        context.fillStyle = "rgba(103, 232, 249, 0.48)";
        context.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    };

    resize();
    draw();

    const observer = new ResizeObserver(debouncedResize);

    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    window.addEventListener("resize", debouncedResize);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", debouncedResize);

      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [disabled, isVisible]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-55"
      aria-hidden="true"
    />
  );
});

FiberCanvas.displayName = "FiberCanvas";

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
      className="relative inline-flex h-[1.12em] min-w-[8.2ch] items-center justify-center overflow-hidden align-bottom"
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
          className="absolute inline-flex items-baseline justify-center"
        >
          <span className="relative bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-300 bg-clip-text px-1 text-transparent">
            {rotatingWords[currentIndex]}

            <span className="absolute inset-x-1 -bottom-[0.03em] h-[0.18em] rounded-full bg-cyan-300/10 blur-md" />
          </span>

          <span className="ml-2 text-white">.</span>
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
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: -3,
                    scale: 1.03,
                  }
            }
            className="group flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-4 py-2 backdrop-blur transition hover:border-cyan-200/25 hover:bg-white/[0.07]"
          >
            <Icon
              size={14}
              className="text-cyan-300 transition group-hover:text-cyan-200"
            />
            <span className="text-xs font-semibold text-slate-300">
              {feature.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
export default function HeroSection({ onNavigate }: HeroSectionProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
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
    hidden: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.96,
    },
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
      aria-label="Hero section with fiber internet plans"
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
      <FiberCanvas disabled={shouldReduceMotion} />
      <SoftParticles disabled={shouldReduceMotion} />

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
              Bharuch Fiber ISP
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            aria-label="Fiber internet built for streaming, gaming, working, learning, and creating."
            className="max-w-5xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Fiber internet built for <br className="hidden sm:block" />
            <RotatingText />
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-base leading-7 text-slate-300/90 sm:text-lg md:text-xl md:leading-8"
          >
            Premium broadband plans for Bharuch homes and businesses with clear
            pricing, generous FUP, local support, and a smooth connection
            experience.
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
              whileHover={
                shouldReduceMotion ? undefined : { y: -3, scale: 1.015 }
              }
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.28)] transition hover:bg-cyan-200 hover:shadow-[0_22px_72px_rgba(34,211,238,0.38)]"
            >
              <span className="absolute inset-0 translate-x-[-110%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition duration-700 group-hover:translate-x-[110%]" />

              <span className="relative z-10 flex items-center gap-2">
                <span>View Plans</span>
                <span className="hidden text-xs font-black opacity-65 sm:inline">
                  40–300 Mbps
                </span>

                <motion.span
                  animate={{
                    x: isPrimaryHovering && !shouldReduceMotion ? 5 : 0,
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
              whileHover={
                shouldReduceMotion ? undefined : { y: -3, scale: 1.015 }
              }
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-8 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-cyan-200/40 hover:bg-white/[0.09] hover:shadow-[0_18px_60px_rgba(15,23,42,0.35)]"
            >
              Book New Connection
            </motion.button>
          </motion.div>

          {/* Trust Stats */}
          <motion.div
            variants={scaleIn}
            className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {trustStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: shouldReduceMotion ? 0 : 0.5 + index * 0.08,
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -5,
                        scale: 1.025,
                      }
                }
                className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4 backdrop-blur transition hover:border-cyan-300/25 hover:bg-white/[0.07]"
              >
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent opacity-0 transition group-hover:opacity-100" />

                <p className="text-2xl font-black text-white transition group-hover:text-cyan-200">
                  {stat.value}
                </p>

                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
