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

export default function SiteNotificationsBanner({ hasNavbar }: SiteNotificationsBannerProps) {
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        const data = await res.json();

        if (!cancelled) {
          setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
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

  if (!loaded || notifications.length === 0 || !tickerText) {
    return null;
  }

  return (
    <div
      className={`${hasNavbar ? "sticky top-16 z-40" : "relative z-40"} border-b border-cyan-900/50 bg-cyan-950/85`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-900/40 text-cyan-200">
            <BellRing size={13} />
          </div>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-cyan-950/85 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-cyan-950/85 to-transparent" />
            <div className="flex w-max gap-12 whitespace-nowrap text-sm text-cyan-100 motion-safe:animate-[notification-ticker_24s_linear_infinite] hover:[animation-play-state:paused]">
              <span>{tickerText}</span>
              <span aria-hidden="true">{tickerText}</span>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes notification-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
