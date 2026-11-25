"use client";

import Link from "next/link";
import NavIcon from "@/components/ui/nav-icon";
import { logoutUserAction } from "@/actions/auth-actions";

const ADMIN_TABS = [
  { id: "overview", label: "Statistik Platform", icon: "stats" },
  { id: "curators", label: "Verifikasi Curator", icon: "curator" },
  { id: "moderation", label: "Moderasi Konten", icon: "moderation" },
  { id: "users", label: "Manajemen Pengguna", icon: "users" },
  { id: "categories", label: "Manajemen Kategori", icon: "categories" },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  pendingCuratorsCount = 0,
  pendingReportsCount = 0,
  adminUser = null,
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}) {
  return (
    <>
      {mobileOpen && (
        <div onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-white/[0.07] bg-[#0a0a0b]/92 px-5 py-6 backdrop-blur-md transition-all duration-300 lg:z-30 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-20 lg:px-3" : "lg:w-64"}`}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-champagne-400/25 to-transparent" />

        <div>
          {/* Brand Logo Header + Minimize Button */}
          <div className={`flex items-center px-1 ${collapsed ? "justify-between lg:flex-col lg:gap-3" : "justify-between"}`}>
            <Link href="/home" title="Aesthe" className="flex items-center gap-3 overflow-hidden">
              <img src="/images/aesthe-logo.png" alt="Logo Aesthe" className="logo-glow h-9 w-9 shrink-0 object-contain mix-blend-screen" />
              <img src="/images/aesthe-text.png" alt="AESTHE" className={`h-3.5 w-auto mix-blend-screen opacity-90 ${collapsed ? "lg:hidden" : ""}`} />
            </Link>

            <div className="flex items-center gap-1.5">
              <span className={`rounded-md border border-champagne-300/30 bg-champagne-400/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-champagne-200 ${collapsed ? "lg:hidden" : ""}`}>
                Admin
              </span>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title={collapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
                  aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
                  className="hidden h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-zinc-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white lg:flex"
                >
                  {collapsed ? "»" : "«"}
                </button>
              )}
            </div>
          </div>

          {/* Daftar Menu Admin */}
          <nav className="mt-8 space-y-1.5">
            <p className={`px-3 pb-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500 ${collapsed ? "lg:hidden" : ""}`}>
              Panel Kontrol
            </p>
            {collapsed && <div className="mb-3 hidden h-px w-full bg-white/[0.07] lg:block" />}

            {ADMIN_TABS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`relative flex w-full items-center justify-between overflow-hidden rounded-xl px-3.5 py-2.5 text-left text-xs tracking-wide transition ${
                    collapsed ? "lg:justify-center lg:px-0" : ""
                  } ${
                    isActive
                      ? "border border-champagne-300/20 bg-gradient-to-r from-champagne-400/[0.15] via-white/[0.03] to-transparent font-medium text-white shadow-[0_0_25px_-10px_rgba(212,175,106,0.45)]"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-champagne-50"
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-champagne-200 to-champagne-500 shadow-[0_0_10px_rgba(212,175,106,0.8)]" />}
                  <div className="flex items-center gap-3.5">
                    <NavIcon name={item.icon} className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-champagne-300" : "opacity-80"}`} />
                    <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                  </div>

                  {item.id === "curators" && pendingCuratorsCount > 0 && (
                    <span className={`rounded-full bg-champagne-300 px-2 py-0.5 text-[10px] font-semibold text-black ${collapsed ? "lg:absolute lg:-right-0.5 lg:-top-0.5 lg:px-1.5 lg:py-0 lg:text-[9px]" : ""}`}>
                      {pendingCuratorsCount}
                    </span>
                  )}

                  {item.id === "moderation" && pendingReportsCount > 0 && (
                    <span className={`rounded-full border border-red-400/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300 ${collapsed ? "lg:absolute lg:-right-0.5 lg:-top-0.5 lg:px-1.5 lg:py-0 lg:text-[9px]" : ""}`}>
                      {pendingReportsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Akses Cepat ke Galeri Publik */}
          <div className="mt-7 border-t border-white/[0.07] pt-5">
            <p className={`px-3 pb-2 text-[10px] uppercase tracking-[0.25em] text-zinc-600 ${collapsed ? "lg:hidden" : ""}`}>
              Platform
            </p>
            <Link href="/home" title="Lihat Galeri (/home)" className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-champagne-50 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
              <NavIcon name="home" className="h-[18px] w-[18px] shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>Lihat Galeri (/home)</span>
            </Link>
            <Link href="/profile" title="Pengaturan Profil" className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2 text-xs text-zinc-400 transition hover:bg-white/[0.04] hover:text-champagne-50 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
              <NavIcon name="profile" className="h-[18px] w-[18px] shrink-0" />
              <span className={collapsed ? "lg:hidden" : ""}>Pengaturan Profil</span>
            </Link>
          </div>
        </div>

        {/* Kartu Akun Admin di Bagian Bawah Sidebar */}
        <div className="border-t border-white/[0.06] pt-4">
          <div className={`glass flex items-center justify-between gap-2 rounded-2xl p-3 transition hover:border-champagne-300/25 ${collapsed ? "lg:flex-col lg:p-2" : ""}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div title={adminUser?.display_name || "Administrator"} className="shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-champagne-200">
                  {adminUser?.display_name ? adminUser.display_name.slice(0, 2).toUpperCase() : "AD"}
                </div>
              </div>
              <div className={`truncate ${collapsed ? "lg:hidden" : ""}`}>
                <p className="truncate text-xs font-medium text-white">{adminUser?.display_name || "Administrator"}</p>
                <p className="truncate text-[10px] text-zinc-500">{adminUser?.email || "admin@aesthe.id"}</p>
              </div>
            </div>
            <form action={logoutUserAction}>
              <button type="submit" title="Keluar" className="flex items-center justify-center rounded-lg px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 transition hover:bg-red-500/20 hover:text-red-300">
                <span className={collapsed ? "lg:hidden" : ""}>Keluar</span>
                {collapsed && <NavIcon name="logout" className="hidden h-4 w-4 lg:block" />}
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
