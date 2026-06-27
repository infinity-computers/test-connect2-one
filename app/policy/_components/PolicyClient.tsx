"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import FiberCanvas from "../../../components/ui/FiberCanvas";
import {
  Shield,
  AlertTriangle,
  Check,
  Info,
  Wifi,
  Zap,
  Server,
  Clock,
  Award,
  FileCheck,
  Globe,
  Lock,
  Users,
  Headphones,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

// ─── Floating Particles ──────────────────────────────────────────────────────
const floatingParticles = [
  { left: "8%", top: "20%", driftA: 42, driftB: -28, duration: 10, delay: 0.2 },
  { left: "18%", top: "72%", driftA: -36, driftB: 54, duration: 13, delay: 1.4 },
  { left: "28%", top: "38%", driftA: 58, driftB: -46, duration: 11, delay: 2.1 },
  { left: "42%", top: "82%", driftA: -48, driftB: 34, duration: 14, delay: 0.8 },
  { left: "54%", top: "26%", driftA: 30, driftB: -60, duration: 12, delay: 3.2 },
  { left: "66%", top: "64%", driftA: -56, driftB: 42, duration: 10.5, delay: 1.9 },
  { left: "74%", top: "18%", driftA: 46, driftB: -32, duration: 13.5, delay: 2.7 },
  { left: "82%", top: "78%", driftA: -28, driftB: 62, duration: 12.5, delay: 0.5 },
  { left: "90%", top: "44%", driftA: 52, driftB: -40, duration: 11.5, delay: 3.8 },
  { left: "36%", top: "58%", driftA: -40, driftB: 48, duration: 14.5, delay: 1.1 },
];

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {floatingParticles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full bg-cyan-300/15"
          style={{ left: particle.left, top: particle.top }}
          animate={{
            y: [0, -80, -160],
            x: [0, particle.driftA, particle.driftB],
            opacity: [0, 0.25, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Expandable Section ──────────────────────────────────────────────────────
function ExpandableSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  accent = "cyan",
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: "cyan" | "emerald" | "amber" | "red" | "blue";
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const accentColors = {
    cyan: "from-cyan-400 to-blue-500",
    emerald: "from-emerald-400 to-green-500",
    amber: "from-amber-400 to-yellow-500",
    red: "from-red-400 to-rose-500",
    blue: "from-blue-400 to-indigo-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${accentColors[accent]}/10 border border-white/5`}
          >
            <Icon
              size={18}
              className={`text-${accent === "cyan" ? "cyan-300" : accent === "emerald" ? "emerald-300" : accent === "amber" ? "amber-300" : accent === "red" ? "red-300" : "blue-300"}`}
            />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="p-1 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors"
        >
          <ChevronDown size={16} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-1 border-t border-white/[0.04]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PolicyClient() {
  const [activeTab, setActiveTab] = useState<"overview" | "fup" | "scope">(
    "overview",
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const stats = [
    { icon: Award, label: "Service Level", value: "99.9%", sub: "Uptime SLA" },
    {
      icon: Users,
      label: "Happy Customers",
      value: "500+",
      sub: "Bharuch & beyond",
    },
    { icon: Headphones, label: "Support", value: "Local", sub: "11 AM - 6 PM" },
    { icon: Clock, label: "Resolution", value: "48 Hrs", sub: "Average time" },
  ];

  return (
    <div
      className="min-h-screen pt-16 relative"
      style={{
        background:
          "linear-gradient(135deg,#030913 0%,#071527 48%,#020617 100%)",
      }}
    >
      <FloatingParticles />
      <FiberCanvas opacity={0.3} nodeCount={24} connectionDistance={150} speed={0.25} lineAlpha={0.25} nodeRadius={1.4} nodeOpacity={0.4} />

      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(34,211,238,0.08),transparent_50%)]" />
        <div className="absolute left-1/2 top-0 h-px w-[60vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100 mb-6"
          >
            <Shield size={13} className="text-cyan-300" />
            Service Terms & Scope
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
          >
            Service{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Policy
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-4 text-slate-400 max-w-xl mx-auto text-base leading-7"
          >
            Understanding what we provide and the clear scope of our internet
            service ensures a smooth customer experience.
          </motion.p>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 backdrop-blur"
                >
                  <Icon size={14} className="text-cyan-300 mb-1.5" />
                  <p className="text-lg font-black text-white">{stat.value}</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-[8px] text-slate-500 mt-0.5">{stat.sub}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-10"
        >
          <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1.5 backdrop-blur">
            {[
              { id: "overview", label: "Overview", icon: Shield },
              { id: "fup", label: "FUP Policy", icon: FileCheck },
              { id: "scope", label: "Scope", icon: Globe },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={[
                    "relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                    activeTab === tab.id
                      ? "text-slate-950"
                      : "text-slate-400 hover:text-slate-200",
                  ].join(" ")}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="policy-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={14} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {activeTab === "overview" && (
              <>
                {/* What We Provide */}
                <ExpandableSection
                  title="What We Provide"
                  icon={Check}
                  accent="emerald"
                  defaultOpen={true}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        title: "Fiber to Premises",
                        desc: "Fiber optic cable from our nearest node to your premises entry point.",
                        icon: Wifi,
                      },
                      {
                        title: "ONU/ONT Installation",
                        desc: "Full installation and basic configuration of the Optical Network Unit.",
                        icon: Server,
                      },
                      {
                        title: "Speed Activation",
                        desc: "Activation of the internet speed as per your selected plan.",
                        icon: Zap,
                      },
                      {
                        title: "Technical Support",
                        desc: "Phone and WhatsApp support during office hours (11 AM – 6 PM).",
                        icon: Headphones,
                      },
                      {
                        title: "Network Monitoring",
                        desc: "Proactive monitoring of our network for outages and disruptions.",
                        icon: Activity,
                      },
                      {
                        title: "Transparent Billing",
                        desc: "Clear invoices for all payments with no hidden charges.",
                        icon: Shield,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.title}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="flex gap-3 p-3 rounded-xl bg-emerald-400/[0.06] border border-emerald-400/10 hover:border-emerald-400/20 transition-all"
                        >
                          <div className="p-1.5 rounded-lg bg-emerald-400/10 h-fit">
                            <Icon size={12} className="text-emerald-300" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-100">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ExpandableSection>

                {/* Not Covered */}
                <ExpandableSection
                  title="Not Covered by Service"
                  icon={AlertTriangle}
                  accent="red"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Internal concealed wiring or civil work",
                      "Electrician services or society cabling",
                      "Wi-Fi coverage guarantees across walls/floors",
                      "Customer-side router or LAN device issues",
                      "Third-party device compatibility",
                      "Internet disruptions due to force majeure events",
                    ].map((item) => (
                      <motion.div
                        key={item}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-red-400/[0.06] border border-red-400/10 hover:border-red-400/20 transition-all"
                      >
                        <span className="w-4 h-4 rounded-full bg-red-400/10 text-red-300 flex items-center justify-center text-xs shrink-0">
                          ✕
                        </span>
                        <p className="text-sm text-slate-200">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </ExpandableSection>

                {/* Customer Acceptance */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/[0.06] to-blue-400/[0.04] p-6"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-300/5 rounded-full blur-2xl" />
                  <div className="relative flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-cyan-300/10 border border-cyan-300/20">
                      <Shield size={18} className="text-cyan-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                        Customer Acceptance
                        <Sparkles size={14} className="text-cyan-300" />
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        By proceeding with the service order, customers confirm
                        they have read and accepted this service policy.
                        Customer acceptance timestamp is stored digitally for
                        record-keeping purposes.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === "fup" && (
              <>
                {/* FUP Stats */}
                <motion.div
                  variants={fadeUp as any}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-6 text-center">
                    <p className="text-xs uppercase tracking-widest text-cyan-300 font-semibold">
                      FUP Data Limit
                    </p>
                    <p className="text-4xl font-black text-white mt-2">
                      3.5 TB
                    </p>
                    <p className="text-sm text-slate-400 mt-1">Per Month</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-6 text-center">
                    <p className="text-xs uppercase tracking-widest text-cyan-300 font-semibold">
                      Post-FUP Speed
                    </p>
                    <p className="text-4xl font-black text-white mt-2">
                      2 Mbps
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Until next cycle
                    </p>
                  </div>
                </motion.div>

                <ExpandableSection
                  title="Fair Usage Policy Details"
                  icon={FileCheck}
                  accent="cyan"
                  defaultOpen={true}
                >
                  <div className="space-y-4">
                    {[
                      "All broadband plans are subject to a Fair Usage Policy limit of 3.5 TB data per month.",
                      "After the monthly FUP limit is consumed, the connection speed may be reduced to 2 Mbps until the next billing or usage cycle begins.",
                      "FUP limits are applied to maintain fair network usage and service quality for all customers.",
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                      >
                        <span className="w-6 h-6 rounded-full bg-cyan-300/10 text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </ExpandableSection>

                <motion.div
                  variants={fadeUp as any}
                  className="rounded-2xl border border-blue-300/20 bg-blue-300/[0.06] p-4 flex items-start gap-3"
                >
                  <Info size={16} className="text-blue-300 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-200 leading-relaxed">
                    <strong>Pro Tip:</strong> Monitor your data usage through
                    your customer portal to avoid reaching the FUP limit.
                  </p>
                </motion.div>
              </>
            )}

            {activeTab === "scope" && (
              <>
                <ExpandableSection
                  title="Scope of Work"
                  icon={Globe}
                  accent="blue"
                  defaultOpen={true}
                >
                  <div className="bg-blue-400/[0.06] border border-blue-400/10 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
                    <Info size={14} className="text-blue-300 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-200 leading-relaxed">
                      <strong>ISP Scope:</strong> Our service scope covers only
                      up to the installation point (ONU/ONT). Beyond this point,
                      the internal network is the customer's responsibility.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Fiber cable installation is limited to the nearest entry point of the premises. Any cabling beyond the ONU/ONT mounting location is not included.",
                      "Internal concealed wiring (inside walls or ceilings) is not covered under our service scope.",
                      "Civil work, drilling, or structural modifications required for cable routing inside the premises are not part of our service.",
                      "Connect One Networks is not responsible for electrician services or society-level cabling infrastructure.",
                      "Wi-Fi signal strength and coverage within walls, floors, or rooms is dependent on the customer's router and premises structure. No guarantee of Wi-Fi coverage is provided.",
                      "Any additional internal wiring, router placement, or network extension work must be independently arranged and paid for by the customer.",
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                      >
                        <span className="w-6 h-6 rounded-full bg-blue-400/10 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </ExpandableSection>

                <motion.div
                  variants={fadeUp as any}
                  className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 flex items-start gap-3"
                >
                  <AlertTriangle
                    size={16}
                    className="text-amber-300 mt-0.5 shrink-0"
                  />
                  <p className="text-sm text-amber-200 leading-relaxed">
                    <strong>Important:</strong> Please ensure your premises is
                    ready for fiber installation. Any additional work may incur
                    extra charges.
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
