"use client";

import { useState } from "react";
import { Zap, Star, Check, Tv, Gift } from "lucide-react";
import { plans, PlanCategory } from "../../../data/mockPlans";
import { ottPlans } from "../../../data/mockOTT";

const categoryInfo: Record<
  PlanCategory,
  { desc: string; color: string; tag: string }
> = {
  Eco: {
    desc: "Affordable fiber internet with 48–72 working hours resolution. Perfect for everyday browsing.",
    color: "bg-gradient-to-br from-blue-950 to-cyan-500",
    tag: "Budget Friendly",
  },
  Budget: {
    desc: "Faster priority support with 24–48 working hours resolution. Best balance of speed and price.",
    color: "bg-gradient-to-br from-blue-600 to-blue-700",
    tag: "Priority Support",
  },
  Premium: {
    desc: "VIP priority service with 4–24 working hours resolution. Festival offer discounts available.",
    color: "bg-gradient-to-br from-blue-950 to-blue-600",
    tag: "VIP Priority",
  },
};

export default function PlansClient() {
  const [activeCategory, setActiveCategory] = useState<PlanCategory>("Eco");
  const [selectedDuration, setSelectedDuration] = useState<"3m" | "6m" | "12m">(
    "12m",
  );
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const filtered = plans.filter((p) => p.category === activeCategory);
  const durationLabels = {
    "3m": "3 Months",
    "6m": "6 Months",
    "12m": "12 Months",
  };

  return (
    <div className="pt-16 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-3 py-1 mb-4">
            <Zap size={13} className="text-cyan-300" />
            <span className="text-xs text-slate-300">
              Transparent Pricing, No Hidden Charges
            </span>
          </div>
          <h1 className="heading-rhythm text-4xl font-bold mb-3">
            Broadband Plans
          </h1>
          <p className="copy-rhythm text-slate-400 max-w-lg mx-auto">
            Choose from Eco, Budget, or Premium plans with speeds up to 300
            Mbps. All plans include a 3.5 TB/month FUP with 2 Mbps post-FUP speed.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 rounded-2xl p-1.5 shadow-sm border border-slate-700 flex gap-1">
            {(["Eco", "Budget", "Premium"] as PlanCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeCategory === cat
                    ? cat === "Premium"
                      ? "bg-gradient-to-r from-blue-950 to-blue-600 text-white shadow-sm"
                      : cat === "Budget"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm"
                        : "bg-gradient-to-r from-blue-950 to-cyan-500 text-white shadow-sm"
                    : "text-slate-300 hover:text-slate-100 hover:bg-slate-950"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Category Info */}
        <div
          className={`${categoryInfo[activeCategory].color} rounded-2xl p-5 mb-8 text-white flex flex-col sm:flex-row sm:items-center gap-3`}
        >
          <div className="flex-1">
            <span className="inline-block bg-slate-800/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
              {categoryInfo[activeCategory].tag}
            </span>
            <p className="text-sm leading-relaxed opacity-90">
              {categoryInfo[activeCategory].desc}
            </p>
          </div>
          {activeCategory === "Premium" && (
            <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2 shrink-0">
              <Star size={14} className="text-yellow-300 fill-yellow-300" />
              <span className="text-sm font-semibold">
                Festival Offers Available
              </span>
            </div>
          )}
        </div>

        {/* Duration Toggle */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-100">
            {activeCategory} Plans
          </h2>
          <div className="bg-slate-900 rounded-xl p-1 border border-slate-700 shadow-sm flex gap-1">
            {(["3m", "6m", "12m"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedDuration === d ? "bg-blue-500 text-white shadow-sm" : "text-slate-300 hover:text-slate-100"}`}
              >
                {durationLabels[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {filtered.map((plan) => {
            const variant = plan.variants.find(
              (v) => v.duration === selectedDuration,
            )!;
            const isPopular = plan.badge === "Popular";
            return (
              <div
                key={plan.id}
                className={`relative bg-slate-900 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${isPopular ? "border-blue-500 shadow-md" : "border-slate-800"}`}
              >
                {plan.badge && (
                  <div
                    className={`absolute top-0 right-0 ${isPopular ? "bg-blue-500" : "bg-blue-600"} text-white text-xs font-bold px-3 py-1 rounded-bl-xl`}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={16} className="text-blue-400" />
                      <span className="text-2xl font-black text-slate-100">
                        {plan.speed}
                      </span>
                      <span className="text-sm text-slate-400 font-medium">
                        Mbps
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Fiber Broadband</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-slate-100">
                      ₹{variant.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      for {durationLabels[selectedDuration]}
                    </p>
                    {selectedDuration !== "3m" && (
                      <p className="text-xs text-emerald-300 font-medium mt-0.5">
                        ₹
                        {Math.round(
                          variant.price / variant.months,
                        ).toLocaleString()}
                        /mo avg
                      </p>
                    )}
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.slice(0, 4).map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-xs text-slate-300"
                      >
                        <Check
                          size={12}
                          className="text-emerald-500 mt-0.5 shrink-0"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mb-5 rounded-xl border border-cyan-800/60 bg-cyan-950/30 px-3 py-2.5 text-xs text-cyan-100">
                    <p className="font-semibold">FUP Data Limit: 3.5 TB/Month</p>
                    <p className="text-cyan-200/80">Post-FUP Speed: 2 Mbps</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConnectionModal(true)}
                    className={` block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors`}>
                    Get Started
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* OTT Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Tv size={20} className="text-blue-300" />
            <h2 className="subheading-rhythm text-2xl font-bold text-slate-100">
              OTT + Broadband Add-ons
            </h2>
          </div>
          <p className="copy-rhythm text-slate-400 mb-2">
            Enhance your internet plan with premium OTT streaming bundles.
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-2.5 mb-8">
            <Gift size={14} className="text-blue-400" />
            <p className="text-sm text-blue-300 font-medium">
              Special Offer: Add Basic OTT plan with any broadband at just{" "}
              <strong>₹299/year</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ottPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full min-h-[20rem] md:min-h-[24rem]"
            >
              <div className="flex items-center gap-2 mb-1">
                <Tv size={14} className="text-blue-500" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  {plan.name}
                </h3>
              </div>
              {plan.highlight && (
                <p className="text-xs text-blue-400 font-medium mb-3">
                  {plan.highlight}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-4">
                {plan.apps.map((app) => (
                  <span
                    key={app}
                    className="text-xs bg-blue-900/30 text-blue-200 px-2 py-0.5 rounded-full"
                  >
                    {app}
                  </span>
                ))}
              </div>
              <div className="space-y-1.5">
                {plan.variants.map((v) => (
                  <div
                    key={v.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-400 text-xs">{v.label}</span>
                    <span className="font-bold text-slate-100">₹{v.price}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowConnectionModal(true)}
                className="mt-auto pt-4 block w-full text-center py-2 rounded-xl text-sm font-semibold border-2 border-blue-700/60 text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
              >
                Add to Plan
              </button>
            </div>
          ))}
        </div>
            {showConnectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">New Connection / Upgrade</h3>
            <p className="text-sm text-slate-300 mb-4">Please contact us for new connections and plan upgrades.</p>
            <p className="text-cyan-300 font-semibold text-lg mb-1">99749 55542</p>
            <p className="text-xs text-slate-400 mb-5">New connections & upgrades</p>
            <div className="flex gap-3">
              <a href="tel:+919974955542" className="btn-primary flex-1 text-center py-2.5">Call Now</a>
              <button
                type="button"
                onClick={() => setShowConnectionModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-semibold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
