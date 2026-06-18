"use client";

import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Wifi,
  FileText,
  ArrowUpRight,
} from "lucide-react";

interface FooterProps {
  onNavigate: (path: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const quickLinks = [
    ["Home", "/"],
    ["Plans", "/plans"],
    ["Service Policy", "/policy"],
    ["Contact", "/contact"],
  ] as const;

  const legalLinks = [
    ["Privacy Policy", "/privacy-policy"],
    ["Refund & Return Policy", "/refund-policy"],
    ["Terms & Conditions", "/terms-and-conditions"],
  ] as const;

  return (
    <footer
      className="relative border-t border-white/[0.06] text-slate-400"
      style={{
        background:
          "linear-gradient(135deg,#030913 0%,#071527 48%,#020617 100%)",
      }}
    >
      {/* Top cyan line — matches hero/plans header */}
      <div className="absolute left-1/2 top-0 h-px w-[60vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src="/LOGO_(1).png"
              alt="Connect One Networks"
              className="h-10 w-auto mb-4"
            />
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Local fiber ISP serving Bharuch, Gujarat with high-speed broadband
              and local support.
            </p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">UDYAM-GJ-06-0069641</p>
              <p className="text-xs text-slate-600">GST: 24AAWFC2395Q1ZJ</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-[0.16em]">
              Contact Us
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-600 mb-0.5">Sales</p>
                  <a
                    href="tel:+919974955542"
                    className="text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    99749 55542
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-slate-600 mb-0.5">
                    Service / WhatsApp
                  </p>
                  <a
                    href="tel:+919974955502"
                    className="text-slate-300 hover:text-cyan-300 transition-colors"
                  >
                    99749 55502
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                <a
                  href="mailto:care@connect2one.in"
                  className="text-slate-300 hover:text-cyan-300 transition-colors"
                >
                  care@connect2one.in
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                <span className="text-slate-400">11:00 AM – 06:00 PM</span>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-[0.16em]">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map(([label, path]) => (
                <li key={path}>
                  <button
                    onClick={() => onNavigate(path)}
                    className="text-slate-500 hover:text-cyan-300 transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <a
                  href="http://www.connect2one.in"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-cyan-300 transition-colors"
                >
                  www.connect2one.in
                  <ArrowUpRight size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-[0.16em]">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              {legalLinks.map(([label, path]) => (
                <li key={path}>
                  <button
                    onClick={() => onNavigate(path)}
                    className="inline-flex items-center gap-2 text-left text-slate-500 hover:text-cyan-300 transition-colors"
                  >
                    <FileText size={12} className="shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Address & Bank */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-xs uppercase tracking-[0.16em]">
              Address & Bank
            </h4>
            <div className="flex items-start gap-2.5 mb-5">
              <MapPin size={13} className="text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                13(A), A-Building, Shubham Valley,
                <br />
                Village: Tavra, Bharuch – 392011,
                <br />
                Gujarat, India
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-xs space-y-1.5">
              <p className="text-slate-400 font-semibold mb-2">Bank Details</p>
              <p className="text-slate-300">HDFC Bank – Current A/C</p>
              <p className="text-slate-500">A/C: 99910081000999</p>
              <p className="text-slate-500">IFSC: HDFC0008146</p>
              <p className="text-slate-500">Branch: Suhradam Zadeshwar</p>
              <p className="text-slate-500">UPI: connectone@hdfcbank</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <Wifi size={12} className="text-cyan-400" />
            Customer acceptance timestamp is stored digitally.
          </p>
          <p className="text-xs text-slate-600">
            © 2026 Connect One Networks. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
