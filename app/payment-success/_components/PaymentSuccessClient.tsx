"use client";

import { CheckCircle, AlertCircle, Home, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentSuccessClientProps {
  queryParams?: Record<string, string>;
}

export default function PaymentSuccessClient({ queryParams = {} }: PaymentSuccessClientProps) {
  const router = useRouter();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const paymentId = queryParams.payment_id;
  const orderId = queryParams.order_id;
  const subscriptionId = queryParams.subscription_id;
  const isValid = paymentId && orderId && subscriptionId;

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {!isValid ? (
          <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 text-center">
            <div className="inline-flex p-4 bg-red-900/30 rounded-full mb-5">
              <AlertCircle size={28} className="text-red-300" />
            </div>
            <h2 className="subheading-rhythm text-2xl font-bold text-slate-100 mb-2">Invalid Reference</h2>
            <p className="copy-rhythm text-slate-400 text-sm mb-7">
              The payment reference is missing or invalid. Please check your email for a confirmation or contact our support.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onNavigate('/')}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                <Home size={16} /> Back to Home
              </button>
              <a
                href="tel:+919974955542"
                className="w-full border border-slate-700 text-slate-200 hover:border-blue-700 font-semibold py-3 rounded-xl transition-colors text-center text-sm"
              >
                Call Support: 99749 55542
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-3xl shadow-xl border border-emerald-800/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-950 to-cyan-500 p-8 text-center text-white">
              <div className="inline-flex p-4 bg-slate-800/70 rounded-full mb-4">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h2 className="subheading-rhythm text-2xl font-bold mb-1">Payment Successful!</h2>
              <p className="text-emerald-100 text-sm">Your subscription has been activated.</p>
            </div>

            <div className="p-7">
              <div className="space-y-3 mb-7">
                {[
                  { label: 'Payment ID', value: paymentId },
                  { label: 'Order ID', value: orderId },
                  { label: 'Subscription ID', value: subscriptionId },
                  { label: 'Status', value: 'Confirmed' },
                  { label: 'Date', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <span className="text-xs text-slate-400 font-medium">{label}</span>
                    <span className={`text-sm font-semibold ${label === 'Status' ? 'text-emerald-300' : 'text-slate-100'} text-right max-w-[60%] break-all`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-900/20 border border-amber-700/60 rounded-xl px-4 py-3 mb-6 text-xs text-amber-200">
                A confirmation email has been sent to your registered email address. Keep this for your records.
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onNavigate('/my-subscriptions')}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} /> View My Subscriptions
                </button>
                <button
                  onClick={() => onNavigate('/')}
                  className="w-full border border-slate-700 text-slate-200 hover:border-blue-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Home size={16} /> Back to Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
