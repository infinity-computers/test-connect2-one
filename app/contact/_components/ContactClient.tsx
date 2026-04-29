"use client";

import { useState } from 'react';
import { Phone, Mail, Clock, MessageCircle, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

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
  "Other"
];

export default function ContactClient() {
  const router = useRouter();
  const { user } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [form, setForm] = useState({
    issue_type: '',
    description: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bharuch',
    state: 'Gujarat',
    pin_code: '392001'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.issue_type) e.issue_type = 'Please select an issue type.';
    
    if (!user) {
      if (!form.name.trim()) e.name = 'Please enter your name.';
      if (!form.phone.trim()) e.phone = 'Please enter your contact number.';
      if (!form.email.trim()) e.email = 'Please enter your email.';
      if (!form.address.trim()) e.address = 'Please enter your address.';
      if (!form.city.trim()) e.city = 'Please enter your city.';
      if (!form.state.trim()) e.state = 'Please enter your state.';
      if (!form.pin_code.trim()) e.pin_code = 'Please enter your pin code.';
    }
    
    if (form.issue_type === 'Other' && !form.description.trim()) {
      e.description = 'Please describe your issue.';
    }
    if (form.description.length > 1000) e.description = 'Description must be under 1000 characters.';
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    
    setLoading(true);
    setErrors({});

    try {
      const payload: {
        issue_type: string;
        description: string;
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        state?: string;
        pin_code?: string;
      } = {
        issue_type: form.issue_type,
        description: form.description
      };

      if (!user) {
        payload.name = form.name;
        payload.phone = form.phone;
        payload.email = form.email;
        payload.address = form.address;
        payload.city = form.city;
        payload.state = form.state;
        payload.pin_code = form.pin_code;
      }

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || 'Failed to submit complaint' });
        setLoading(false);
        return;
      }

      setComplaintId(data.complaintId?.toString() || '');
      setTrackingCode(data.trackingCode || '');
      setSubmitted(true);
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="pt-16 bg-slate-950 min-h-screen">
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="heading-rhythm text-4xl font-bold mb-3">Contact Us</h1>
          <p className="copy-rhythm text-slate-400 max-w-lg">Reach out for new connections, plan upgrades, billing queries, or technical support.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {[
            { icon: Phone, title: 'Sales', value: '99749 55542', sub: 'New connections & upgrades', href: 'tel:+919974955542', color: 'text-blue-200 bg-blue-900/40' },
            { icon: MessageCircle, title: 'Service / WhatsApp', value: '99749 55502', sub: 'Technical support', href: 'https://wa.me/919974955502', color: 'text-emerald-200 bg-emerald-900/30' },
            { icon: Mail, title: 'Email', value: 'care@connect2one.in', sub: 'Billing & account queries', href: 'mailto:care@connect2one.in', color: 'text-blue-300 bg-blue-900/40' },
            { icon: Clock, title: 'Office Hours', value: '11 AM – 6 PM', sub: 'Monday to Saturday', href: null, color: 'text-cyan-200 bg-cyan-900/30' },
          ].map(({ icon: Icon, title, value, sub, href, color }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-3 rounded-xl mb-4 ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{title}</p>
              {href ? (
                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="font-semibold text-slate-100 hover:text-blue-400 transition-colors block text-sm">{value}</a>
              ) : (
                <p className="font-semibold text-slate-100 text-sm">{value}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Complaint Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Raise a Complaint</h2>
          <p className="copy-rhythm text-slate-400 mb-6 text-sm">
            {user 
              ? 'Submit a complaint and our team will respond promptly.' 
              : 'Fill the form below and our team will respond promptly. You may also login for faster service.'}
          </p>

          {!user && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-300">Login for faster service and track your complaint</p>
              <button onClick={() => onNavigate('/login')} className="btn-primary px-4 py-2 text-sm">
                Sign In
              </button>
            </div>
          )}

          {submitted ? (
            <div className="bg-slate-900 border border-emerald-700/60 rounded-2xl p-10 text-center">
              <div className="inline-flex p-4 bg-emerald-900/30 rounded-full mb-4">
                <CheckCircle size={28} className="text-emerald-300" />
              </div>
              <h3 className="subheading-rhythm font-bold text-xl text-slate-100 mb-2">Complaint Submitted!</h3>
              <p className="copy-rhythm text-slate-400 text-sm mb-1">Your complaint has been registered successfully.</p>
              <p className="text-sm font-semibold text-blue-200 mb-1">Complaint ID: {complaintId}</p>
              <p className="text-sm font-semibold text-blue-200 mb-5">Tracking Code: {trackingCode}</p>
              <p className="text-xs text-slate-500">Our team will contact you within the resolution window as per your plan type.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ issue_type: '', description: '', name: '', phone: '', email: '', address: '', city: 'Bharuch', state: 'Gujarat', pin_code: '392001' }); }}
                className="mt-5 border border-slate-700 text-slate-200 hover:border-blue-700 font-semibold px-5 py-2 rounded-xl transition-colors text-sm"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">Issue Type <span className="text-red-300">*</span></label>
                  <select
                    value={form.issue_type}
                    onChange={e => { setForm(f => ({ ...f, issue_type: e.target.value })); setErrors(er => ({ ...er, issue_type: '' })); }}
                    className={`input-dark py-2.5 ${errors.issue_type ? 'border-red-400' : 'border-slate-700'}`}
                  >
                    <option value="">Select issue type</option>
                    {issueTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                  {errors.issue_type && <p className="text-xs text-red-300 mt-1">{errors.issue_type}</p>}
                </div>

                {/* Guest fields */}
                {!user && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1.5">Name <span className="text-red-300">*</span></label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                          className={`input-dark py-2.5 ${errors.name ? 'border-red-400' : 'border-slate-700'}`}
                          placeholder="Your full name"
                        />
                        {errors.name && <p className="text-xs text-red-300 mt-1">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1.5">Contact Number <span className="text-red-300">*</span></label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(er => ({ ...er, phone: '' })); }}
                          className={`input-dark py-2.5 ${errors.phone ? 'border-red-400' : 'border-slate-700'}`}
                          placeholder="99749 55542"
                        />
                        {errors.phone && <p className="text-xs text-red-300 mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-1.5">Email <span className="text-red-300">*</span></label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                        className={`input-dark py-2.5 ${errors.email ? 'border-red-400' : 'border-slate-700'}`}
                        placeholder="you@example.com"
                      />
                      {errors.email && <p className="text-xs text-red-300 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-1.5">Address <span className="text-red-300">*</span></label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setErrors(er => ({ ...er, address: '' })); }}
                        className={`input-dark py-2.5 ${errors.address ? 'border-red-400' : 'border-slate-700'}`}
                        placeholder="Address Line 1"
                      />
                      {errors.address && <p className="text-xs text-red-300 mt-1">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-1">
                        <label className="block text-sm font-semibold text-slate-200 mb-1.5">City <span className="text-red-300">*</span></label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setErrors(er => ({ ...er, city: '' })); }}
                          className={`input-dark py-2.5 ${errors.city ? 'border-red-400' : 'border-slate-700'}`}
                        />
                        {errors.city && <p className="text-xs text-red-300 mt-1">{errors.city}</p>}
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-semibold text-slate-200 mb-1.5">State <span className="text-red-300">*</span></label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={e => { setForm(f => ({ ...f, state: e.target.value })); setErrors(er => ({ ...er, state: '' })); }}
                          className={`input-dark py-2.5 ${errors.state ? 'border-red-400' : 'border-slate-700'}`}
                        />
                        {errors.state && <p className="text-xs text-red-300 mt-1">{errors.state}</p>}
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-200 mb-1.5">Pin Code <span className="text-red-300">*</span></label>
                        <input
                          type="text"
                          value={form.pin_code}
                          onChange={e => { setForm(f => ({ ...f, pin_code: e.target.value })); setErrors(er => ({ ...er, pin_code: '' })); }}
                          className={`input-dark py-2.5 ${errors.pin_code ? 'border-red-400' : 'border-slate-700'}`}
                        />
                        {errors.pin_code && <p className="text-xs text-red-300 mt-1">{errors.pin_code}</p>}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Description {form.issue_type === 'Other' && <span className="text-red-300">*</span>}
                    {form.issue_type !== 'Other' && <span className="text-slate-500 font-normal text-xs ml-1">(optional)</span>}
                  </label>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={form.description}
                    onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: '' })); }}
                    placeholder="Describe your issue in detail..."
                    className={`input-dark py-2.5 resize-none ${errors.description ? 'border-red-400' : 'border-slate-700'}`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description ? <p className="text-xs text-red-300">{errors.description}</p> : <span />}
                    <p className="text-xs text-slate-500">{form.description.length}/1000</p>
                  </div>
                </div>

                {errors.general && <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{errors.general}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
