"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Loader2, ShieldCheck, UploadCloud, X, XCircle } from "lucide-react";

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

type UploadProgress = "idle" | "uploading" | "done" | "error";

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

function formatFileSize(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CustomerDocumentUploadClient({ token }: { token: string }) {
  const [request, setRequest] = useState<UploadRequest | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [confirmedDocuments, setConfirmedDocuments] = useState<string[]>([]);
  const [remainingDocuments, setRemainingDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
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
      setSelectedFiles({});
      setConfirmedDocuments([]);
      setRemainingDocuments(data.request.requiredDocuments || []);
      setUploadProgress({});
    } catch {
      setError("Failed to load document upload request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [token]);

  const selectDocument = (documentType: string, file: File | null) => {
    if (!request || !file) return;

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("PDF size must be 10 MB or less.");
      return;
    }

    setError("");
    setMessage("PDF selected. Review and submit when ready.");
    setSelectedFiles((current) => ({ ...current, [documentType]: file }));
    setUploadProgress((current) => ({ ...current, [documentType]: "idle" }));
  };

  const removeSelectedDocument = (documentType: string) => {
    setSelectedFiles((current) => {
      const next = { ...current };
      delete next[documentType];
      return next;
    });
    setUploadProgress((current) => {
      const next = { ...current };
      delete next[documentType];
      return next;
    });
    setMessage("");
  };

  const submitDocuments = async () => {
    if (!request) return;

    const documentsToUpload = request.requiredDocuments.filter((documentType) => {
      return !confirmedDocuments.includes(documentType) && selectedFiles[documentType];
    });

    if (documentsToUpload.length === 0) {
      setError("Select all required PDFs before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("Uploading documents...");

    let activeDocument: string | null = null;
    let latestRemainingDocuments = remainingDocuments;

    try {
      for (const documentType of documentsToUpload) {
        const file = selectedFiles[documentType];
        if (!file) continue;

        activeDocument = documentType;
        setUploadingDocument(documentType);
        setUploadProgress((current) => ({ ...current, [documentType]: "uploading" }));

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
        if (!uploadRes.ok) throw new Error("Failed to upload file. Please try again.");

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

        latestRemainingDocuments = confirmData.request.remainingDocuments || [];
        setConfirmedDocuments(confirmData.request.confirmedDocuments || []);
        setRemainingDocuments(latestRemainingDocuments);
        setRequest((current) => current ? { ...current, status: confirmData.request.status || current.status } : current);
        setUploadProgress((current) => ({ ...current, [documentType]: "done" }));
        setSelectedFiles((current) => {
          const next = { ...current };
          delete next[documentType];
          return next;
        });
      }

      setMessage(latestRemainingDocuments.length === 0 ? "All documents submitted successfully." : "Selected documents submitted successfully.");
    } catch (err) {
      if (activeDocument) {
        const failedDocument = activeDocument;
        setUploadProgress((current) => ({ ...current, [failedDocument]: "error" }));
      }
      setError(err instanceof Error ? err.message : "Failed to submit documents");
    } finally {
      setUploadingDocument(null);
      setSubmitting(false);
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
  const missingSelections = request.requiredDocuments.filter((documentType) => {
    const alreadyConfirmed = confirmedDocuments.includes(documentType) || !remainingDocuments.includes(documentType);
    const hasSelectedFile = Boolean(selectedFiles[documentType]);
    return !alreadyConfirmed && !hasSelectedFile;
  });
  const submitDisabled = submitting || isSubmitted || missingSelections.length > 0;

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
                <p className="mt-1 text-sm text-slate-400">Choose each PDF first, review the selected files, then submit everything together.</p>
              </div>
            </div>

            {error && <div className="mb-4 rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>}
            {message && <div className="mb-4 rounded-xl border border-emerald-800/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{message}</div>}

            <div className="space-y-3">
              {request.requiredDocuments.map((documentType) => {
                const selectedFile = selectedFiles[documentType];
                const progress = uploadProgress[documentType] || "idle";
                const complete = completed.has(documentType) || !remainingDocuments.includes(documentType);
                const isUploading = progress === "uploading" || uploadingDocument === documentType;

                return (
                  <div key={documentType} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`rounded-xl p-2 ${complete ? "bg-emerald-950/50 text-emerald-200" : selectedFile ? "bg-blue-950/50 text-blue-200" : "bg-slate-900 text-slate-400"}`}>
                        {complete ? <CheckCircle2 size={18} /> : isUploading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100">{formatDocument(documentType)}</p>
                        {complete ? (
                          <p className="text-xs text-emerald-300">Uploaded</p>
                        ) : selectedFile ? (
                          <div className="mt-1 space-y-1">
                            <p className="truncate text-xs text-slate-300">{selectedFile.name}</p>
                            <p className="text-xs text-blue-200/80">{formatFileSize(selectedFile.size)} · Ready to submit</p>
                          </div>
                        ) : progress === "error" ? (
                          <p className="text-xs text-red-300">Upload failed. You can submit again.</p>
                        ) : (
                          <p className="text-xs text-slate-500">PDF only, up to 10 MB</p>
                        )}
                      </div>
                    </div>

                    {!isSubmitted && !complete && (
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {selectedFile && !submitting && (
                          <button
                            type="button"
                            onClick={() => removeSelectedDocument(documentType)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-red-500/60 hover:text-red-200"
                          >
                            <X size={14} />
                            Remove
                          </button>
                        )}
                        <label className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${submitting ? "cursor-not-allowed border-slate-700 bg-slate-900 text-slate-500" : "cursor-pointer border-blue-700/60 bg-blue-950/40 text-blue-100 hover:bg-blue-900/40"}`}>
                          {isUploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                          {selectedFile ? "Replace PDF" : "Choose PDF"}
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            disabled={submitting}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              event.target.value = "";
                              selectDocument(documentType, file);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isSubmitted && (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Ready to send documents?</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {missingSelections.length > 0 ? "Select all required PDFs before submitting." : "Files stay in your browser until you submit them."}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={submitDisabled}
                  onClick={submitDocuments}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:mt-0 sm:w-auto"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  Submit Documents
                </button>
              </div>
            )}
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
                <p className="mt-2 text-sm text-slate-400">{isSubmitted ? "All required documents are submitted. Our team will review them next." : `${missingSelections.length} document(s) still need a selected PDF.`}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
