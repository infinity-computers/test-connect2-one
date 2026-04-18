"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DevToggle from "./DevToggle";

const ADMIN_PATH_PREFIX = "/admin";
const NO_LAYOUT_PATHS = new Set(["/login", "/admin/login"]);

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const onNavigate = (to: string) => {
    router.push(to);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isAdminPath = pathname.startsWith(ADMIN_PATH_PREFIX);
  const showLayout = !NO_LAYOUT_PATHS.has(pathname) && !isAdminPath;
  const showFooter = showLayout && pathname !== "/dashboard" && pathname !== "/my-subscriptions";

  return (
    <div className="min-h-screen flex flex-col">
      {(showLayout || isAdminPath) && <Navbar currentPath={pathname} onNavigate={onNavigate} />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer onNavigate={onNavigate} />}
      <DevToggle onNavigate={onNavigate} />
    </div>
  );
}
