"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
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
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-zinc-100">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 left-1/3 h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-[140px]" />
        <div className="absolute right-0 top-[50%] h-[400px] w-[400px] rounded-full bg-zinc-500/[0.035] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
      </div>

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
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/75 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              COMMUNITY / <span className="text-zinc-300">CHALLENGES</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <img src="/images/aesthe-logo.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-xs tracking-[0.25em]">AESTHE</span>
            </div>
          </div>

          <div className="relative mx-4 hidden max-w-[360px] flex-1 md:block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges or curator..."
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.025] py-2.5 pl-11 pr-5 text-[11px] text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.05]"
            />
          </div>

          <Link href={currentUser ? "/profile" : "/"} className="flex items-center gap-3 transition hover:opacity-85">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-medium">{currentUser ? currentUser.displayName : "Guest Visitor"}</p>
              <p className="mt-0.5 text-[9px] text-zinc-600">{currentUser ? `${role.toUpperCase()} ACCOUNT` : "PUBLIC VIEW"}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-500 to-zinc-900 text-xs font-medium uppercase">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" />
              ) : (
                currentUser ? currentUser.displayName.charAt(0) : "G"
              )}
            </div>
          </Link>
        </header>

        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="text-[9px] tracking-[0.35em] text-zinc-500">COMPETITIONS &amp; EVENTS</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  {challenges.length} EVENTS
                </span>
              </div>
              <h1 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl">
                Community Challenges<span className="text-zinc-500">.</span>
              </h1>
              <p className="mt-3 max-w-xl text-[11px] text-zinc-500 sm:text-xs">
                Ikuti kompetisi kreatif dari para Curator, daftarkan karya terbaikmu, dan raih gelar juara resmi.
              </p>
            </div>

            {isCurator && isCuratorApproved && (
              <Link href="/curator" className="rounded-full border border-amber-400/40 bg-amber-500/10 px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-400 hover:text-black">
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
                      ? "border-white bg-white font-semibold text-black"
                      : "border-white/[0.08] text-zinc-400 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:hidden">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges..."
                className="w-full rounded-full border border-white/[0.08] bg-white/[0.025] py-2 pl-10 pr-4 text-[11px] text-white outline-none"
              />
            </div>
          </div>

          {/* CHALLENGES GRID */}
          {filteredChallenges.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-20 text-center">
              <p className="text-sm text-zinc-400">Belum ada challenge yang sesuai dengan filter.</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredChallenges.map((ch) => {
                const status = getChallengeStatus(ch);
                return (
                  <Link
                    key={ch.id}
                    href={`/challenges/${ch.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/45 transition hover:border-white/25"
                  >
                    <div className="relative h-44 overflow-hidden bg-zinc-900">
                      {ch.banner_url ? (
                        <img src={ch.banner_url} alt={ch.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-3xl text-zinc-700">
                          ✧
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[9px] font-medium uppercase tracking-widest backdrop-blur-md ${
                            status === "active"
                              ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                              : status === "upcoming"
                              ? "border-sky-400/40 bg-sky-500/20 text-sky-300"
                              : "border-zinc-500/40 bg-zinc-800/80 text-zinc-300"
                          }`}
                        >
                          {status === "active" ? "Ongoing Event" : status === "upcoming" ? "Upcoming" : "Ended"}
                        </span>

                        {status === "ended" && ch.winner_count > 0 && (
                          <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-[9px] font-medium uppercase tracking-wider text-amber-300 backdrop-blur-md">
                            ♛ Pemenang Diumumkan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h2 className="text-lg font-medium text-white transition group-hover:text-zinc-200">{ch.title}</h2>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">{ch.description}</p>
                      </div>

                      <div className="mt-5 space-y-2 border-t border-white/[0.07] pt-4 text-[11px] text-zinc-400">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Curator</span>
                          <span className="text-zinc-200">{ch.curator_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Hadiah</span>
                          <span className="truncate max-w-[180px] text-amber-300">{ch.prize}</span>
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
                );
              })}
            </div>
          )}

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span>COMMUNITY CHALLENGES.</span>
            <span>MADE FOR CREATORS.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
