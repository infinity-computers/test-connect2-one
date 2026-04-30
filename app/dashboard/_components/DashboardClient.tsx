"use client";

import { useState, useEffect } from 'react';
import { Wifi, Calendar, Clock, DollarSign, RefreshCw, LogOut, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/ui/StatusBadge';

type SubscriptionStatus = 'active' | 'expired' | 'cancelled';
type PaymentStatus = 'pending' | 'success' | 'failed';

type Subscription = {
  id: string;
  start_date: string;
  end_date: string;
  status: SubscriptionStatus;
  plan_variants: {
    speed_mbps: number;
    duration_months: number;
    price: number;
    plans: { name: string };
  };
  payments: Payment[];
};

type Payment = {
  id: string;
  amount: number;
  status: PaymentStatus;
  payment_date: string | null;
  created_at: string;
  subscriptions: {
    plan_variants: {
      speed_mbps: number;
      duration_months: number;
      plans: { name: string };
    };
  };
};

export default function DashboardClient() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [subRes, payRes] = await Promise.all([
          fetch('/api/subscriptions/me'),
          fetch('/api/payments/me')
        ]);

        const subData = await subRes.json();
        const payData = await payRes.json();

        setSubscription(subData.subscription);
        setPayments(payData.payments || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user || user.role !== 'USER') {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Please sign in to access your dashboard.</p>
          <button onClick={() => onNavigate('/login')} className="btn-primary px-5 py-2.5">Sign In</button>
        </div>
      </div>
    );
  }

  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000)) : 0;
  const totalDays = subscription ? subscription.plan_variants.duration_months * 30 : 0;
  const usedPct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

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
              <p className="text-slate-400 text-xs ml-13 pl-0.5">{user.email} {user.phone && `· ${user.phone}`}</p>
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
          {subscription ? (
            <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-800/60 rounded-xl"><Wifi size={18} /></div>
                    <div>
                      <p className="font-bold text-lg">{subscription.plan_variants.plans.name}</p>
                      <p className="text-slate-400 text-xs">{subscription.plan_variants.plans.name} Plan</p>
                    </div>
                    <StatusBadge status={subscription.status} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {[
                      { icon: Wifi, label: 'Speed', value: `${subscription.plan_variants.speed_mbps} Mbps` },
                      { icon: Clock, label: 'Duration', value: `${subscription.plan_variants.duration_months} Months` },
                      { icon: DollarSign, label: 'Amount', value: `₹${Number(subscription.plan_variants.price).toLocaleString()}` },
                      { icon: Calendar, label: 'Active Since', value: formatDate(subscription.start_date) },
                      { icon: Calendar, label: 'Expires On', value: formatDate(subscription.end_date) },
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
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-slate-400 mb-4">No active subscription found.</p>
              <button onClick={() => onNavigate('/plans')} className="btn-primary px-5 py-2.5">
                View Plans
              </button>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="subheading-rhythm text-lg font-bold text-slate-100">Payment History</h2>
            <button onClick={() => onNavigate('/my-subscriptions')} className="text-sm text-link font-medium">View all</button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {payments.length === 0 ? (
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
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-950 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-100 whitespace-nowrap">{pay.subscriptions?.plan_variants?.plans?.name || 'N/A'}</td>
                        <td className="px-4 py-3.5 text-slate-300">{pay.subscriptions?.plan_variants?.speed_mbps || '-'} Mbps</td>
                        <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{pay.subscriptions?.plan_variants?.duration_months || '-'} Months</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-100">₹{Number(pay.amount).toLocaleString()}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={pay.status} size="sm" /></td>
                        <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{pay.payment_date ? formatDate(pay.payment_date) : '-'}</td>
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
