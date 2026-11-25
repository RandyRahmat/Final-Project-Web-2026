"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import QuickSearchTrigger, { QuickSearchIconButton } from "@/components/ui/quick-search-trigger";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";

function getChallengeStatus(ch) {
  const now = new Date();
  const start = ch.start_date ? new Date(ch.start_date) : null;
  const end = new Date(ch.end_date);

  if (end < now) return "ended";
  if (start && start > now) return "upcoming";
  return "active";
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ChallengesClient({ currentUser, challenges }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();

  const role = currentUser?.role || "Guest";
  const isCurator = role === "Curator";
  const isCuratorApproved = isCurator && currentUser?.curatorStatus === "Approved";

  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return challenges.filter((ch) => {
      const status = getChallengeStatus(ch);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !q ||
        ch.title.toLowerCase().includes(q) ||
        (ch.description || "").toLowerCase().includes(q) ||
        (ch.curator_name || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [challenges, statusFilter, search]);

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      <AppSidebar
        currentUser={currentUser}
        activeItem="challenges"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileMenu={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
        challengesCount={challenges.length}
      />

      {/* MAIN CONTENT */}
      <div className={`relative z-10 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[78px]" : "lg:ml-[250px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/80 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              COMMUNITY / <span className="text-champagne-200">CHALLENGES</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <img src="/images/aesthe-logo.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-xs tracking-[0.25em]">AESTHE</span>
            </div>
          </div>

          <QuickSearchTrigger />

          <div className="flex items-center gap-3">
            <QuickSearchIconButton />

            <Link href={currentUser ? "/profile" : "/"} className="flex items-center gap-3 transition hover:opacity-85">
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-medium">{currentUser ? currentUser.displayName : "Guest Visitor"}</p>
                <p className="mt-0.5 text-[9px] text-zinc-600">{currentUser ? `${role.toUpperCase()} ACCOUNT` : "PUBLIC VIEW"}</p>
              </div>
              <div className="rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-medium uppercase">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" />
                  ) : (
                    currentUser ? currentUser.displayName.charAt(0) : "G"
                  )}
                </div>
              </div>
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <section data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="eyebrow">COMPETITIONS &amp; EVENTS</p>
                <span className="rounded-full border border-champagne-300/25 bg-champagne-400/10 px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-champagne-200">
                  {challenges.length} EVENTS
                </span>
              </div>
              <h1 className="font-display text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                Community <span className="italic text-gold">Challenges</span><span className="text-champagne-400">.</span>
              </h1>
              <p className="mt-3 max-w-xl text-[11px] text-zinc-400 sm:text-xs">
                Ikuti kompetisi kreatif dari para Curator, daftarkan karya terbaikmu, dan raih gelar juara resmi.
              </p>
            </div>

            {isCurator && isCuratorApproved && (
              <Link href="/curator" className="btn-gold rounded-full px-5 py-2.5 text-[10px] uppercase tracking-[0.18em]">
                ✦ Kelola Challenge di Dashboard
              </Link>
            )}
          </section>

          {/* FILTER PILLS */}
          <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "all", label: "SEMUA" },
                { id: "active", label: "BERLANGSUNG" },
                { id: "upcoming", label: "AKAN DATANG" },
                { id: "ended", label: "SELESAI" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`shrink-0 rounded-full border px-5 py-2 text-[9px] tracking-[0.14em] transition ${
                    statusFilter === tab.id
                      ? "chip-active"
                      : "border-white/10 text-zinc-400 hover:border-champagne-300/40 hover:text-champagne-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari challenge atau curator..."
                className="input-lux rounded-full py-2.5 pl-10 pr-9 text-[11px]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 transition hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* CHALLENGES GRID */}
          {filteredChallenges.length === 0 ? (
            <div className="glass mt-12 rounded-2xl border border-white/10 px-6 py-20 text-center">
              <p className="text-sm text-zinc-400">Belum ada challenge yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredChallenges.map((ch) => {
                const status = getChallengeStatus(ch);
                return (
                  <div key={ch.id} data-reveal className="h-full">
                    <Link
                      href={`/challenges/${ch.id}`}
                      className="card-lux spotlight glass group flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 transition hover:border-champagne-300/45"
                    >
                      <div className="relative h-44 overflow-hidden bg-zinc-900">
                        {ch.banner_url ? (
                          <img src={ch.banner_url} alt={ch.title} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-3xl text-zinc-700">
                            ✧
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                        <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[9px] font-medium uppercase tracking-widest backdrop-blur-md ${
                              status === "active"
                                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                                : status === "upcoming"
                                ? "border-sky-400/40 bg-sky-500/20 text-sky-300"
                                : "border-zinc-500/40 bg-zinc-800/80 text-zinc-300"
                            }`}
                          >
                            {status === "active" && <span className="live-dot text-emerald-400" />}
                            {status === "active" ? "Ongoing Event" : status === "upcoming" ? "Upcoming" : "Ended"}
                          </span>

                          {status === "ended" && ch.winner_count > 0 && (
                            <span className="shine rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[9px] font-medium uppercase tracking-wider text-amber-200 backdrop-blur-md">
                              ♛ Pemenang Diumumkan
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <h2 className="font-display text-2xl text-white transition group-hover:text-champagne-100">{ch.title}</h2>
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">{ch.description}</p>
                        </div>

                        <div className="mt-5 space-y-2 border-t border-white/[0.07] pt-4 text-[11px] text-zinc-400">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Curator</span>
                            <span className="text-zinc-200">{ch.curator_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Hadiah</span>
                            <span className="max-w-[180px] truncate text-champagne-300">{ch.prize}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Periode</span>
                            <span>{formatDate(ch.start_date)} – {formatDate(ch.end_date)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Partisipan</span>
                            <span>{ch.submission_count} karya</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span className="font-display text-sm italic normal-case tracking-normal text-zinc-500">Curated creative competitions.</span>
            <span>MADE FOR CREATORS.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
