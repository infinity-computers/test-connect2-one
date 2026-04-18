"use client";

import { useState } from 'react';
import { Users, Wifi, XCircle, DollarSign, Bell, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { adminUsers, kpiStats } from '../../../../data/mockUsers';
import { mockComplaints } from '../../../../data/mockComplaints';
import StatusBadge from '../../../../components/ui/StatusBadge';

export default function AdminDashboardClient() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const onNavigate = (path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [search, setSearch] = useState('');
  const [showAlerts, setShowAlerts] = useState(false);

  const openComplaints = mockComplaints.filter(c => c.status === 'open');
  const filtered = adminUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  if (!user || (user.role !== 'admin')) {
    return (
      <div className="pt-16 min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-slate-300 mb-4">Admin access required.</p>
          <button onClick={() => onNavigate('/admin/login')} className="btn-primary px-5 py-2.5">Admin Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-slate-950">
      {/* Admin Header */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-xs mb-1">Admin Portal</p>
              <h1 className="subheading-rhythm text-2xl font-bold">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-0.5">Welcome, {user.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative bg-slate-800/50 hover:bg-slate-800/70 border border-slate-600 p-2.5 rounded-xl transition-colors"
                >
                  <Bell size={18} />
                  {openComplaints.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs font-bold flex items-center justify-center">
                      {openComplaints.length}
                    </span>
                  )}
                </button>
                {showAlerts && (
                  <div className="absolute right-0 top-12 w-72 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-950 border-b border-slate-800">
                      <p className="text-sm font-semibold text-slate-100">Open Complaints ({openComplaints.length})</p>
                    </div>
                    {openComplaints.map(c => (
                      <div key={c.id} className="px-4 py-3 border-b border-slate-800 hover:bg-slate-950 cursor-pointer" onClick={() => { onNavigate('/admin/complaints'); setShowAlerts(false); }}>
                        <p className="text-xs font-semibold text-slate-100">{c.id} – {c.issueType}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.userName}</p>
                      </div>
                    ))}
                    <div className="px-4 py-3 text-center">
                      <button onClick={() => { onNavigate('/admin/complaints'); setShowAlerts(false); }} className="text-xs text-link font-semibold">
                        View all complaints
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => { logout(); onNavigate('/'); }}
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Users', value: kpiStats.totalUsers.toLocaleString(), color: 'text-blue-200 bg-blue-900/40', change: '+12 this month' },
            { icon: Wifi, label: 'Active Plans', value: kpiStats.activePlans.toLocaleString(), color: 'text-emerald-200 bg-emerald-900/30', change: `${Math.round((kpiStats.activePlans / kpiStats.totalUsers) * 100)}% of users` },
            { icon: XCircle, label: 'Expired Plans', value: kpiStats.expiredPlans.toLocaleString(), color: 'text-red-200 bg-red-900/30', change: 'Needs renewal' },
            { icon: DollarSign, label: 'Total Revenue', value: `₹${(kpiStats.totalRevenue / 100000).toFixed(1)}L`, color: 'text-blue-300 bg-blue-900/40', change: 'This year' },
          ].map(({ icon: Icon, label, value, color, change }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{label}</p>
              <p className="text-xs text-slate-500 mt-1">{change}</p>
            </div>
          ))}
        </div>

        {/* Users Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="subheading-rhythm text-lg font-bold text-slate-100">All Users</h2>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-dark pl-9 py-2 w-56"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-800">
                  <tr>
                    {['ID', 'Name', 'Email', 'Phone', 'Plan', 'Speed', 'Duration', 'Status', 'Expiry'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-950 transition-colors">
                      <td className="px-4 py-3.5 text-slate-500 text-xs font-mono">{u.id}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-100 whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-3.5 text-slate-300">{u.phone}</td>
                      <td className="px-4 py-3.5 text-slate-300">{u.plan}</td>
                      <td className="px-4 py-3.5 text-slate-300">{u.speed} Mbps</td>
                      <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{u.duration}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={u.status} size="sm" /></td>
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{u.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">No users found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
