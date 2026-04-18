export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  speed: number;
  duration: string;
  status: 'active' | 'expired' | 'pending';
  expiry: string;
}

export const adminUsers: AdminUser[] = [
  { id: 'USR001', name: 'Ravi Patel', email: 'ravi.patel@gmail.com', phone: '9876543210', plan: 'Budget', speed: 60, duration: '6 Months', status: 'active', expiry: '2026-04-15' },
  { id: 'USR002', name: 'Meera Shah', email: 'meera.shah@yahoo.com', phone: '9123456789', plan: 'Premium', speed: 100, duration: '12 Months', status: 'active', expiry: '2026-11-20' },
  { id: 'USR003', name: 'Ankit Desai', email: 'ankit.desai@gmail.com', phone: '9988776655', plan: 'Eco', speed: 40, duration: '3 Months', status: 'expired', expiry: '2026-01-05' },
  { id: 'USR004', name: 'Pooja Trivedi', email: 'pooja.t@hotmail.com', phone: '9765432109', plan: 'Budget', speed: 80, duration: '6 Months', status: 'active', expiry: '2026-06-10' },
  { id: 'USR005', name: 'Sunil Joshi', email: 'sunil.joshi@gmail.com', phone: '9654321098', plan: 'Eco', speed: 60, duration: '12 Months', status: 'active', expiry: '2026-09-01' },
  { id: 'USR006', name: 'Kavita Mehta', email: 'kavita.mehta@gmail.com', phone: '9543210987', plan: 'Premium', speed: 80, duration: '6 Months', status: 'expired', expiry: '2025-12-31' },
  { id: 'USR007', name: 'Dinesh Prajapati', email: 'dinesh.p@gmail.com', phone: '9432109876', plan: 'Eco', speed: 40, duration: '3 Months', status: 'pending', expiry: '2026-05-01' },
  { id: 'USR008', name: 'Hina Vohra', email: 'hina.vohra@gmail.com', phone: '9321098765', plan: 'Budget', speed: 100, duration: '12 Months', status: 'active', expiry: '2026-08-15' },
];

export const kpiStats = {
  totalUsers: 312,
  activePlans: 276,
  expiredPlans: 36,
  totalRevenue: 1248500,
};
