"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import {
  Zap,
  Star,
  Check,
  Tv,
  Gift,
  Loader2,
  Wifi,
  ArrowRight,
} from "lucide-react";
import { plans, PlanCategory, Duration } from "../../../data/mockPlans";
import FiberCanvas from "../../../components/ui/FiberCanvas";
import { ottPlans } from "../../../data/mockOTT";
import { useAuth } from "../../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type SelectedConnectionPlan = {
  category: string;
  speed: number;
  duration: Duration | "1m";
  months: number;
  price: number;
};

type ConnectionForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  landmark: string;
  notes: string;
};

type CashfreeCheckout = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal";
  }) => Promise<unknown>;
};

declare global {
  interface Window {
    Cashfree?: (options: {
      mode: "sandbox" | "production";
    }) => CashfreeCheckout;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const categoryMeta: Record<
  PlanCategory,
  { desc: string; tag: string; accent: string; glow: string }
> = {
  Eco: {
    desc: "Solid fiber speeds for everyday browsing, streaming, and staying connected.",
    tag: "Budget Friendly",
    accent: "from-cyan-400 to-blue-500",
    glow: "rgba(34,211,238,0.15)",
  },
  Budget: {
    desc: "Faster priority support. The sweet spot of speed and value for most households.",
    tag: "Priority Support",
    accent: "from-blue-400 to-blue-600",
    glow: "rgba(59,130,246,0.18)",
  },
  Premium: {
    desc: "VIP response times, top-tier speeds, and festival offer discounts when they run.",
    tag: "VIP Priority",
    accent: "from-blue-300 to-cyan-400",
    glow: "rgba(147,197,253,0.15)",
  },
};

// "Best for" tags per speed — helps users self-select without reading specs
const bestFor: Record<number, string> = {
  40: "Browsing · YouTube · 2–3 devices",
  60: "HD streaming · Video calls · 3–4 devices",
  100: "4K streaming · Family use · Video calls",
  150: "Heavy streaming · WFH · 5+ devices",
  200: "Gaming · 4K + calls simultaneously",
  300: "Gaming · Office work · Heavy downloads",
};

function getBestFor(speed: number): string {
  // exact match first, then nearest lower
  if (bestFor[speed]) return bestFor[speed];
  const keys = Object.keys(bestFor)
    .map(Number)
    .sort((a, b) => b - a);
  const match = keys.find((k) => k <= speed);
  return match ? bestFor[match] : "High-speed fiber for all use cases";
}

const durationLabels: Record<string, string> = {
  "1m": "1 Month",
  "3m": "3 Months",
  "6m": "6 Months",
  "12m": "12 Months",
};

const initialConnectionForm: ConnectionForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "Bharuch",
  state: "Gujarat",
  pinCode: "392001",
  landmark: "",
  notes: "",
};

// Marquee items — social-proof flavour, not spec sheet
const MARQUEE_ITEMS = [
  "300+ homes connected in Bharuch",
  "Zero throttling during peak hours",
  "Local team picks up the phone",
  "Same-day technician dispatch",
  "Router provided with active subscription",
  "Installation charges apply",
  "Transparent monthly billing",
  "40 · 100 · 300 Mbps fiber plans",
];

// ─── Cashfree loader ──────────────────────────────────────────────────────────
function loadCashfreeSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined")
      return reject(new Error("Checkout is unavailable"));
    if (window.Cashfree) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-cashfree-sdk]",
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Cashfree checkout")),
        { once: true },
      );
      return;
    }
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.async = true;
    s.dataset.cashfreeSdk = "true";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Cashfree checkout"));
    document.body.appendChild(s);
  });
}

// ─── Marquee ticker ───────────────────────────────────────────────────────────
function Marquee() {
  const shouldReduceMotion = useReducedMotion();
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]; // duplicate for seamless loop

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-white/[0.06] bg-white/[0.03] backdrop-blur-sm py-2.5">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="flex w-max gap-8 whitespace-nowrap"
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {item}
            </span>
            <span className="text-cyan-400/60 text-xs">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Tilt card wrapper ────────────────────────────────────────────────────────
