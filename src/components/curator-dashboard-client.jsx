"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import MobileBottomNav from "@/components/ui/mobile-bottom-nav";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { logoutUserAction } from "@/actions/auth-actions";
import {
  createChallengeAction,
  updateChallengeAction,
  deleteChallengeAction,
  selectChallengeWinnerAction,
} from "@/actions/challenge-actions";

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

function toDateTimeLocal(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CuratorDashboardClient({ curator, challenges, submissions }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [managingChallengeId, setManagingChallengeId] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [editBannerPreview, setEditBannerPreview] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [selectingSubId, setSelectingSubId] = useState(null);
  const [actionError, setActionError] = useState("");

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setBannerPreview("");
  };

  const closeEditModal = () => {
    setEditingChallenge(null);
    setEditBannerPreview("");
  };

  const [createState, createFormAction, isCreating] = useActionState(async (prevState, formData) => {
    const res = await createChallengeAction(prevState, formData);
    if (res?.success) {
      closeCreateModal();
    }
    return res;
  }, null);

  const [editState, editFormAction, isEditing] = useActionState(async (prevState, formData) => {
    const res = await updateChallengeAction(prevState, formData);
    if (res?.success) {
      closeEditModal();
    }
    return res;
  }, null);

  const stats = useMemo(() => {
    let active = 0;
    let ended = 0;
    challenges.forEach((ch) => {
      const s = getChallengeStatus(ch);
      if (s === "active") active += 1;
      if (s === "ended") ended += 1;
    });
    return {
      total: challenges.length,
      active,
      ended,
      totalSubmissions: submissions.length,
    };
  }, [challenges, submissions]);

  const managingChallenge = useMemo(
    () => challenges.find((c) => c.id === managingChallengeId) || null,
    [challenges, managingChallengeId]
  );

  const managingSubmissions = useMemo(
    () => submissions.filter((s) => Number(s.challenge_id) === Number(managingChallengeId)),
    [submissions, managingChallengeId]
  );

  const handleDeleteChallenge = async (ch) => {
    const confirmed = window.confirm(`Hapus challenge "${ch.title}" beserta seluruh submisinya?`);
    if (!confirmed) return;
    setDeletingId(ch.id);
    setActionError("");
    const res = await deleteChallengeAction(ch.id);
    setDeletingId(null);
    if (res?.error) {
      setActionError(res.error);
    } else if (managingChallengeId === ch.id) {
      setManagingChallengeId(null);
    }
  };

  const handleSelectWinner = async (challengeId, submissionId, rank) => {
    setSelectingSubId(submissionId);
    setActionError("");
    const res = await selectChallengeWinnerAction(challengeId, submissionId, rank);
    setSelectingSubId(null);
    if (res?.error) {
      setActionError(res.error);
    }
  };

  const openEditModal = (ch) => {
    setEditingChallenge(ch);
    setEditBannerPreview(ch.banner_url || "");
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div onClick={() => setMobileMenu(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-white/[0.07] bg-[#0a0a0b]/80 px-6 py-7 backdrop-blur-2xl transition-all duration-300 lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "lg:w-[78px] lg:px-3" : "lg:w-[250px]"}`}>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-champagne-400/25 to-transparent" />

        <div className={`mb-10 flex items-center ${sidebarCollapsed ? "justify-between lg:flex-col lg:gap-3" : "justify-between"}`}>
          <Link href="/home" title="Aesthe" className="flex items-center gap-3 overflow-hidden">
            <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow h-9 w-9 shrink-0 object-contain mix-blend-screen" />
            <div className={sidebarCollapsed ? "lg:hidden" : ""}>
              <h1 className="bg-gradient-to-r from-white to-champagne-200 bg-clip-text text-[17px] font-medium tracking-[0.35em] text-transparent">AESTHE</h1>
              <p className="mt-0.5 text-[8px] tracking-[0.3em] text-champagne-400">CURATOR STUDIO</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            title={sidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-xs text-zinc-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white lg:flex"
          >
            {sidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        <div>
          <p className={`mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600 ${sidebarCollapsed ? "lg:hidden" : ""}`}>CURATOR MENU</p>
          {sidebarCollapsed && <div className="mb-3 hidden h-px w-full bg-white/[0.07] lg:block" />}
          <nav className="space-y-1">
            <button
              type="button"
              title="My Challenges"
              onClick={() => {
                setManagingChallengeId(null);
                setMobileMenu(false);
              }}
              className={`relative flex w-full items-center gap-4 overflow-hidden rounded-lg px-4 py-3 text-left text-[12px] transition ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""} ${
                !managingChallengeId
                  ? "border border-champagne-300/20 bg-gradient-to-r from-champagne-400/[0.16] via-white/[0.03] to-transparent text-white shadow-[0_0_30px_-12px_rgba(212,175,106,0.5)]"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-champagne-50"
              }`}
            >
              {!managingChallengeId && <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-champagne-200 to-champagne-500 shadow-[0_0_10px_rgba(212,175,106,0.8)]" />}
              <span className={`w-4 shrink-0 text-center text-base ${!managingChallengeId ? "text-champagne-300" : ""}`}>✦</span>
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>My Challenges</span>
              <span className={`ml-auto rounded-full bg-champagne-400/15 px-2 py-0.5 text-[9px] text-champagne-200 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                {challenges.length}
              </span>
            </button>

            <button
              type="button"
              title="Buat Challenge Baru"
              onClick={() => {
                setShowCreateModal(true);
                setMobileMenu(false);
              }}
              className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-400 transition hover:bg-white/[0.04] hover:text-champagne-50 ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}
            >
              <span className="w-4 shrink-0 text-center text-lg">＋</span>
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>Buat Challenge Baru</span>
            </button>
          </nav>
        </div>

        <div className="mt-10">
          <p className={`mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600 ${sidebarCollapsed ? "lg:hidden" : ""}`}>NAVIGASI PUBLIK</p>
          {sidebarCollapsed && <div className="mb-3 hidden h-px w-full bg-white/[0.07] lg:block" />}
          <nav className="space-y-1">
            <Link href="/home" title="Home" className={`flex w-full items-center gap-4 rounded-lg px-4 py-2.5 text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-champagne-50 ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}>
              <span className="w-4 shrink-0 text-center text-base">⌂</span>
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>Home</span>
            </Link>
            <Link href="/explore" title="Explore" className={`flex w-full items-center gap-4 rounded-lg px-4 py-2.5 text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-champagne-50 ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}>
              <span className="w-4 shrink-0 text-center text-base">◈</span>
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>Explore</span>
            </Link>
            <Link href="/challenges" title="Public Challenges" className={`flex w-full items-center gap-4 rounded-lg px-4 py-2.5 text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-champagne-50 ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}>
              <span className="w-4 shrink-0 text-center text-base">✧</span>
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>Public Challenges</span>
            </Link>
            <Link href="/messages" title="Messages" className={`flex w-full items-center gap-4 rounded-lg px-4 py-2.5 text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-champagne-50 ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}>
              <span className="w-4 shrink-0 text-center text-sm">✉</span>
              <span className={sidebarCollapsed ? "lg:hidden" : ""}>Messages</span>
            </Link>
          </nav>
        </div>

        {/* SESSION CARD */}
        <div className="mt-auto border-t border-white/[0.06] pt-4">
          <div className={`glass flex items-center gap-3 rounded-2xl p-2.5 transition hover:border-champagne-300/25 ${sidebarCollapsed ? "lg:flex-col lg:gap-2 lg:p-2" : ""}`}>
            <Link href="/profile" title={curator.display_name} className="relative shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold text-white">
                {curator.avatar_url ? (
                  <img src={curator.avatar_url} alt={curator.display_name} className="h-full w-full object-cover" />
                ) : (
                  curator.display_name?.charAt(0).toUpperCase() || "C"
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black bg-emerald-400" />
            </Link>
            <div className={`min-w-0 flex-1 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
              <Link href="/profile" className="block truncate text-xs font-medium leading-tight text-white transition hover:text-champagne-200">
                {curator.display_name}
              </Link>
              <form action={logoutUserAction} className="mt-0.5">
                <button type="submit" className="text-[10px] text-zinc-500 transition hover:text-red-400">
                  Logout
                </button>
              </form>
            </div>
            {sidebarCollapsed && (
              <form action={logoutUserAction} className="hidden lg:block">
                <button type="submit" title="Logout" className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-zinc-500 transition hover:bg-red-500/15 hover:text-red-400">
                  ⎋
                </button>
              </form>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`relative z-10 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[78px]" : "lg:ml-[250px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/60 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="text-[10px] tracking-[0.2em] text-zinc-600">
              CURATOR / <span className="text-champagne-200">{managingChallenge ? "SUBMISSIONS & WINNERS" : "DASHBOARD"}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-gold rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.18em]"
          >
            ＋ Buat Challenge
          </button>
        </header>

        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
          {actionError && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {actionError}
            </div>
          )}

          {/* MODE 1: MANAGE SUBMISSIONS & SELECT WINNERS */}
          {managingChallenge ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
                <div>
                  <button
                    type="button"
                    onClick={() => setManagingChallengeId(null)}
                    className="mb-3 inline-flex items-center gap-1.5 text-[11px] text-zinc-400 transition hover:text-champagne-200"
                  >
                    &larr; Kembali ke Daftar Challenge
                  </button>
                  <h1 className="font-display text-3xl text-white sm:text-4xl">{managingChallenge.title}</h1>
                  <p className="mt-1 text-xs text-zinc-500">
                    Periode: {formatDate(managingChallenge.start_date)} – {formatDate(managingChallenge.end_date)} &bull; {managingSubmissions.length} karya terdaftar
                  </p>
                </div>

                <Link href={`/challenges/${managingChallenge.id}`} className="btn-ghost rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.15em]">
                  Lihat Halaman Publik ↗
                </Link>
              </div>

              {getChallengeStatus(managingChallenge) !== "ended" ? (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-xs text-amber-200">
                  Challenge ini belum berakhir (deadline: {formatDate(managingChallenge.end_date)}). Pemilihan pemenang Juara #1, #2, #3 baru akan terbuka otomatis setelah challenge berakhir.
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-xs text-emerald-200">
                  Challenge telah selesai! Pilih maksimal 3 karya sebagai pemenang resmi (Juara #1 Gold, #2 Silver, #3 Bronze). Setiap peringkat hanya untuk 1 karya.
                </div>
              )}

              {managingSubmissions.length === 0 ? (
                <div className="glass mt-8 rounded-2xl border border-white/10 px-6 py-20 text-center">
                  <p className="text-sm text-zinc-400">Belum ada submisi karya pada challenge ini.</p>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {managingSubmissions.map((sub) => {
                    const isEnded = getChallengeStatus(managingChallenge) === "ended";
                    return (
                      <div key={sub.id} data-reveal>
                        <article className="card-lux spotlight glass overflow-hidden rounded-2xl border border-white/15">
                          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                            <img src={sub.artwork_image_url} alt={sub.artwork_title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                            <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[8px] tracking-wider text-white backdrop-blur-md">
                              {sub.category_name.toUpperCase()}
                            </span>
                            {isEnded && sub.winner_rank && (
                              <span className="shine absolute right-3 top-3 rounded-full border border-amber-400/60 bg-amber-500/25 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200 backdrop-blur-md">
                                ♛ Juara #{sub.winner_rank}
                              </span>
                            )}
                          </div>

                          <div className="p-4">
                            <h3 className="font-display truncate text-xl text-white">{sub.artwork_title}</h3>
                            <Link href={`/creators/${sub.artist_username}`} className="mt-0.5 inline-block text-[11px] text-zinc-400 transition hover:text-champagne-200">
                              {sub.artist_name} (@{sub.artist_username})
                            </Link>

                            {isEnded && (
                              <div className="mt-4 border-t border-white/[0.08] pt-3">
                                <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-zinc-500">Tetapkan Peringkat</p>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {[
                                    { rank: 1, label: "#1 Gold", activeClass: "border-amber-400 bg-amber-400 text-black font-semibold" },
                                    { rank: 2, label: "#2 Silver", activeClass: "border-slate-200 bg-slate-200 text-black font-semibold" },
                                    { rank: 3, label: "#3 Bronze", activeClass: "border-amber-700 bg-amber-600 text-white font-semibold" },
                                  ].map((opt) => {
                                    const isCurrent = Number(sub.winner_rank) === opt.rank;
                                    return (
                                      <button
                                        key={opt.rank}
                                        type="button"
                                        disabled={selectingSubId === sub.id}
                                        onClick={() => handleSelectWinner(managingChallenge.id, sub.id, isCurrent ? null : opt.rank)}
                                        className={`rounded-lg border px-2.5 py-1.5 text-[10px] transition disabled:opacity-50 ${
                                          isCurrent
                                            ? opt.activeClass
                                            : "border-white/15 bg-white/[0.04] text-zinc-300 hover:border-champagne-300/50 hover:text-white"
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                  {sub.winner_rank && (
                                    <button
                                      type="button"
                                      disabled={selectingSubId === sub.id}
                                      onClick={() => handleSelectWinner(managingChallenge.id, sub.id, null)}
                                      className="ml-auto rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            /* MODE 2: LIST CHALLENGES & STATS */
            <>
              <section data-reveal className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">CURATOR WORKSPACE</p>
                  <h1 className="font-display mt-2 text-4xl leading-[1.05] text-white sm:text-5xl">
                    Kelola <span className="italic text-gold">Challenge</span><span className="text-champagne-400">.</span>
                  </h1>
                  <p className="mt-2 text-xs text-zinc-400">
                    Buat event lomba kreatif, tinjau karya partisipan, dan umumkan pemenang resmi.
                  </p>
                </div>
              </section>

              {/* STAT CARDS */}
              <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="glass spotlight rounded-2xl border border-white/15 p-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Total Challenge</p>
                  <p className="font-display mt-2 text-4xl text-gold">{stats.total}</p>
                </div>
                <div className="glass spotlight rounded-2xl border border-emerald-400/20 p-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Sedang Berlangsung</p>
                  <p className="font-display mt-2 text-4xl text-emerald-300">{stats.active}</p>
                </div>
                <div className="glass spotlight rounded-2xl border border-amber-400/20 p-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Challenge Selesai</p>
                  <p className="font-display mt-2 text-4xl text-amber-300">{stats.ended}</p>
                </div>
                <div className="glass spotlight rounded-2xl border border-white/15 p-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Total Submisi Masuk</p>
                  <p className="font-display mt-2 text-4xl text-gold">{stats.totalSubmissions}</p>
                </div>
              </section>

              {/* DAFTAR CHALLENGE */}
              <section className="mt-10">
                {challenges.length === 0 ? (
                  <div className="glass rounded-3xl border border-white/15 px-6 py-20 text-center">
                    <p className="text-sm text-zinc-400">Kamu belum membuat challenge apa pun.</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="btn-gold mt-4 rounded-full px-6 py-2.5 text-[10px] uppercase tracking-[0.18em]"
                    >
                      ＋ Buat Challenge Pertama
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {challenges.map((ch) => {
                      const status = getChallengeStatus(ch);
                      return (
                        <div key={ch.id} data-reveal className="h-full">
                          <article className="card-lux spotlight glass flex h-full flex-col overflow-hidden rounded-2xl border border-white/15">
                            <div className="relative h-44 overflow-hidden bg-zinc-900">
                              {ch.banner_url ? (
                                <img src={ch.banner_url} alt={ch.title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-3xl text-zinc-700">✧</div>
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
                                  {status === "active" ? "Ongoing" : status === "upcoming" ? "Upcoming" : "Ended"}
                                </span>
                                {status === "ended" && ch.winner_count > 0 && (
                                  <span className="shine rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[9px] font-medium text-amber-200 backdrop-blur-md">
                                    ♛ {ch.winner_count} Pemenang
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col justify-between p-5">
                              <div>
                                <h2 className="font-display text-2xl text-white">{ch.title}</h2>
                                <p className="mt-1.5 line-clamp-2 text-xs text-zinc-400">{ch.description}</p>
                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                                  <span>Hadiah: <strong className="font-normal text-champagne-300">{ch.prize}</strong></span>
                                  <span>Periode: {formatDate(ch.start_date)} – {formatDate(ch.end_date)}</span>
                                  <span>Submisi: {ch.submission_count} karya</span>
                                </div>
                              </div>

                              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
                                <button
                                  type="button"
                                  onClick={() => setManagingChallengeId(ch.id)}
                                  className="btn-gold flex-1 rounded-xl px-3 py-2 text-[10px] uppercase tracking-[0.14em]"
                                >
                                  {status === "ended" ? "Pilih Pemenang" : `Submisi (${ch.submission_count})`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(ch)}
                                  className="btn-ghost rounded-xl px-3.5 py-2 text-[10px] uppercase tracking-[0.14em]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingId === ch.id}
                                  onClick={() => handleDeleteChallenge(ch)}
                                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-[10px] uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                                >
                                  {deletingId === ch.id ? "..." : "Hapus"}
                                </button>
                              </div>
                            </div>
                          </article>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* MODAL CREATE CHALLENGE */}
      {showCreateModal && (
        <div onClick={closeCreateModal} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">NEW CHALLENGE</p>
                <h2 className="font-display mt-1.5 text-3xl text-white">Buat Challenge Baru</h2>
              </div>
              <button type="button" onClick={closeCreateModal} className="text-xl text-zinc-500 hover:text-white">×</button>
            </div>

            {createState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {createState.error}
              </div>
            )}

            <form action={createFormAction} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Judul Challenge</label>
                <input type="text" name="title" required placeholder="Contoh: Futuristic Urban 2026" className="input-lux" />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Hadiah</label>
                <input type="text" name="prize" required placeholder="Contoh: Rp 5.000.000 + Gold Badge" className="input-lux" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Tanggal Mulai</label>
                  <input type="datetime-local" name="startDate" required className="input-lux" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Tanggal Selesai (Deadline)</label>
                  <input type="datetime-local" name="endDate" required className="input-lux" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Gambar Banner (JPG/PNG/WEBP, maks. 8MB)</label>
                <input
                  type="file"
                  name="bannerFile"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setBannerPreview(f ? URL.createObjectURL(f) : "");
                  }}
                  className="input-lux file:mr-3 file:rounded-md file:border-0 file:bg-champagne-200 file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-black"
                />
                {bannerPreview && (
                  <div className="mt-2.5 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                    <img src={bannerPreview} alt="Preview banner" className="max-h-40 w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi</label>
                <textarea name="description" rows={3} required placeholder="Jelaskan tema dan tujuan challenge..." className="input-lux" />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Aturan Lomba</label>
                <textarea name="rules" rows={3} required placeholder="1. Karya orisinal..." className="input-lux" />
              </div>

              <button type="submit" disabled={isCreating} className="btn-gold w-full rounded-xl py-3 text-[10px] uppercase tracking-[0.2em]">
                {isCreating ? "Menyimpan..." : "Publish Challenge"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT CHALLENGE */}
      {editingChallenge && (
        <div onClick={closeEditModal} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">EDIT CHALLENGE</p>
                <h2 className="font-display mt-1.5 text-3xl text-white">Perbarui Challenge</h2>
              </div>
              <button type="button" onClick={closeEditModal} className="text-xl text-zinc-500 hover:text-white">×</button>
            </div>

            {editState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {editState.error}
              </div>
            )}

            <form action={editFormAction} className="mt-5 space-y-4">
              <input type="hidden" name="challengeId" value={editingChallenge.id} />

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Judul Challenge</label>
                <input type="text" name="title" required defaultValue={editingChallenge.title} className="input-lux" />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Hadiah</label>
                <input type="text" name="prize" required defaultValue={editingChallenge.prize} className="input-lux" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Tanggal Mulai</label>
                  <input type="datetime-local" name="startDate" required defaultValue={toDateTimeLocal(editingChallenge.start_date)} className="input-lux" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Tanggal Selesai</label>
                  <input type="datetime-local" name="endDate" required defaultValue={toDateTimeLocal(editingChallenge.end_date)} className="input-lux" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Ganti Gambar Banner (Opsional)</label>
                <input
                  type="file"
                  name="bannerFile"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setEditBannerPreview(URL.createObjectURL(f));
                  }}
                  className="input-lux file:mr-3 file:rounded-md file:border-0 file:bg-champagne-200 file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-black"
                />
                {editBannerPreview && (
                  <div className="mt-2.5 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                    <img src={editBannerPreview} alt="Preview banner" className="max-h-40 w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi</label>
                <textarea name="description" rows={3} required defaultValue={editingChallenge.description} className="input-lux" />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Aturan Lomba</label>
                <textarea name="rules" rows={3} required defaultValue={editingChallenge.rules || ""} className="input-lux" />
              </div>

              <button type="submit" disabled={isEditing} className="btn-gold w-full rounded-xl py-3 text-[10px] uppercase tracking-[0.2em]">
                {isEditing ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
      <MobileBottomNav currentUser={curator} activeItem="curator" />
    </main>
  );
}
