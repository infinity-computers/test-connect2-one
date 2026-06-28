"use client";

import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Gauge,
  Headphones,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  RadioTower,
  RefreshCw,
  Router,
  Shield,
  Sparkles,
  TicketCheck,
  Wifi,
  Wrench,
  ClipboardList,
  MapPinned,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  activeSubscription,
  paymentHistory,
} from "../../data/mockSubscriptions";
import { plans } from "../../data/mockPlans";
import { CoverageSection } from "./LocalCoverageSection";
import HeroSection from "./HeroSection";
import WhatWeOffer from "./WhatWeOffer";
import CTABanner from "./Ctabanner";

const trustStats = [
  { label: "Fiber speeds", value: "40-300 Mbps" },
  { label: "Monthly FUP", value: "3.5 TB" },
  { label: "Post-FUP speed", value: "2 Mbps" },
];

const processSteps = [
  { title: "Choose Plan", desc: "Compare speeds, durations, and FUP details." },
  {
    title: "Book Request",
    desc: "Submit your new connection details securely.",
  },
  {
    title: "Feasibility Check",
    desc: "Our local team verifies installation scope.",
  },
  {
    title: "Go Online",
    desc: "Installation and activation are completed by the local team.",
  },
];

const processStepIcons = [ClipboardList, Send, MapPinned, Wifi];

const coverageHighlights = [
  {
    icon: Wrench,
    title: "Local installation support",
    desc: "On-ground coordination for Bharuch addresses after your request is booked.",
  },
  {
    icon: Router,
    title: "Fiber setup coordination",
    desc: "Plan, router, wiring, and setup details are clarified before activation.",
  },
  {
    icon: TicketCheck,
    title: "Service request follow-up",
    desc: "Requests are tracked through the support flow so the next step stays clear.",
  },
  {
    icon: MapPinned,
    title: "Built for Bharuch homes and businesses",
    desc: "Local guidance for apartments, shops, offices, and family homes.",
  },
];

const coverageStatusItems = [
  { label: "Plan guidance", left: "24%", top: "31%", icon: ClipboardList },
  { label: "Feasibility check", left: "76%", top: "31%", icon: MapPinned },
  { label: "Install follow-up", left: "50%", top: "74%", icon: TicketCheck },
];

const trustHighlights = [
  {
    icon: Shield,
    title: "Transparent plan details",
    desc: "Clear speed, FUP, duration, and renewal information before booking.",
  },
  {
    icon: RadioTower,
    title: "Local technician coordination",
    desc: "Installation and setup are handled with local follow-up.",
  },
  {
    icon: RefreshCw,
    title: "Simple renewal and support flow",
    desc: "Customers can renew plans and raise support requests without confusion.",
  },
  {
    icon: Headphones,
    title: "Reliable support after booking",
    desc: "The connection journey does not stop after plan selection.",
  },
];

const faqs = [
  {
    question: "What is FUP?",
    answer:
      "FUP means Fair Usage Policy. It is the monthly high-speed data limit attached to a broadband plan.",
  },
  {
    question: "What happens after my monthly FUP is over?",
    answer:
      "After the monthly FUP is used, speed shifts to the post-FUP speed shown for the plan until the next cycle.",
  },
  {
    question: "How long does installation usually take?",
    answer:
      "Installation timing depends on address feasibility, wiring scope, and technician scheduling. The local team confirms the next step after booking.",
  },
  {
    question: "Do I need to pay installation charges?",
    answer:
      "Installation charges may vary by plan, location, wiring requirement, and feasibility. The team confirms applicable charges before setup.",
  },
  {
    question: "Do I get a router with the connection?",
    answer:
      "Router availability depends on the selected plan and setup terms. The team will explain router options before activation.",
  },
  {
    question: "How can I renew my plan?",
    answer:
      "You can renew from your subscription dashboard or contact the local support team for renewal guidance.",
  },
  {
    question: "How do I raise a service request?",
    answer:
      "Customers can raise a service request through the dashboard or contact local support for help with an active connection.",
  },
  {
    question: "Can I upgrade my plan later?",
    answer:
      "Yes, upgrades can be requested later. Availability may depend on the plan, account status, and local feasibility.",
  },
];

