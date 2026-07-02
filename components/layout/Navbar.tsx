"use client";

import { useEffect, useRef, useState } from "react";
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

  // Drive border-radius so it responds to both scrolled AND menuOpen.
  //
  // IMPORTANT: the pill-forming radius change (triggered by scroll) should
  // animate smoothly via spring, but the radius change triggered by opening
  // the mobile menu must snap INSTANTLY. If both go through the spring, the
  // radius takes a few hundred ms to ease from the pill value (9999) down to
  // the open value (18) while the menu's height is *also* animating open on
  // its own timeline — so you briefly see a tall box still wearing the huge
  // pill radius before it "unrounds" into a rectangle. Splitting these into
  // two effects (one springs, one jumps) fixes that.
  const radiusRaw = useMotionValue(0);
  const borderRadius = useSpring(radiusRaw, { stiffness: 300, damping: 30 });

  const scrolledRef = useRef(scrolled);
  const menuOpenRef = useRef(menuOpen);

  useEffect(() => {
    scrolledRef.current = scrolled;
  }, [scrolled]);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  // Scroll position changed: animate the radius smoothly (spring).
  useEffect(() => {
    const target = scrolled ? (menuOpenRef.current ? 18 : 9999) : 0;
    radiusRaw.set(target);
  }, [scrolled, radiusRaw]);

  // Menu open/closed changed: snap the radius instantly so it never lags
  // behind the height animation.
  useEffect(() => {
    const target = scrolledRef.current ? (menuOpen ? 18 : 9999) : 0;
    borderRadius.jump(target);
    radiusRaw.set(target);
  }, [menuOpen, borderRadius, radiusRaw]);

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

  // ── Motion variants ─────────────────────────────────────────────────

  const navVariants: Variants = {
    top: {
      top: 0,
      left: 0,
      right: 0,
      x: 0,
      width: "100%",
      transition: { duration: 0.28, ease: NAV_EASE },
    },
    scrolled: {
      top: 10,
      left: "50%",
      right: "auto",
      x: "-50%",
      width: "min(calc(100% - 40px), 72rem)",
      transition: { duration: 0.28, ease: NAV_EASE },
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
      className={[
        "group/nav fixed z-50 backdrop-blur-md transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border border-white/[0.065] bg-[#06111f]/62 shadow-[0_8px_28px_rgba(0,0,0,0.18)] hover:border-white/[0.09] hover:bg-[#06111f]/70 hover:shadow-[0_10px_32px_rgba(0,0,0,0.2)]"
          : "bg-[#06111f]/72 shadow-[0_1px_0_rgba(255,255,255,0.045)] after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-[#06111f]/72",
      ].join(" ")}
      variants={navVariants}
      initial={false}
      animate={scrolled ? "scrolled" : "top"}
      style={{ borderRadius }}
    >
      <div className="mx-auto px-4 sm:px-5 lg:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => handleNavigate("/")}
            className="inline-flex shrink-0 items-center gap-3 rounded-full transition duration-300 hover:scale-[1.015] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-label="Go to homepage"
          >
            <img
              src="/LOGO_(1).png"
              alt="Connect One Networks"
              className="h-8 w-auto"
            />
          </button>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1 rounded-full px-1.5 py-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.path);

              return (
                <button
                  key={link.path}
                  onClick={() => handleNavigate(link.path)}
                  className={[
                    "group/link relative overflow-hidden rounded-full px-3.5 py-1.5 text-sm font-medium transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                    active
                      ? "text-white"
                      : "text-slate-400 hover:bg-white/[0.035] hover:text-white",
                  ].join(" ")}
                >
                  <span className="relative z-10">{link.label}</span>
                  {!active && (
                    <span
                      className="absolute inset-x-4 -bottom-0.5 h-px origin-center scale-x-0 rounded-full bg-cyan-300/45 opacity-0 transition duration-300 group-hover/link:scale-x-100 group-hover/link:opacity-100"
                      aria-hidden="true"
                    />
                  )}
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-x-4 -bottom-0.5 h-px rounded-full bg-cyan-300/85 shadow-[0_0_10px_rgba(103,232,249,0.45)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <button
              onClick={handleAccountClick}
              className="group/account inline-flex min-h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.026] px-3.5 py-1.5 text-sm font-semibold text-slate-200 transition duration-300 hover:-translate-y-px hover:border-cyan-200/20 hover:bg-cyan-300/[0.05] hover:text-cyan-100 hover:shadow-[0_8px_26px_rgba(34,211,238,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <span className="transition duration-300 group-hover/account:text-cyan-200 group-hover/account:drop-shadow-[0_0_8px_rgba(103,232,249,0.35)]">
                {user ? <LayoutDashboard size={15} /> : <UserRound size={15} />}
              </span>
              {user ? "Dashboard" : "Sign In"}
            </button>
          </div>

          {/* Hamburger */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-100 transition duration-300 hover:-translate-y-px hover:border-cyan-200/20 hover:bg-cyan-300/[0.055] hover:text-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 md:hidden"
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
              <div className="border-t border-white/[0.08] px-1 pb-4 pt-3">
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
                        "flex min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200",
                        isActive(link.path)
                          ? "bg-cyan-300/[0.08] text-cyan-100"
                          : "text-slate-300 hover:bg-white/[0.055] hover:text-white",
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
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-100 transition duration-300 hover:border-cyan-200/20 hover:bg-cyan-300/[0.055] hover:text-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
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