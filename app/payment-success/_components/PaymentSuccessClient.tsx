"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Home, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentSuccessClientProps {
  queryParams?: Record<string, string>;
}

type NewConnectionStatus = {
  id: string;
  status: string;
  orderId: string;
  trackingCode: string | null;
  paidAt: string | null;
  amount: number;
  plan: {
    name: string;
    speedMbps: number;
    durationMonths: number;
  };
};

function isPaidStatus(status?: string) {
  return status === "PAID" || status === "UNDER_REVIEW" || status === "ASSIGNED" || status === "INSTALLATION_IN_PROGRESS" || status === "INSTALLED" || status === "ACTIVATED";
}

export default function PaymentSuccessClient({ queryParams = {} }: PaymentSuccessClientProps) {
  const router = useRouter();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paymentType = queryParams.type;
  const requestId = queryParams.request_id;
  const newConnectionOrderId = queryParams.order_id;
  const isNewConnection = paymentType === "new_connection";

  const [newConnectionStatus, setNewConnectionStatus] = useState<NewConnectionStatus | null>(null);
  const [newConnectionLoading, setNewConnectionLoading] = useState(isNewConnection);
  const [newConnectionError, setNewConnectionError] = useState("");

  useEffect(() => {
    if (!isNewConnection || !requestId || !newConnectionOrderId) return;

    let cancelled = false;
    let attempts = 0;

    const fetchStatus = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/new-connections/status?requestId=${encodeURIComponent(requestId)}&orderId=${encodeURIComponent(newConnectionOrderId)}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setNewConnectionError(data.error || "Failed to verify payment status");
          setNewConnectionLoading(false);
          return;
        }

        setNewConnectionStatus(data.request);

        if (isPaidStatus(data.request?.status) || attempts >= 8) {
          setNewConnectionLoading(false);
          return;
        }

        window.setTimeout(fetchStatus, 2500);
      } catch {
        if (!cancelled) {
          setNewConnectionError("Failed to verify payment status");
          setNewConnectionLoading(false);
        }
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [isNewConnection, requestId, newConnectionOrderId]);

  if (isNewConnection) {
    const hasValidReference = requestId && newConnectionOrderId;
    const paid = isPaidStatus(newConnectionStatus?.status);

    return (
      <div className="pt-14 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!hasValidReference ? (
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 text-center">
              <div className="inline-flex p-4 bg-red-900/30 rounded-full mb-5">
                <AlertCircle size={28} className="text-red-300" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Invalid Reference</h2>
              <p className="copy-rhythm text-slate-400 text-sm mb-7">The payment reference is missing or invalid. Please contact support if your amount was debited.</p>
              <button onClick={() => onNavigate("/")} className="btn-primary w-full py-3 flex items-center justify-center gap-2"><Home size={16} /> Back to Home</button>
            </div>
          ) : newConnectionLoading ? (
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 text-center">
              <div className="inline-flex p-4 bg-blue-900/30 rounded-full mb-5">
                <Loader2 size={28} className="text-blue-300 animate-spin" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Verifying Payment</h2>
              <p className="copy-rhythm text-slate-400 text-sm">Please wait while we confirm your payment with Cashfree.</p>
            </div>
          ) : newConnectionError ? (
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 text-center">
              <div className="inline-flex p-4 bg-amber-900/30 rounded-full mb-5">
                <AlertCircle size={28} className="text-amber-300" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Payment Check Pending</h2>
              <p className="copy-rhythm text-slate-400 text-sm mb-7">{newConnectionError}</p>
              <a href="tel:+919974955542" className="w-full block border border-slate-700 text-slate-200 hover:border-blue-700 font-semibold py-3 rounded-xl transition-colors text-center text-sm">Call Support: 99749 55542</a>
            </div>
          ) : paid ? (
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-emerald-800/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-950 to-cyan-500 p-8 text-center text-white">
                <div className="inline-flex p-4 bg-slate-800/70 rounded-full mb-4">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <h2 className="subheading-rhythm text-2xl font-bold mb-1">Payment Received</h2>
                <p className="text-emerald-100 text-sm">Your new connection request has been submitted.</p>
              </div>

              <div className="p-7">
                <div className="space-y-3 mb-7">
                  {[
                    { label: "Tracking ID", value: newConnectionStatus?.trackingCode || "Generating" },
                    { label: "Order ID", value: newConnectionOrderId },
                    { label: "Plan", value: newConnectionStatus ? `${newConnectionStatus.plan.name} ${newConnectionStatus.plan.speedMbps} Mbps` : "-" },
                    { label: "Amount", value: newConnectionStatus ? `₹${newConnectionStatus.amount.toLocaleString("en-IN")}` : "-" },
                    { label: "Status", value: "Payment Confirmed" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4 py-2 border-b border-slate-800 last:border-0">
                      <span className="text-sm text-slate-400">{label}</span>
                      <span className="text-sm font-semibold text-slate-100 text-right break-all">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-900/20 border border-amber-700/60 rounded-xl px-4 py-3 mb-6">
                  <p className="text-xs text-amber-200">Installation charges will be collected at the time of installation. Our team will contact you shortly.</p>
                </div>

                <button onClick={() => onNavigate("/")} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <Home size={16} /> Back to Home
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 text-center">
              <div className="inline-flex p-4 bg-amber-900/30 rounded-full mb-5">
                <AlertCircle size={28} className="text-amber-300" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Payment Not Confirmed Yet</h2>
              <p className="copy-rhythm text-slate-400 text-sm mb-7">If your amount was debited, please wait for confirmation or contact support with your order ID.</p>
              <button onClick={() => onNavigate("/")} className="btn-primary w-full py-3 flex items-center justify-center gap-2"><Home size={16} /> Back to Home</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const paymentId = queryParams.payment_id;
  const orderId = queryParams.order_id;
  const subscriptionId = queryParams.subscription_id;
  const isValid = paymentId && orderId && subscriptionId;

  return (
    <div className="pt-14 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {!isValid ? (
          <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 text-center">
            <div className="inline-flex p-4 bg-red-900/30 rounded-full mb-5">
              <AlertCircle size={28} className="text-red-300" />
            </div>
            <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Invalid Reference</h2>
            <p className="copy-rhythm text-slate-400 text-sm mb-7">
              The payment reference is missing or invalid. Please check your email for a confirmation or contact our support.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onNavigate("/")}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Home size={16} /> Back to Home
              </button>
              <a
                href="tel:+919974955542"
                className="w-full border border-slate-700 text-slate-200 hover:border-blue-700 font-semibold py-3 rounded-xl transition-colors text-center text-sm"
              >
                Call Support: 99749 55542
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-3xl shadow-xl border border-emerald-800/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-950 to-cyan-500 p-8 text-center text-white">
              <div className="inline-flex p-4 bg-slate-800/70 rounded-full mb-4">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold mb-1">Payment Successful!</h2>
              <p className="text-emerald-100 text-sm">Your subscription has been activated.</p>
            </div>

            <div className="p-7">
              <div className="space-y-3 mb-7">
                {[
                  { label: "Payment ID", value: paymentId },
                  { label: "Order ID", value: orderId },
                  { label: "Subscription ID", value: subscriptionId },
                  { label: "Status", value: "Confirmed" },
                  { label: "Date", value: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-semibold text-slate-100 break-all text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-900/30 rounded-xl p-4 mb-6 flex gap-3">
                <CreditCard size={20} className="text-blue-300 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200">
                  A confirmation email has been sent to your registered email address. Keep this for your records.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onNavigate("/my-subscriptions")}
                  className="btn-primary w-full py-3"
                >
                  View My Subscriptions
                </button>
                <button
                  onClick={() => onNavigate("/")}
                  className="w-full border border-slate-700 text-slate-200 hover:border-blue-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
