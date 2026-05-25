"use client";

import { useEffect, useState } from "react";
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

  if (!loaded || notifications.length === 0) {
    return null;
  }

  const scrollingNotifications = [...notifications, ...notifications];

  return (
    <div
      className={`${hasNavbar ? "sticky top-16 z-40" : "relative z-40"} bg-slate-950/95 backdrop-blur-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto border-b border-slate-800/70">
        <div className="overflow-hidden px-4 py-3 sm:px-6 lg:px-8">
          <div
            className="flex w-max items-stretch gap-3 motion-safe:animate-[scroll-notifications_55s_linear_infinite] hover:[animation-play-state:paused]"
            aria-label="Site notifications"
          >
            {scrollingNotifications.map((notification, idx) => (
              <div
                key={`${notification.id}-${idx}`}
                className="flex min-w-[320px] max-w-[440px] flex-none gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-sm"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-900/30 text-cyan-200">
                  <BellRing size={14} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll-notifications {
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
