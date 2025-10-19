"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const HomeIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
    {...props}
  >
    <path d="M12 3.172 3.172 12A4 4 0 0 0 2 14.828V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3h4v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5.172A4 4 0 0 0 20.828 12L12 3.172Z" />
  </svg>
);

const AccountIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="currentColor"
    {...props}
  >
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.761-3.582-5-8-5Z" />
  </svg>
);

const Navbar = () => {
  const pathname = usePathname();
  const routeTab = useMemo(() => (pathname === "/finance" ? "finance" : "browse"), [pathname]);
  const [hoverTab, setHoverTab] = useState(null);
  const activeTab = hoverTab ?? routeTab;

  return (
    <div className="fixed top-3 left-1/2 z-50 -translate-x-1/2 w-full px-3">
      <nav className="mx-auto max-w-3xl rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg shadow-black/10 dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2">
          {/* Left icon/logo */}
          <Link
            href="/"
            aria-label="Home"
            className="text-foreground/90 hover:text-foreground transition-colors"
          >
            <HomeIcon className="h-6 w-6" />
          </Link>

          {/* Center tabs */}
          <div
            className="relative w-56 select-none rounded-xl bg-white/5 p-1 text-sm text-foreground/80"
            onMouseLeave={() => setHoverTab(null)}
          >
            <span
              className={`pointer-events-none absolute inset-y-1 left-1 w-1/2 rounded-lg bg-neutral-300/80 dark:bg-neutral-700/70 shadow-sm transition-transform duration-300 ease-out will-change-transform ${
                activeTab === "browse" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <div className="relative z-10 grid grid-cols-2 gap-1">
              <Link
                href="/"
                onMouseEnter={() => setHoverTab("browse")}
                className={`flex items-center justify-center rounded-lg px-3 py-1.5 transition-colors duration-200 ${
                  activeTab === "browse" ? "text-black dark:text-white" : "hover:text-foreground"
                }`}
              >
                Browse
              </Link>
              <Link
                href="/finance"
                onMouseEnter={() => setHoverTab("finance")}
                className={`flex items-center justify-center rounded-lg px-3 py-1.5 transition-colors duration-200 ${
                  activeTab === "finance" ? "text-black dark:text-white" : "hover:text-foreground"
                }`}
              >
                Finance
              </Link>
            </div>
          </div>

          {/* Right account icon */}
          <Link
            href="/dashboard"
            aria-label="Account"
            className="text-foreground/90 hover:text-foreground transition-colors"
          >
            <AccountIcon className="h-6 w-6" />
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
