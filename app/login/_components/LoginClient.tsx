"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle, Wifi, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

type LoginFlow = "email" | "phone" | "otp" | "success";

export default function LoginClient() {
  const router = useRouter();
  const { login } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [flow, setFlow] = useState<LoginFlow>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [challengeId, setChallengeId] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to proceed");
        setLoading(false);
        return;
      }

      if (data.nextStep === "phone") {
        setFlow("phone");
      } else if (data.nextStep === "otp") {
        setChallengeId(data.challengeId || "");
        setFlow("otp");
        let c = 60;
        setCountdown(c);
        const timer = setInterval(() => {
          c--;
          setCountdown(c);
          if (c <= 0) clearInterval(timer);
        }, 1000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), phone: phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      login(data.user);
      setFlow("success");
      setTimeout(() => {
        onNavigate(data.redirectTo || "/dashboard");
      }, 1000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleOtpSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, otp: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        setLoading(false);
        return;
      }

      login(data.user);
      setFlow("success");
      setTimeout(() => {
        onNavigate(data.redirectTo || "/dashboard");
      }, 1000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const resendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.challengeId) {
        setChallengeId(data.challengeId);
        let c = 60;
        setCountdown(c);
        const timer = setInterval(() => {
          c--;
          setCountdown(c);
          if (c <= 0) clearInterval(timer);
        }, 1000);
      }
    } catch {
      setError("Failed to resend OTP");
    }
    setLoading(false);
  };

  return (
    <div className="pt-14 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/LOGO_(1).png" alt="Connect One Networks" className="h-12 w-auto mx-auto mb-4" />
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden">
          {flow === "email" && (
            <div className="p-8">
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm mb-7">Sign in to your Connect One account</p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="input-dark"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 py-3 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? "Please wait..." : "Continue"}
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-500">
                  New customer? <a href="tel:+919974955542" className="text-blue-400 font-semibold">Call 99749 55542</a> to get connected.
                </p>
              </div>
            </div>
          )}

          {flow === "phone" && (
            <div className="p-8">
              <button onClick={() => { setFlow("email"); setError(""); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-5 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">Enter Phone Number</h2>
              <p className="text-slate-400 text-sm mb-7">for {email}</p>
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter your registered phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError("");
                    }}
                    className="input-dark"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{error}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 py-3 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </div>
          )}

          {flow === "otp" && (
            <div className="p-8">
              <button onClick={() => { setFlow("email"); setError(""); setOtp(["", "", "", "", "", ""]); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-5 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">Verify OTP</h2>
              <p className="text-slate-400 text-sm mb-1">Enter the 6-digit OTP sent to</p>
              <p className="text-blue-300 font-semibold text-sm mb-7">{email}</p>
              <div className="flex gap-2 justify-center mb-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
                    }}
                    className="input-dark w-11 h-12 border-2 rounded-xl text-center font-bold text-lg px-0 py-0 focus:border-blue-500"
                  />
                ))}
              </div>
              {error && <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2 mb-3 text-center">{error}</p>}
              <button onClick={handleOtpSubmit} disabled={loading} className="btn-primary w-full disabled:opacity-60 py-3 mb-4 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <p className="text-center text-xs text-slate-400">
                {countdown > 0 ? (
                  <>
                    Resend OTP in <span className="font-semibold text-blue-300">{countdown}s</span>
                  </>
                ) : (
                  <button onClick={resendOtp} disabled={loading} className="text-link font-semibold">Resend OTP</button>
                )}
              </p>
            </div>
          )}

          {flow === "success" && (
            <div className="p-10 text-center">
              <div className="inline-flex p-4 bg-emerald-900/30 rounded-full mb-5">
                <CheckCircle size={28} className="text-emerald-300" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Welcome!</h2>
              <p className="text-slate-400 text-sm mb-7">Redirecting to your dashboard...</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Wifi size={12} className="text-cyan-300" />
          <span>Powered by Connect One Networks, Bharuch</span>
        </div>
      </div>
    </div>
  );
}
