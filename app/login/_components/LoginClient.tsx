"use client";

import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, CheckCircle, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

type LoginFlow = 'signin' | 'forgot_request' | 'forgot_otp' | 'forgot_reset' | 'success';

export default function LoginClient() {
  const router = useRouter();
  const { login } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [flow, setFlow] = useState<LoginFlow>('signin');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const mockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signInForm.email || !signInForm.password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login({ id: 'USR001', name: 'Ravi Patel', email: signInForm.email, phone: '9876543210', role: 'user' });
      onNavigate('/dashboard');
    }, 1200);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const sendOtp = () => {
    if (!forgotEmail) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setFlow('forgot_otp');
      let c = 60;
      setCountdown(c);
      const timer = setInterval(() => { c--; setCountdown(c); if (c <= 0) clearInterval(timer); }, 1000);
    }, 1000);
  };

  const verifyOtp = () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setFlow('forgot_reset'); }, 1000);
  };

  const resetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setFlow('success'); }, 1000);
  };

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/LOGO_(1).png" alt="Connect One Networks" className="h-12 w-auto mx-auto mb-4" />
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden">
          {/* Sign In */}
          {flow === 'signin' && (
            <div className="p-8">
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm mb-7">Sign in to your Connect One account</p>
              <form onSubmit={mockLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={signInForm.email}
                    onChange={e => setSignInForm(f => ({ ...f, email: e.target.value }))}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={signInForm.password}
                      onChange={e => setSignInForm(f => ({ ...f, password: e.target.value }))}
                      className="input-dark pr-11"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 py-3 flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="mt-5 text-center">
                <button onClick={() => { setFlow('forgot_request'); setError(''); }} className="text-sm text-link font-medium">
                  Forgot your password?
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-500">
                  New customer? <a href="tel:+919974955542" className="text-blue-400 font-semibold">Call 99749 55542</a> to get connected.
                </p>
              </div>
            </div>
          )}

          {/* Forgot - Request OTP */}
          {flow === 'forgot_request' && (
            <div className="p-8">
              <button onClick={() => { setFlow('signin'); setError(''); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-5 transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </button>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">Reset Password</h2>
              <p className="text-slate-400 text-sm mb-7">Enter your registered email to receive an OTP.</p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Registered email address"
                  value={forgotEmail}
                  onChange={e => { setForgotEmail(e.target.value); setError(''); }}
                  className="input-dark"
                />
                {error && <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{error}</p>}
                <button onClick={sendOtp} disabled={loading} className="btn-primary w-full disabled:opacity-60 py-3 flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            </div>
          )}

          {/* OTP Verification */}
          {flow === 'forgot_otp' && (
            <div className="p-8">
              <button onClick={() => { setFlow('forgot_request'); setError(''); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-5 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">Verify OTP</h2>
              <p className="text-slate-400 text-sm mb-1">Enter the 6-digit OTP sent to</p>
              <p className="text-blue-300 font-semibold text-sm mb-7">{forgotEmail}</p>
              <div className="flex gap-2 justify-center mb-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Backspace' && !digit && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus(); }}
                    className="input-dark w-11 h-12 border-2 rounded-xl text-center font-bold text-lg px-0 py-0 focus:border-blue-500"
                  />
                ))}
              </div>
              {error && <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2 mb-3 text-center">{error}</p>}
              <button onClick={verifyOtp} disabled={loading} className="btn-primary w-full disabled:opacity-60 py-3 mb-4 flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <p className="text-center text-xs text-slate-400">
                {countdown > 0 ? (
                  <>Resend OTP in <span className="font-semibold text-blue-300">{countdown}s</span></>
                ) : (
                  <button onClick={sendOtp} className="text-link font-semibold">Resend OTP</button>
                )}
              </p>
            </div>
          )}

          {/* New Password */}
          {flow === 'forgot_reset' && (
            <div className="p-8">
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-1">New Password</h2>
              <p className="text-slate-400 text-sm mb-7">Set a new password for your account.</p>
              <form onSubmit={resetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">New Password</label>
                  <input type="password" placeholder="Min. 6 characters" value={newPass} onChange={e => { setNewPass(e.target.value); setError(''); }} className="input-dark" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">Confirm Password</label>
                  <input type="password" placeholder="Repeat password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(''); }} className="input-dark" />
                </div>
                {error && <p className="text-xs text-red-200 bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 py-3 flex items-center justify-center gap-2">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Success */}
          {flow === 'success' && (
            <div className="p-10 text-center">
              <div className="inline-flex p-4 bg-emerald-900/30 rounded-full mb-5">
                <CheckCircle size={28} className="text-emerald-300" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Password Updated!</h2>
              <p className="text-slate-400 text-sm mb-7">Your password has been reset successfully. You can now sign in.</p>
              <button onClick={() => { setFlow('signin'); setOtp(['', '', '', '', '', '']); setForgotEmail(''); setNewPass(''); setConfirmPass(''); }} className="btn-primary px-7 py-3">
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Wifi size={12} className="text-cyan-300" />
          <span>Powered by Connect One Networks, Bharuch</span>
        </div>
      </div>
    </div>
  );
}
