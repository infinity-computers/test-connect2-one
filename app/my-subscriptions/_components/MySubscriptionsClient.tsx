"use client";

import { useState } from 'react';
import { Wifi, Check, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { activeSubscription, paymentHistory } from '../../../data/mockSubscriptions';
import { plans, PlanCategory, Duration } from '../../../data/mockPlans';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function MySubscriptionsClient() {
  const router = useRouter();
  const { user } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<Duration>('3m');
  const [category, setCategory] = useState<PlanCategory>('Budget');
  const [showRenewModal, setShowRenewModal] = useState(false);

  if (!user || user.role !== 'user') {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Please sign in to view your subscriptions.</p>
          <button onClick={() => onNavigate('/login')} className="btn-primary px-5 py-2.5">Sign In</button>
        </div>
      </div>
    );
  }

  const filteredPlans = plans.filter(p => p.category === category);
  const durationLabels: Record<Duration, string> = { '3m': '3 Months', '6m': '6 Months', '12m': '12 Months' };
  const daysLeft = Math.max(0, Math.ceil((new Date(activeSubscription.expiresOn).getTime() - Date.now()) / 86400000));

  const selectedPlanObj = plans.find(p => p.id === selectedPlan);
  const selectedVariant = selectedPlanObj?.variants.find(v => v.duration === selectedDuration);

  const handleRenew = () => {
    if (!selectedPlan) return;
    setShowRenewModal(true);
  };

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
          {activeSubscription ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Plan', value: activeSubscription.planName },
                { label: 'Speed', value: `${activeSubscription.speed} Mbps` },
                { label: 'Duration', value: activeSubscription.duration },
                { label: 'Amount Paid', value: `₹${activeSubscription.price.toLocaleString()}` },
                { label: 'Expires On', value: activeSubscription.expiresOn },
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
                <button key={cat} onClick={() => { setCategory(cat); setSelectedPlan(null); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${category === cat ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-slate-100'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-slate-900 rounded-xl border border-slate-700 p-1 shadow-sm">
              {(['3m', '6m', '12m'] as Duration[]).map(d => (
                <button key={d} onClick={() => setSelectedDuration(d)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedDuration === d ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-300 hover:text-slate-100'}`}>
                  {durationLabels[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPlans.map(plan => {
              const variant = plan.variants.find(v => v.duration === selectedDuration)!;
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative text-left bg-slate-900 border-2 rounded-2xl p-5 transition-all hover:shadow-md ${isSelected ? 'border-blue-500 shadow-md bg-blue-900/40' : 'border-slate-800'}`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                  {plan.badge && (
                    <span className="inline-block text-xs bg-blue-900/35 text-blue-200 font-semibold px-2 py-0.5 rounded-full mb-3">{plan.badge}</span>
                  )}
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-2xl font-black text-slate-100">{plan.speed}</span>
                    <span className="text-sm text-slate-500 mb-0.5">Mbps</span>
                  </div>
                  <p className="text-xl font-bold text-blue-400">₹{variant.price.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{durationLabels[selectedDuration]}</p>
                  <p className="text-xs text-emerald-300 mt-1">₹{Math.round(variant.price / variant.months)}/mo avg</p>
                </button>
              );
            })}
          </div>

          {selectedPlan && (
            <div className="mt-5 bg-slate-900 border border-blue-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Selected: <span className="text-blue-300">{selectedPlanObj?.speed} Mbps {selectedPlanObj?.category} – {durationLabels[selectedDuration]}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Total: <span className="font-bold text-slate-100">₹{selectedVariant?.price.toLocaleString()}</span></p>
              </div>
              <button
                onClick={handleRenew}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    {['#', 'Plan', 'Speed', 'Duration', 'Amount', 'Status', 'Date', 'Payment ID'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paymentHistory.map((pay, idx) => (
                    <tr key={pay.id} className="hover:bg-slate-950 transition-colors">
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-100 whitespace-nowrap">{pay.plan}</td>
                      <td className="px-4 py-3.5 text-slate-300">{pay.speed} Mbps</td>
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{pay.duration}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-100">₹{pay.amount.toLocaleString()}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={pay.status} size="sm" /></td>
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{pay.date}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">{pay.paymentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="inline-flex p-3 bg-blue-900/40 rounded-full mb-4">
              <Wifi size={24} className="text-blue-400" />
            </div>
            <h3 className="subheading-rhythm text-xl font-bold text-slate-100 mb-2">Confirm Renewal</h3>
            <p className="text-slate-400 text-sm mb-5">
              {selectedPlanObj?.speed} Mbps {selectedPlanObj?.category} Plan<br />
              {durationLabels[selectedDuration]} — <strong>₹{selectedVariant?.price.toLocaleString()}</strong>
            </p>
            <div className="bg-amber-900/20 border border-amber-700/60 rounded-xl px-4 py-3 mb-5 text-xs text-amber-200">
              This is a mock UI. In production, this will redirect to payment gateway.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRenewModal(false)} className="flex-1 border border-slate-700 text-slate-200 hover:border-slate-600 font-semibold py-2.5 rounded-xl transition-colors">Cancel</button>
              <button
                onClick={() => {
                  setShowRenewModal(false);
                  onNavigate('/payment-success?payment_id=PAY_MOCK123&order_id=ORD_MOCK456&subscription_id=SUB_MOCK789');
                }}
                className="btn-primary flex-1 py-2.5"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