function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={
        shouldReduceMotion
          ? { transformStyle: "preserve-3d" }
          : { rotateX, rotateY, transformStyle: "preserve-3d" }
      }
      whileHover={shouldReduceMotion ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlansClient() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const backgroundGlow = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    [0.28, 0.5, 0.34],
  );

  const [activeCategory, setActiveCategory] = useState<PlanCategory>("Eco");
  const [selectedDuration, setSelectedDuration] = useState<"3m" | "6m" | "12m">(
    "12m",
  );
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedConnectionPlan, setSelectedConnectionPlan] =
    useState<SelectedConnectionPlan | null>(null);
  const [connectionForm, setConnectionForm] = useState<ConnectionForm>(
    initialConnectionForm,
  );
  const [connectionError, setConnectionError] = useState("");
  const [processingConnection, setProcessingConnection] = useState(false);
  const [showCashfreeTestPlan, setShowCashfreeTestPlan] = useState(false);

  const filtered = plans.filter((p) => p.category === activeCategory);
  const meta = categoryMeta[activeCategory];

  useEffect(() => {
    setShowCashfreeTestPlan(
      new URLSearchParams(window.location.search).get("cashfreeTest") === "1",
    );
  }, []);

  const openConnectionModal = (plan: SelectedConnectionPlan) => {
    setSelectedConnectionPlan(plan);
    setConnectionError("");
    setShowConnectionModal(true);
  };
  const openOttContactModal = () => {
    setSelectedConnectionPlan(null);
    setConnectionError("");
    setShowConnectionModal(true);
  };
  const closeConnectionModal = () => {
    if (processingConnection) return;
    setShowConnectionModal(false);
    setSelectedConnectionPlan(null);
    setConnectionError("");
  };
  const updateConnectionForm = (field: keyof ConnectionForm, value: string) => {
    setConnectionForm((prev) => ({ ...prev, [field]: value }));
    setConnectionError("");
  };

  const handleNewConnectionPayment = async () => {
    if (!selectedConnectionPlan) return;
    setConnectionError("");
    const required: (keyof ConnectionForm)[] = [
      "name",
      "phone",
      "email",
      "address",
      "city",
      "state",
      "pinCode",
    ];
    if (required.find((f) => !connectionForm[f].trim())) {
      setConnectionError("Please fill all required fields before payment.");
      return;
    }
    setProcessingConnection(true);
    try {
      const res = await fetch("/api/new-connections/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: selectedConnectionPlan.category,
          speedMbps: selectedConnectionPlan.speed,
          durationMonths: selectedConnectionPlan.months,
          ...Object.fromEntries(
            Object.entries(connectionForm).map(([k, v]) => [k, v.trim()]),
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConnectionError(data.error || "Failed to start payment.");
        return;
      }
      await loadCashfreeSdk();
      if (!window.Cashfree)
        throw new Error("Cashfree checkout failed to initialize");
      const cashfree = window.Cashfree({ mode: data.mode || "sandbox" });
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.error("New connection payment error:", err);
      setConnectionError(
        "Something went wrong while starting payment. Please try again.",
      );
    } finally {
      setProcessingConnection(false);
    }
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        delay: i * 0.08,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  return (
    <div
      className="min-h-screen pt-14"
      style={{
        background:
          "linear-gradient(135deg,#030913 0%,#071527 48%,#020617 100%)",
      }}
    >
      {/* ── Page header ── */}
      <div className="relative overflow-hidden border-b border-white/10 pb-14">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 50%, ${meta.glow}, transparent 60%),
                         radial-gradient(circle at 80% 20%, rgba(59,130,246,0.12), transparent 50%)`,
          }}
        />
        <div className="absolute left-1/2 top-0 h-px w-[60vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        <FiberCanvas opacity={0.35} nodeCount={28} speed={0.3} />

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100 mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_3px_rgba(34,211,238,0.45)]" />
            <Wifi size={13} />
            Transparent Pricing · No Hidden Charges
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
          >
            Broadband{" "}
            <span
              className={`bg-gradient-to-r ${meta.accent} bg-clip-text text-transparent`}
            >
              Plans
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-4 text-slate-400 max-w-md mx-auto text-base leading-7"
          >
            Fiber speeds from 40 to 300 Mbps for Bharuch homes and businesses.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={
                () =>
                  setShowConnectionModal(
                    true,
                  ) /* or route to availability check */
              }
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_14px_50px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-200 hover:shadow-[0_18px_60px_rgba(34,211,238,0.38)]"
            >
              Check Availability
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-0.5"
              />
            </button>
            <a
              href="#plans"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.06] px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.09]"
            >
              View Plans
            </a>
          </motion.div>
        </div>

        {/* Marquee ticker */}
        <Marquee />
      </div>

      {/* ── Body ── */}
      <div className="relative overflow-hidden">
        {/* Ambient glows */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-cyan-300/[0.055] blur-3xl"
          style={
            shouldReduceMotion
              ? undefined
              : { y: backgroundY, opacity: backgroundGlow }
          }
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-[34rem] h-[26rem] w-[26rem] rounded-full bg-blue-400/[0.05] blur-3xl"
          style={shouldReduceMotion ? undefined : { y: backgroundY }}
        />

        <div
          className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
          id="plans"
        >
          {/* ── Category tabs ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="flex justify-center mb-8"
          >
            <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1.5 backdrop-blur">
              {(["Eco", "Budget", "Premium"] as PlanCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={[
                    "relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061321]",
                    activeCategory === cat
                      ? "text-slate-950"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.045]",
                  ].join(" ")}
                >
                  {activeCategory === cat && (
                    <motion.span
                      layoutId="cat-pill"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${categoryMeta[cat].accent}`}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Category info banner ── */}
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors hover:border-cyan-200/15 hover:bg-white/[0.055]"
          >
            <div className="flex-1">
              <span
                className={`inline-block bg-gradient-to-r ${meta.accent} text-slate-950 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-2`}
              >
                {meta.tag}
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {meta.desc}
              </p>
            </div>
            {activeCategory === "Premium" && (
              <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 shrink-0">
                <Star size={14} className="text-yellow-300 fill-yellow-300" />
                <span className="text-sm font-semibold text-yellow-200">
                  Festival Offers Available
                </span>
              </div>
            )}
          </motion.div>

          {/* ── Duration toggle ── */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-xl font-bold text-white">
              {activeCategory} Plans
            </h2>
            <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 backdrop-blur">
              {(["3m", "6m", "12m"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={[
                    "relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50",
                    selectedDuration === d
                      ? "text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  {selectedDuration === d && (
                    <motion.span
                      layoutId="dur-pill"
                      className="absolute inset-0 rounded-lg bg-cyan-300/20 border border-cyan-300/30"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{durationLabels[d]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Plan cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {filtered.map((plan, i) => {
              const variant = plan.variants.find(
                (v) => v.duration === selectedDuration,
              )!;
              const isPopular = plan.badge === "Popular";
              return (
                <motion.div
                  key={plan.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                >
                  <TiltCard className="h-full">
                    <div
                      className={[
                        "group/plan relative h-full rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:border-cyan-200/25 hover:bg-white/[0.065] hover:shadow-[0_18px_70px_rgba(34,211,238,0.10)]",
                        isPopular
                          ? "border-cyan-300/30 bg-white/[0.06] shadow-[0_0_40px_rgba(34,211,238,0.1)]"
                          : "border-white/[0.06] bg-white/[0.04]",
                      ].join(" ")}
                      style={{ backdropFilter: "blur(12px)" }}
                    >
                      {/* Top shimmer line for popular */}
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
                      )}

                      {/* Hover shimmer sweep */}
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover/plan:opacity-100">
                        <div className="absolute -left-20 top-0 h-full w-20 rotate-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover/plan:translate-x-[26rem]" />
                        <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200/25 to-transparent" />
                      </div>

                      {plan.badge && (
                        <div
                          className={[
                            "absolute top-0 right-0 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl",
                            isPopular
                              ? "bg-cyan-300 text-slate-950"
                              : "bg-blue-500/80 text-white",
                          ].join(" ")}
                        >
                          {plan.badge}
                        </div>
                      )}

                      <div className="p-5 flex flex-col flex-1">
                        {/* Speed + best-for */}
                        <div className="mb-5">
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-3xl font-black text-white transition-colors group-hover/plan:text-cyan-100">
                              {plan.speed}
                            </span>
                            <span className="text-sm text-slate-400 font-medium">
                              Mbps
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Zap size={12} className="text-cyan-400" />
                            <span className="text-xs text-slate-500">
                              Fiber Broadband
                            </span>
                          </div>
                          {/* Best for tag */}
                          <div className="inline-flex rounded-full border border-cyan-200/10 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-semibold leading-5 text-slate-300">
                            {getBestFor(plan.speed)}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          <p
                            className={[
                              "text-3xl font-black",
                              isPopular ? "text-cyan-300" : "text-white",
                            ].join(" ")}
                          >
                            ₹{variant.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            for {durationLabels[selectedDuration]}
                          </p>
                          {selectedDuration !== "3m" && (
                            <p className="text-xs text-cyan-300 font-semibold mt-1">
                              ₹
                              {Math.round(
                                variant.price / variant.months,
                              ).toLocaleString()}
                              /mo avg
                            </p>
                          )}
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 mb-4 flex-1">
                          {plan.features.slice(0, 4).map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-2 text-xs text-slate-300 transition-colors group-hover/plan:text-slate-200"
                            >
                              <Check
                                size={12}
                                className="text-cyan-400 mt-0.5 shrink-0 transition-transform group-hover/plan:scale-110"
                              />
                              {f}
                            </li>
                          ))}
                        </ul>

                        {/* Router/install note */}
                        <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
                          Router provided with active subscription ·
                          Installation charges apply
                        </p>

                        {/* CTA */}
                        <button
                          type="button"
                          onClick={() =>
                            openConnectionModal({
                              category: plan.category,
                              speed: plan.speed,
                              duration: selectedDuration,
                              months: variant.months,
                              price: variant.price,
                            })
                          }
                          className={[
                            "w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98]",
                            isPopular
                              ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_8px_30px_rgba(34,211,238,0.25)] hover:shadow-[0_12px_40px_rgba(34,211,238,0.35)] hover:-translate-y-0.5"
                              : "bg-white/[0.08] text-white border border-white/[0.08] hover:bg-white/[0.13] hover:border-white/[0.15] hover:-translate-y-0.5",
                          ].join(" ")}
                        >
                          Get Started
                        </button>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>

          {/* ── Cashfree test plan (hidden) ── */}
          {showCashfreeTestPlan && (
            <div className="mb-16 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] backdrop-blur p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                    Production payment test
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    Cashfree Test Plan
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Use this hidden plan to verify live Cashfree checkout,
                    webhook, ticket creation, and success-page flow with a ₹1
                    payment.
                  </p>
                  <p className="mt-2 text-xs text-amber-300 font-mono">
                    /plans?cashfreeTest=1
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-white/[0.04] p-4 md:min-w-52">
                  <p className="text-sm text-slate-400">Test amount</p>
                  <p className="text-3xl font-black text-white">₹1</p>
                  <button
                    type="button"
                    onClick={() =>
                      openConnectionModal({
                        category: "Test",
                        speed: 1,
                        duration: "1m",
                        months: 1,
                        price: 1,
                      })
                    }
                    className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition-colors"
                  >
                    Test Cashfree Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── OTT section ── */}
          <section className="relative mt-16 border-t border-white/[0.08] pt-12">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/18 to-transparent" />
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                <Tv size={14} className="text-cyan-300" />
                Streaming add-ons
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">
                  OTT + Broadband Add-ons
                </h2>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3.5 py-2">
                  <Gift size={14} className="text-cyan-300" />
                  <p className="text-xs font-bold text-cyan-200 sm:text-sm">
                    Basic from <strong className="text-cyan-100">₹299/year</strong>
                  </p>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Optional streaming bundles you can add on top of your fiber
                plan. Broadband plans stay separate from these entertainment
                add-ons.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ottPlans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  whileHover={shouldReduceMotion ? undefined : { y: -5 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className="group/ott relative flex min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur transition-colors duration-300 hover:border-cyan-200/25 hover:bg-white/[0.075] hover:shadow-[0_18px_60px_rgba(34,211,238,0.08)]"
                >
                  <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/0 to-transparent transition group-hover/ott:via-cyan-200/40" />
                  <div className="mb-1 flex items-center gap-2">
                    <Tv size={13} className="text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">
                      {plan.name}
                    </h3>
                  </div>
                  {plan.highlight && (
                    <p className="mb-3 text-xs font-medium text-cyan-300">
                      {plan.highlight}
                    </p>
                  )}
                  <div className="mb-4 flex min-h-[3.75rem] flex-wrap content-start gap-1">
                    {plan.apps.map((app) => (
                      <span
                        key={app}
                        className="rounded-full border border-white/[0.06] bg-white/[0.05] px-2 py-0.5 text-xs text-slate-300 transition-colors group-hover/ott:border-cyan-200/15 group-hover/ott:text-slate-200"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                  <div className="mb-4 flex-1 space-y-2">
                    {plan.variants.map((v) => (
                      <div
                        key={v.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-xs text-slate-400">{v.label}</span>
                        <span className="text-sm font-bold text-white">
                          ₹{v.price}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={openOttContactModal}
                    className="w-full rounded-xl border border-cyan-300/20 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-300/10 hover:shadow-[0_10px_34px_rgba(34,211,238,0.12)] active:scale-[0.98]"
                  >
                    Add to Plan
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Connection modal ── */}
      <AnimatePresence>
        {showConnectionModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-5 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#071527] p-5 sm:p-6 shadow-2xl"
          >
            {!selectedConnectionPlan ? (
              <>
                <h3 className="text-lg font-bold text-white mb-2">
                  New Connection / Upgrade
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  Please contact us for OTT add-ons, plan upgrades, or custom
                  plan assistance.
                </p>
                <p className="text-cyan-300 font-bold text-lg mb-0.5">
                  99749 55542
                </p>
                <p className="text-xs text-slate-400 mb-5">
                  New connections & upgrades
                </p>
                <div className="flex gap-3">
                  <a
                    href="tel:+919974955542"
                    className="flex-1 text-center py-2.5 rounded-xl bg-cyan-300 text-slate-950 font-bold text-sm hover:bg-cyan-200 transition-colors"
                  >
                    Call Now
                  </a>
                  <button
                    type="button"
                    onClick={closeConnectionModal}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.05] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : user ? (
              <>
                <h3 className="text-lg font-bold text-white mb-2">
                  Existing Customer
                </h3>
                <p className="text-sm text-slate-300 mb-5">
                  New connection checkout is for new customers only. Renewal and
                  upgrade payments for existing customers will be available from
                  My Subscriptions.
                </p>
                <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm text-cyan-100 mb-5">
                  Selected: {selectedConnectionPlan.category}{" "}
                  {selectedConnectionPlan.speed} Mbps for{" "}
                  {durationLabels[selectedConnectionPlan.duration] || "Months"}.
                </div>
                <button
                  type="button"
                  onClick={closeConnectionModal}
                  className="w-full py-2.5 rounded-xl bg-cyan-300 text-slate-950 font-bold text-sm hover:bg-cyan-200 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      New Broadband Connection
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Fill your installation details and continue to Cashfree
                      payment.
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-100 sm:text-right shrink-0">
                    <p className="font-bold">
                      {selectedConnectionPlan.category}{" "}
                      {selectedConnectionPlan.speed} Mbps
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      {durationLabels[selectedConnectionPlan.duration]} · ₹
                      {selectedConnectionPlan.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs text-amber-200 mb-5">
                  This payment covers only the selected broadband plan.
                  Installation charges will be collected at the time of
                  installation.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Full Name *",
                      field: "name" as const,
                      placeholder: "Customer name",
                      type: "text",
                    },
                    {
                      label: "Phone *",
                      field: "phone" as const,
                      placeholder: "99749 55542",
                      type: "text",
                    },
                    {
                      label: "Email *",
                      field: "email" as const,
                      placeholder: "customer@example.com",
                      type: "email",
                    },
                    {
                      label: "Pin Code *",
                      field: "pinCode" as const,
                      placeholder: "392001",
                      type: "text",
                    },
                    {
                      label: "City *",
                      field: "city" as const,
                      placeholder: "Bharuch",
                      type: "text",
                    },
                    {
                      label: "State *",
                      field: "state" as const,
                      placeholder: "Gujarat",
                      type: "text",
                    },
                  ].map(({ label, field, placeholder, type }) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                        {label}
                      </label>
                      <input
                        type={type}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-300/40 focus:bg-white/[0.07] transition-colors"
                        value={connectionForm[field]}
                        onChange={(e) =>
                          updateConnectionForm(field, e.target.value)
                        }
                        placeholder={placeholder}
                      />
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Installation Address *
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-300/40 focus:bg-white/[0.07] transition-colors min-h-20"
                      value={connectionForm.address}
                      onChange={(e) =>
                        updateConnectionForm("address", e.target.value)
                      }
                      placeholder="House/flat number, street, area"
                    />
                  </div>

                  {[
                    {
                      label: "Landmark",
                      field: "landmark" as const,
                      placeholder: "Nearby landmark",
                    },
                    {
                      label: "Notes",
                      field: "notes" as const,
                      placeholder: "Preferred timing, etc.",
                    },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                        {label}
                      </label>
                      <input
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-300/40 focus:bg-white/[0.07] transition-colors"
                        value={connectionForm[field]}
                        onChange={(e) =>
                          updateConnectionForm(field, e.target.value)
                        }
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>

                {connectionError && (
                  <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
                    {connectionError}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeConnectionModal}
                    disabled={processingConnection}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.05] disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNewConnectionPayment}
                    disabled={processingConnection}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-300 text-slate-950 font-bold text-sm hover:bg-cyan-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(34,211,238,0.25)]"
                  >
                    {processingConnection && (
                      <Loader2 size={15} className="animate-spin" />
                    )}
                    {processingConnection
                      ? "Starting Payment…"
                      : "Pay with Cashfree"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
