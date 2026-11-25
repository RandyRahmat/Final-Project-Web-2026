"use client";

import Link from "next/link";

function NavIcon({ name, className = "h-5 w-5" }) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5" />
          <path d="M9.5 20.5V14h5v6.5" />
        </svg>
      );
    case "explore":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="9" />
          <polygon points="15.8 8.2 13.7 13.7 8.2 15.8 10.3 10.3 15.8 8.2" />
        </svg>
      );
    case "favorites":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.2L5 20V5a1 1 0 0 1 1-1z" />
        </svg>
      );
    case "challenges":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z" />
        </svg>
      );
    case "profile":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20c1.4-3.8 4.4-5.5 7.5-5.5s6.1 1.7 7.5 5.5" />
        </svg>
      );
    case "curator":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M8 21h8M12 18v3" />
          <path d="M8 10l2.5 2.5L16 7.5" />
        </svg>
      );
    case "admin":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
          <path d="M9.5 12l1.8 1.8 3.5-3.8" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      );
  }
}

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
