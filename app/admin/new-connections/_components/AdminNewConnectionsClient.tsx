"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Cable,
  Calendar,
  CheckSquare,
  CreditCard,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Ticket,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";

type NewConnectionRequest = {
  id: string;
  status: string;
  request_source?: string;
  payment_mode?: string;
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
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
  paid_at: string | null;
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
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

type PlanVariant = {
  id: string;
  speed_mbps: number;
  duration_months: number;
  price: string | number;
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  plan_variants: PlanVariant[];
};

type CreateConnectionForm = {
  planVariantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  installationAddress: string;
  city: string;
  state: string;
  pinCode: string;
  landmark: string;
  notes: string;
  paymentMode: "NOT_COLLECTED" | "CASH" | "BANK_TRANSFER" | "UPI";
  uploadMode: "CUSTOMER_LINK" | "MANUAL_UPLOAD";
  expiresInDays: number;
  requiredDocuments: string[];
};

const documentOptions = [
  { value: "ID_PROOF", label: "ID proof" },
  { value: "ADDRESS_PROOF", label: "Address proof" },
  { value: "CUSTOMER_PHOTO", label: "Customer photo" },
  { value: "BUSINESS_PROOF", label: "Business proof" },
  { value: "OTHER", label: "Other" },
];

const defaultForm: CreateConnectionForm = {
  planVariantId: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  installationAddress: "",
  city: "Bharuch",
  state: "Gujarat",
  pinCode: "",
  landmark: "",
  notes: "",
  paymentMode: "NOT_COLLECTED",
  uploadMode: "CUSTOMER_LINK",
  expiresInDays: 7,
  requiredDocuments: ["ID_PROOF", "ADDRESS_PROOF"],
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
  if (status === "UNDER_REVIEW" || status === "ASSIGNED") return "border-blue-800/60 bg-blue-950/30 text-blue-200";
  if (status === "PENDING_PAYMENT") return "border-amber-800/60 bg-amber-950/30 text-amber-200";
  if (status.includes("FAILED") || status === "CANCELLED" || status === "REJECTED") return "border-red-800/60 bg-red-950/30 text-red-200";
  return "border-blue-800/60 bg-blue-950/30 text-blue-200";
}

function money(value: string | number) {
  return Number(value).toLocaleString("en-IN");
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{children}</label>;
}

export default function AdminNewConnectionsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<NewConnectionRequest[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [form, setForm] = useState<CreateConnectionForm>(defaultForm);

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

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (res.ok) setPlans(data.plans || []);
    } catch {
      setPlans([]);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "TECHNICIAN")) {
      fetchRequests();
      fetchPlans();
    }
  }, [user]);

  const planVariants = useMemo(() => (
    plans.flatMap((plan) => plan.plan_variants.map((variant) => ({ plan, variant })))
  ), [plans]);

  const selectedPlan = useMemo(() => (
    planVariants.find(({ variant }) => variant.id === form.planVariantId)
  ), [form.planVariantId, planVariants]);

  const stats = useMemo(() => ({
    total: requests.length,
    paid: requests.filter((request) => request.status === "PAID" || request.status === "UNDER_REVIEW").length,
    pending: requests.filter((request) => request.status === "PENDING_PAYMENT").length,
    failed: requests.filter((request) => request.status === "PAYMENT_FAILED" || request.status === "PAYMENT_DROPPED" || request.status === "REJECTED").length,
  }), [requests]);

  const updateForm = <K extends keyof CreateConnectionForm>(key: K, value: CreateConnectionForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleDocument = (documentType: string) => {
    setForm((current) => {
      const exists = current.requiredDocuments.includes(documentType);
      const nextDocuments = exists
        ? current.requiredDocuments.filter((item) => item !== documentType)
        : [...current.requiredDocuments, documentType];

      return { ...current, requiredDocuments: nextDocuments };
    });
  };

  const resetCreateForm = () => {
    setForm(defaultForm);
    setCreateError("");
    setCreateSuccess("");
  };

  const submitCreateConnection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const res = await fetch("/api/admin/new-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planVariantId: form.planVariantId,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          installationAddress: form.installationAddress,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
          landmark: form.landmark || undefined,
          notes: form.notes || undefined,
          paymentMode: form.paymentMode,
          uploadMode: form.uploadMode,
          requiredDocuments: form.requiredDocuments,
          expiresInDays: form.expiresInDays,
          sendLink: form.uploadMode === "CUSTOMER_LINK",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create connection request");
        return;
      }

      setCreateSuccess(form.uploadMode === "CUSTOMER_LINK" ? "Connection request created and KYC link sent." : "Connection request created. Manual KYC upload is ready.");
      resetCreateForm();
      setCreateOpen(false);
      fetchRequests(true);
    } catch {
      setCreateError("Failed to create connection request");
    } finally {
      setCreating(false);
    }
  };

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
              <p className="text-slate-400 text-xs mb-1">Payment-backed and admin-created requests</p>
              <h1 className="heading-rhythm text-3xl font-bold">New Connections</h1>
              <p className="text-slate-500 text-sm mt-1">Track new customers, KYC progress, and installation readiness.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                <Plus size={15} /> Create Connection
              </button>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, icon: Cable, color: "text-blue-200 bg-blue-900/40" },
            { label: "In Review", value: stats.paid, icon: CheckSquare, color: "text-emerald-200 bg-emerald-900/30" },
            { label: "Pending Payment", value: stats.pending, icon: Calendar, color: "text-amber-200 bg-amber-900/30" },
            { label: "Failed/Rejected", value: stats.failed, icon: RefreshCw, color: "text-red-200 bg-red-900/30" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}><Icon size={18} /></div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {error && <div className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}
        {createSuccess && <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{createSuccess}</div>}

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
                      {request.request_source && <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs font-medium text-slate-300">{request.request_source.replace(/_/g, " ")}</span>}
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
                        {request.rejection_reason && <p className="text-xs text-red-300 mt-1">Rejected: {request.rejection_reason}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2 text-sm">
                    <p className="font-semibold text-slate-100 flex items-center gap-2"><Ticket size={15} className="text-blue-300" /> References</p>
                    <p className="text-slate-400">Tracking ID: <span className="text-slate-100 font-mono">{request.ticket?.tracking_code || "-"}</span></p>
                    <p className="text-slate-400">Order ID: <span className="text-slate-100 font-mono break-all">{request.cashfree_order_id || "Admin created"}</span></p>
                    <p className="text-slate-400">Payment: <span className="text-slate-100">{request.payment_mode?.replace(/_/g, " ") || "-"}</span></p>
                    <p className="text-slate-400">Paid At: <span className="text-slate-100">{formatDate(request.paid_at)}</span></p>
                    <p className="text-slate-400">Created: <span className="text-slate-100">{formatDate(request.created_at)}</span></p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-blue-950/40 sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Admin connection</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Create New Connection</h2>
                <p className="mt-1 text-sm text-slate-400">Create a pending request, choose KYC flow, and keep activation gated behind approval.</p>
              </div>
              <button
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
                className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
                aria-label="Close create connection modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitCreateConnection} className="mt-5 space-y-5">
              {createError && <div className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{createError}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel>Customer name</FieldLabel>
                  <input value={form.customerName} onChange={(event) => updateForm("customerName", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Phone</FieldLabel>
                  <input value={form.customerPhone} onChange={(event) => updateForm("customerPhone", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <FieldLabel>Email</FieldLabel>
                  <input type="email" value={form.customerEmail} onChange={(event) => updateForm("customerEmail", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <FieldLabel>Installation address</FieldLabel>
                  <textarea value={form.installationAddress} onChange={(event) => updateForm("installationAddress", event.target.value)} className="min-h-20 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-2">
                  <FieldLabel>City</FieldLabel>
                  <input value={form.city} onChange={(event) => updateForm("city", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-2">
                  <FieldLabel>State</FieldLabel>
                  <input value={form.state} onChange={(event) => updateForm("state", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Pin code</FieldLabel>
                  <input value={form.pinCode} onChange={(event) => updateForm("pinCode", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Landmark</FieldLabel>
                  <input value={form.landmark} onChange={(event) => updateForm("landmark", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel>Plan</FieldLabel>
                  <select value={form.planVariantId} onChange={(event) => updateForm("planVariantId", event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" required>
                    <option value="">Select a plan</option>
                    {planVariants.map(({ plan, variant }) => (
                      <option key={variant.id} value={variant.id}>{plan.name} · {variant.speed_mbps} Mbps · {variant.duration_months} months · Rs. {money(variant.price)}</option>
                    ))}
                  </select>
                  {selectedPlan && <p className="text-xs text-slate-500">Selected amount: Rs. {money(selectedPlan.variant.price)}</p>}
                </div>
                <div className="space-y-2">
                  <FieldLabel>Payment mode</FieldLabel>
                  <select value={form.paymentMode} onChange={(event) => updateForm("paymentMode", event.target.value as CreateConnectionForm["paymentMode"])} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
                    <option value="NOT_COLLECTED">Not collected</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <button type="button" onClick={() => updateForm("uploadMode", "CUSTOMER_LINK")} className={`rounded-2xl border p-4 text-left transition ${form.uploadMode === "CUSTOMER_LINK" ? "border-blue-500 bg-blue-950/40" : "border-slate-800 bg-slate-900 hover:border-slate-700"}`}>
                  <Send size={18} className="mb-3 text-blue-300" />
                  <p className="font-semibold text-white">Send customer link</p>
                  <p className="mt-1 text-sm text-slate-400">Customer uploads KYC documents from their email link.</p>
                </button>
                <button type="button" onClick={() => updateForm("uploadMode", "MANUAL_UPLOAD")} className={`rounded-2xl border p-4 text-left transition ${form.uploadMode === "MANUAL_UPLOAD" ? "border-blue-500 bg-blue-950/40" : "border-slate-800 bg-slate-900 hover:border-slate-700"}`}>
                  <UploadCloud size={18} className="mb-3 text-blue-300" />
                  <p className="font-semibold text-white">Manual document upload</p>
                  <p className="mt-1 text-sm text-slate-400">Admin or technician uploads KYC PDFs from the review screen.</p>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                  <FieldLabel>Required documents</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {documentOptions.map((option) => {
                      const checked = form.requiredDocuments.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleDocument(option.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${checked ? "border-blue-500 bg-blue-950/50 text-blue-100" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100"}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Expiry days</FieldLabel>
                  <input type="number" min={1} max={30} value={form.expiresInDays} onChange={(event) => updateForm("expiresInDays", Number(event.target.value))} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} className="min-h-20 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setCreateOpen(false); resetCreateForm(); }} className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" disabled={creating || form.requiredDocuments.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
                  {creating && <Loader2 size={15} className="animate-spin" />}
                  Create request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
