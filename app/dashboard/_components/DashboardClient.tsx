"use client";

import { Wifi, Calendar, Clock, DollarSign, RefreshCw, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { activeSubscription, paymentHistory } from '../../../data/mockSubscriptions';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function DashboardClient() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user || user.role !== 'user') {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Please sign in to access your dashboard.</p>
          <button onClick={() => onNavigate('/login')} className="btn-primary px-5 py-2.5">Sign In</button>
        </div>
      </div>
    );
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(activeSubscription.expiresOn).getTime() - Date.now()) / 86400000));
  const totalDays = activeSubscription.months * 30;
  const usedPct = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  return (
    <div className="pt-16 min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-slate-800/70 rounded-full flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Welcome back</p>
                  <h1 className="subheading-rhythm text-xl font-bold">{user.name}</h1>
                </div>
              </div>
              <p className="text-slate-400 text-xs ml-13 pl-0.5">{user.email} &nbsp;·&nbsp; {user.phone}</p>
            </div>
            <button
              onClick={() => { logout(); onNavigate('/'); }}
              className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors self-start sm:self-auto"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Active Subscription */}
        <div>
          <h2 className="subheading-rhythm text-lg font-bold text-slate-100 mb-4">Active Subscription</h2>
          <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-800/60 rounded-xl"><Wifi size={18} /></div>
                  <div>
                    <p className="font-bold text-lg">{activeSubscription.planName}</p>
                    <p className="text-slate-400 text-xs">{activeSubscription.category} Tier</p>
                  </div>
                  <StatusBadge status={activeSubscription.status} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { icon: Wifi, label: 'Speed', value: `${activeSubscription.speed} Mbps` },
                    { icon: Clock, label: 'Duration', value: activeSubscription.duration },
                    { icon: DollarSign, label: 'Amount', value: `₹${activeSubscription.price.toLocaleString()}` },
                    { icon: Calendar, label: 'Active Since', value: activeSubscription.activeSince },
                    { icon: Calendar, label: 'Expires On', value: activeSubscription.expiresOn },
                    { icon: Clock, label: 'Days Left', value: `${daysLeft} days` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={12} className="text-slate-400" />
                        <p className="text-slate-400 text-xs">{label}</p>
                      </div>
                      <p className="font-semibold text-sm">{value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Plan Usage</span>
                    <span className="text-white font-semibold">{usedPct}% used</span>
                  </div>
                  <div className="w-full bg-slate-800/70 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${usedPct > 80 ? 'bg-red-400' : usedPct > 50 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => onNavigate('/my-subscriptions')}
                  className="btn-primary flex items-center gap-2 px-5 py-3 whitespace-nowrap"
                >
                  <RefreshCw size={15} /> Renew Plan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="subheading-rhythm text-lg font-bold text-slate-100">Payment History</h2>
            <button onClick={() => onNavigate('/my-subscriptions')} className="text-sm text-link font-medium">View all</button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {paymentHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No payment history found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800">
                    <tr>
                      {['Plan', 'Speed', 'Duration', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paymentHistory.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-950 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-100 whitespace-nowrap">{pay.plan}</td>
                        <td className="px-4 py-3.5 text-slate-300">{pay.speed} Mbps</td>
                        <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{pay.duration}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-100">₹{pay.amount.toLocaleString()}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={pay.status} size="sm" /></td>
                        <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{pay.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
