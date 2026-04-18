"use client";

import { Phone, Mail, MapPin, Clock, Wifi } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <img src="/LOGO_(1).png" alt="Connect One Networks" className="h-10 w-auto mb-4" />
            <p className="text-sm text-slate-500 leading-relaxed mb-3">
              Local Cable Operator & Internet Service Provider serving Bharuch, Gujarat with high-speed fiber internet.
            </p>
            <p className="text-xs text-slate-400">UDYAM-GJ-06-0069641</p>
            <p className="text-xs text-slate-400">GST: 24AAWFC2395Q1ZJ</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone size={14} className="text-cyan-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs">Sales</p>
                  <a href="tel:+919974955542" className="text-slate-200 hover:text-blue-300 transition-colors">99749 55542</a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={14} className="text-cyan-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs">Service / WhatsApp</p>
                  <a href="tel:+919974955502" className="text-slate-200 hover:text-blue-300 transition-colors">99749 55502</a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={14} className="text-cyan-300 mt-0.5 shrink-0" />
                <a href="mailto:care@connect2one.in" className="text-slate-200 hover:text-blue-300 transition-colors">care@connect2one.in</a>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-cyan-300 mt-0.5 shrink-0" />
                <span className="text-slate-300">11:00 AM – 06:00 PM</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[['Home', '/'], ['Plans', '/plans'], ['Service Policy', '/policy'], ['Contact', '/contact']].map(([label, path]) => (
                <li key={path}>
                  <button
                    onClick={() => onNavigate(path)}
                    className="text-slate-500 hover:text-blue-300 transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <a href="http://www.connect2one.in" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-300 transition-colors">
                  www.connect2one.in
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Address & Bank</h4>
            <div className="flex items-start gap-2 mb-4">
              <MapPin size={14} className="text-cyan-300 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                13(A), A-Building, Shubham Valley,<br />
                Village: Tavra, Bharuch – 392011,<br />
                Gujarat, India
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-xs space-y-1">
              <p className="text-slate-500 font-medium">Bank Details</p>
              <p className="text-slate-300">HDFC Bank – Current A/C</p>
              <p className="text-slate-500">A/C: 99910081000999</p>
              <p className="text-slate-500">IFSC: HDFC0008146</p>
              <p className="text-slate-500">Branch: Suhradam Zadeshwar</p>
              <p className="text-slate-500">UPI: connectone@hdfcbank</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/90 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Wifi size={12} className="text-cyan-300" />
              Customer acceptance timestamp is stored digitally.
            </p>
            <p className="text-xs text-slate-400">
              © 2026 Connect One Networks. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
