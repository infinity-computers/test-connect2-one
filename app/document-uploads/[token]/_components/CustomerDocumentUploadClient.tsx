"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Loader2, ShieldCheck, UploadCloud, XCircle } from "lucide-react";

type UploadRequest = {
  id: string;
  status: string;
  uploadMode: string;
  requiredDocuments: string[];
  expiresAt: string;
  createdAt: string;
  connection: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    city: string;
    state: string;
    plan: {
      name: string;
      speedMbps: number;
      durationMonths: number;
    };
  };
};

function formatDocument(value: string) {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerDocumentUploadClient({ token }: { token: string }) {
  const [request, setRequest] = useState<UploadRequest | null>(null);
  const [confirmedDocuments, setConfirmedDocuments] = useState<string[]>([]);
  const [remainingDocuments, setRemainingDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [terminalMessage, setTerminalMessage] = useState("");

  const fetchRequest = async () => {
    setLoading(true);
    setError("");
    setTerminalMessage("");

    try {
      const res = await fetch(`/api/document-uploads/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setTerminalMessage(data.error || "This document upload link is not available.");
        setRequest(null);
        return;
      }

      setRequest(data.request);
      setConfirmedDocuments([]);
      setRemainingDocuments(data.request.requiredDocuments || []);
    } catch {
      setError("Failed to load document upload request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [token]);

  const uploadDocument = async (documentType: string, file: File | null) => {
    if (!request || !file) return;

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }

    setUploadingDocument(documentType);
    setError("");
    setMessage("");

    try {
      const presignRes = await fetch(`/api/document-uploads/${token}/presign`, {
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
      if (!uploadRes.ok) throw new Error("Failed to upload file");

      const confirmRes = await fetch(`/api/document-uploads/${token}/confirm`, {
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

      setConfirmedDocuments(confirmData.request.confirmedDocuments || []);
      setRemainingDocuments(confirmData.request.remainingDocuments || []);
      setMessage(confirmData.request.remainingDocuments?.length === 0 ? "All documents submitted successfully." : "Document uploaded successfully.");
      if (confirmData.request.status === "SUBMITTED") {
        setRequest((current) => current ? { ...current, status: "SUBMITTED" } : current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploadingDocument(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <Loader2 size={34} className="animate-spin text-blue-300" />
      </main>
    );
  }

  if (terminalMessage || !request) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-8 text-center">
          <XCircle size={36} className="mx-auto mb-4 text-red-300" />
          <h1 className="text-2xl font-bold">Upload link unavailable</h1>
          <p className="mt-3 text-sm text-slate-400">{terminalMessage || "This document upload link is not available."}</p>
        </div>
      </main>
    );
  }

  const completed = new Set(confirmedDocuments);
  const isSubmitted = request.status === "SUBMITTED" || remainingDocuments.length === 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-slate-900 bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/40 px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Connect One KYC</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Upload your connection documents</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Submit the required PDFs for your new broadband connection. Your link expires on {formatDate(request.expiresAt)}.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-blue-950/50 p-3 text-blue-200"><FileText size={22} /></div>
              <div>
                <h2 className="text-xl font-bold">Required documents</h2>
                <p className="mt-1 text-sm text-slate-400">Upload each document as a PDF. You can replace a document before final submission by uploading it again.</p>
              </div>
            </div>

            {error && <div className="mb-4 rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}
            {message && <div className="mb-4 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{message}</div>}

            <div className="space-y-3">
              {request.requiredDocuments.map((documentType) => {
                const complete = completed.has(documentType) || !remainingDocuments.includes(documentType);
                return (
                  <div key={documentType} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2 ${complete ? "bg-emerald-950/50 text-emerald-200" : "bg-slate-900 text-slate-400"}`}>
                        {complete ? <CheckCircle2 size={18} /> : <FileText size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{formatDocument(documentType)}</p>
                        <p className="text-xs text-slate-500">PDF only, up to 10 MB</p>
                      </div>
                    </div>
                    {!isSubmitted && (
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-700/60 bg-blue-950/40 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-900/40">
                        {uploadingDocument === documentType ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                        {complete ? "Replace PDF" : "Upload PDF"}
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          disabled={Boolean(uploadingDocument)}
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            event.target.value = "";
                            uploadDocument(documentType, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="mb-4 rounded-2xl border border-blue-800/50 bg-blue-950/20 p-4 text-blue-100">
              <p className="text-sm font-bold">{request.connection.plan.name}</p>
              <p className="text-xs text-blue-200/80">{request.connection.plan.speedMbps} Mbps · {request.connection.plan.durationMonths} months</p>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-semibold text-slate-100">{request.connection.customerName}</p>
              </div>
              <div>
                <p className="text-slate-500">Contact</p>
                <p className="text-slate-200">{request.connection.customerPhone}</p>
                <p className="text-slate-400">{request.connection.customerEmail}</p>
              </div>
              <div>
                <p className="text-slate-500">Location</p>
                <p className="text-slate-200">{request.connection.city}, {request.connection.state}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-slate-100">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  <span className="font-semibold">Status</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{isSubmitted ? "All required documents are submitted. Our team will review them next." : `${remainingDocuments.length} document(s) remaining.`}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
