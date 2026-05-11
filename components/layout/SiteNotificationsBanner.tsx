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

  return (
    <div
      className={`${hasNavbar ? "sticky top-16 z-40" : "relative z-40"} bg-slate-950/95 backdrop-blur-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2 border-b border-slate-800/70">
        {notifications.map((notification) => {
          return (
            <div
              key={notification.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900/30 text-blue-200">
                  <BellRing size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{notification.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-200 whitespace-pre-line">
                    {notification.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
