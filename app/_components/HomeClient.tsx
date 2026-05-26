"use client";

import { Zap, Users, Shield, BarChart2, ArrowRight, RefreshCw, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { activeSubscription, paymentHistory } from '../../data/mockSubscriptions';
import { plans } from '../../data/mockPlans';

export default function HomeClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const renewalPlans = plans.filter(p => p.category === 'Budget').slice(0, 3);
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const daysLeft = Math.max(0, Math.ceil((new Date(activeSubscription.expiresOn).getTime() - Date.now()) / 86400000));

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1 mb-5">
              <Wifi size={14} className="text-cyan-300" />
              <span className="text-xs font-medium text-blue-200">Bharuch's Trusted Fiber ISP</span>
            </div>
            <h1 className="heading-rhythm text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
              High-Speed Fiber<br />
              <span className="text-cyan-300">Internet</span> for Bharuch
            </h1>
            <p className="copy-rhythm text-lg text-slate-300 mb-4 max-w-xl">
              Transparent 3, 6, and 12 month broadband plans with 40–100 Mbps speeds. Local support, no hidden charges, and clear scope of work.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              Serving Bharuch, Gujarat since inception &nbsp;·&nbsp; 99749 55542
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('/plans')}
                className="btn-primary flex items-center gap-2 px-6 py-3 transition-all duration-200 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                Explore Plans <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowConnectionModal(true)}
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                Book Service Request
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="subheading-rhythm text-3xl font-bold text-slate-100 mb-3">Why Choose Connect One Networks?</h2>
            <p className="copy-rhythm text-slate-400 max-w-xl mx-auto">We believe in delivering internet services with full transparency, local accountability, and reliable performance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Transparent Plans', desc: 'No hidden fees. All pricing clearly listed for 3, 6, and 12 month durations.', color: 'text-blue-200 bg-blue-900/40' },
              { icon: Users, title: 'Local Support', desc: 'Bharuch-based team with WhatsApp and phone support during office hours.', color: 'text-emerald-200 bg-emerald-900/30' },
              { icon: Zap, title: 'Lightning Speeds', desc: 'Plans from 40 to 100 Mbps fiber speeds for homes and businesses.', color: 'text-blue-300 bg-blue-900/40' },
              { icon: BarChart2, title: 'Clear Scope of Work', desc: 'We clearly define what we install and maintain, avoiding confusion.', color: 'text-cyan-200 bg-cyan-900/30' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="subheading-rhythm font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="copy-rhythm text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logged-in user subscription section */}
      {user && user.role === 'USER' && (
        <section className="py-14 bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-6">Your Subscription Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Active Plan</p>
                      <h3 className="text-xl font-bold">{activeSubscription.planName}</h3>
                    </div>
                    <span className="bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full">Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-800/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">Speed</p>
                      <p className="font-bold">{activeSubscription.speed} Mbps</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">Duration</p>
                      <p className="font-bold">{activeSubscription.duration}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">Active Since</p>
                      <p className="font-bold text-sm">{activeSubscription.activeSince}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs">Expires On</p>
                      <p className="font-bold text-sm">{activeSubscription.expiresOn}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Days Remaining</span>
                      <span className="font-semibold text-white">{daysLeft} days</span>
                    </div>
                    <div className="w-full bg-slate-800/70 rounded-full h-1.5">
                      <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (daysLeft / (activeSubscription.months * 30)) * 100)}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('/my-subscriptions')}
                    className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={15} /> Renew Plan
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-base font-semibold text-slate-100 mb-3">Quick Renewal Options</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {renewalPlans.map(plan => (
                    <div key={plan.id} className="border border-slate-700 rounded-xl p-4 hover:border-blue-700 hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigate('/my-subscriptions')}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-200 bg-blue-900/40 px-2 py-0.5 rounded">{plan.category}</span>
                        <span className="text-sm font-bold text-slate-100">{plan.speed} Mbps</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">Starting at</p>
                      <p className="text-lg font-bold text-blue-400">₹{plan.variants[0].price.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">for 3 months</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <button onClick={() => onNavigate('/plans')} className="text-sm text-link font-medium inline-flex items-center gap-1">
                    View all plans <ArrowRight size={13} />
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-semibold text-slate-100 mb-3">Recent Payments</h3>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950">
                        <tr>
                          {['Plan', 'Amount', 'Date', 'Status'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-400 font-semibold uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {paymentHistory.slice(0, 3).map(pay => (
                          <tr key={pay.id} className="hover:bg-slate-950 transition-colors">
                            <td className="px-4 py-3 text-slate-100 font-medium">{pay.plan}</td>
                            <td className="px-4 py-3 text-slate-200">₹{pay.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-400">{pay.date}</td>
                            <td className="px-4 py-3">
                              <span className="text-emerald-200 bg-emerald-900/30 text-xs font-semibold px-2 py-0.5 rounded-full">Paid</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Eco Plan Spotlight */}
      <section className="py-16 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-900 rounded-3xl p-8 shadow-sm border border-blue-900/50">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-900/40 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                <Zap size={12} /> Eco Plan Spotlight
              </div>
              <h2 className="subheading-rhythm text-3xl font-bold text-slate-100 mb-2">
                Starting at <span className="text-blue-400">₹2,899</span>
                <span className="text-lg text-slate-400 font-normal"> / 3 months</span>
              </h2>
              <p className="copy-rhythm text-slate-300 max-w-md">
                Our Eco plans offer 40–100 Mbps fiber speeds at the most affordable pricing. Perfect for light to moderate internet users.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                {['Unlimited data, no FUP', 'Standard support via WhatsApp', 'Plans from 3 to 12 months', 'Transparent billing, no surprises'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-900/30 text-emerald-300 flex items-center justify-center text-xs font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 min-w-[200px]">
              <button
                onClick={() => onNavigate('/plans')}
                className="btn-primary px-6 py-3 shadow-sm flex items-center justify-center gap-2"
              >
                View Eco Plans <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowConnectionModal(true)}
                className="border border-slate-700 text-slate-200 hover:border-blue-700 hover:text-blue-300 font-semibold px-6 py-3 rounded-xl transition-colors text-center"
              >
                Book New Connection
              </button>
            </div>
          </div>
        </div>
      </section>

      {showConnectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">New Connection / Upgrade</h3>
            <p className="text-sm text-slate-300 mb-4">Please contact us for new connections and plan upgrades.</p>
            <p className="text-cyan-300 font-semibold text-lg mb-1">99749 55542</p>
            <p className="text-xs text-slate-400 mb-5">New connections & upgrades</p>
            <div className="flex gap-3">
              <a href="tel:+919974955542" className="btn-primary flex-1 text-center py-2.5">Call Now</a>
              <button
                type="button"
                onClick={() => setShowConnectionModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-semibold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Banner */}
      {!user && (
        <section className="py-14 bg-blue-800 text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="subheading-rhythm text-3xl font-bold mb-3">Ready to Connect?</h2>
            <p className="copy-rhythm text-slate-400 mb-7">
              Get high-speed fiber internet at your home or office in Bharuch. Transparent pricing, local support, and no hidden charges.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => onNavigate('/plans')}
                className="btn-primary px-7 py-3 shadow-lg"
              >
                See All Plans
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="border border-slate-600 hover:bg-slate-800/50 text-white font-semibold px-7 py-3 rounded-xl transition-colors"
              >
                Talk to Us
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
