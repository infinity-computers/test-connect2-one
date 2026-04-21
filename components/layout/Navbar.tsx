"use client";

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { user, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Plans', path: '/plans' },
    { label: 'Service Policy', path: '/policy' },
    { label: 'Contact', path: '/contact' },
  ];

  const getDashboardPath = () => {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'TECHNICIAN') return '/admin/complaints';
    return '/dashboard';
  };

  const handleCtaClick = () => {
    if (user) {
      onNavigate(getDashboardPath());
    } else {
      onNavigate('/login');
    }
    setMenuOpen(false);
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || menuOpen ? 'bg-slate-900 shadow-md' : 'bg-slate-950/90 backdrop-blur-sm shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => { onNavigate('/'); setMenuOpen(false); }}
            className="inline-flex items-center focus:outline-none"
          >
            <img src="/LOGO_(1).png" alt="Connect One Networks" className="h-10 w-auto" />
          </button>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`text-sm font-medium transition-colors duration-200 ${isActive(link.path) ? 'text-blue-300 border-b-2 border-blue-500 pb-0.5' : 'text-slate-200 hover:text-blue-300'}`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleCtaClick}
              className="btn-primary px-4 py-2 text-sm rounded-lg shadow-sm"
            >
              {user ? 'Dashboard' : 'Sign In'}
            </button>
          </div>

          <button
            className="md:hidden p-2 text-slate-200 hover:text-blue-400 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 py-3 space-y-1">
            {navLinks.map(link => (
              <button
                key={link.path}
                onClick={() => { onNavigate(link.path); setMenuOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive(link.path) ? 'text-blue-300 bg-blue-900/40' : 'text-slate-200 hover:bg-slate-950'}`}
              >
                {link.label}
              </button>
            ))}
            <div className="px-4 pt-2">
              <button
                onClick={handleCtaClick}
                className="btn-primary w-full py-2.5 text-sm rounded-lg"
              >
                {user ? 'Dashboard' : 'Sign In'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
