"use client";

import Link from "next/link";
import { logoutUserAction } from "@/actions/auth-actions";

export default function AppSidebar({
  currentUser,
  activeItem = "home",
  collapsed = false,
  onToggleCollapse,
  mobileMenu = false,
  onCloseMobile,
  onOpenUpload,
  challengesCount,
  favoritesCount,
  publicPortfolioUsername,
}) {
  const role = currentUser?.role || "Guest";
  const isGuest = !currentUser;
  const isMember = role === "Member";
  const isCurator = role === "Curator";
  const isAdmin = role === "Admin";
  const isCuratorApproved = isCurator && currentUser?.curatorStatus === "Approved";

  const displayName = currentUser?.displayName || currentUser?.display_name || "User";
  const avatarUrl = currentUser?.avatarUrl || currentUser?.avatar_url || null;

  const navItemClass = (isActive) =>
    `group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] transition-all duration-300 ${
      collapsed ? "lg:justify-center lg:px-0" : ""
    } ${
      isActive
        ? "border border-white/[0.08] bg-white/[0.08] text-white shadow-[inset_2px_0_0_white]"
        : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
    }`;

  return (
    <>
      {mobileMenu && (
        <div onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-white/[0.07] bg-[#0b0b0c]/95 px-6 py-7 backdrop-blur-2xl transition-all duration-300 lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[78px] lg:px-3" : "lg:w-[250px]"}`}
      >
        {/* HEADER LOGO + TOMBOL MINIMIZE */}
        <div className={`mb-10 flex items-center ${collapsed ? "justify-between lg:flex-col lg:gap-3" : "justify-between"}`}>
          <Link href="/home" title="Aesthe Home" onClick={onCloseMobile} className="flex items-center gap-3 overflow-hidden">
            <img src="/images/aesthe-logo.png" alt="Aesthe" className="h-9 w-9 shrink-0 object-contain mix-blend-screen" />
            <div className={collapsed ? "lg:hidden" : ""}>
              <h1 className="text-[17px] font-medium tracking-[0.35em]">AESTHE</h1>
              <p className="mt-0.5 text-[8px] tracking-[0.3em] text-zinc-600">ART SHOWCASE</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-zinc-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white lg:flex"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {/* WORKSPACE NAVIGATION */}
        <div>
          <p className={`mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600 ${collapsed ? "lg:hidden" : ""}`}>
            WORKSPACE
          </p>
          {collapsed && <div className="mb-3 hidden h-px w-full bg-white/[0.07] lg:block" />}

          <nav className="space-y-1">
            <Link href="/home" title="Home" onClick={onCloseMobile} className={navItemClass(activeItem === "home")}>
              <span className="w-4 shrink-0 text-center text-base transition-transform duration-300 group-hover:scale-110">⌂</span>
              <span className={collapsed ? "lg:hidden" : ""}>Home</span>
            </Link>

            <Link href="/explore" title="Explore" onClick={onCloseMobile} className={navItemClass(activeItem === "explore")}>
              <span className="w-4 shrink-0 text-center text-base transition-transform duration-300 group-hover:scale-110">◈</span>
              <span className={collapsed ? "lg:hidden" : ""}>Explore</span>
            </Link>

            {isMember && (
              <Link href="/favorites" title="Favorites" onClick={onCloseMobile} className={navItemClass(activeItem === "favorites")}>
                <span className="w-4 shrink-0 text-center text-base transition-transform duration-300 group-hover:scale-110">⚑</span>
                <span className={collapsed ? "lg:hidden" : ""}>Favorites</span>
                {typeof favoritesCount === "number" && (
                  <span className={`ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-zinc-300 ${collapsed ? "lg:hidden" : ""}`}>
                    {favoritesCount}
                  </span>
                )}
              </Link>
            )}

            <Link href="/challenges" title="Challenges" onClick={onCloseMobile} className={navItemClass(activeItem === "challenges")}>
              <span className="w-4 shrink-0 text-center text-base transition-transform duration-300 group-hover:scale-110">✧</span>
              <span className={collapsed ? "lg:hidden" : ""}>Challenges</span>
              {typeof challengesCount === "number" && (
                <span className={`ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-zinc-300 ${collapsed ? "lg:hidden" : ""}`}>
                  {challengesCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* PERSONAL SPACE */}
        <div className="mt-8">
          <p className={`mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600 ${collapsed ? "lg:hidden" : ""}`}>
            PERSONAL SPACE
          </p>
          {collapsed && <div className="mb-3 hidden h-px w-full bg-white/[0.07] lg:block" />}

          <div className="space-y-1">
            {isMember && (
              onOpenUpload ? (
                <button
                  type="button"
                  title="Upload Artwork"
                  onClick={() => {
                    onOpenUpload();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={navItemClass(false)}
                >
                  <span className="w-4 shrink-0 text-center text-lg leading-none">＋</span>
                  <span className={collapsed ? "lg:hidden" : ""}>Upload Artwork</span>
                </button>
              ) : (
                <Link href="/home" title="Upload Artwork" onClick={onCloseMobile} className={navItemClass(false)}>
                  <span className="w-4 shrink-0 text-center text-lg leading-none">＋</span>
                  <span className={collapsed ? "lg:hidden" : ""}>Upload Artwork</span>
                </Link>
              )
            )}

            {currentUser && (
              <Link href="/profile" title="My Profile" onClick={onCloseMobile} className={navItemClass(activeItem === "profile")}>
                <span className="w-4 shrink-0 text-center text-base">◉</span>
                <span className={collapsed ? "lg:hidden" : ""}>My Profile</span>
              </Link>
            )}

            {isMember && publicPortfolioUsername && (
              <Link href={`/creators/${publicPortfolioUsername}`} title="Public Portfolio" onClick={onCloseMobile} className={navItemClass(false)}>
                <span className="w-4 shrink-0 text-center text-sm">↗</span>
                <span className={collapsed ? "lg:hidden" : ""}>Public Portfolio</span>
              </Link>
            )}

            {currentUser && (
              <Link href="/messages" title="Messages" onClick={onCloseMobile} className={navItemClass(activeItem === "messages")}>
                <span className="w-4 shrink-0 text-center text-sm">✉</span>
                <span className={collapsed ? "lg:hidden" : ""}>Messages</span>
              </Link>
            )}

            {isCurator && isCuratorApproved && (
              <Link
                href="/curator"
                title="Curator Dashboard"
                onClick={onCloseMobile}
                className={`flex w-full items-center gap-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-[12px] text-amber-200 transition hover:border-amber-400/40 hover:bg-amber-500/15 ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                }`}
              >
                <span className="w-4 shrink-0 text-center text-base">✦</span>
                <span className={collapsed ? "lg:hidden" : ""}>Curator Dashboard</span>
              </Link>
            )}

            {isCurator && !isCuratorApproved && (
              <Link
                href="/pending-curator"
                title={`Status Verifikasi (${currentUser?.curatorStatus || "Pending"})`}
                onClick={onCloseMobile}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-[11px] text-amber-300 transition hover:bg-amber-500/15 ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-center">⏳</span>
                  <span className={collapsed ? "lg:hidden" : ""}>Status Verifikasi</span>
                </span>
                <span className={`rounded-full bg-amber-500/20 px-2 py-0.5 text-[8px] uppercase tracking-wider ${collapsed ? "lg:hidden" : ""}`}>
                  {currentUser?.curatorStatus || "Pending"}
                </span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                title="Admin Console"
                onClick={onCloseMobile}
                className={`flex w-full items-center gap-4 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-3 text-left text-[12px] text-white transition hover:bg-white/10 ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                }`}
              >
                <span className="w-4 shrink-0 text-center text-base">❖</span>
                <span className={collapsed ? "lg:hidden" : ""}>Admin Console</span>
              </Link>
            )}

            {isGuest && (
              <Link href="/" title="Login / Register" onClick={onCloseMobile} className={navItemClass(false)}>
                <span className="w-4 shrink-0 text-center text-lg leading-none">→</span>
                <span className={collapsed ? "lg:hidden" : ""}>Login / Register</span>
              </Link>
            )}
          </div>
        </div>

        {/* SESSION CARD POJOK KIRI BAWAH */}
        <div className="mt-auto border-t border-white/[0.06] pt-4">
          {currentUser ? (
            <div className={`flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 transition hover:border-white/20 ${collapsed ? "lg:flex-col lg:gap-2 lg:p-2" : ""}`}>
              <Link href="/profile" title={`Profil ${displayName}`} onClick={onCloseMobile} className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-semibold text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black bg-emerald-400" />
              </Link>

              <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                <Link href="/profile" onClick={onCloseMobile} className="block truncate text-xs font-medium leading-tight text-white transition hover:text-zinc-300">
                  {displayName}
                </Link>
                <form action={logoutUserAction} className="mt-0.5">
                  <button type="submit" className="text-[10px] text-zinc-500 transition hover:text-red-400">
                    Logout
                  </button>
                </form>
              </div>

              {collapsed && (
                <form action={logoutUserAction} className="hidden lg:block">
                  <button type="submit" title="Logout" aria-label="Logout" className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-zinc-500 transition hover:bg-red-500/15 hover:text-red-400">
                    ⎋
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className={`flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 ${collapsed ? "lg:flex-col lg:gap-1.5 lg:p-2" : ""}`}>
              <Link href="/" title="Sign In" onClick={onCloseMobile} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-xs text-zinc-400 transition hover:border-white/30 hover:text-white">
                G
              </Link>
              <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
                <p className="truncate text-xs font-medium leading-tight text-white">Guest</p>
                <Link href="/" onClick={onCloseMobile} className="text-[10px] text-zinc-400 transition hover:text-white">
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <div className={`mt-3 flex items-center justify-between text-[8px] tracking-wider text-zinc-700 ${collapsed ? "lg:hidden" : ""}`}>
            <span>AESTHE © 2026</span>
          </div>
        </div>
      </aside>
    </>
  );
}
