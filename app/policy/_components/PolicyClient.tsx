"use client";

import { Shield, AlertTriangle, Check, Info } from 'lucide-react';

export default function PolicyClient() {
  return (
    <div className="pt-16 bg-slate-950 min-h-screen">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-3 py-1 mb-4">
            <Shield size={13} className="text-cyan-300" />
            <span className="text-xs text-slate-300">Service Terms & Scope</span>
          </div>
          <h1 className="heading-rhythm text-4xl font-bold mb-3">Service Policy</h1>
          <p className="copy-rhythm text-slate-400 max-w-xl">Understanding what we provide and the clear scope of our internet service ensures a smooth customer experience.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* What We Provide */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-emerald-900/20 rounded-xl">
              <Check size={18} className="text-emerald-300" />
            </div>
            <h2 className="subheading-rhythm text-xl font-bold text-slate-100">What We Provide</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Fiber to Premises', desc: 'Fiber optic cable from our nearest node to your premises entry point.' },
              { title: 'ONU/ONT Installation', desc: 'Full installation and basic configuration of the Optical Network Unit at your location.' },
              { title: 'Speed Activation', desc: 'Activation of the internet speed as per your selected plan.' },
              { title: 'Technical Support', desc: 'Phone and WhatsApp support during office hours (11 AM – 6 PM).' },
              { title: 'Network Monitoring', desc: 'Proactive monitoring of our network for outages and disruptions.' },
              { title: 'Transparent Billing', desc: 'Clear invoices for all payments with no hidden charges.' },
            ].map(item => (
              <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-emerald-900/20 border border-emerald-800/50">
                <span className="w-5 h-5 rounded-full bg-emerald-900/30 text-emerald-300 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">✓</span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scope of Work */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-amber-900/20 rounded-xl">
              <Info size={18} className="text-amber-600" />
            </div>
            <h2 className="subheading-rhythm text-xl font-bold text-slate-100">Scope of Work</h2>
          </div>
          <div className="bg-blue-900/30 border border-blue-700/60 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
            <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-200 leading-relaxed">
              <strong>ISP Scope:</strong> Our service scope covers only up to the installation point (ONU/ONT). Beyond this point, the internal network (router, switches, LAN wiring) is the customer's responsibility.
            </p>
          </div>
          <div className="space-y-3">
            {[
              'Fiber cable installation is limited to the nearest entry point of the premises. Any cabling beyond the ONU/ONT mounting location is not included.',
              'Internal concealed wiring (inside walls or ceilings) is not covered under our service scope.',
              'Civil work, drilling, or structural modifications required for cable routing inside the premises are not part of our service.',
              'Connect One Networks is not responsible for electrician services or society-level cabling infrastructure.',
              'Wi-Fi signal strength and coverage within walls, floors, or rooms is dependent on the customer\'s router and premises structure. No guarantee of Wi-Fi coverage is provided.',
              'Any additional internal wiring, router placement, or network extension work must be independently arranged and paid for by the customer.',
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 hover:bg-slate-950 transition-colors">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Not Covered */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-red-900/20 rounded-xl">
              <AlertTriangle size={18} className="text-red-300" />
            </div>
            <h2 className="subheading-rhythm text-xl font-bold text-slate-100">Not Covered by Service</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Internal concealed wiring or civil work',
              'Electrician services or society cabling',
              'Wi-Fi coverage guarantees across walls/floors',
              'Customer-side router or LAN device issues',
              'Third-party device compatibility',
              'Internet disruptions due to force majeure events',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-red-900/20 border border-red-800/50">
                <span className="w-4 h-4 rounded-full bg-red-900/30 text-red-300 flex items-center justify-center text-xs shrink-0">✕</span>
                <p className="text-sm text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Note */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Customer Acceptance</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                By proceeding with the service order, customers confirm they have read and accepted this service policy. Customer acceptance timestamp is stored digitally for record-keeping purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
