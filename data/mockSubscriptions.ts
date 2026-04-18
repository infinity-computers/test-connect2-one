export interface Subscription {
  id: string;
  planName: string;
  category: string;
  speed: number;
  duration: string;
  months: number;
  price: number;
  activeSince: string;
  expiresOn: string;
  daysLeft: number;
  status: 'active' | 'expired' | 'pending';
}

export interface PaymentRecord {
  id: string;
  plan: string;
  speed: number;
  duration: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  paymentId: string;
}

export const activeSubscription: Subscription = {
  id: 'SUB-2024-001',
  planName: 'Budget Plan',
  category: 'Budget',
  speed: 60,
  duration: '6 Months',
  months: 6,
  price: 5799,
  activeSince: '2025-10-15',
  expiresOn: '2026-04-15',
  daysLeft: 0,
  status: 'active',
};

export const paymentHistory: PaymentRecord[] = [
  { id: 'PAY-001', plan: 'Budget Plan', speed: 60, duration: '6 Months', amount: 5799, status: 'paid', date: '2025-10-15', paymentId: 'PAY_abc123xyz' },
  { id: 'PAY-002', plan: 'Eco Plan', speed: 40, duration: '3 Months', amount: 2899, status: 'paid', date: '2025-07-10', paymentId: 'PAY_def456uvw' },
  { id: 'PAY-003', plan: 'Eco Plan', speed: 40, duration: '3 Months', amount: 2899, status: 'paid', date: '2025-04-05', paymentId: 'PAY_ghi789rst' },
  { id: 'PAY-004', plan: 'Eco Plan', speed: 40, duration: '3 Months', amount: 2899, status: 'paid', date: '2025-01-02', paymentId: 'PAY_jkl012mno' },
];
