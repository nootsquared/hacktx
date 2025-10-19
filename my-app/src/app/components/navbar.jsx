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
const AppIcon = ({ size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="app-icon-title"
      role="img"
    >
      <title id="app-icon-title">Toyota Financial Journey App Icon</title>
      
      {/* Background Rounded Square */}
      <rect width="100" height="100" rx="22" fill="#1A1A1A" />
      
      {/* Red Circle Accent */}
      <circle cx="50" cy="50" r="38" fill="#D32F2F" />

      {/* Upward Arrow / Path */}
      <path
        d="M25 75 Q50 75 50 50 Q50 25 75 25"
        fill="none"
        stroke="rgba(255, 255, 255, 0.8)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <path
        d="M68 20 L75 25 L68 30"
        fill="none"
        stroke="rgba(255, 255, 255, 0.8)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Stylized Car Shape */}
      <g transform="translate(20, 52) rotate(-20)">
        <path
          d="M0 10 C 5 0, 25 0, 30 10 L 30 15 L 0 15 Z"
          fill="#FFFFFF"
        />
        <circle cx="7" cy="15" r="3" fill="#1A1A1A" />
        <circle cx="23" cy="15" r="3" fill="#1A1A1A" />
      </g>

    </svg>
  );
};

const CarIcon = ({ size = 24, color = 'currentColor' }) => {
  return (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill={color} className="bi bi-car-front" viewBox="0 0 16 16">
  <path d="M4 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0m10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0M6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2zM4.862 4.276 3.906 6.19a.51.51 0 0 0 .497.731c.91-.073 2.35-.17 3.597-.17s2.688.097 3.597.17a.51.51 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 10.691 4H5.309a.5.5 0 0 0-.447.276"/>
  <path d="M2.52 3.515A2.5 2.5 0 0 1 4.82 2h6.362c1 0 1.904.596 2.298 1.515l.792 1.848c.075.175.21.319.38.404.5.25.855.715.965 1.262l.335 1.679q.05.242.049.49v.413c0 .814-.39 1.543-1 1.997V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.338c-1.292.048-2.745.088-4 .088s-2.708-.04-4-.088V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.892c-.61-.454-1-1.183-1-1.997v-.413a2.5 2.5 0 0 1 .049-.49l.335-1.68c.11-.546.465-1.012.964-1.261a.8.8 0 0 0 .381-.404l.792-1.848ZM4.82 3a1.5 1.5 0 0 0-1.379.91l-.792 1.847a1.8 1.8 0 0 1-.853.904.8.8 0 0 0-.43.564L1.03 8.904a1.5 1.5 0 0 0-.03.294v.413c0 .796.62 1.448 1.408 1.484 1.555.07 3.786.155 5.592.155s4.037-.084 5.592-.155A1.48 1.48 0 0 0 15 9.611v-.413q0-.148-.03-.294l-.335-1.68a.8.8 0 0 0-.43-.563 1.8 1.8 0 0 1-.853-.904l-.792-1.848A1.5 1.5 0 0 0 11.18 3z"/>
</svg>
  );
};
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
  const routeTab = useMemo(() => (
    pathname && (pathname.startsWith("/finance") || pathname.startsWith("/dashboard"))
      ? "finance"
      : "browse"
  ), [pathname]);
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
            <CarIcon className="h-6 w-6" />
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
                href="/finance-intake"
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

