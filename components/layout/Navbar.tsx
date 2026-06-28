"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, UserRound, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  type Variants,
} from "motion/react";
import { useAuth } from "../../context/AuthContext";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const NAV_EASE = [0.32, 0.72, 0, 1] as const;
const ITEM_EASE = [0.22, 1, 0.36, 1] as const;

export default function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { user, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Drive border-radius independently so it responds to both scrolled AND menuOpen
  // without being stuck in a cached variant object.
  const radiusRaw = useMotionValue(0);
  const borderRadius = useSpring(radiusRaw, { stiffness: 300, damping: 30 });

  useEffect(() => {
    radiusRaw.set(scrolled ? (menuOpen ? 24 : 9999) : 0);
  }, [scrolled, menuOpen, radiusRaw]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Plans", path: "/plans" },
    { label: "Service Policy", path: "/policy" },
    { label: "Contact", path: "/contact" },
  ];

  const getDashboardPath = () => {
    if (role === "ADMIN") return "/admin/dashboard";
    if (role === "TECHNICIAN") return "/admin/complaints";
    return "/dashboard";
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setMenuOpen(false);
  };

  const handleAccountClick = () =>
    handleNavigate(user ? getDashboardPath() : "/login");

  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  // ── Framer Motion variants ─────────────────────────────────────────────────

  const navVariants: Variants = {
    top: {
      top: 0,
      left: 0,
      right: 0,
      x: 0,
      width: "100%",
      transition: { duration: 0.45, ease: NAV_EASE },
    },
    scrolled: {
      top: 16,
      left: "50%",
      right: "auto",
      x: "-50%",
      width: "min(calc(100% - 24px), 80rem)",
      transition: { duration: 0.45, ease: NAV_EASE },
    },
  };

  // Mobile menu panel
  const menuVariants: Variants = {
    closed: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: NAV_EASE },
    },
    open: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.35, ease: NAV_EASE },
    },
  };

  // Stagger children inside menu
  const menuItemVariants: Variants = {
    closed: { opacity: 0, x: -8 },
    open: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { duration: 0.25, delay: i * 0.05, ease: ITEM_EASE },
    }),
  };

  return (
    <motion.nav
      className="fixed z-50 border border-white/10 bg-[#071527]/88 backdrop-blur-xl shadow-[0_12px_60px_rgba(0,0,0,0.35)]"
      variants={navVariants}
      initial={false}
      animate={scrolled ? "scrolled" : "top"}
      style={{ borderRadius }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[62px] items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => handleNavigate("/")}
            className="inline-flex items-center gap-3 focus:outline-none shrink-0"
            aria-label="Go to homepage"
          >
            <img
              src="/LOGO_(1).png"
              alt="Connect One Networks"
              className="h-10 w-auto"
            />
          </button>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1 rounded-full border border-white/[0.05] bg-white/[0.03] px-2 py-1 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavigate(link.path)}
                className={[
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive(link.path)
                    ? "bg-cyan-300/10 text-cyan-100"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex shrink-0">
            <button
              onClick={handleAccountClick}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              {user ? <LayoutDashboard size={16} /> : <UserRound size={16} />}
              {user ? "Dashboard" : "Sign In"}
            </button>
          </div>

          {/* Hamburger */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-100 transition hover:bg-white/[0.08] hover:text-cyan-100 md:hidden"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <X size={21} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <Menu size={21} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="overflow-hidden md:hidden"
            >
              <div className="border-t border-white/10 px-1 pb-4 pt-3">
                <div className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.button
                      key={link.path}
                      custom={i}
                      variants={menuItemVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      onClick={() => handleNavigate(link.path)}
                      className={[
                        "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                        isActive(link.path)
                          ? "bg-cyan-300/10 text-cyan-100"
                          : "text-slate-200 hover:bg-white/[0.06] hover:text-white",
                      ].join(" ")}
                    >
                      {link.label}
                      {isActive(link.path) && (
                        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                      )}
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  custom={navLinks.length}
                  variants={menuItemVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="mt-4"
                >
                  <button
                    onClick={handleAccountClick}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/[0.08] hover:text-cyan-100"
                  >
                    {user ? (
                      <LayoutDashboard size={17} />
                    ) : (
                      <UserRound size={17} />
                    )}
                    {user ? "Open Dashboard" : "Sign In"}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
