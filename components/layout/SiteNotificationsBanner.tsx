"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing } from "lucide-react";

type SiteNotification = {
  id: string;
  title: string;
  description: string;
  expires_at: string;
};

interface SiteNotificationsBannerProps {
  hasNavbar: boolean;
}

const REFRESH_INTERVAL_MS = 60_000;

export default function SiteNotificationsBanner({
  hasNavbar,
}: SiteNotificationsBannerProps) {
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [navbarScrolled, setNavbarScrolled] = useState(false);

  useEffect(() => {
    if (!hasNavbar) {
      setNavbarScrolled(false);
      return;
    }

    const handleScroll = () => setNavbarScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNavbar]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setNotifications(
            Array.isArray(data.notifications) ? data.notifications : [],
          );
        }
      } catch (err) {
        console.error("Failed to load site notifications:", err);
        if (!cancelled) {
          setNotifications([]);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    };

    load();
    const timer = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const tickerText = useMemo(() => {
    return notifications
      .map((n) => `${n.title}: ${n.description}`)
      .join("   •   ");
  }, [notifications]);

  const tickerDurationSeconds = useMemo(() => {
    return Math.min(42, Math.max(24, tickerText.length * 0.22));
  }, [tickerText]);

  if (!loaded || notifications.length === 0 || !tickerText) {
    return null;
  }

  const isCompact = hasNavbar && navbarScrolled;

  return (
    <div
      className={[
        hasNavbar ? "sticky z-40" : "relative z-40",
        isCompact
          ? "top-[4.75rem] mx-auto w-[min(calc(100%_-_40px),72rem)] overflow-hidden rounded-full border border-white/[0.075] bg-[#06111f]/72 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
          : "top-14 w-full border-b border-white/[0.065] bg-[#06111f]/80 shadow-[0_8px_28px_rgba(0,0,0,0.18)]",
        "backdrop-blur-md transition-[top,width,background-color,border-color,box-shadow,border-radius] duration-300",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div
        className={
          isCompact
            ? "mx-auto px-3 sm:px-4 lg:px-5"
            : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        }
      >
        <div className={`flex items-center gap-3 ${isCompact ? "py-2" : "py-2.5"}`}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-cyan-200 ${
              isCompact ? "h-6 w-6" : "h-7 w-7"
            }`}
          >
            <BellRing size={isCompact ? 12 : 13} className="animate-pulse" />
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 z-10 bg-gradient-to-r to-transparent ${
                isCompact ? "w-4 from-[#06111f]/45" : "w-8 from-[#06111f]"
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 z-10 bg-gradient-to-l to-transparent ${
                isCompact ? "w-4 from-[#06111f]/45" : "w-8 from-[#06111f]"
              }`}
            />

            <div
              className={`whitespace-nowrap font-medium text-slate-200 motion-safe:animate-[notification-ticker_28s_linear_infinite] hover:[animation-play-state:paused] ${
                isCompact ? "text-[13px]" : "text-sm"
              }`}
              style={{ animationDuration: `${tickerDurationSeconds}s` }}
            >
              <span className="inline-block pr-12">
                {notifications.map((n) => (
                  <span
                    key={n.id}
                    className="mr-12 inline-flex items-center gap-2"
                  >
                    <span className="text-cyan-100">{n.title}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300">{n.description}</span>
                  </span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes notification-ticker {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
