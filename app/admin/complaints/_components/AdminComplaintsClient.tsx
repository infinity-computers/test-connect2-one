"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Send, RefreshCw, LogOut, X, Loader2, Eye, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import StatusBadge from '../../../../components/ui/StatusBadge';

type Complaint = {
  id: string;
  tracking_code: string;
  user_id: string | null;
  source: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  reporter_email: string | null;
  reporter_address: string | null;
  city?: string | null;
  state?: string | null;
  pin_code?: string | null;
  issue_type: string;
  explicit_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  users: { name: string; email: string; phone: string } | null;
};

type ComplaintDetail = Complaint & {
  users: { id: string; name: string; email: string; phone: string | null } | null;
};

type FilterTab = 'all' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export default function AdminComplaintsClient() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const navigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [otpModal, setOtpModal] = useState<{ complaint: Complaint | null; sent: boolean; verified: boolean; countdown: number }>({
    complaint: null, sent: false, verified: false, countdown: 0,
  });
  const [challengeId, setChallengeId] = useState<string>('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [detail, setDetail] = useState<ComplaintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN')) return;

    const fetchComplaints = async () => {
      try {
        const res = await fetch('/api/admin/complaints');
        const data = await res.json();
        setComplaints(data.complaints || []);
      } catch (err) {
        console.error('Failed to fetch complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN')) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-slate-300 mb-4">Staff access required.</p>
          <button onClick={() => navigate('/login')} className="btn-primary px-5 py-2.5">Login</button>
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

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  const tabCounts: Record<FilterTab, number> = {
    all: complaints.length,
    OPEN: complaints.filter(c => c.status === 'OPEN').length,
    IN_PROGRESS: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED: complaints.filter(c => c.status === 'RESOLVED').length,
  };

  const updateStatus = async (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch {
      console.error('Failed to update status');
    }
    setUpdating(null);
  };

  const openDetails = async (complaintId: string) => {
    setDetailError('');
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}`);
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error || 'Failed to load complaint');
        return;
      }
      setDetail(data.complaint || null);
    } catch {
      setDetailError('Failed to load complaint');
    } finally {
      setDetailLoading(false);
    }
  };

  const startOtpFlow = async (complaint: Complaint) => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setChallengeId('');
    setUpdating(complaint.id);

    try {
      const res = await fetch(`/api/admin/complaints/${complaint.id}/send-otp`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send OTP');
        return;
      }

      setChallengeId(data.challengeId || '');
      let c = 60;
      setOtpModal({ complaint, sent: true, verified: false, countdown: c });
      const timer = setInterval(() => {
        c--;
        setOtpModal(m => ({ ...m, countdown: c }));
        if (c <= 0) clearInterval(timer);
      }, 1000);
    } catch {
      setOtpError('Failed to send OTP');
    } finally {
      setUpdating(null);
    }
  };

  const resendOtp = async () => {
    if (!otpModal.complaint) return;
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    try {
      const res = await fetch(`/api/admin/complaints/${otpModal.complaint.id}/send-otp`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send OTP');
        return;
      }
      setChallengeId(data.challengeId || '');
      let c = 60;
      setOtpModal(m => ({ ...m, countdown: c, verified: false }));
      const timer = setInterval(() => {
        c--;
        setOtpModal(m => ({ ...m, countdown: c }));
        if (c <= 0) clearInterval(timer);
      }, 1000);
    } catch {
      setOtpError('Failed to send OTP');
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`rotp-${idx + 1}`)?.focus();
  };

  const verifyAndResolve = async () => {
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Enter all 6 digits.'); return; }
    setOtpError('');
    if (!otpModal.complaint || !challengeId) {
      setOtpError('OTP session expired. Please resend OTP.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/complaints/${otpModal.complaint.id}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp: code })
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Invalid OTP');
        return;
      }

      updateStatus(otpModal.complaint.id, 'RESOLVED');
      setOtpModal(m => ({ ...m, verified: true }));
    } catch {
      setOtpError('Failed to verify OTP');
    }
  };

  const closeModal = () => {
    setOtpModal({ complaint: null, sent: false, verified: false, countdown: 0 });
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setChallengeId('');
  };

  const getUserName = (c: Complaint) => c.users?.name || c.reporter_name || 'Guest';
  const getUserEmail = (c: Complaint) => c.users?.email || c.reporter_email || '-';
  const getUserPhone = (c: Complaint) => c.users?.phone || c.reporter_phone || '-';

  const tabs: { value: FilterTab; label: string; icon: typeof CheckCircle }[] = [
    { value: 'all', label: 'All', icon: AlertCircle },
    { value: 'OPEN', label: 'Open', icon: AlertCircle },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: Clock },
    { value: 'RESOLVED', label: 'Resolved', icon: CheckCircle },
  ];

  return (
    <div className="pt-16 min-h-screen bg-slate-950">
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-xs mb-1">{user.role === 'ADMIN' ? 'Admin Portal' : 'Technician Portal'}</p>
              <h1 className="subheading-rhythm text-2xl font-bold">Complaints</h1>
              <p className="text-slate-500 text-sm mt-0.5">Welcome, {user.name}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === value
                ? value === 'OPEN' ? 'bg-blue-600 text-white shadow-sm'
                  : value === 'IN_PROGRESS' ? 'bg-amber-900/35 text-white shadow-sm'
                    : value === 'RESOLVED' ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
            >
              <Icon size={14} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === value ? 'bg-slate-800/70 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {tabCounts[value]}
              </span>
            </button>
          ))}
        </div>

        {/* Complaints List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
              No complaints in this category.
            </div>
          )}
          {filtered.map(complaint => (
            <div key={complaint.id} className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all ${complaint.status === 'OPEN' ? 'border-blue-700/60' : complaint.status === 'IN_PROGRESS' ? 'border-amber-700/60' : 'border-slate-800'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-500">#{complaint.id.slice(0, 8)}</span>
                    <span className="text-xs font-mono text-blue-300">{complaint.tracking_code}</span>
                    <StatusBadge status={complaint.status.toLowerCase() as 'open' | 'in_progress' | 'resolved'} size="sm" />
                    <span className="text-xs text-slate-500">{new Date(complaint.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <h3 className="subheading-rhythm font-semibold text-slate-100 mb-1">{complaint.issue_type?.replace(/_/g, ' ')}</h3>
                  {complaint.explicit_description && (
                    <p className="copy-rhythm text-sm text-slate-300 mb-3">{complaint.explicit_description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-200">{getUserName(complaint)}</span>
                    <span>{getUserEmail(complaint)}</span>
                    <span>{getUserPhone(complaint)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Status Actions</p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => openDetails(complaint.id)}
                      className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={12} /> View Details
                    </button>
                    {complaint.status === 'OPEN' && (
                      <button
                        onClick={() => updateStatus(complaint.id, 'IN_PROGRESS')}
                        disabled={updating === complaint.id}
                        className="flex items-center gap-1.5 bg-amber-900/20 hover:bg-amber-900/35 border border-amber-700/60 text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating === complaint.id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                        Start Working
                      </button>
                    )}
                    {complaint.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          if (user.role === 'TECHNICIAN') {
                            startOtpFlow(complaint);
                          } else {
                            updateStatus(complaint.id, 'RESOLVED');
                          }
                        }}
                        className="flex items-center gap-1.5 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/60 text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {user.role === 'TECHNICIAN' ? <Send size={12} /> : <ShieldCheck size={12} />}
                        {user.role === 'TECHNICIAN' ? 'Send OTP & Resolve' : 'Mark Resolved'}
                      </button>
                    )}
                    {complaint.status === 'RESOLVED' && (
                      <span className="flex items-center gap-1.5 bg-emerald-900/20 border border-emerald-700/60 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-lg">
                        <CheckCircle size={12} /> Resolved
                      </span>
                    )}
                    {complaint.status === 'OPEN' && user.role === 'ADMIN' && (
                      <button
                        onClick={() => updateStatus(complaint.id, 'RESOLVED')}
                        disabled={updating === complaint.id}
                        className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating === complaint.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Mark Resolved
                      </button>
                    )}
                    {complaint.status === 'RESOLVED' && (
                      <button
                        onClick={() => updateStatus(complaint.id, 'OPEN')}
                        disabled={updating === complaint.id}
                        className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating === complaint.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OTP Modal */}
      {otpModal.complaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="subheading-rhythm text-lg font-bold text-slate-100">
                {otpModal.verified ? 'Complaint Resolved!' : 'Resolve via OTP'}
              </h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-300 p-1">
                <X size={18} />
              </button>
            </div>

            {otpModal.verified ? (
              <div className="text-center">
                <div className="inline-flex p-4 bg-emerald-900/30 rounded-full mb-4">
                  <CheckCircle size={28} className="text-emerald-300" />
                </div>
                <p className="text-slate-200 text-sm mb-2 font-medium">#{otpModal.complaint.id.slice(0, 8)}</p>
                <p className="text-slate-400 text-sm mb-5">Complaint has been verified and resolved successfully.</p>
                <button onClick={closeModal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <>
                  <div className="bg-blue-900/30 border border-blue-700/60 rounded-xl px-4 py-3 mb-5">
                    <p className="text-xs text-blue-200 font-medium mb-0.5">Sending OTP to customer email</p>
                    <p className="text-sm font-semibold text-blue-100">{getUserEmail(otpModal.complaint)}</p>
                    <p className="text-xs text-blue-300 mt-1">Tracking Code: {otpModal.complaint.tracking_code}</p>
                  </div>

                <p className="copy-rhythm text-sm text-slate-300 mb-3">Enter the 6-digit OTP provided by the customer to confirm resolution:</p>

                <div className="flex gap-2 justify-center mb-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`rotp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Backspace' && !digit && idx > 0) document.getElementById(`rotp-${idx - 1}`)?.focus(); }}
                      className="input-dark w-10 h-11 border-2 rounded-xl text-center font-bold text-lg px-0 py-0 focus:border-blue-500"
                    />
                  ))}
                </div>

                {otpError && <p className="text-xs text-red-300 text-center mb-2">{otpError}</p>}

                <div className="text-center text-xs text-slate-400 mb-4">
                  {otpModal.countdown > 0 ? (
                    <>OTP expires in <span className="font-semibold text-blue-300">{otpModal.countdown}s</span></>
                  ) : (
                    <button onClick={resendOtp} className="text-link font-semibold">
                      Resend OTP to customer
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
                  <button
                    onClick={verifyAndResolve}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Verify & Resolve
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {(detailLoading || detail || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="subheading-rhythm text-lg font-bold text-slate-100">
                Complaint Details
              </h3>
              <button
                onClick={() => { setDetail(null); setDetailError(''); setDetailLoading(false); }}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={28} className="animate-spin text-blue-400" />
              </div>
            )}

            {detailError && !detailLoading && (
              <div className="text-sm text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">
                {detailError}
              </div>
            )}

            {detail && !detailLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">#{detail.id.slice(0, 8)}</span>
                  <span className="text-xs font-mono text-blue-300">{detail.tracking_code}</span>
                  <StatusBadge status={detail.status.toLowerCase() as 'open' | 'in_progress' | 'resolved'} size="sm" />
                  <span className="text-xs text-slate-500">{detail.created_at ? new Date(detail.created_at).toLocaleDateString('en-IN') : '-'}</span>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Issue Type</p>
                  <p className="text-sm text-slate-100 font-semibold">{detail.issue_type?.replace(/_/g, ' ')}</p>
                </div>

                {detail.explicit_description && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-slate-300">{detail.explicit_description}</p>
                  </div>
                )}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Reporter Info</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-200">{detail.users?.name || detail.reporter_name || 'Guest'}</p>
                    <p className="text-slate-400">{detail.users?.email || detail.reporter_email || '-'}</p>
                    <p className="text-slate-400">{detail.users?.phone || detail.reporter_phone || '-'}</p>
                  </div>
                </div>

                {detail.source === 'GUEST' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Guest Address</p>
                    <div className="space-y-1 text-sm text-slate-300">
                      <p>{detail.reporter_address || '-'}</p>
                      <p>{detail.city || '-'}{detail.state ? `, ${detail.state}` : ''}</p>
                      <p>{detail.pin_code || '-'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
