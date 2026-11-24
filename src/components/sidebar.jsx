"use client";

import Link from "next/link";

const ADMIN_TABS = [
  { id: "overview", label: "Statistik Platform", icon: "◈" },
  { id: "curators", label: "Verifikasi Curator", icon: "✦" },
  { id: "moderation", label: "Moderasi Konten", icon: "⚑" },
  { id: "users", label: "Manajemen Pengguna", icon: "◉" },
  { id: "categories", label: "Manajemen Kategori", icon: "❖" },
];

export default function Sidebar({ activeTab, onSelectTab, pendingCuratorsCount = 0, pendingReportsCount = 0 }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-white/10 bg-[#0b0b0c]/95 px-5 py-6 backdrop-blur-xl lg:flex">
      <div>
        <div className="flex items-center justify-between px-2">
          <Link href="/home" className="flex items-center gap-3">
            <img src="/images/aesthe-logo.png" alt="Logo Aesthe" className="h-9 w-9 object-contain mix-blend-screen" />
            <img src="/images/aesthe-text.png" alt="AESTHE" className="h-3.5 w-auto mix-blend-screen opacity-90" />
          </Link>
          <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white">
            Admin
          </span>
        </div>

        <nav className="mt-9 space-y-1.5">
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500">Panel Kontrol</p>
          {ADMIN_TABS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs tracking-wide transition ${
                  isActive
                    ? "border border-white/15 bg-white/[0.08] font-medium text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-sm opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.id === "curators" && pendingCuratorsCount > 0 && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black">
                    {pendingCuratorsCount}
                  </span>
                )}

                {item.id === "moderation" && pendingReportsCount > 0 && (
                  <span className="rounded-full border border-red-400/40 bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                    {pendingReportsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white text-xs font-bold text-black">
              AD
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-medium text-white">Administrator</p>
              <p className="truncate text-[10px] text-zinc-500">admin@aesthe.id</p>
            </div>
          </div>
          <Link href="/" title="Keluar" className="rounded-lg px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400 transition hover:bg-white/10 hover:text-white">
            Keluar
          </Link>
        </div>
      </div>
    </aside>
  );
}