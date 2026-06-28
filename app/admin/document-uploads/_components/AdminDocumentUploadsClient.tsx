"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileText, Loader2, RefreshCw, Send, ShieldCheck, TimerReset, UploadCloud, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";

type KycFile = {
  id: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedByType: string;
  createdAt: string;
  downloadPath: string;
};

type KycRequest = {
  id: string;
  status: string;
  uploadMode: string;
  requiredDocuments: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  files: KycFile[];
  connection: {
    id: string;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    city: string;
    state: string;
    pinCode: string;
    paidAt: string | null;
    createdAt: string;
    plan: {
      name: string;
      speedMbps: number;
      durationMonths: number;
    };
  };
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

function formatDocument(value: string) {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}

function statusTone(status: string) {
  if (status === "SUBMITTED") return "border-emerald-800/60 bg-emerald-950/30 text-emerald-200";
  if (status === "PENDING") return "border-blue-800/60 bg-blue-950/30 text-blue-200";
  if (status === "EXPIRED") return "border-amber-800/60 bg-amber-950/30 text-amber-200";
  return "border-red-800/60 bg-red-950/30 text-red-200";
}

function fileSizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocumentUploadsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const query = status === "all" ? "" : `?status=${status}`;
      const res = await fetch(`/api/admin/document-uploads${query}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch KYC requests");
        return;
      }
      setRequests(data.requests || []);
    } catch {
      setError("Failed to fetch KYC requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "TECHNICIAN")) fetchRequests();
  }, [user, status]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === "PENDING").length,
    submitted: requests.filter((request) => request.status === "SUBMITTED").length,
    blocked: requests.filter((request) => request.status === "EXPIRED" || request.status === "CANCELLED").length,
  }), [requests]);

  const runAction = async (requestId: string, action: () => Promise<string>) => {
    setBusyId(requestId);
    setError("");
    setMessage("");

    try {
      const nextMessage = await action();
      setMessage(nextMessage);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const downloadFile = async (file: KycFile) => {
    const res = await fetch(file.downloadPath);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create download link");
    window.open(data.download.url, "_blank", "noopener,noreferrer");
  };

  const uploadManualDocument = async (request: KycRequest, documentType: string, file: File | null) => {
    if (!file) return;

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }

    const key = `${request.id}:${documentType}`;
    setUploadingKey(key);
    setBusyId(request.id);
    setError("");
    setMessage("");

    try {
      const presignRes = await fetch(`/api/admin/document-uploads/${request.id}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || "Failed to prepare upload");

      const uploadRes = await fetch(presignData.upload.url, {
        method: "PUT",
        headers: presignData.upload.headers,
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file to storage");

      const confirmRes = await fetch(`/api/admin/document-uploads/${request.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          s3Key: presignData.upload.s3Key,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || "Failed to confirm upload");

      setMessage("Document uploaded successfully.");
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploadingKey(null);
      setBusyId(null);
    }
  };

  const resendLink = (request: KycRequest) => runAction(request.id, async () => {
    const res = await fetch(`/api/admin/document-uploads/${request.id}/send-link`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to resend link");
    return `KYC link sent to ${data.sentTo}`;
  });

  const extendRequest = (request: KycRequest) => runAction(request.id, async () => {
    const res = await fetch(`/api/admin/document-uploads/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: 7 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to extend request");
    return "KYC request extended by 7 days.";
  });

  const cancelRequest = (request: KycRequest) => runAction(request.id, async () => {
    const res = await fetch(`/api/admin/document-uploads/${request.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to cancel request");
    return "KYC request cancelled.";
  });

  const approveConnection = (request: KycRequest) => runAction(request.id, async () => {
    const res = await fetch(`/api/admin/new-connections/${request.connection.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to approve connection");
    return "Connection approved and subscription created.";
  });

  const rejectConnection = (request: KycRequest) => runAction(request.id, async () => {
    const reason = window.prompt("Reason for rejection?")?.trim();
    if (!reason) throw new Error("Rejection reason is required");

    const res = await fetch(`/api/admin/new-connections/${request.connection.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECT", rejectionReason: reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reject connection");
    return "Connection request rejected.";
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Admin access required.</p>
          <button onClick={() => router.push("/login")} className="btn-primary px-5 py-2.5">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-slate-950 text-white">
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.push("/admin/dashboard")} className="mb-3 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300">KYC review desk</p>
              <h1 className="heading-rhythm mt-1 text-3xl font-bold">Document Uploads</h1>
              <p className="mt-1 text-sm text-slate-500">Review customer documents, resend links, and approve or reject new connections.</p>
            </div>
            <button onClick={fetchRequests} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "text-blue-200 bg-blue-900/40" },
            { label: "Pending", value: stats.pending, icon: TimerReset, color: "text-blue-200 bg-blue-900/30" },
            { label: "Submitted", value: stats.submitted, icon: ShieldCheck, color: "text-emerald-200 bg-emerald-900/30" },
            { label: "Blocked", value: stats.blocked, icon: XCircle, color: "text-red-200 bg-red-900/30" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}><Icon size={18} /></div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "PENDING", "SUBMITTED", "EXPIRED", "CANCELLED"].map((item) => (
              <button
                key={item}
                onClick={() => setStatus(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status === item ? "border-blue-500 bg-blue-950/50 text-blue-100" : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-100"}`}
              >
                {item === "all" ? "All" : item.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <button onClick={() => router.push("/admin/new-connections")} className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">New connections</button>
        </div>

        {error && <div className="rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{message}</div>}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={30} className="animate-spin text-blue-300" /></div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-500">No KYC document requests found.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const uploadedTypes = new Set(request.files.map((file) => file.documentType));
              const remaining = request.requiredDocuments.filter((documentType) => !uploadedTypes.has(documentType));
              const busy = busyId === request.id;
              const canApprove = user.role === "ADMIN" && request.status === "SUBMITTED" && remaining.length === 0 && request.connection.status !== "ACTIVATED";

              return (
                <div key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(request.status)}`}>{request.status.replace(/_/g, " ")}</span>
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">{request.uploadMode.replace(/_/g, " ")}</span>
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">Connection {request.connection.status.replace(/_/g, " ")}</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-100">{request.connection.customerName}</h2>
                      <p className="text-sm text-slate-400">{request.connection.customerPhone} · {request.connection.customerEmail}</p>
                      <p className="mt-1 text-xs text-slate-500">{request.connection.city}, {request.connection.state} - {request.connection.pinCode}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-800/50 bg-blue-950/20 px-4 py-3 text-sm text-blue-100 lg:text-right">
                      <p className="font-bold">{request.connection.plan.name} {request.connection.plan.speedMbps} Mbps</p>
                      <p className="text-blue-200/80">{request.connection.plan.durationMonths} months · expires {formatDate(request.expiresAt)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-100">Required documents</p>
                      <div className="flex flex-wrap gap-2">
                        {request.requiredDocuments.map((documentType) => {
                          const complete = uploadedTypes.has(documentType);
                          const uploadKey = `${request.id}:${documentType}`;
                          const canUpload = request.uploadMode === "MANUAL_UPLOAD" && request.status === "PENDING" && !complete;

                          return (
                            <div key={documentType} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${complete ? "border-emerald-800 bg-emerald-950/40 text-emerald-200" : "border-slate-800 bg-slate-900 text-slate-400"}`}>
                              {complete && <CheckCircle2 size={13} />}
                              <span>{formatDocument(documentType)}</span>
                              {canUpload && (
                                <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-blue-800/70 bg-blue-950/40 px-2 py-0.5 text-blue-200 hover:text-white">
                                  {uploadingKey === uploadKey ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                                  Upload
                                  <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    disabled={Boolean(uploadingKey)}
                                    onChange={(event) => {
                                      const file = event.target.files?.[0] ?? null;
                                      event.target.value = "";
                                      uploadManualDocument(request, documentType, file);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {remaining.length > 0 && <p className="mt-3 text-xs text-slate-500">Remaining: {remaining.map(formatDocument).join(", ")}</p>}
                      {request.uploadMode === "MANUAL_UPLOAD" && request.status === "PENDING" && remaining.length > 0 && <p className="mt-2 text-xs text-blue-200/80">Upload PDFs here to complete manual KYC before approval.</p>}
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="mb-3 text-sm font-semibold text-slate-100">Uploaded files</p>
                      {request.files.length === 0 ? (
                        <p className="text-sm text-slate-500">No files uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {request.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-100">{formatDocument(file.documentType)}</p>
                                <p className="truncate text-xs text-slate-500">{file.originalFileName} · {fileSizeLabel(file.fileSize)} · {file.uploadedByType}</p>
                              </div>
                              <button
                                onClick={() => runAction(request.id, async () => { await downloadFile(file); return "Download link opened."; })}
                                className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white"
                                aria-label={`Download ${file.originalFileName}`}
                              >
                                <Download size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {request.uploadMode === "CUSTOMER_LINK" && request.status === "PENDING" && (
                      <button disabled={busy} onClick={() => resendLink(request)} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"><Send size={14} /> Resend link</button>
                    )}
                    {(request.status === "PENDING" || request.status === "EXPIRED") && (
                      <button disabled={busy} onClick={() => extendRequest(request)} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"><TimerReset size={14} /> Extend 7 days</button>
                    )}
                    {request.status !== "SUBMITTED" && request.status !== "CANCELLED" && (
                      <button disabled={busy} onClick={() => cancelRequest(request)} className="inline-flex items-center gap-2 rounded-xl border border-red-800/70 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-950/30 disabled:opacity-60"><XCircle size={14} /> Cancel KYC</button>
                    )}
                    {canApprove && (
                      <button disabled={busy} onClick={() => approveConnection(request)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"><ShieldCheck size={14} /> Approve connection</button>
                    )}
                    {user.role === "ADMIN" && request.connection.status !== "ACTIVATED" && request.connection.status !== "REJECTED" && (
                      <button disabled={busy} onClick={() => rejectConnection(request)} className="inline-flex items-center gap-2 rounded-xl border border-red-800/70 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-950/30 disabled:opacity-60">Reject connection</button>
                    )}
                    {busy && <span className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-400"><Loader2 size={14} className="animate-spin" /> Working</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
