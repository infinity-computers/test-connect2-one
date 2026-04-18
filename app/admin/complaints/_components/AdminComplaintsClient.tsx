"use client";

import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Send, RefreshCw, LogOut, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { mockComplaints as initialComplaints, Complaint, ComplaintStatus } from '../../../../data/mockComplaints';
import StatusBadge from '../../../../components/ui/StatusBadge';

type FilterTab = 'all' | ComplaintStatus;

export default function AdminComplaintsClient() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const navigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [otpModal, setOtpModal] = useState<{ complaint: Complaint | null; sent: boolean; verified: boolean; countdown: number }>({
    complaint: null, sent: false, verified: false, countdown: 0,
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');

  if (!user || (user.role !== 'admin' && user.role !== 'technician')) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-slate-300 mb-4">Staff access required.</p>
          <button onClick={() => navigate('/admin/login')} className="btn-primary px-5 py-2.5">Login</button>
        </div>
      </div>
    );
  }

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  const tabCounts: Record<FilterTab, number> = {
    all: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  const updateStatus = (id: string, status: ComplaintStatus) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c));
  };

  const openOtpFlow = (complaint: Complaint) => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    let c = 60;
    setOtpModal({ complaint, sent: true, verified: false, countdown: c });
    const timer = setInterval(() => {
      c--;
      setOtpModal(m => ({ ...m, countdown: c }));
      if (c <= 0) clearInterval(timer);
    }, 1000);
  };

  const resendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    let c = 60;
    setOtpModal(m => ({ ...m, countdown: c, verified: false }));
    const timer = setInterval(() => {
      c--;
      setOtpModal(m => ({ ...m, countdown: c }));
      if (c <= 0) clearInterval(timer);
    }, 1000);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`rotp-${idx + 1}`)?.focus();
  };

  const verifyAndResolve = () => {
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Enter all 6 digits.'); return; }
    setOtpError('');
    if (otpModal.complaint) {
      updateStatus(otpModal.complaint.id, 'resolved');
      setOtpModal(m => ({ ...m, verified: true }));
    }
  };

  const closeModal = () => {
    setOtpModal({ complaint: null, sent: false, verified: false, countdown: 0 });
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
  };

  const tabs: { value: FilterTab; label: string; icon: typeof CheckCircle }[] = [
    { value: 'all', label: 'All', icon: AlertCircle },
    { value: 'open', label: 'Open', icon: AlertCircle },
    { value: 'in_progress', label: 'In Progress', icon: Clock },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle },
  ];

  return (
    <div className="pt-16 min-h-screen bg-slate-950">
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-xs mb-1">{user.role === 'admin' ? 'Admin Portal' : 'Technician Portal'}</p>
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
                ? value === 'open' ? 'bg-blue-600 text-white shadow-sm'
                  : value === 'in_progress' ? 'bg-amber-900/35 text-white shadow-sm'
                    : value === 'resolved' ? 'bg-emerald-600 text-white shadow-sm'
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
            <div key={complaint.id} className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all ${complaint.status === 'open' ? 'border-blue-700/60' : complaint.status === 'in_progress' ? 'border-amber-700/60' : 'border-slate-800'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-500">{complaint.id}</span>
                    <StatusBadge status={complaint.status} size="sm" />
                    <span className="text-xs text-slate-500">{new Date(complaint.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <h3 className="subheading-rhythm font-semibold text-slate-100 mb-1">{complaint.issueType}</h3>
                  {complaint.description && (
                    <p className="copy-rhythm text-sm text-slate-300 mb-3">{complaint.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-200">{complaint.userName}</span>
                    <span>{complaint.userEmail}</span>
                    <span>{complaint.userPhone}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  {complaint.status === 'open' && (
                    <button
                      onClick={() => updateStatus(complaint.id, 'in_progress')}
                      className="flex items-center gap-1.5 bg-amber-900/20 hover:bg-amber-900/35 border border-amber-700/60 text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Clock size={12} /> Start Working
                    </button>
                  )}
                  {complaint.status === 'in_progress' && (
                    <button
                      onClick={() => openOtpFlow(complaint)}
                      className="flex items-center gap-1.5 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/60 text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Send size={12} /> Send OTP & Resolve
                    </button>
                  )}
                  {complaint.status === 'resolved' && (
                    <span className="flex items-center gap-1.5 bg-emerald-900/20 border border-emerald-700/60 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      <CheckCircle size={12} /> Resolved
                    </span>
                  )}
                  {complaint.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(complaint.id, 'resolved')}
                      className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle size={12} /> Mark Resolved
                    </button>
                  )}
                  {complaint.status === 'resolved' && (
                    <button
                      onClick={() => updateStatus(complaint.id, 'open')}
                      className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <RefreshCw size={12} /> Reopen
                    </button>
                  )}
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
                <p className="text-slate-200 text-sm mb-2 font-medium">{otpModal.complaint.id}</p>
                <p className="text-slate-400 text-sm mb-5">Complaint has been verified and resolved successfully.</p>
                <button onClick={closeModal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="bg-blue-900/30 border border-blue-700/60 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs text-blue-200 font-medium mb-0.5">Sending OTP to customer</p>
                  <p className="text-sm font-semibold text-blue-100">{otpModal.complaint.userName}</p>
                  <p className="text-xs text-blue-300">{otpModal.complaint.userPhone}</p>
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
    </div>
  );
}
