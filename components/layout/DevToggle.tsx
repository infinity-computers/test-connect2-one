"use client";

import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';

interface DevToggleProps {
  onNavigate: (path: string) => void;
}

export default function DevToggle({ onNavigate }: DevToggleProps) {
  const { role, setRole } = useAuth();
  const [open, setOpen] = useState(false);

  const roles: { value: UserRole; label: string; path: string }[] = [
    { value: 'guest', label: 'Guest', path: '/' },
    { value: 'user', label: 'Customer', path: '/dashboard' },
    { value: 'admin', label: 'Admin', path: '/admin/dashboard' },
    { value: 'technician', label: 'Technician', path: '/admin/complaints' },
  ];

  const handleSelect = (r: UserRole, path: string) => {
    setRole(r);
    onNavigate(path);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg hover:bg-slate-900 transition-colors border border-slate-700"
      >
        <Settings size={13} />
        Dev: {roles.find(r => r.value === role)?.label ?? 'Guest'}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 bg-slate-900 rounded-xl shadow-xl border border-slate-700 overflow-hidden w-44">
          <div className="px-3 py-2 bg-slate-950 border-b border-slate-800">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Switch Role</p>
          </div>
          {roles.map(r => (
            <button
              key={r.value}
              onClick={() => handleSelect(r.value, r.path)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${role === r.value ? 'bg-blue-900/40 text-blue-300 font-semibold' : 'text-slate-200 hover:bg-slate-950'}`}
            >
              <span className={`w-2 h-2 rounded-full ${role === r.value ? 'bg-blue-500' : 'bg-slate-500'}`} />
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
