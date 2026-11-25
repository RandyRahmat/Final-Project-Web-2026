"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";
import {
  submitArtworkToChallengeAction,
  withdrawSubmissionAction,
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

function formatDateTime(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const RANK_STYLE = {
  1: {
    badge: "♛ Juara #1 · Gold",
    border: "shine border-amber-400/70 bg-gradient-to-b from-amber-500/20 via-zinc-900/80 to-zinc-950 shadow-[0_0_35px_rgba(245,158,11,0.2)]",
    text: "text-amber-300",
  },
  2: {
    badge: "Juara #2 · Silver",
    border: "border-slate-300/45 bg-gradient-to-b from-slate-200/15 to-zinc-900/75",
    text: "text-slate-100",
  },
  3: {
    badge: "Juara #3 · Bronze",
    border: "border-amber-700/50 bg-gradient-to-b from-amber-800/20 to-zinc-900/75",
    text: "text-amber-500",
  },
};

export default function ChallengeDetailClient({
  currentUser,
  challenge,
  submissions,
  memberArtworks,
  userSubmission,
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState(memberArtworks[0]?.id || "");
  const [withdrawing, setWithdrawing] = useState(false);
  const [selectingSubId, setSelectingSubId] = useState(null);
  const [actionError, setActionError] = useState("");

  const [submitState, submitFormAction, isSubmitting] = useActionState(async (prevState, formData) => {
    const res = await submitArtworkToChallengeAction(prevState, formData);
    if (res?.success) {
      setShowSubmitModal(false);
      toast.success("Karya berhasil disubmit", challenge.title);
    } else if (res?.error) {
      toast.error("Gagal mengirim submisi", res.error);
    }
    return res;
  }, null);

  const effectiveArtworkId = memberArtworks.some((a) => Number(a.id) === Number(selectedArtworkId))
    ? selectedArtworkId
    : memberArtworks[0]?.id || "";

  const status = getChallengeStatus(challenge);
  const isActive = status === "active";
  const isEnded = status === "ended";
  const isMember = currentUser?.role === "Member";
  const isGuest = !currentUser;
  const isOwnerCurator =
    currentUser?.role === "Curator" &&
    currentUser?.curatorStatus === "Approved" &&
    Number(currentUser?.id) === Number(challenge.curator_id);

  useBodyScrollLock(showSubmitModal && isMember && isActive);

  useEffect(() => {
    if (!showSubmitModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowSubmitModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSubmitModal]);

  const winners = isEnded
    ? submissions
        .filter((s) => s.winner_rank !== null && s.winner_rank !== undefined)
        .sort((a, b) => Number(a.winner_rank) - Number(b.winner_rank))
    : [];

  const handleWithdraw = async () => {
    const confirmed = await confirm({
      title: "Tarik Submisi",
      message: "Tarik kembali submisi karyamu dari challenge ini?",
      confirmText: "Ya, Tarik Submisi",
      variant: "danger",
    });
    if (!confirmed) return;
    setWithdrawing(true);
    setActionError("");
    try {
      const res = await withdrawSubmissionAction(challenge.id);
      if (res?.error) {
        setActionError(res.error);
        toast.error("Gagal menarik submisi", res.error);
      } else {
        toast.info("Submisi berhasil ditarik", challenge.title);
      }
    } catch {
      setActionError("Gagal menarik submisi. Silakan coba lagi.");
      toast.error("Gagal menarik submisi", "Terjadi gangguan jaringan.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSelectWinner = async (submissionId, rank) => {
    if (selectingSubId) return;
    setSelectingSubId(submissionId);
    setActionError("");
    try {
      const res = await selectChallengeWinnerAction(challenge.id, submissionId, rank);
      if (res?.error) {
        setActionError(res.error);
        toast.error("Gagal menetapkan juara", res.error);
      } else {
        toast.success(rank ? `Juara #${rank} ditetapkan` : "Status juara dibatalkan", challenge.title);
      }
    } catch {
      setActionError("Gagal menetapkan juara. Silakan coba lagi.");
      toast.error("Gagal menetapkan juara", "Terjadi gangguan jaringan.");
    } finally {
      setSelectingSubId(null);
    }
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/80 px-5 backdrop-blur-md sm:px-10">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-3">
            <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow h-8 w-8 object-contain mix-blend-screen" />
            <span className="bg-gradient-to-r from-white to-champagne-200 bg-clip-text text-sm font-medium tracking-[0.3em] text-transparent">AESTHE</span>
          </Link>
          <span className="hidden text-zinc-700 sm:inline">/</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-champagne-200 sm:inline">
            CHALLENGE DETAILS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/challenges" className="btn-ghost rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em]">
            &larr; Semua Challenges
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-10 sm:px-10">
        {/* BANNER & INFO UTAMA CHALLENGE */}
        <section className="glass spotlight overflow-hidden rounded-3xl border border-white/15">
          <div className="relative h-64 w-full overflow-hidden bg-zinc-900 sm:h-80">
            {challenge.banner_url ? (
              <img src={challenge.banner_url} alt={challenge.title} className="animate-ken-burns h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-5xl text-zinc-700">
                ✧
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-black/45 to-transparent" />

            <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-medium uppercase tracking-widest backdrop-blur-md ${
                  status === "active"
                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                    : status === "upcoming"
                    ? "border-sky-400/40 bg-sky-500/20 text-sky-300"
                    : "border-zinc-500/40 bg-zinc-800/80 text-zinc-300"
                }`}
              >
                {status === "active" && <span className="live-dot text-emerald-400" />}
                {status === "active" ? "Sedang Berlangsung" : status === "upcoming" ? "Akan Datang" : "Challenge Selesai"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 p-6 sm:p-9 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h1 className="font-display text-4xl leading-[1.05] text-white sm:text-5xl">{challenge.title}</h1>
              <p className="mt-2.5 text-xs text-zinc-400">
                Diselenggarakan oleh Curator:{" "}
                <Link href={`/creators/${challenge.curator_username}`} className="text-champagne-200 underline decoration-champagne-300/35 underline-offset-4 hover:text-white">
                  {challenge.curator_name}
                </Link>
              </p>

              <div className="mt-6">
                <h2 className="eyebrow">DESKRIPSI CHALLENGE</h2>
                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {challenge.description}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
                <h2 className="eyebrow">ATURAN &amp; KETENTUAN</h2>
                <p className="mt-2.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
                  {challenge.rules || "1. Karya harus orisinal milik peserta.\n2. Maksimal 1 karya per Member untuk challenge ini.\n3. Pemenang ditentukan secara resmi oleh Curator setelah periode challenge berakhir."}
                </p>
              </div>
            </div>

            {/* PANEL KANAN: HADIAH, DEADLINE, TOMBOL SUBMIT/WITHDRAW */}
            <div className="glass flex flex-col justify-between rounded-2xl border border-white/15 p-6 lg:col-span-4">
              <div className="space-y-4">
                <div>
                  <p className="eyebrow">HADIAH UTAMA</p>
                  <p className="font-display mt-1.5 text-2xl text-gold">{challenge.prize}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4 text-xs">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Mulai</p>
                    <p className="mt-1 text-zinc-200">{formatDateTime(challenge.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Deadline</p>
                    <p className="mt-1 text-zinc-200">{formatDateTime(challenge.end_date)}</p>
                  </div>
                </div>

                <div className="border-t border-white/[0.07] pt-4 text-xs">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Total Submisi</p>
                  <p className="mt-1 text-zinc-200">{submissions.length} karya terdaftar</p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/[0.08] pt-5">
                {actionError && (
                  <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                    {actionError}
                  </p>
                )}

                {isMember && isActive && !userSubmission && (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="btn-gold w-full rounded-full py-3 text-[10px] uppercase tracking-[0.2em]"
                  >
                    Submit Your Work
                  </button>
                )}

                {isMember && isActive && userSubmission && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-300">Submisi Kamu Terdaftar</p>
                      <p className="mt-1 font-medium text-white">{userSubmission.artwork_title}</p>
                    </div>
                    <button
                      type="button"
                      disabled={withdrawing}
                      onClick={handleWithdraw}
                      className="w-full rounded-full border border-red-500/40 bg-red-500/10 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                      {withdrawing ? "Menarik Submisi..." : "Withdraw Submission"}
                    </button>
                  </div>
                )}

                {isMember && !isActive && (
                  <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs text-zinc-400">
                    {status === "upcoming"
                      ? "Challenge belum dibuka untuk submisi."
                      : userSubmission
                      ? `Kamu telah mendaftarkan "${userSubmission.artwork_title}".`
                      : "Periode submisi telah berakhir."}
                  </p>
                )}

                {isGuest && isActive && (
                  <Link href="/?step=login" className="btn-gold w-full rounded-full py-3 text-center text-[10px] uppercase tracking-[0.2em]">
                    Login sebagai Member untuk Ikut
                  </Link>
                )}

                {!isMember && !isGuest && (
                  <p className="text-center text-[11px] text-zinc-500">
                    {isOwnerCurator
                      ? isEnded
                        ? "Challenge telah berakhir. Pilih Juara #1, #2, #3 pada Galeri Submisi di bawah."
                        : "Challenge masih berlangsung. Pemenang baru dapat dipilih setelah deadline berakhir."
                      : "Hanya akun Member yang dapat mengikuti challenge."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* BAGIAN PEMENANG RESMI (DIPILIH OLEH CURATOR) */}
        <section className="mt-12">
          <div className="mb-6">
            <p className="eyebrow">OFFICIAL RESULTS</p>
            <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">
              Pemenang Challenge<span className="text-champagne-400">.</span>
            </h2>
          </div>

          {winners.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 px-6 py-12 text-center">
              <p className="text-xs text-zinc-400">
                {isEnded
                  ? "Challenge telah berakhir. Menunggu Curator meninjau submisi dan mengumumkan pemenang."
                  : "Pemenang baru dapat dipilih dan diumumkan oleh Curator setelah periode submisi challenge berakhir."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {winners.map((win) => {
                const style = RANK_STYLE[Number(win.winner_rank)] || RANK_STYLE[3];
                return (
                  <div key={win.id} data-reveal>
                    <div className={`card-lux spotlight overflow-hidden rounded-2xl border p-4 ${style.border}`}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className={`text-xs font-semibold uppercase tracking-widest ${style.text}`}>
                          {style.badge}
                        </span>
                      </div>
                      <Link href={`/artworks/${win.artwork_id}`} className="block aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                        <img src={win.artwork_image_url} alt={win.artwork_title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                      </Link>
                      <Link href={`/artworks/${win.artwork_id}`} className="font-display mt-4 block text-xl text-white transition hover:text-champagne-200">
                        {win.artwork_title}
                      </Link>
                      <Link href={`/creators/${win.artist_username}`} className="mt-1 inline-block text-xs text-zinc-400 transition hover:text-champagne-200">
                        by {win.artist_name} (@{win.artist_username})
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* GALERI SUBMISI PARTISIPAN */}
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">PARTICIPANTS GALLERY</p>
              <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">
                Galeri Submisi <span className="font-sans text-base text-champagne-300/80">({submissions.length})</span>
              </h2>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 px-6 py-16 text-center">
              <p className="text-sm text-zinc-400">Belum ada karya yang didaftarkan ke challenge ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {submissions.map((sub) => (
                <article key={sub.id} data-reveal className="group">
                  <div className="card-lux spotlight glass overflow-hidden rounded-2xl border border-white/15">
                    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">
                      <img
                        src={sub.artwork_image_url}
                        alt={sub.artwork_title}
                        className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

                      <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[8px] tracking-wider text-white backdrop-blur-md">
                        {sub.category_name.toUpperCase()}
                      </span>

                      {isEnded && sub.winner_rank && (
                        <span className="shine absolute right-3 top-3 rounded-full border border-amber-400/60 bg-amber-500/25 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200 backdrop-blur-md">
                          ♛ Juara #{sub.winner_rank}
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <Link href={`/artworks/${sub.artwork_id}`} className="font-display block text-lg text-white transition hover:text-champagne-100">
                          {sub.artwork_title}
                        </Link>
                        <Link href={`/creators/${sub.artist_username}`} className="mt-1 inline-block text-[11px] text-zinc-400 transition hover:text-champagne-200">
                          {sub.artist_name} (@{sub.artist_username})
                        </Link>
                      </div>
                    </div>

                    {isOwnerCurator && isEnded && (
                      <div className="border-t border-white/[0.08] bg-black/40 p-3">
                        <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                          Pilih Pemenang Resmi (Curator)
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { rank: 1, label: "#1 Gold", activeClass: "border-amber-400 bg-amber-400 text-black font-semibold" },
                            { rank: 2, label: "#2 Silver", activeClass: "border-slate-200 bg-slate-200 text-black font-semibold" },
                            { rank: 3, label: "#3 Bronze", activeClass: "border-amber-700 bg-amber-600 text-white font-semibold" },
                          ].map((opt) => {
                            const isCurrentRank = Number(sub.winner_rank) === opt.rank;
                            return (
                              <button
                                key={opt.rank}
                                type="button"
                                disabled={Boolean(selectingSubId)}
                                onClick={() => handleSelectWinner(sub.id, isCurrentRank ? null : opt.rank)}
                                className={`rounded-lg border px-2.5 py-1.5 text-[10px] transition disabled:opacity-50 ${
                                  isCurrentRank
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
                              disabled={Boolean(selectingSubId)}
                              onClick={() => handleSelectWinner(sub.id, null)}
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
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL SUBMIT YOUR WORK (KHUSUS MEMBER) */}
      {showSubmitModal && isMember && isActive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-work-title"
          onClick={() => setShowSubmitModal(false)}
          className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
        >
          <div data-lenis-prevent onClick={(e) => e.stopPropagation()} className="modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">CHALLENGE ENTRY</p>
                <h2 id="submit-work-title" className="font-display mt-1.5 text-3xl text-white">Submit Your Work</h2>
              </div>
              <button type="button" onClick={() => setShowSubmitModal(false)} className="text-xl text-zinc-500 transition hover:text-white">
                ×
              </button>
            </div>

            {submitState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {submitState.error}
              </div>
            )}

            {memberArtworks.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
                <p className="text-xs text-zinc-300">Kamu belum memiliki karya di portofoliomu.</p>
                <Link href="/home" className="btn-gold mt-4 inline-flex rounded-full px-5 py-2 text-[10px] uppercase tracking-wider">
                  Upload Karya Terlebih Dahulu
                </Link>
              </div>
            ) : (
              <form action={submitFormAction} className="mt-5 space-y-4">
                <input type="hidden" name="challengeId" value={challenge.id} />
                <input type="hidden" name="artworkId" value={effectiveArtworkId} />

                <p className="text-xs text-zinc-400">
                  Pilih 1 karya dari portofoliomu untuk didaftarkan ke <span className="text-champagne-200">{challenge.title}</span>:
                </p>

                <div data-lenis-prevent className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1">
                  {memberArtworks.map((art) => {
                    const isSelected = Number(effectiveArtworkId) === Number(art.id);
                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => setSelectedArtworkId(art.id)}
                        className={`overflow-hidden rounded-xl border text-left transition ${
                          isSelected
                            ? "border-champagne-300/70 bg-champagne-400/15"
                            : "border-white/10 bg-black/40 hover:border-champagne-300/40"
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-zinc-900">
                          <img src={art.image_url} alt={art.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-xs font-medium text-white">{art.title}</p>
                          <p className="text-[10px] text-zinc-500">{art.category_name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !effectiveArtworkId}
                  className="btn-gold w-full rounded-xl py-3 text-[10px] uppercase tracking-[0.2em]"
                >
                  {isSubmitting ? "Mendaftarkan..." : "Kirim Submisi Karya"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
