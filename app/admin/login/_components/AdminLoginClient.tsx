"use client";

import { useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';

export default function AdminLoginClient() {
  const router = useRouter();
  const { login } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter credentials.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (form.email.includes('admin')) {
        login({ id: 'ADM001', name: 'Admin User', email: form.email, phone: '9974955542', role: 'admin' });
        onNavigate('/admin/dashboard');
      } else if (form.email.includes('tech')) {
        login({ id: 'TECH001', name: 'Suresh Mehta', email: form.email, phone: '9974955502', role: 'technician' });
        onNavigate('/admin/complaints');
      } else {
        setError('Invalid credentials. Use "admin@..." or "tech@..." for demo.');
      }
    }, 1200);
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/LOGO_(1).png" alt="Connect One Networks" className="h-10 w-auto mx-auto mb-3" />
          <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-3 py-1">
            <Shield size={12} className="text-cyan-300" />
            <span className="text-xs text-slate-300">Admin / Technician Portal</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8">
          <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">Staff Sign In</h2>
          <p className="copy-rhythm text-slate-400 text-sm mb-7">Access the admin portal with your staff credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="admin@connect2one.in"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-dark pr-11"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{error}</p>}

            <div className="bg-blue-900/30 border border-blue-700/60 rounded-xl px-3 py-2.5 text-xs text-blue-200">
              Demo hint: Use email with "admin" for admin role, "tech" for technician role. Any password.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60 py-3 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield size={15} />}
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button onClick={() => onNavigate('/')} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Back to main site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