function ConnectionProcessTimeline({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 72%", "end 42%"],
  });

  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextStep = Math.min(
      processSteps.length - 1,
      Math.floor(latest * processSteps.length),
    );
    setActiveStep(nextStep);
  });

  return (
    <div className="mx-auto w-full max-w-[640px] lg:mx-0">
      <div ref={timelineRef} className="relative py-2">
        {/* Vertical line */}
        <div className="pointer-events-none absolute bottom-12 left-[22.5px] top-7 w-[3px] overflow-hidden rounded-full [mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)] sm:left-[26.5px]">
          <div className="absolute inset-0 rounded-full bg-sky-200/10" />
          <motion.div
            className="absolute inset-x-0 top-0 h-full origin-top rounded-full bg-gradient-to-b from-cyan-200 via-sky-300 to-cyan-500/20 shadow-[0_0_26px_rgba(56,189,248,0.55)]"
            style={{ scaleY: shouldReduceMotion ? 1 : lineScale }}
          />
        </div>

        <div className="space-y-6 sm:space-y-7">
          {processSteps.map((step, index) => {
            const Icon = processStepIcons[index] ?? ClipboardList;
            const isActive = shouldReduceMotion || index <= activeStep;
            const isCurrentStep = !shouldReduceMotion && index === activeStep;

            return (
              <div
                key={step.title}
                className="group relative flex gap-4 sm:gap-5"
              >
                {/* Step circle */}
                <div
                  className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#061827] text-sm font-black transition duration-300 sm:h-14 sm:w-14 ${
                    isActive
                      ? "border border-cyan-100/70 text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.38)] ring-4 ring-cyan-300/10"
                      : "border border-sky-200/20 text-slate-300 shadow-[0_0_16px_rgba(34,211,238,0.12)] ring-4 ring-cyan-300/5 group-hover:border-cyan-100/50 group-hover:text-cyan-100 group-hover:shadow-[0_0_28px_rgba(34,211,238,0.28)]"
                  }`}
                >
                  {/* Pulse rings — only on the current active step */}
                  {isCurrentStep && (
                    <>
                      <motion.span
                        className="absolute -inset-2 rounded-full border border-cyan-300/40"
                        aria-hidden="true"
                        animate={{ scale: [0.9, 1.5], opacity: [0.5, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: 0,
                        }}
                      />
                      <motion.span
                        className="absolute -inset-2 rounded-full border border-cyan-300/25"
                        aria-hidden="true"
                        animate={{ scale: [0.9, 1.7], opacity: [0.3, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: 0.5,
                        }}
                      />
                    </>
                  )}

                  {/* Inner glow */}
                  <span
                    className={`absolute inset-1 rounded-full blur-sm transition duration-300 ${
                      isActive ? "bg-cyan-300/14" : "bg-cyan-300/5"
                    }`}
                  />
                  <span className="relative">{index + 1}</span>
                </div>

                {/* Step card */}
                <motion.div
                  className="min-w-0 flex-1 rounded-2xl border border-sky-200/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] px-4 py-4 shadow-lg shadow-slate-950/10 backdrop-blur transition duration-300 group-hover:border-cyan-200/25 group-hover:bg-white/[0.045] sm:px-5"
                  animate={
                    isCurrentStep && !shouldReduceMotion
                      ? {
                          borderColor: "rgba(34,211,238,0.28)",
                          backgroundColor: "rgba(255,255,255,0.04)",
                        }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-black tracking-[-0.02em] text-white sm:text-lg">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-400">
                        {step.desc}
                      </p>
                    </div>

                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition duration-300 ${
                        isCurrentStep
                          ? "border-cyan-200/40 bg-cyan-300/15 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.2)]"
                          : isActive
                            ? "border-cyan-200/25 bg-cyan-300/10 text-cyan-100"
                            : "border-sky-200/10 bg-white/[0.03] text-slate-500 group-hover:text-cyan-100"
                      }`}
                    >
                      {/* Icon pulses subtly on current step */}
                      {isCurrentStep && !shouldReduceMotion ? (
                        <motion.span
                          animate={{ scale: [1, 1.18, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Icon size={16} />
                        </motion.span>
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onNavigate("/plans")}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200 sm:ml-[76px] sm:w-auto"
      >
        View Plans <ArrowRight size={16} />
      </button>
    </div>
  );
}
function NetworkCommandPanel() {
  const networkStats = [
    { label: "FUP limit", value: "3.5 TB", tone: "text-cyan-100" },
    { label: "Post-FUP", value: "2 Mbps", tone: "text-emerald-100" },
    { label: "Support", value: "Local", tone: "text-blue-100" },
  ];

  const workflow = [
    "Plan selected",
    "Request verified",
    "Technician assigned",
    "Connected",
  ];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#071522]/85 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))]" />
      <div className="network-scan absolute inset-x-6 top-0 h-24 rounded-full bg-cyan-200/10 blur-2xl" />

      <div className="relative rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-100/65">
              Live Fiber Experience
            </p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
              Connection command center
            </h3>
          </div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">
            Network ready
          </div>
        </div>

        <div className="mt-7 rounded-[1.5rem] border border-cyan-200/10 bg-cyan-300/[0.06] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-400">
                Peak plan speed
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-6xl font-black leading-none tracking-[-0.07em] text-white sm:text-7xl">
                  300
                </span>
                <span className="pb-2 text-xl font-black text-cyan-100">
                  Mbps
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-cyan-300/10 p-4 text-cyan-100 ring-1 ring-cyan-200/15">
              <Gauge size={34} />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-950/70">
            <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-cyan-300 via-blue-300 to-emerald-300 shadow-[0_0_24px_rgba(34,211,238,0.45)]" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {networkStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
            >
              <p className={`text-lg font-black ${stat.tone}`}>{stat.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                Service workflow
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                New connection tracking
              </p>
            </div>
            <RadioTower size={22} className="text-cyan-100" />
          </div>

          <div className="space-y-3">
            {workflow.map((step, index) => {
              const isLast = index === workflow.length - 1;

              return (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-200/15 bg-cyan-300/10 text-cyan-100">
                    {isLast ? <Clock3 size={15} /> : <CheckCircle2 size={15} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-100">
                        {step}
                      </p>
                      <span className="text-xs font-semibold text-slate-500">
                        {isLast ? "Next" : "Done"}
                      </span>
                    </div>
                    {!isLast && (
                      <div className="mt-2 h-px bg-gradient-to-r from-cyan-200/35 to-transparent" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const { user } = useAuth();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [activeFaq, setActiveFaq] = useState(0);
  const renewalPlans = plans.filter((p) => p.category === "Budget").slice(0, 3);
  const ecoPlans = plans.filter((p) => p.category === "Eco").slice(0, 3);
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(activeSubscription.expiresOn).getTime() - Date.now()) /
        86400000,
    ),
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#030913] pt-16 text-white">
      <HeroSection onNavigate={onNavigate} />

      {/* <section className="relative overflow-hidden bg-[#050d18] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_86%_72%,rgba(59,130,246,0.08),transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/18 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200/75">
                Why Connect One
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Local service, clear pricing, and broadband operations that are
                actually tracked.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-slate-350 lg:ml-auto">
              From choosing a plan to raising a service request, Connect One
              keeps the broadband journey clear, trackable, and locally
              supported.
            </p>
          </div>
        </div>
      </section> */}
      <WhatWeOffer />
      {/* 
      {user && user.role === "USER" && (
        <section className="bg-[#030913] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-200/70">
                  Customer portal
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Your Subscription Dashboard
                </h2>
              </div>
              <button
                onClick={() => onNavigate("/my-subscriptions")}
                className="text-sm font-bold text-cyan-200 hover:text-cyan-100"
              >
                Open subscription details
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-[1.7rem] border border-cyan-200/15 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-slate-950 p-6 text-white shadow-2xl shadow-cyan-950/20">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/65">
                      Active Plan
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {activeSubscription.planName}
                    </h3>
                  </div>
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Speed", `${activeSubscription.speed} Mbps`],
                    ["Duration", activeSubscription.duration],
                    ["Active Since", activeSubscription.activeSince],
                    ["Expires On", activeSubscription.expiresOn],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                    >
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-black text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-slate-300">
                    <span>Days Remaining</span>
                    <span className="font-black text-white">
                      {daysLeft} days
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950/70">
                    <div
                      className="h-2 rounded-full bg-cyan-300"
                      style={{
                        width: `${Math.min(100, (daysLeft / (activeSubscription.months * 30)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => onNavigate("/my-subscriptions")}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                >
                  <RefreshCw size={15} /> Renew Plan
                </button>
              </div>

              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {renewalPlans.map((plan) => (
                    <button
                      key={plan.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/30"
                      onClick={() => onNavigate("/my-subscriptions")}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-full bg-blue-400/10 px-2 py-1 text-xs font-bold text-blue-200">
                          {plan.category}
                        </span>
                        <span className="text-sm font-black text-white">
                          {plan.speed} Mbps
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Starting at</p>
                      <p className="mt-1 text-xl font-black text-cyan-200">
                        ₹{plan.variants[0].price.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">for 3 months</p>
                    </button>
                  ))}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.04]">
                      <tr>
                        {["Plan", "Amount", "Date", "Status"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {paymentHistory.slice(0, 3).map((pay) => (
                        <tr key={pay.id} className="hover:bg-white/[0.03]">
                          <td className="px-4 py-3 font-bold text-white">
                            {pay.plan}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            ₹{pay.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {pay.date}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-200">
                              Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )} */}

      <section className="relative bg-[#050d18] py-16 sm:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(34,211,238,0.05),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* Left: heading */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                <Sparkles size={14} /> Popular starting point
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
                Start with Eco plans built for everyday internet.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
                Eco plans keep pricing approachable for Bharuch homes and small
                offices while still showing speed, FUP, duration, and renewal
                details clearly before booking.
              </p>
              <button
                onClick={() => onNavigate("/plans")}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-white/[0.08]"
              >
                See all plans <ArrowRight size={15} />
              </button>
            </motion.div>

            {/* Right: plan cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {ecoPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={
                    shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                  }
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : index * 0.08,
                    ease: "easeOut",
                  }}
                  onClick={() => onNavigate("/plans")}
                  className="group relative flex min-h-[240px] cursor-pointer flex-col overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-5 transition duration-300 hover:-translate-y-1.5 hover:border-cyan-200/35 hover:shadow-[0_16px_48px_rgba(34,211,238,0.08)]"
                >
                  {/* Default content */}
                  <div className="flex flex-1 flex-col transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-1">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200/70">
                      {plan.category}
                    </p>
                    <h3 className="mt-3 text-3xl font-black text-white">
                      {plan.speed}
                      <span className="text-base text-slate-400"> Mbps</span>
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      FUP Data Limit: 3.5 TB/month. Post-FUP Speed: 2 Mbps.
                    </p>
                    <div className="mt-auto pt-5">
                      <p className="text-xs text-slate-500">Starting at</p>
                      <p className="text-2xl font-black text-cyan-200">
                        ₹{plan.variants[0].price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Hover: price breakdown slides up */}
                  <div className="absolute inset-0 flex translate-y-3 flex-col justify-end rounded-[1.7rem] bg-[#060f1c]/95 p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.1),transparent_55%)] rounded-[1.7rem]" />
                    <div className="relative">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200/70">
                        {plan.category} · {plan.speed} Mbps
                      </p>
                      <div className="mt-4 space-y-2.5">
                        {plan.variants.map(
                          (v: { months: number; price: number }) => (
                            <div
                              key={v.months}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                            >
                              <span className="text-xs font-bold text-slate-400">
                                {v.months} {v.months === 1 ? "month" : "months"}
                              </span>
                              <span className="text-sm font-black text-cyan-200">
                                ₹{v.price.toLocaleString()}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-cyan-300/70">
                        <ArrowRight size={12} />
                        View full plan details
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#030913] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-6 shadow-2xl shadow-slate-950/30 sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div className="lg:pt-14">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-200/75">
                  Connection process
                </p>

                <h2 className="mt-4 max-w-md text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  From plan selection to installation, every step is visible.
                </h2>

                <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300/80 sm:text-base">
                  Follow a simple local workflow from choosing your plan to
                  getting your connection activated.
                </p>
              </div>

              <ConnectionProcessTimeline onNavigate={onNavigate} />
            </div>
          </div>
        </div>
      </section>

      {/* <CoverageSection /> */}

      {/* <section className="relative overflow-hidden bg-[#030913] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(34,211,238,0.10),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-3xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200/75">
              Customer trust
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-white sm:text-5xl">
              Why local customers choose Connect One
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">
              No borrowed testimonials. Just the operational details customers
              look for before choosing a local broadband provider.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:gap-5">
            {trustHighlights.map(({ icon: Icon, title, desc }, index) => (
              <motion.div
                key={title}
                className={`group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-xl shadow-slate-950/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:shadow-[0_20px_70px_rgba(34,211,238,0.12)] sm:p-6 ${
                  index % 2 === 1 ? "lg:mt-8" : ""
                }`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
                whileInView={
                  shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, amount: 0.28 }}
                transition={{
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : index * 0.07,
                  ease: "easeOut",
                }}
              >
                <div className="absolute right-5 top-5 text-5xl font-black tracking-[-0.08em] text-white/[0.035]">
                  0{index + 1}
                </div>
                <div className="relative flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-100 transition group-hover:scale-105 group-hover:bg-cyan-300/15">
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black tracking-[-0.02em] text-white">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {desc}
                    </p>
                  </div>
                </div>
                <div className="mt-5 h-px bg-gradient-to-r from-cyan-200/25 via-sky-200/10 to-transparent" />
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="relative overflow-hidden bg-[#050d18] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.12),transparent_34%)]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200/75">
              Plan questions
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-white sm:text-5xl">
              Clear answers before you book.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-400">
              Short answers for Bharuch customers comparing Eco fiber plans,
              installation scope, renewals, and support.
            </p>
          </motion.div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;

              return (
                <div
                  key={faq.question}
                  className={`overflow-hidden rounded-[1.5rem] border backdrop-blur transition duration-300 ${
                    isOpen
                      ? "border-cyan-200/35 bg-cyan-300/[0.07] shadow-[0_0_42px_rgba(34,211,238,0.12)]"
                      : "border-white/10 bg-white/[0.04] hover:border-cyan-200/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setActiveFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5 sm:py-5"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${
                        isOpen
                          ? "border-cyan-200/35 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-slate-950/35 text-slate-400"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 text-base font-black tracking-[-0.015em] text-white sm:text-lg">
                      {faq.question}
                    </span>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                        isOpen
                          ? "border-cyan-200/25 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-white/[0.035] text-slate-400"
                      }`}
                    >
                      {isOpen ? <Minus size={17} /> : <Plus size={17} />}
                    </span>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.26,
                      ease: "easeOut",
                    }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-5 pl-[72px] text-sm leading-7 text-slate-350 sm:px-5 sm:pb-6 sm:pl-[84px]">
                      {faq.answer}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CTABanner />

      {/* {!user && (
        <section className="relative overflow-hidden bg-[#050d18] py-16 text-white sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_36%)]" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
              <MapPin size={26} />
            </div>
            <h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Ready to connect your home or office?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
              Explore plans, submit your connection request, and our local team
              will follow up for installation feasibility and charges.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => onNavigate("/plans")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-7 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
              >
                See All Plans <ArrowRight size={17} />
              </button>
              <button
                onClick={() => onNavigate("/contact")}
                className="rounded-2xl border border-white/12 bg-white/[0.05] px-7 py-4 text-sm font-bold text-white transition hover:border-cyan-200/35 hover:bg-white/[0.08]"
              >
                Talk to Us: 99749 55542
              </button>
            </div>
          </div>
        </section>
      )} */}
    </div>
  );
}
