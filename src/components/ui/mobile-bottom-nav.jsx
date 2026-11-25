"use client";

import Link from "next/link";
import NavIcon from "@/components/ui/nav-icon";

export default function MobileBottomNav({ currentUser, activeItem = "home" }) {
  const role = currentUser?.role || "Guest";
  const isMember = role === "Member";
  const isCurator = role === "Curator";
  const isAdmin = role === "Admin";
  const isCuratorApproved = isCurator && (currentUser?.curatorStatus === "Approved" || currentUser?.curator_status === "Approved");

  let items;
  if (isMember) {
    items = [
      { id: "home", label: "Home", href: "/home", icon: "home" },
      { id: "explore", label: "Explore", href: "/explore", icon: "explore" },
      { id: "favorites", label: "Favorites", href: "/favorites", icon: "favorites" },
      { id: "challenges", label: "Events", href: "/challenges", icon: "challenges" },
      { id: "profile", label: "Profile", href: "/profile", icon: "profile" },
    ];
  } else if (isCuratorApproved) {
    items = [
      { id: "home", label: "Home", href: "/home", icon: "home" },
      { id: "explore", label: "Explore", href: "/explore", icon: "explore" },
      { id: "challenges", label: "Events", href: "/challenges", icon: "challenges" },
      { id: "curator", label: "Studio", href: "/curator", icon: "curator" },
      { id: "profile", label: "Profile", href: "/profile", icon: "profile" },
    ];
  } else if (isAdmin) {
    items = [
      { id: "home", label: "Home", href: "/home", icon: "home" },
      { id: "explore", label: "Explore", href: "/explore", icon: "explore" },
      { id: "challenges", label: "Events", href: "/challenges", icon: "challenges" },
      { id: "admin", label: "Admin", href: "/admin", icon: "admin" },
      { id: "profile", label: "Profile", href: "/profile", icon: "profile" },
    ];
  } else if (currentUser) {
    items = [
      { id: "home", label: "Home", href: "/home", icon: "home" },
      { id: "explore", label: "Explore", href: "/explore", icon: "explore" },
      { id: "challenges", label: "Events", href: "/challenges", icon: "challenges" },
      { id: "profile", label: "Profile", href: "/profile", icon: "profile" },
    ];
  } else {
    items = [
      { id: "home", label: "Home", href: "/home", icon: "home" },
      { id: "explore", label: "Explore", href: "/explore", icon: "explore" },
      { id: "challenges", label: "Events", href: "/challenges", icon: "challenges" },
      { id: "login", label: "Masuk", href: "/", icon: "login" },
    ];
  }

  const count = items.length;
  const activeIndex = items.findIndex((item) => item.id === activeItem);
  const hasNotch = activeIndex >= 0;
  const ratio = hasNotch ? (activeIndex + 0.5) / count : 0.5;

  return (
    <nav
      data-mobile-nav="true"
      aria-label="Navigasi bawah mobile"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-[430px] select-none lg:hidden"
    >
      <div className="relative h-[64px] w-full">
        {/* LATAR MELENGKUNG (NOTCHED GLASS BAR) */}
        {hasNotch ? (
          <div className="pointer-events-none absolute inset-0 flex h-[64px] w-full drop-shadow-[0_18px_36px_rgba(0,0,0,0.88)]">
            {/* Segmen Kiri */}
            <div
              style={{
                width: `calc((100% - 32px) * ${ratio} - 18px)`,
                transition: "width 480ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className="h-[64px] shrink-0 rounded-l-[16px] border-y border-l border-white/[0.16] bg-[#101013]/95 backdrop-blur-2xl"
            />

            {/* Segmen Kurva U-Notch Tengah (fixed 68px agar kurva selalu presisi) */}
            <svg
              width="68"
              height="64"
              viewBox="0 0 68 64"
              fill="none"
              className="h-[64px] w-[68px] shrink-0 overflow-visible"
            >
              <defs>
                <radialGradient id="notchGlow" cx="50%" cy="15%" r="65%">
                  <stop offset="0%" stopColor="rgba(212, 175, 106, 0.22)" />
                  <stop offset="100%" stopColor="rgba(16, 16, 19, 0)" />
                </radialGradient>
              </defs>
              <path
                d="M 0,0.5 C 10,0.5 11,30 34,30 C 57,30 58,0.5 68,0.5 L 68,63.5 L 0,63.5 Z"
                fill="rgba(16, 16, 19, 0.95)"
              />
              <path
                d="M 0,0.5 C 10,0.5 11,30 34,30 C 57,30 58,0.5 68,0.5 L 68,63.5 L 0,63.5 Z"
                fill="url(#notchGlow)"
              />
              <path
                d="M 0,0.5 C 10,0.5 11,30 34,30 C 57,30 58,0.5 68,0.5"
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="1"
              />
              <line x1="0" y1="63.5" x2="68" y2="63.5" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1" />
            </svg>

            {/* Segmen Kanan */}
            <div className="h-[64px] flex-1 rounded-r-[16px] border-y border-r border-white/[0.16] bg-[#101013]/95 backdrop-blur-2xl" />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/[0.16] bg-[#101013]/95 shadow-[0_18px_36px_rgba(0,0,0,0.88)] backdrop-blur-2xl" />
        )}

        {/* LINGKARAN BERCAHAYA EMAS CHAMPAGNE (INDIKATOR AKTIF) */}
        {hasNotch && (
          <div
            style={{
              left: `calc(16px + (100% - 32px) * ${ratio})`,
              transition: "left 480ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="pointer-events-none absolute -top-[24px] z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-champagne-100 via-champagne-300 to-champagne-500 shadow-[0_0_28px_rgba(212,175,106,0.72),0_8px_18px_rgba(0,0,0,0.7)] ring-1 ring-white/40"
          />
        )}

        {/* ITEM NAVIGASI */}
        <div className="relative z-20 flex h-full w-full items-center px-4">
          {items.map((item) => {
            const isActive = item.id === activeItem;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="relative flex h-full flex-1 flex-col items-center justify-center"
              >
                <span
                  className={`transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? "-translate-y-[24px] scale-105 text-[#0b0b0c]"
                      : "translate-y-0 text-zinc-400 hover:text-champagne-100"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-[20px] w-[20px]" />
                </span>

                <span
                  className={`absolute bottom-2 text-[10px] font-semibold tracking-wide transition-all duration-400 ${
                    isActive
                      ? "translate-y-0 text-champagne-200 opacity-100"
                      : "pointer-events-none translate-y-1.5 text-zinc-500 opacity-0"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
