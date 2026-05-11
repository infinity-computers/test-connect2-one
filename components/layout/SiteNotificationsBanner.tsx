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

function formatExpiry(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

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

  const containerClassName = useMemo(
    () => `${hasNavbar ? "mt-16" : "mt-0"} border-b border-amber-500/20 bg-amber-500/10`,
    [hasNavbar],
  );

  if (!loaded || notifications.length === 0) {
    return null;
  }

  return (
    <div className={containerClassName} role="status" aria-live="polite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">
        {notifications.map((notification) => {
          const expiresLabel = formatExpiry(notification.expires_at);

          return (
            <div
              key={notification.id}
              className="flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-slate-950/70 px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                  <BellRing size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-100">{notification.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-200 whitespace-pre-line">
                    {notification.description}
                  </p>
                </div>
              </div>

              {expiresLabel && (
                <p className="text-xs font-medium text-slate-400 sm:pl-12 sm:pt-1">
                  Expires {expiresLabel}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
