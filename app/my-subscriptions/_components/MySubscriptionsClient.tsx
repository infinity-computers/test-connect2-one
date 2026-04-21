"use client";

import { useState, useEffect } from 'react';
import { Wifi, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/ui/StatusBadge';

type PlanVariant = {
  id: string;
  speed_mbps: number;
  duration_months: number;
  price: number;
  plans: { name: string };
};

type Subscription = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  plan_variants: PlanVariant;
};

type PaymentStatus = 'pending' | 'success' | 'failed';

type Payment = {
  id: string;
  amount: number;
  status: PaymentStatus;
  payment_date: string | null;
  created_at: string;
  razorpay_payment_id: string | null;
  subscriptions: { plan_variants: PlanVariant } | null;
};

type PlanCategory = 'Premium' | 'Budget' | 'Eco';

type ApiPlan = {
  id: string;
  name: string;
  description: string | null;
  plan_variants: {
    id: string;
    speed_mbps: number;
    duration_months: number;
    price: number;
  }[];
};

const durationMap: Record<number, string> = { 3: '3m', 6: '6m', 12: '12m' };
const durationLabels: Record<string, string> = { '3m': '3 Months', '6m': '6 Months', '12m': '12 Months' };

export default function MySubscriptionsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>('Budget');
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [plansRes, subRes, payRes] = await Promise.all([
          fetch('/api/plans'),
          fetch('/api/subscriptions/me'),
          fetch('/api/payments/me')
        ]);

        const plansData = await plansRes.json();
        const subData = await subRes.json();
        const payData = await payRes.json();

        setPlans(plansData.plans || []);
        setSubscription(subData.subscription);
        setPayments(payData.payments || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
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
          <p className="text-slate-300 mb-4">Please sign in to view your subscriptions.</p>
          <button onClick={() => onNavigate('/login')} className="btn-primary px-5 py-2.5">Sign In</button>
        </div>
      </div>
    );
  }

  const filteredPlans = plans.filter(p => p.name === selectedCategory);
  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / 86400000)) : 0;

  const selectedVariant = plans
    .flatMap(p => p.plan_variants)
    .find(v => v.id === selectedVariantId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleRenew = async () => {
    if (!selectedVariantId) return;
    setProcessingPayment(true);

    try {
      const res = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription?.id,
          planVariantId: selectedVariantId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to create payment');
        setProcessingPayment(false);
        return;
      }

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Something went wrong. Please try again.');
    }
    setProcessingPayment(false);
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
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate('/dashboard')} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="heading-rhythm text-3xl font-bold">My Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your active plan and renew your subscription.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Active Subscription Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="subheading-rhythm text-base font-bold text-slate-100 mb-4">Current Active Plan</h2>
          {subscription ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Plan', value: subscription.plan_variants.plans.name },
                { label: 'Speed', value: `${subscription.plan_variants.speed_mbps} Mbps` },
                { label: 'Duration', value: `${subscription.plan_variants.duration_months} Months` },
                { label: 'Amount Paid', value: `₹${Number(subscription.plan_variants.price).toLocaleString()}` },
                { label: 'Expires On', value: formatDate(subscription.end_date) },
                { label: 'Days Left', value: `${daysLeft} days` },
              ].map(item => (
                <div key={item.label} className="bg-slate-950 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-100">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Wifi size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active subscription found.</p>
            </div>
          )}
        </div>

        {/* Renewal Plans */}
        <div>
          <h2 className="subheading-rhythm text-base font-bold text-slate-100 mb-4">Select Renewal Plan</h2>

          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-1 bg-slate-900 rounded-xl border border-slate-700 p-1 shadow-sm">
              {(['Premium', 'Budget', 'Eco'] as PlanCategory[]).map(cat => (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedVariantId(null); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-slate-100'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPlans[0]?.plan_variants.map(variant => {
              const isSelected = selectedVariantId === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`relative text-left bg-slate-900 border-2 rounded-2xl p-5 transition-all hover:shadow-md ${isSelected ? 'border-blue-500 shadow-md bg-blue-900/40' : 'border-slate-800'}`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-2xl font-black text-slate-100">{variant.speed_mbps}</span>
                    <span className="text-sm text-slate-500 mb-0.5">Mbps</span>
                  </div>
                  <p className="text-xl font-bold text-blue-400">₹{Number(variant.price).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{durationLabels[durationMap[variant.duration_months]]}</p>
                  <p className="text-xs text-emerald-300 mt-1">₹{Math.round(Number(variant.price) / variant.duration_months)}/mo avg</p>
                </button>
              );
            })}
          </div>

          {selectedVariant && (
            <div className="mt-5 bg-slate-900 border border-blue-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Selected: <span className="text-blue-300">{selectedVariant.speed_mbps} Mbps {selectedCategory} – {durationLabels[durationMap[selectedVariant.duration_months]]}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Total: <span className="font-bold text-slate-100">₹{Number(selectedVariant.price).toLocaleString()}</span></p>
              </div>
              <button
                onClick={() => setShowRenewModal(true)}
                className="btn-primary px-7 py-3 whitespace-nowrap"
              >
                Proceed to Renew
              </button>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <h2 className="subheading-rhythm text-base font-bold text-slate-100 mb-4">Payment History</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {payments.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No payment history found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800">
                    <tr>
                      {['#', 'Plan', 'Speed', 'Duration', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.map((pay, idx) => (
                      <tr key={pay.id} className="hover:bg-slate-950 transition-colors">
                        <td className="px-4 py-3.5 text-slate-500 text-xs">{idx + 1}</td>
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

      {/* Renewal Modal */}
      {showRenewModal && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="inline-flex p-3 bg-blue-900/40 rounded-full mb-4">
              <Wifi size={24} className="text-blue-400" />
            </div>
            <h3 className="subheading-rhythm text-xl font-bold text-slate-100 mb-2">Confirm Renewal</h3>
            <p className="text-slate-400 text-sm mb-5">
              {selectedVariant.speed_mbps} Mbps {selectedCategory} Plan<br />
              {durationLabels[durationMap[selectedVariant.duration_months]]} — <strong>₹{Number(selectedVariant.price).toLocaleString()}</strong>
            </p>
            <div className="bg-amber-900/20 border border-amber-700/60 rounded-xl px-4 py-3 mb-5 text-xs text-amber-200">
              You will be redirected to Razorpay to complete payment.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRenewModal(false)} className="flex-1 border border-slate-700 text-slate-200 hover:border-slate-600 font-semibold py-2.5 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={handleRenew}
                disabled={processingPayment}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {processingPayment ? <Loader2 size={16} className="animate-spin" /> : null}
                {processingPayment ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
