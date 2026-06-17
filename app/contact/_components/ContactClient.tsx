"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  Loader2,
  Wifi,
  Headphones,
  User,
  MapPin,
  AlertCircle,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { CustomDropdown } from "./CustomDropdown";
import FiberCanvas from "../../../components/ui/FiberCanvas";

// ─── Types ────────────────────────────────────────────────────────────────────
type ContactForm = {
  issue_type: string;
  description: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
};

const initialForm: ContactForm = {
  issue_type: "",
  description: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "Bharuch",
  state: "Gujarat",
  pin_code: "392001",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const issueTypes = [
  { value: "Internet_speed", label: "Internet Speed", icon: Zap },
  { value: "Downtime_outage", label: "Downtime / Outage", icon: AlertCircle },
  { value: "Billing_error", label: "Billing Error", icon: Shield },
  { value: "Equipment_fault", label: "Equipment Fault", icon: Wifi },
  { value: "New_connection_delay", label: "New Connection Delay", icon: Clock },
  { value: "Poor_signal", label: "Poor Signal", icon: Headphones },
  {
    value: "Not_working_more_than_4_hours",
    label: "Not Working > 4 Hrs",
    icon: AlertCircle,
  },
  {
    value: "Not_working_more_than_24_hours",
    label: "Not Working > 24 Hrs",
    icon: AlertCircle,
  },
  {
    value: "Not_working_more_than_48_hours",
    label: "Not Working > 48 Hrs",
    icon: AlertCircle,
  },
  { value: "Other", label: "Other", icon: MessageCircle },
];

const contactCards = [
  {
    icon: Phone,
    title: "Sales",
    value: "99749 55542",
    sub: "New connections & upgrades",
    href: "tel:+919974955542",
    color: "bg-cyan-300/10 text-cyan-300 border border-cyan-300/20",
    delay: 0,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    value: "99749 55502",
    sub: "Technical support",
    href: "https://wa.me/919974955502",
    color: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20",
    delay: 0.1,
  },
  {
    icon: Mail,
    title: "Email",
    value: "care@connect2one.in",
    sub: "Billing & account queries",
    href: "mailto:care@connect2one.in",
    color: "bg-blue-400/10 text-blue-400 border border-blue-400/20",
    delay: 0.2,
  },
  {
    icon: Clock,
    title: "Office Hours",
    value: "11 AM – 6 PM",
    sub: "Monday to Saturday",
    href: null,
    color: "bg-purple-400/10 text-purple-400 border border-purple-400/20",
    delay: 0.3,
  },
] satisfies ContactCardProps[];

// ─── Contact Card ─────────────────────────────────────────────────────────────
type ContactCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  sub: string;
  href: string | null;
  color: string;
  delay?: number;
};

