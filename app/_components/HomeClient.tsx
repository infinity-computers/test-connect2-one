"use client";

import {
  ArrowRight,
  Cable,
  Headphones,
  MapPin,
  RefreshCw,
  Shield,
  Sparkles,
  TicketCheck,
  Wifi,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { activeSubscription, paymentHistory } from '../../data/mockSubscriptions';
import { plans } from '../../data/mockPlans';

const trustStats = [
  { label: 'Fiber speeds', value: '40-300 Mbps' },
  { label: 'Monthly FUP', value: '3.5 TB' },
  { label: 'Post-FUP speed', value: '2 Mbps' },
];

const featureCards = [
  {
    icon: Shield,
    title: 'Transparent broadband plans',
    desc: 'Clear 3, 6, and 12 month pricing with installation scope and FUP terms shown upfront.',
  },
  {
    icon: Headphones,
    title: 'Local Bharuch support',
    desc: 'A nearby team for onboarding, service requests, upgrades, and issue follow-ups.',
  },
  {
    icon: Zap,
    title: 'Built for everyday speed',
    desc: 'Stable fiber plans for work calls, streaming, online classes, gaming, and home offices.',
  },
  {
    icon: TicketCheck,
    title: 'Tracked service workflow',
    desc: 'Every service request can move through approval, assignment, progress, and resolution.',
  },
];

const processSteps = [
  { title: 'Choose plan', desc: 'Compare speeds, durations, and FUP details.' },
  { title: 'Book request', desc: 'Submit your new connection details securely.' },
  { title: 'Local follow-up', desc: 'Our team verifies feasibility and installation scope.' },
  { title: 'Go online', desc: 'Installation and activation are completed by the local team.' },
];

function FiberHeroVisual() {
  const nodes = [
    'left-[14%] top-[24%]',
    'left-[34%] top-[14%]',
    'right-[18%] top-[28%]',
    'left-[21%] bottom-[24%]',
    'right-[28%] bottom-[18%]',
    'right-[10%] bottom-[38%]',
  ];

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#071522]/80 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl lg:min-h-[520px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_78%_72%,rgba(52,211,153,0.17),transparent_28%)]" />
      <div className="absolute inset-5 rounded-[1.6rem] border border-cyan-200/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />

      <svg className="absolute inset-0 h-full w-full opacity-90" viewBox="0 0 520 520" fill="none" aria-hidden="true">
        <path className="fiber-line" d="M78 148 C154 72 258 82 336 140 S438 236 396 334 S238 452 122 352" />
        <path className="fiber-line fiber-line-delay" d="M98 340 C172 274 218 250 286 278 S386 316 446 242" />
        <path className="fiber-line fiber-line-slow" d="M148 92 C210 184 252 192 340 188 S424 202 468 132" />
        <path className="fiber-line fiber-line-delay" d="M64 246 C142 212 210 220 260 260 S338 394 458 378" />
      </svg>

      {nodes.map((position, index) => (
        <div key={position} className={`absolute ${position} fiber-node`} style={{ animationDelay: `${index * 260}ms` }}>
          <span className="absolute inset-0 rounded-full bg-cyan-300/25 blur-md" />
          <span className="relative block h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.95)]" />
        </div>
      ))}

      <div className="absolute left-6 top-6 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Network load</p>
        <p className="mt-1 text-2xl font-black text-white">99.9%</p>
      </div>

      <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/10 bg-slate-950/55 p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">Live fiber route</p>
            <h3 className="mt-2 text-xl font-black text-white">Bharuch home network</h3>
          </div>
          <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200 ring-1 ring-emerald-300/20">
            <Cable size={26} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs text-slate-300">
          {['Low latency', 'Local support', 'Fast setup'].map(item => (
            <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeClient() {
  const router = useRouter();
  const { user } = useAuth();
  const renewalPlans = plans.filter(p => p.category === 'Budget').slice(0, 3);
  const ecoPlans = plans.filter(p => p.category === 'Eco').slice(0, 3);

  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const daysLeft = Math.max(0, Math.ceil((new Date(activeSubscription.expiresOn).getTime() - Date.now()) / 86400000));

  return (
    <div className="min-h-screen overflow-hidden bg-[#030913] pt-16 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(59,130,246,0.20),transparent_32%),linear-gradient(135deg,#030913_0%,#071527_48%,#020617_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-1/2 top-0 h-px w-[70vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100 shadow-lg shadow-cyan-950/30">
              <Wifi size={15} /> Bharuch Fiber ISP
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Fiber internet that feels fast before the speed test.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Premium home and business broadband plans from 40 to 300 Mbps with transparent pricing, local support, and a clear service workflow for Bharuch.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => onNavigate('/plans')}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_18px_60px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                Explore Plans <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/plans')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-white/[0.09]"
              >
                Book New Connection
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {trustStats.map(stat => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <FiberHeroVisual />
        </div>
      </section>

      <section className="relative bg-[#050d18] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-200/75">Why Connect One</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Local service, clear pricing, and broadband operations that are actually tracked.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-slate-350 lg:ml-auto">
              The website should communicate more than speed. It should show customers that plans, service requests, upgrades, support, and installation are handled with accountability.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-6 shadow-xl shadow-slate-950/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[0.065]">
                <div className="mb-5 inline-flex rounded-2xl border border-cyan-200/15 bg-cyan-300/10 p-3 text-cyan-100 transition group-hover:scale-105">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-black tracking-[-0.02em] text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {user && user.role === 'USER' && (
        <section className="bg-[#030913] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-200/70">Customer portal</p>
                <h2 className="mt-2 text-2xl font-black text-white">Your Subscription Dashboard</h2>
              </div>
              <button onClick={() => onNavigate('/my-subscriptions')} className="text-sm font-bold text-cyan-200 hover:text-cyan-100">
                Open subscription details
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-[1.7rem] border border-cyan-200/15 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-slate-950 p-6 text-white shadow-2xl shadow-cyan-950/20">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/65">Active Plan</p>
                    <h3 className="mt-1 text-2xl font-black">{activeSubscription.planName}</h3>
                  </div>
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Speed', `${activeSubscription.speed} Mbps`],
                    ['Duration', activeSubscription.duration],
                    ['Active Since', activeSubscription.activeSince],
                    ['Expires On', activeSubscription.expiresOn],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-slate-300">
                    <span>Days Remaining</span>
                    <span className="font-black text-white">{daysLeft} days</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950/70">
                    <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${Math.min(100, (daysLeft / (activeSubscription.months * 30)) * 100)}%` }} />
                  </div>
                </div>
                <button onClick={() => onNavigate('/my-subscriptions')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                  <RefreshCw size={15} /> Renew Plan
                </button>
              </div>

              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {renewalPlans.map(plan => (
                    <button key={plan.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200/30" onClick={() => onNavigate('/my-subscriptions')}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-full bg-blue-400/10 px-2 py-1 text-xs font-bold text-blue-200">{plan.category}</span>
                        <span className="text-sm font-black text-white">{plan.speed} Mbps</span>
                      </div>
                      <p className="text-xs text-slate-400">Starting at</p>
                      <p className="mt-1 text-xl font-black text-cyan-200">₹{plan.variants[0].price.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">for 3 months</p>
                    </button>
                  ))}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.04]">
                      <tr>
                        {['Plan', 'Amount', 'Date', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {paymentHistory.slice(0, 3).map(pay => (
                        <tr key={pay.id} className="hover:bg-white/[0.03]">
                          <td className="px-4 py-3 font-bold text-white">{pay.plan}</td>
                          <td className="px-4 py-3 text-slate-300">₹{pay.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-400">{pay.date}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-200">Paid</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="relative bg-[#050d18] py-16 sm:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                <Sparkles size={14} /> Popular starting point
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
                Start with Eco plans, upgrade when your home needs more speed.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
                Eco plans are built for affordable everyday internet, while Budget and Premium tiers give more speed for heavier streaming, gaming, and business usage.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {ecoPlans.map(plan => (
                <div key={plan.id} className="flex min-h-[230px] flex-col rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-emerald-200/30">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200/70">{plan.category}</p>
                  <h3 className="mt-3 text-3xl font-black text-white">{plan.speed}<span className="text-base text-slate-400"> Mbps</span></h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">FUP Data Limit: 3.5 TB/Month. Post-FUP Speed: 2 Mbps.</p>
                  <div className="mt-auto pt-5">
                    <p className="text-xs text-slate-500">Starting at</p>
                    <p className="text-2xl font-black text-cyan-200">₹{plan.variants[0].price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#030913] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-6 shadow-2xl shadow-slate-950/30 sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-200/75">Connection process</p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">From plan selection to installation, every step is visible.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {processSteps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">{index + 1}</div>
                    <h3 className="text-lg font-black text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <section className="relative overflow-hidden bg-[#050d18] py-16 text-white sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_36%)]" />
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
              <MapPin size={26} />
            </div>
            <h2 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl">Ready to connect your home or office?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
              Explore plans, submit your connection request, and our local team will follow up for installation feasibility and charges.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => onNavigate('/plans')} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-7 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                See All Plans <ArrowRight size={17} />
              </button>
              <button onClick={() => onNavigate('/contact')} className="rounded-2xl border border-white/12 bg-white/[0.05] px-7 py-4 text-sm font-bold text-white transition hover:border-cyan-200/35 hover:bg-white/[0.08]">
                Talk to Us: 99749 55542
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
