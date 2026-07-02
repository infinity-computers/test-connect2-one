"use client";

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Send, RefreshCw, LogOut, X, Loader2, Eye, ShieldCheck, UserCheck, Ban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import StatusBadge from '../../../../components/ui/StatusBadge';

type ComplaintStatus = 'PENDING_APPROVAL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

type Ticket = {
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
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
  users: { name: string; email: string; phone: string } | null;
  assigned_technician: { id: string; name: string | null; email: string | null; phone: string | null } | null;
  assigned_at?: string | null;
};

type ComplaintDetail = Ticket & {
  users: { id: string; name: string; email: string; phone: string | null } | null;
};

type Technician = { id: string; name: string | null; email: string | null; phone: string | null };
type FilterTab = 'all' | ComplaintStatus;

const issueTypes = [
  "Internet_speed",
  "Downtime_outage",
  "Billing_error",
  "Equipment_fault",
  "New_connection_delay",
  "Poor_signal",
  "Not_working_more_than_4_hours",
  "Not_working_more_than_24_hours",
  "Not_working_more_than_48_hours",
  "Other",
];

export default function AdminComplaintsClient() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const navigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [loading, setLoading] = useState(true);
  const [tickets, setComplaints] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FilterTab>('all');
  const [otpModal, setOtpModal] = useState<{ ticket: Ticket | null; sent: boolean; verified: boolean; countdown: number }>({
    ticket: null, sent: false, verified: false, countdown: 0,
  });
  const [challengeId, setChallengeId] = useState<string>('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [detail, setDetail] = useState<ComplaintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [createForm, setCreateForm] = useState({ issue_type: '', description: '', assigned_technician_id: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN')) return;

    const fetchData = async () => {
      try {
        const complaintRes = await fetch('/api/admin/tickets');
        const complaintData = await complaintRes.json();
        const complaintList = complaintData.tickets || [];
        setComplaints(complaintList);
        setAssignments(Object.fromEntries(complaintList.map((c: Ticket) => [c.id, c.assigned_technician?.id || ''])));

        if (user.role === 'ADMIN') {
          const userRes = await fetch('/api/admin/users');
          const userData = await userRes.json();
          const techList = (userData.users || []).filter((u: any) => u.role === 'TECHNICIAN');
          setTechnicians(techList);
        }
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN')) {
    return (
      <div className="pt-14 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-slate-300 mb-4">Staff access required.</p>
          <button onClick={() => navigate('/login')} className="btn-primary px-5 py-2.5">Login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-14 min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(c => c.status === filter);

  const tabCounts: Record<FilterTab, number> = {
    all: tickets.length,
    PENDING_APPROVAL: tickets.filter(c => c.status === 'PENDING_APPROVAL').length,
    OPEN: tickets.filter(c => c.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED: tickets.filter(c => c.status === 'RESOLVED').length,
    REJECTED: tickets.filter(c => c.status === 'REJECTED').length,
  };

  const updateComplaint = (next: Ticket) => {
    setComplaints(prev => prev.map(c => (c.id === next.id ? { ...c, ...next } : c)));
    setAssignments(prev => ({ ...prev, [next.id]: next.assigned_technician?.id || '' }));
    if (detail?.id === next.id) setDetail({ ...detail, status: next.status, assigned_technician: next.assigned_technician, assigned_at: next.assigned_at ?? null, updated_at: next.updated_at });
  };

  const patchComplaint = async (id: string, payload: { status?: ComplaintStatus; assigned_technician_id?: string | null }) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ticket) updateComplaint(data.ticket);
    } catch {
      console.error('Failed to update ticket');
    } finally {
      setUpdating(null);
    }
  };

  const openDetails = async (complaintId: string) => {
    setDetailError('');
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/admin/tickets/${complaintId}`);
      const data = await res.json();
      if (!res.ok) {
        setDetailError(data.error || 'Failed to load ticket');
        return;
      }
      setDetail(data.ticket || null);
    } catch {
      setDetailError('Failed to load ticket');
    } finally {
      setDetailLoading(false);
    }
  };

  const startOtpFlow = async (ticket: Ticket) => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setChallengeId('');
    setUpdating(ticket.id);

    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/send-otp`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send OTP');
        return;
      }

      setChallengeId(data.challengeId || '');
      let c = 60;
      setOtpModal({ ticket, sent: true, verified: false, countdown: c });
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
    if (!otpModal.ticket) return;
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    try {
      const res = await fetch(`/api/admin/tickets/${otpModal.ticket.id}/send-otp`, { method: 'POST' });
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
    if (!otpModal.ticket || !challengeId) {
      setOtpError('OTP session expired. Please resend OTP.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/tickets/${otpModal.ticket.id}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Invalid OTP');
        return;
      }

      await patchComplaint(otpModal.ticket.id, { status: 'RESOLVED' });
      setOtpModal(m => ({ ...m, verified: true }));
    } catch {
      setOtpError('Failed to verify OTP');
    }
  };

  const closeModal = () => {
    setOtpModal({ ticket: null, sent: false, verified: false, countdown: 0 });
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setChallengeId('');
  };

  const getUserName = (c: Ticket) => c.users?.name || c.reporter_name || 'Guest';
  const getUserEmail = (c: Ticket) => c.users?.email || c.reporter_email || '-';
  const getUserPhone = (c: Ticket) => c.users?.phone || c.reporter_phone || '-';
  const getAssignedTech = (c: Ticket) => c.assigned_technician?.name || c.assigned_technician?.email || '-';