function ContactCard({
  icon: Icon,
  title,
  value,
  sub,
  href,
  color,
  delay = 0,
}: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur p-5 hover:border-white/[0.12] transition-all duration-300"
    >
      <div
        className={`inline-flex p-3 rounded-xl mb-4 ${color} group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon size={20} />
      </div>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
        {title}
      </p>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="font-bold text-white hover:text-cyan-300 transition-colors block text-sm"
        >
          {value}
          <ArrowRight
            size={12}
            className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </a>
      ) : (
        <p className="font-bold text-white text-sm">{value}</p>
      )}
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </motion.div>
  );
}

// ─── Shared input class builder ───────────────────────────────────────────────
function inputCls(hasError: boolean, extra = "") {
  return [
    "w-full rounded-xl border bg-white/[0.05] px-3 py-2.5 text-sm text-white",
    "placeholder:text-slate-600 focus:outline-none transition-colors",
    hasError
      ? "border-red-400/40 focus:border-red-400/60"
      : "border-white/[0.08] focus:border-cyan-300/40 focus:bg-white/[0.07]",
    extra,
  ].join(" ");
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xs text-red-400 mt-1"
    >
      {msg}
    </motion.p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContactClient() {
  const router = useRouter();
  const { user } = useAuth();

  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [form, setForm] = useState<ContactForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (field: keyof ContactForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.issue_type) e.issue_type = "Please select an issue type.";
    if (form.issue_type === "Other" && !form.description.trim())
      e.description = "Please describe your issue.";
    if (form.description.length > 1000)
      e.description = "Description must be under 1000 characters.";

    if (!user) {
      if (!form.name.trim()) e.name = "Please enter your name.";
      if (!form.phone.trim()) e.phone = "Please enter your contact number.";
      if (!form.email.trim()) e.email = "Please enter your email.";
      if (!form.address.trim()) e.address = "Please enter your address.";
      if (!form.city.trim()) e.city = "Please enter your city.";
      if (!form.state.trim()) e.state = "Please enter your state.";
      if (!form.pin_code.trim()) e.pin_code = "Please enter your pin code.";
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const payload: Record<string, unknown> = {
        issue_type: form.issue_type,
        description: form.description,
      };
      if (!user) {
        const { issue_type, description, ...rest } = form;
        void issue_type;
        void description;
        Object.assign(payload, rest);
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || "Failed to submit ticket" });
        return;
      }

      setComplaintId(data.complaintId?.toString() || "");
      setTrackingCode(data.trackingCode || "");
      setSubmitted(true);
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen pt-16 relative"
      style={{
        background:
          "linear-gradient(135deg,#030913 0%,#071527 48%,#020617 100%)",
      }}
    >
      {/* ── Header ── */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(34,211,238,0.08),transparent_50%)]" />
        <div className="absolute left-1/2 top-0 h-px w-[60vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <FiberCanvas opacity={0.3} nodeCount={24} speed={0.25} />

        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100 mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_8px_3px_rgba(34,211,238,0.45)]" />
            <MessageCircle size={13} className="text-cyan-300" />
            We're Here to Help
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"
          >
            Contact{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Us
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-4 text-slate-400 max-w-xl mx-auto text-base leading-7"
          >
            Reach out for new connections, plan upgrades, billing queries, or
            technical support.
          </motion.p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {contactCards.map((c) => (
            <ContactCard key={c.title} {...c} />
          ))}
        </div>

        {/* Ticket form */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Raise a Ticket
              </span>
              <Sparkles size={20} className="text-cyan-300" />
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {user
                ? "Submit a ticket and our team will respond promptly."
                : "Fill the form below and our team will respond promptly. You may also login for faster service."}
            </p>
          </motion.div>

          {/* Login nudge for guests */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] backdrop-blur p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-300/10">
                  <User size={16} className="text-cyan-300" />
                </div>
                <p className="text-sm text-slate-300">
                  Login for faster service and to track your ticket
                </p>
              </div>
              <button
                onClick={() => onNavigate("/login")}
                className="px-5 py-2 rounded-xl bg-cyan-300 text-slate-950 font-bold text-sm hover:bg-cyan-200 shadow-[0_8px_30px_rgba(34,211,238,0.2)] transition-all hover:-translate-y-0.5"
              >
                Sign In
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {submitted ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] backdrop-blur p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="inline-flex p-4 rounded-full bg-emerald-400/10 border border-emerald-400/20 mb-4"
                >
                  <CheckCircle size={32} className="text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Ticket Submitted! 🎉
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Your ticket has been registered successfully.
                </p>
                <div className="bg-white/[0.04] rounded-xl p-4 mb-6 space-y-2">
                  <p className="text-sm font-semibold text-cyan-300">
                    Ticket ID: {complaintId}
                  </p>
                  <p className="text-sm font-semibold text-cyan-300">
                    Tracking Code: {trackingCode}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Our team will contact you within the resolution window as per
                  your plan type.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm(initialForm);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-white/[0.08] text-white hover:bg-white/[0.05] transition-colors text-sm font-semibold"
                >
                  Submit Another Ticket
                </button>
              </motion.div>
            ) : (
              /* ── Form ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur p-6"
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Issue type dropdown */}
                  <CustomDropdown
                    value={form.issue_type}
                    onChange={(value) => setField("issue_type", value)}
                    error={errors.issue_type}
                    placeholder="Select issue type"
                    options={issueTypes}
                  />

                  {/* Guest-only fields */}
                  {!user && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <User
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                              type="text"
                              value={form.name}
                              onChange={(e) => setField("name", e.target.value)}
                              className={inputCls(!!errors.name, "pl-9")}
                              placeholder="Your full name"
                            />
                          </div>
                          <FieldError msg={errors.name} />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                            Phone Number <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Phone
                              size={15}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                              type="tel"
                              value={form.phone}
                              onChange={(e) =>
                                setField("phone", e.target.value)
                              }
                              className={inputCls(!!errors.phone, "pl-9")}
                              placeholder="99749 55542"
                            />
                          </div>
                          <FieldError msg={errors.phone} />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                          />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setField("email", e.target.value)}
                            className={inputCls(!!errors.email, "pl-9")}
                            placeholder="you@example.com"
                          />
                        </div>
                        <FieldError msg={errors.email} />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                          Address <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <MapPin
                            size={15}
                            className="absolute left-3 top-3 text-slate-500"
                          />
                          <textarea
                            rows={2}
                            value={form.address}
                            onChange={(e) =>
                              setField("address", e.target.value)
                            }
                            className={inputCls(
                              !!errors.address,
                              "pl-9 resize-none",
                            )}
                            placeholder="House/flat number, street, area"
                          />
                        </div>
                        <FieldError msg={errors.address} />
                      </div>

                      {/* City / State / Pin */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                            City <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) => setField("city", e.target.value)}
                            className={inputCls(!!errors.city)}
                          />
                          <FieldError msg={errors.city} />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                            State <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.state}
                            onChange={(e) => setField("state", e.target.value)}
                            className={inputCls(!!errors.state)}
                          />
                          <FieldError msg={errors.state} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                            Pin Code <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.pin_code}
                            onChange={(e) =>
                              setField("pin_code", e.target.value)
                            }
                            className={inputCls(!!errors.pin_code)}
                          />
                          <FieldError msg={errors.pin_code} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Description{" "}
                      {form.issue_type === "Other" ? (
                        <span className="text-red-400">*</span>
                      ) : (
                        <span className="text-slate-500 font-normal text-xs ml-1">
                          (optional)
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      className={inputCls(!!errors.description, "resize-none")}
                      placeholder="Describe your issue in detail..."
                    />
                    <div className="flex justify-between mt-1">
                      <FieldError msg={errors.description} />
                      <p className="text-xs text-slate-500 ml-auto">
                        {form.description.length}/1000
                      </p>
                    </div>
                  </div>

                  {/* General error */}
                  {errors.general && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-200 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3"
                    >
                      {errors.general}
                    </motion.p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-cyan-300 text-slate-950 font-bold text-sm hover:bg-cyan-200 shadow-[0_8px_30px_rgba(34,211,238,0.2)] hover:shadow-[0_12px_40px_rgba(34,211,238,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />{" "}
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send size={15} /> Submit Ticket
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
