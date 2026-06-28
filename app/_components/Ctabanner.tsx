"use client";

import { motion, useReducedMotion } from "motion/react";
import { Phone, MessageCircle } from "lucide-react";

export default function CTABanner() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative bg-[#030913] px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_16%_10%,rgba(34,211,238,0.13),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.065),rgba(255,255,255,0.018))] p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-10 lg:p-12"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {/* Top glow line */}
        <div className="absolute left-1/2 top-0 h-px w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          {/* Left — text */}
          <div>
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              Local team · Typically replies in minutes
            </div>

            <h2 className="text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl lg:text-4xl">
              We're local. Just call us.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              No call centers, no bots. Our team is right here in Bharuch — call
              or WhatsApp and a real person picks up.
            </p>
          </div>

          {/* Right — CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch xl:flex-row">
            <a
              href="tel:9974955542"
              className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-cyan-300 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_16px_48px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-200 hover:shadow-[0_20px_56px_rgba(34,211,238,0.32)]"
            >
              <Phone size={16} />
              Call Now
            </a>
            <a
              href="https://wa.me/919974955542"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.055] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-white/[0.085]"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
