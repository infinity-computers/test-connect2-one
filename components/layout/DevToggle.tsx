// "use client";

// import { useState } from 'react';
// import { Settings, ChevronDown } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';

// interface DevToggleProps {
//   onNavigate: (path: string) => void;
// }

// export default function DevToggle({ onNavigate }: DevToggleProps) {
//   const { user, role } = useAuth();
//   const [open, setOpen] = useState(false);

//   const roles: { value: string; label: string; path: string }[] = [
//     { value: 'GUEST', label: 'Guest', path: '/' },
//     { value: 'USER', label: 'Customer', path: '/dashboard' },
//     { value: 'ADMIN', label: 'Admin', path: '/admin/dashboard' },
//     { value: 'TECHNICIAN', label: 'Technician', path: '/admin/complaints' },
//   ];

//   const currentLabel = user ? roles.find(r => r.value === role)?.label || role : 'Guest';

//   return (
//     <div className="fixed bottom-4 right-4 z-[100]">
//       <button
//         onClick={() => setOpen(!open)}
//         className="flex items-center gap-2 bg-slate-950 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg hover:bg-slate-900 transition-colors border border-slate-700"
//       >
//         <Settings size={13} />
//         {currentLabel}
//         <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
//       </button>
//       {open && (
//         <div className="absolute bottom-10 right-0 bg-slate-900 rounded-xl shadow-xl border border-slate-700 overflow-hidden w-44">
//           <div className="px-3 py-2 bg-slate-950 border-b border-slate-800">
//             <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Current: {currentLabel}</p>
//           </div>
//           <button
//             onClick={() => onNavigate('/login')}
//             className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:text-slate-300"
//           >
//             Use /login to authenticate
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
