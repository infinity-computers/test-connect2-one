"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Cable, Calendar, CreditCard, Loader2, MapPin, RefreshCw, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";

type NewConnectionRequest = {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  installation_address: string;
  city: string;
  state: string;
  pin_code: string;
  landmark: string | null;
  notes: string | null;
  amount: number;
  cashfree_order_id: string;
  cashfree_payment_id: string | null;
  paid_at: string | null;
  admin_notified_at: string | null;
  customer_notified_at: string | null;
  created_at: string;
  updated_at: string;
  plan: {
    name: string;
    speed_mbps: number;
    duration_months: number;
  };
  ticket: {
    id: string;
    tracking_code: string;
    status: string;
    assigned_technician_id: string | null;
  } | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: string) {
  if (status === "PAID" || status === "ACTIVATED") return "border-emerald-800/60 bg-emerald-950/30 text-emerald-200";
  if (status === "PENDING_PAYMENT") return "border-amber-800/60 bg-amber-950/30 text-amber-200";
  if (status.includes("FAILED") || status === "CANCELLED") return "border-red-800/60 bg-red-950/30 text-red-200";
  return "border-blue-800/60 bg-blue-950/30 text-blue-200";
}

export default function AdminNewConnectionsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<NewConnectionRequest[]>([]);
  const [error, setError] = useState("");

  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchRequests = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/new-connections");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch new connection requests");
        return;
      }
      setRequests(data.requests || []);
    } catch {
      setError("Failed to fetch new connection requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "TECHNICIAN")) {
      fetchRequests();
    }
  }, [user]);

  const stats = useMemo(() => ({
    total: requests.length,
    paid: requests.filter((request) => request.status === "PAID").length,
    pending: requests.filter((request) => request.status === "PENDING_PAYMENT").length,
    failed: requests.filter((request) => request.status === "PAYMENT_FAILED" || request.status === "PAYMENT_DROPPED").length,
  }), [requests]);

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Admin access required.</p>
          <button onClick={() => onNavigate("/login")} className="btn-primary px-5 py-2.5">Sign In</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-slate-950">
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate("/admin/dashboard")} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-slate-400 text-xs mb-1">Payment-backed requests</p>
              <h1 className="heading-rhythm text-3xl font-bold">New Connections</h1>
              <p className="text-slate-500 text-sm mt-1">Track Cashfree payments and installation requests from new customers.</p>
            </div>
            <button
              onClick={() => fetchRequests(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, icon: Cable, color: "text-blue-200 bg-blue-900/40" },
            { label: "Paid", value: stats.paid, icon: CreditCard, color: "text-emerald-200 bg-emerald-900/30" },
            { label: "Pending Payment", value: stats.pending, icon: Calendar, color: "text-amber-200 bg-amber-900/30" },
            { label: "Failed/Dropped", value: stats.failed, icon: RefreshCw, color: "text-red-200 bg-red-900/30" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}><Icon size={18} /></div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {error && <div className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-500">No new connection requests found.</div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(request.status)}`}>{request.status.replace(/_/g, " ")}</span>
                      {request.ticket && <span className="rounded-full border border-blue-700/60 bg-blue-900/35 px-2 py-0.5 text-xs font-medium text-blue-200">Ticket {request.ticket.status.replace(/_/g, " ")}</span>}
                    </div>
                    <h2 className="text-lg font-bold text-slate-100">{request.customer_name}</h2>
                    <p className="text-sm text-slate-400">{request.customer_phone} · {request.customer_email}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-800/50 bg-blue-950/20 px-4 py-3 text-sm text-blue-100 lg:text-right">
                    <p className="font-bold">{request.plan.name} {request.plan.speed_mbps} Mbps</p>
                    <p className="text-blue-200/80">{request.plan.duration_months} months · Rs. {request.amount.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-2">
                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin size={16} className="text-slate-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">Installation Address</p>
                        <p className="text-sm mt-1">{request.installation_address}</p>
                        <p className="text-xs text-slate-500 mt-1">{request.city}, {request.state} - {request.pin_code}</p>
                        {request.landmark && <p className="text-xs text-slate-400 mt-1">Landmark: {request.landmark}</p>}
                        {request.notes && <p className="text-xs text-slate-400 mt-1">Notes: {request.notes}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-sm">
                    <p className="font-semibold text-slate-100 flex items-center gap-2"><Ticket size={15} className="text-blue-300" /> References</p>
                    <p className="text-slate-400">Tracking ID: <span className="text-slate-100 font-mono">{request.ticket?.tracking_code || "-"}</span></p>
                    <p className="text-slate-400">Order ID: <span className="text-slate-100 font-mono break-all">{request.cashfree_order_id}</span></p>
                    <p className="text-slate-400">Paid At: <span className="text-slate-100">{formatDate(request.paid_at)}</span></p>
                    <p className="text-slate-400">Created: <span className="text-slate-100">{formatDate(request.created_at)}</span></p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
