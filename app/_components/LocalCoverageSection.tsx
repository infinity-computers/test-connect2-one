"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  CircleDot,
  ClipboardList,
  MapPinned,
  RadioTower,
  Send,
  TicketCheck,
  UserRoundCheck,
  Wrench,
  Router,
} from "lucide-react";
import { useRef } from "react";

const coverageHighlights = [
  {
    title: "Installation support",
    icon: Wrench,
  },
  {
    title: "Fiber setup coordination",
    icon: Router,
  },
  {
    title: "Service request follow-up",
    icon: TicketCheck,
  },
  {
    title: "Built for Bharuch homes and businesses",
    icon: UserRoundCheck,
  },
];

export function CoverageSection() {
  const coverageSectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress: coverageProgress } = useScroll({
    target: coverageSectionRef,
    offset: ["start 78%", "end 38%"],
  });

  const coveragePanelOpacity = useTransform(
    coverageProgress,
    [0, 0.18],
    [0.78, 1],
  );

  const coveragePanelY = useTransform(coverageProgress, [0, 0.22], [18, 0]);

  const coverageLineDraw = useTransform(coverageProgress, [0.16, 0.62], [0, 1]);

  const coverageLineOpacity = useTransform(
    coverageProgress,
    [0.12, 0.5],
    [0.08, 0.34],
  );

  const coverageCenterScale = useTransform(
    coverageProgress,
    [0.12, 0.55],
    [0.9, 1],
  );

  const coverageCenterOpacity = useTransform(
    coverageProgress,
    [0.08, 0.38],
    [0.65, 1],
  );

  const coverageCenterGlow = useTransform(
    coverageProgress,
    [0.12, 0.58],
    ["0 0 22px rgba(34,211,238,0.14)", "0 0 54px rgba(34,211,238,0.32)"],
  );

  const coverageBadgeOpacity = useTransform(
    coverageProgress,
    [0.2, 0.48],
    [0.55, 1],
  );

  const coverageBadgeGlow = useTransform(
    coverageProgress,
    [0.22, 0.62],
    ["0 0 0px rgba(110,231,183,0)", "0 0 24px rgba(110,231,183,0.14)"],
  );

  const coverageScanX = useTransform(
    coverageProgress,
    [0, 1],
    ["-35%", "120%"],
  );

  const coverageScanOpacity = useTransform(
    coverageProgress,
    [0.18, 0.48, 0.82],
    [0, 0.45, 0],
  );

  const coverageCardOneOpacity = useTransform(
    coverageProgress,
    [0.18, 0.34],
    [0, 1],
  );

  const coverageCardOneY = useTransform(
    coverageProgress,
    [0.18, 0.34],
    [14, 0],
  );

  const coverageCardTwoOpacity = useTransform(
    coverageProgress,
    [0.28, 0.44],
    [0, 1],
  );

  const coverageCardTwoY = useTransform(
    coverageProgress,
    [0.28, 0.44],
    [14, 0],
  );

  const coverageCardThreeOpacity = useTransform(
    coverageProgress,
    [0.38, 0.56],
    [0, 1],
  );

  const coverageCardThreeY = useTransform(
    coverageProgress,
    [0.38, 0.56],
    [14, 0],
  );

  return (
    <section
      ref={coverageSectionRef}
      className="relative overflow-hidden bg-[#050d18] py-14 sm:py-16"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,211,238,0.10),transparent_32%),radial-gradient(circle_at_82%_58%,rgba(59,130,246,0.08),transparent_34%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/18 to-transparent" />

      <motion.div
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-xl sm:p-7 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="lg:pr-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200/75 sm:text-sm">
                Bharuch service area
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl lg:text-[2.85rem] lg:leading-[0.98]">
                Fiber service for Bharuch homes and businesses.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300/80 sm:text-base sm:leading-8">
                Get help with plan guidance, feasibility checks,
                installation coordination, and service follow-up.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:max-w-xl">
                {coverageHighlights.map(({ icon: Icon, title }, index) => (
                  <motion.div
                    key={title}
                    className="group flex min-h-[58px] items-center gap-3 rounded-2xl border border-sky-200/10 bg-slate-950/28 px-3.5 py-3 backdrop-blur transition duration-300 hover:border-cyan-200/25 hover:bg-white/[0.045]"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    whileInView={
                      shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                    }
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{
                      duration: 0.35,
                      delay: shouldReduceMotion ? 0 : index * 0.04,
                      ease: "easeOut",
                    }}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200/12 bg-cyan-300/[0.08] text-cyan-100 transition group-hover:bg-cyan-300/12">
                      <Icon size={16} />
                    </span>

                    <span className="min-w-0 text-sm font-bold leading-5 text-slate-100">
                      {title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              className="relative min-h-[380px] overflow-hidden rounded-[2rem] border border-cyan-100/20 bg-[#061321]/95 shadow-2xl shadow-cyan-950/20 sm:min-h-[430px]"
              style={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: coveragePanelOpacity,
                      y: coveragePanelY,
                    }
              }
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.014))]" />
              <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(125,211,252,0.75)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.75)_1px,transparent_1px)] [background-size:42px_42px]" />

              {!shouldReduceMotion && (
                <motion.div
                  className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-200/[0.07] to-transparent blur-xl"
                  style={{
                    x: coverageScanX,
                    opacity: coverageScanOpacity,
                  }}
                />
              )}

              <div className="relative z-10 flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/60">
                    Service status
                  </p>

                  <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-white sm:text-2xl">
                    Bharuch coordination flow
                  </h3>
                </div>

                <motion.div
                  className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100 sm:text-[11px]"
                  style={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: coverageBadgeOpacity,
                          boxShadow: coverageBadgeGlow,
                        }
                  }
                >
                  <CircleDot size={12} className="fill-emerald-200/35" />
                  Workflow active
                </motion.div>
              </div>

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 640 420"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M320 230 C270 205 225 165 150 150"
                  fill="none"
                  stroke="rgba(125,211,252,0.24)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  style={{
                    opacity: shouldReduceMotion ? 0.3 : coverageLineOpacity,
                    pathLength: shouldReduceMotion ? 1 : coverageLineDraw,
                  }}
                />

                <motion.path
                  d="M320 230 C370 205 415 165 490 150"
                  fill="none"
                  stroke="rgba(125,211,252,0.24)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  style={{
                    opacity: shouldReduceMotion ? 0.3 : coverageLineOpacity,
                    pathLength: shouldReduceMotion ? 1 : coverageLineDraw,
                  }}
                />

                <motion.path
                  d="M320 230 C320 270 320 300 320 335"
                  fill="none"
                  stroke="rgba(125,211,252,0.22)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  style={{
                    opacity: shouldReduceMotion ? 0.28 : coverageLineOpacity,
                    pathLength: shouldReduceMotion ? 1 : coverageLineDraw,
                  }}
                />
              </svg>

              <div className="absolute left-1/2 top-[52%] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
                <motion.div
                  className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-cyan-100/45 bg-cyan-300/[0.14] text-cyan-50 shadow-[0_0_44px_rgba(34,211,238,0.28)] sm:h-24 sm:w-24"
                  style={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: coverageCenterScale,
                          opacity: coverageCenterOpacity,
                          boxShadow: coverageCenterGlow,
                        }
                  }
                >
                  {!shouldReduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-cyan-200/25"
                      animate={{ scale: [1, 1.32], opacity: [0.35, 0] }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  )}

                  <span className="absolute inset-3 rounded-full border border-cyan-200/12" />
                  <RadioTower size={28} />
                </motion.div>

                <div className="mt-3 rounded-2xl border border-cyan-200/14 bg-slate-950/62 px-4 py-2 text-xs font-black text-cyan-50 backdrop-blur">
                  Bharuch service focus
                </div>
              </div>

              <div className="absolute left-[6%] top-[36%] z-10 sm:left-[10%] sm:top-[34%]">
                <motion.div
                  className="w-[116px] rounded-2xl border border-white/10 bg-slate-950/58 px-3 py-3 text-center shadow-xl shadow-slate-950/20 backdrop-blur sm:w-[150px] sm:px-4"
                  style={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: coverageCardOneOpacity,
                          y: coverageCardOneY,
                        }
                  }
                >
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/12 bg-cyan-300/[0.08] text-cyan-100">
                    <ClipboardList size={15} />
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 sm:text-xs">
                    Plan Guidance
                  </p>
                </motion.div>
              </div>

              <div className="absolute right-[6%] top-[36%] z-10 sm:right-[10%] sm:top-[34%]">
                <motion.div
                  className="w-[116px] rounded-2xl border border-white/10 bg-slate-950/58 px-3 py-3 text-center shadow-xl shadow-slate-950/20 backdrop-blur sm:w-[150px] sm:px-4"
                  style={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: coverageCardTwoOpacity,
                          y: coverageCardTwoY,
                        }
                  }
                >
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/12 bg-cyan-300/[0.08] text-cyan-100">
                    <MapPinned size={15} />
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 sm:text-xs">
                    Feasibility Check
                  </p>
                </motion.div>
              </div>

              <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
                <motion.div
                  className="w-[136px] rounded-2xl border border-white/10 bg-slate-950/58 px-3 py-3 text-center shadow-xl shadow-slate-950/20 backdrop-blur sm:w-[160px] sm:px-4"
                  style={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: coverageCardThreeOpacity,
                          y: coverageCardThreeY,
                        }
                  }
                >
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/12 bg-cyan-300/[0.08] text-cyan-100">
                    <Send size={15} />
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 sm:text-xs">
                    Install Follow-up
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