const progressStages: ComplaintStatus[] = ['PENDING_APPROVAL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];

  const getStageIndex = (status: ComplaintStatus) => progressStages.indexOf(status);

  const renderTicketProgress = (status: ComplaintStatus) => {
    if (status === 'REJECTED') {
      return (
        <div className="mt-2 rounded-lg border border-rose-700/50 bg-rose-900/20 px-3 py-2 text-xs font-medium text-rose-200">
          Ticket rejected by admin
        </div>
      );
    }

    const currentIndex = getStageIndex(status);

    return (
      <div className="mt-2">
        <div className="grid grid-cols-4 gap-2">
          {progressStages.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const label = step === 'PENDING_APPROVAL' ? 'Pending' : step === 'IN_PROGRESS' ? 'In Progress' : step.charAt(0) + step.slice(1).toLowerCase();
            const barClass = 'h-2 w-full rounded-full ' + (isDone ? 'bg-cyan-400' : 'bg-slate-700') + (isCurrent ? ' ring-2 ring-cyan-400/40' : '');
            const textClass = 'text-[10px] font-medium ' + (isDone ? 'text-cyan-200' : 'text-slate-500');

            return (
              <div key={step} className="flex flex-col items-center gap-1">
                <div className={barClass} />
                <span className={textClass}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const createTicket = async () => {
    if (!createForm.issue_type || user.role !== 'ADMIN') return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_type: createForm.issue_type,
          description: createForm.description || null,
          assigned_technician_id: createForm.assigned_technician_id || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setComplaints(prev => [data.ticket, ...prev]);
        setAssignments(prev => ({ ...prev, [data.ticket.id]: data.ticket.assigned_technician?.id || '' }));
        setCreateForm({ issue_type: '', description: '', assigned_technician_id: '' });
      }
    } finally {
      setCreating(false);
    }
  };

  const tabs = [
    { value: 'all' as const, label: 'All', icon: AlertCircle },
    { value: 'PENDING_APPROVAL' as const, label: 'Pending Approval', icon: Clock },
    { value: 'OPEN' as const, label: 'Open', icon: AlertCircle },
    { value: 'IN_PROGRESS' as const, label: 'In Progress', icon: Clock },
    { value: 'RESOLVED' as const, label: 'Resolved', icon: CheckCircle },
    { value: 'REJECTED' as const, label: 'Rejected', icon: Ban },
  ];

  return (
    <div className="pt-14 min-h-screen bg-slate-950">
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-xs mb-1">{user.role === 'ADMIN' ? 'Admin Portal' : 'Technician Portal'}</p>
              <h1 className="subheading-rhythm text-2xl font-bold">Tickets</h1>
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === value ? 'bg-slate-800 text-white shadow-sm border border-slate-600' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600'}`}
            >
              <Icon size={14} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === value ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                {tabCounts[value]}
              </span>
            </button>
          ))}
        </div>
        {user.role === 'ADMIN' && (
          <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-sm text-slate-200 font-semibold mb-3">Create Ticket</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={createForm.issue_type}
                onChange={e => setCreateForm(prev => ({ ...prev, issue_type: e.target.value }))}
                className="input-dark text-sm"
              >
                <option value="">Select issue type</option>
                {issueTypes.map(issue => (
                  <option key={issue} value={issue}>{issue.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <input
                type="text"
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="input-dark text-sm md:col-span-2"
              />
              <div className="flex gap-2">
                <select
                  value={createForm.assigned_technician_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, assigned_technician_id: e.target.value }))}
                  className="input-dark text-sm flex-1"
                >
                  <option value="">Unassigned</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name || t.email || t.phone || t.id}</option>
                  ))}
                </select>
                <button
                  onClick={createTicket}
                  disabled={creating || !createForm.issue_type}
                  className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-sm">
              No tickets in this category.
            </div>
          )}

          {filtered.map(ticket => (
            <div key={ticket.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">#{ticket.id.slice(0, 8)}</span>
                      <span className="text-xs font-mono text-blue-300">{ticket.tracking_code}</span>
                      <StatusBadge status={ticket.status.toLowerCase() as 'pending_approval' | 'open' | 'in_progress' | 'resolved' | 'rejected'} size="sm" />
                      <span className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    <h3 className="subheading-rhythm font-semibold text-slate-100 mb-1">{ticket.issue_type?.replace(/_/g, ' ')}</h3>
                    {ticket.explicit_description && (
                      <p className="copy-rhythm text-sm text-slate-300 mb-3">{ticket.explicit_description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="font-medium text-slate-200">{getUserName(ticket)}</span>
                      <span>{getUserEmail(ticket)}</span>
                      <span>{getUserPhone(ticket)}</span>
                      <span className="text-amber-300">Assigned: {getAssignedTech(ticket)}</span>
                    </div>

                    {renderTicketProgress(ticket.status)}
                  </div>

                  <button
                    onClick={() => openDetails(ticket.id)}
                    className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye size={12} /> View Details
                  </button>
                </div>

                {user.role === 'ADMIN' && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                    <UserCheck size={14} className="text-amber-300" />
                    <select
                      value={assignments[ticket.id] ?? ''}
                      onChange={e => setAssignments(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                      className="input-dark text-sm min-w-[220px]"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>
                          {(t.name || t.email || t.phone || t.id)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => patchComplaint(ticket.id, { assigned_technician_id: assignments[ticket.id] || null })}
                      disabled={updating === ticket.id}
                      className="bg-amber-900/20 hover:bg-amber-900/35 border border-amber-700/60 text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Save Assignment
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {ticket.status === 'PENDING_APPROVAL' && user.role === 'ADMIN' && (
                    <>
                      <button
                        onClick={() => patchComplaint(ticket.id, { status: 'OPEN' })}
                        disabled={updating === ticket.id}
                        className="flex items-center gap-1.5 bg-blue-900/20 hover:bg-blue-900/35 border border-blue-700/60 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating === ticket.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Approve & Open
                      </button>
                      <button
                        onClick={() => patchComplaint(ticket.id, { status: 'REJECTED' })}
                        disabled={updating === ticket.id}
                        className="flex items-center gap-1.5 bg-rose-900/20 hover:bg-rose-900/35 border border-rose-700/60 text-rose-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updating === ticket.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                        Reject
                      </button>
                    </>
                  )}

                  {ticket.status === 'OPEN' && (
                    <button
                      onClick={() => patchComplaint(ticket.id, { status: 'IN_PROGRESS' })}
                      disabled={updating === ticket.id}
                      className="flex items-center gap-1.5 bg-amber-900/20 hover:bg-amber-900/35 border border-amber-700/60 text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updating === ticket.id ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                      Start Working
                    </button>
                  )}

                  {ticket.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        if (user.role === 'TECHNICIAN') startOtpFlow(ticket);
                        else patchComplaint(ticket.id, { status: 'RESOLVED' });
                      }}
                      className="flex items-center gap-1.5 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/60 text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {user.role === 'TECHNICIAN' ? <Send size={12} /> : <ShieldCheck size={12} />}
                      {user.role === 'TECHNICIAN' ? 'Send OTP & Resolve' : 'Mark Resolved'}
                    </button>
                  )}

                  {ticket.status === 'REJECTED' && user.role === 'ADMIN' && (
                    <button
                      onClick={() => patchComplaint(ticket.id, { status: 'PENDING_APPROVAL' })}
                      disabled={updating === ticket.id}
                      className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {updating === ticket.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Re-review
                    </button>
                  )}

                  {ticket.status === 'RESOLVED' && (
                    <span className="flex items-center gap-1.5 bg-emerald-900/20 border border-emerald-700/60 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      <CheckCircle size={12} /> Resolved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {otpModal.ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="subheading-rhythm text-lg font-bold text-slate-100">{otpModal.verified ? 'Ticket Resolved!' : 'Resolve via OTP'}</h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-300 p-1"><X size={18} /></button>
            </div>
            {otpModal.verified ? (
              <div className="text-center">
                <div className="inline-flex p-4 bg-emerald-900/30 rounded-full mb-4"><CheckCircle size={28} className="text-emerald-300" /></div>
                <p className="text-slate-200 text-sm mb-2 font-medium">#{otpModal.ticket.id.slice(0, 8)}</p>
                <p className="text-slate-400 text-sm mb-5">Ticket has been verified and resolved successfully.</p>
                <button onClick={closeModal} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors">Done</button>
              </div>
            ) : (
              <>
                <div className="bg-blue-900/30 border border-blue-700/60 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs text-blue-200 font-medium mb-0.5">Sending OTP to customer email</p>
                  <p className="text-sm font-semibold text-blue-100">{getUserEmail(otpModal.ticket)}</p>
                  <p className="text-xs text-blue-300 mt-1">Tracking Code: {otpModal.ticket.tracking_code}</p>
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
                  {otpModal.countdown > 0 ? <>OTP expires in <span className="font-semibold text-blue-300">{otpModal.countdown}s</span></> : <button onClick={resendOtp} className="text-link font-semibold">Resend OTP to customer</button>}
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 border border-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
                  <button onClick={verifyAndResolve} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5"><CheckCircle size={14} /> Verify & Resolve</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(detailLoading || detail || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="subheading-rhythm text-lg font-bold text-slate-100">Ticket Details</h3>
              <button onClick={() => { setDetail(null); setDetailError(''); setDetailLoading(false); }} className="text-slate-500 hover:text-slate-300 p-1"><X size={18} /></button>
            </div>

            {detailLoading && <div className="flex items-center justify-center py-8"><Loader2 size={28} className="animate-spin text-blue-400" /></div>}
            {detailError && !detailLoading && <div className="text-sm text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{detailError}</div>}

            {detail && !detailLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">#{detail.id.slice(0, 8)}</span>
                  <span className="text-xs font-mono text-blue-300">{detail.tracking_code}</span>
                  <StatusBadge status={detail.status.toLowerCase() as 'pending_approval' | 'open' | 'in_progress' | 'resolved' | 'rejected'} size="sm" />
                  <span className="text-xs text-slate-500">{detail.created_at ? new Date(detail.created_at).toLocaleDateString('en-IN') : '-'}</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Issue Type</p>
                  <p className="text-sm text-slate-100 font-semibold">{detail.issue_type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Assigned Technician</p>
                  <p className="text-sm text-amber-200 font-medium">{detail.assigned_technician?.name || detail.assigned_technician?.email || '-'}</p>
                </div>

                {renderTicketProgress(detail.status)}
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
