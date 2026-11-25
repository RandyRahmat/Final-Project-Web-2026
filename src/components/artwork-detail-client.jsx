"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import {
  reactArtworkAction,
  toggleFavoriteAction,
  addCommentAction,
  deleteCommentAction,
  reportArtworkAction,
} from "@/actions/artwork-actions";

const REACTIONS = [
  { type: "love", icon: "❤️", label: "Love" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "fire", icon: "🔥", label: "Fire" },
  { type: "inspire", icon: "✧", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

const REPORT_REASONS = [
  "Plagiat / Pelanggaran Hak Cipta",
  "SARA / Ujaran Kebencian",
  "Konten Tidak Pantas / NSFW",
  "Spam / Penipuan",
  "Alasan Lainnya",
];

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArtworkDetailClient({ currentUser, artwork, comments }) {
  const [authNotice, setAuthNotice] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const commentFormRef = useRef(null);

  const role = currentUser?.role || "Guest";
  const isGuest = !currentUser;
  const isMember = role === "Member";
  const isOwnArtwork = Number(currentUser?.id) === Number(artwork.artist_id);

  const userReaction = artwork.user_reaction
    ? REACTIONS.find((r) => r.type === artwork.user_reaction) || REACTIONS[0]
    : null;

  const [commentState, commentFormAction, isCommenting] = useActionState(async (prevState, formData) => {
    const res = await addCommentAction(prevState, formData);
    if (res?.success) {
      commentFormRef.current?.reset();
    }
    return res;
  }, null);

  const [reportState, reportFormAction, isReporting] = useActionState(async (prevState, formData) => {
    const res = await reportArtworkAction(prevState, formData);
    if (res?.success) {
      setShowReportModal(false);
    }
    return res;
  }, null);

  const handleReaction = async (reactionType = "love") => {
    if (isGuest) {
      setAuthNotice("Silakan masuk sebagai Member untuk memberi reaksi pada karya ini.");
      return;
    }
    if (!isMember) return;
    setAuthNotice("");
    await reactArtworkAction(artwork.id, reactionType);
  };

  const handleFavorite = async () => {
    if (isGuest) {
      setAuthNotice("Silakan masuk sebagai Member untuk menyimpan karya ke Favorites.");
      return;
    }
    if (!isMember) return;
    setAuthNotice("");
    await toggleFavoriteAction(artwork.id);
  };

  const handleOpenReport = () => {
    if (isGuest) {
      setAuthNotice("Silakan masuk sebagai Member untuk melaporkan karya ini.");
      return;
    }
    if (!isMember || isOwnArtwork) return;
    setAuthNotice("");
    setShowReportModal(true);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Hapus komentarmu ini?")) return;
    setDeletingCommentId(commentId);
    await deleteCommentAction(commentId, artwork.id);
    setDeletingCommentId(null);
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/60 px-5 backdrop-blur-2xl sm:px-10">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-3">
            <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow h-8 w-8 object-contain mix-blend-screen" />
            <span className="bg-gradient-to-r from-white to-champagne-200 bg-clip-text text-sm font-medium tracking-[0.3em] text-transparent">AESTHE</span>
          </Link>
          <span className="hidden text-zinc-700 sm:inline">/</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-champagne-200 sm:inline">
            ARTWORK DETAILS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/explore" className="btn-ghost rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em]">
            Explore
          </Link>
          <Link href="/home" className="btn-ghost rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em]">
            &larr; Home
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-8 sm:px-10 lg:py-12">
        {authNotice && (
          <div className="glass mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-champagne-300/25 px-5 py-3 text-xs text-zinc-200">
            <span>{authNotice}</span>
            <Link href="/" className="btn-gold rounded-full px-4 py-1 text-[10px] uppercase tracking-wider">
              Login Sekarang
            </Link>
          </div>
        )}

        {reportState?.success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs text-emerald-300">
            {reportState.message}
          </div>
        )}

        {/* LAYOUT UTAMA: GAMBAR PENUH (KIRI) + DETAIL & INTERAKSI (KANAN) */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* GAMBAR KARYA PENUH */}
          <div className="lg:col-span-7">
            <div className="glass spotlight overflow-hidden rounded-3xl border border-white/15 bg-black/50 p-2 sm:p-4">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="max-h-[78vh] w-full rounded-2xl object-contain"
              />
            </div>
          </div>

          {/* DETAIL KARYA & TOMBOL INTERAKSI */}
          <div className="glass spotlight flex flex-col justify-between rounded-3xl border border-white/15 p-6 sm:p-8 lg:col-span-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-champagne-300/30 bg-champagne-400/10 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-champagne-200">
                  {artwork.category_name}
                </span>
                <span className="text-[11px] text-zinc-500">Diunggah {formatDate(artwork.created_at)}</span>
              </div>

              <h1 className="font-display mt-4 text-3xl leading-[1.08] text-white sm:text-4xl lg:text-5xl">
                {artwork.title}
              </h1>

              {/* KARTU KREATOR (LINK KE PROFIL PUBLIK) */}
              <Link
                href={`/creators/${artwork.artist_username}`}
                className="glass mt-5 flex items-center gap-3 rounded-2xl border border-white/15 p-3 transition hover:border-champagne-300/45"
              >
                <div className="shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {artwork.artist_avatar ? (
                      <img src={artwork.artist_avatar} alt={artwork.artist_name} className="h-full w-full object-cover" />
                    ) : (
                      artwork.artist_name?.charAt(0).toUpperCase() || "A"
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">{artwork.artist_name}</p>
                  <p className="truncate text-[10px] text-champagne-300/80">@{artwork.artist_username} · Lihat Profil Kreator ↗</p>
                </div>
              </Link>

              {/* DESKRIPSI */}
              <div className="mt-6">
                <p className="eyebrow">DESKRIPSI KARYA</p>
                <p className="mt-2.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
                  {artwork.description}
                </p>
              </div>

              {/* TAGS */}
              {(artwork.tags || []).length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {artwork.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* BAR INTERAKSI (REACTION, FAVORITE, REPORT) */}
            <div className="mt-8 border-t border-white/[0.08] pt-5">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* REACTION */}
                {isMember ? (
                  <div className="group/react relative flex items-center">
                    <div className="glass pointer-events-none absolute bottom-full left-0 mb-2 flex items-center gap-1 rounded-full px-2.5 py-1.5 opacity-0 transition-all duration-200 group-hover/react:pointer-events-auto group-hover/react:opacity-100">
                      {REACTIONS.map((r) => (
                        <button
                          key={r.type}
                          type="button"
                          onClick={() => handleReaction(r.type)}
                          title={r.label}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:scale-125 hover:bg-white/10"
                        >
                          {r.icon}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleReaction(userReaction ? userReaction.type : "love")}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${
                        userReaction
                          ? "border-rose-500/50 bg-rose-500/15 font-medium text-rose-300"
                          : "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-champagne-300/50 hover:text-champagne-100"
                      }`}
                    >
                      <span>{userReaction ? userReaction.icon : "♥"}</span>
                      <span>{artwork.total_reactions} Reaksi</span>
                    </button>
                  </div>
                ) : isGuest ? (
                  <button
                    type="button"
                    onClick={() => handleReaction("love")}
                    className="btn-ghost rounded-full px-4 py-2 text-xs"
                  >
                    <span>♥</span>
                    <span>{artwork.total_reactions} Reaksi</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs text-zinc-500">
                    <span>♥</span>
                    <span>{artwork.total_reactions} Reaksi</span>
                  </div>
                )}

                {/* SAVE TO FAVORITES */}
                {(isMember || isGuest) && (
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${
                      isMember && artwork.is_favorited
                        ? "border-champagne-300 bg-gradient-to-br from-champagne-100 to-champagne-400 font-semibold text-black shadow-[0_0_20px_rgba(212,175,106,0.45)]"
                        : "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-champagne-300/50 hover:text-champagne-100"
                    }`}
                  >
                    <span>⚑</span>
                    <span>{isMember && artwork.is_favorited ? "Tersimpan" : "Favorites"}</span>
                  </button>
                )}

                {/* REPORT ARTWORK (KHUSUS MEMBER & BUKAN KARYA SENDIRI) */}
                {isMember && !isOwnArtwork && (
                  artwork.has_reported || reportState?.success ? (
                    <span className="ml-auto rounded-full border border-zinc-700 bg-zinc-800/70 px-3.5 py-2 text-[10px] uppercase tracking-wider text-zinc-400">
                      Sudah Dilaporkan
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenReport}
                      className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-red-300 transition hover:bg-red-500 hover:text-white"
                    >
                      ⚑ Laporkan
                    </button>
                  )
                )}

                {isGuest && (
                  <button
                    type="button"
                    onClick={handleOpenReport}
                    className="ml-auto rounded-full border border-white/10 px-3.5 py-2 text-[10px] uppercase tracking-wider text-zinc-500 transition hover:border-white/30 hover:text-zinc-200"
                  >
                    ⚑ Laporkan
                  </button>
                )}
              </div>

              {!isMember && !isGuest && (
                <p className="mt-3 text-[10px] text-zinc-500">
                  Mode baca saja ({role}). Interaksi Like, Favorites, Komentar, dan Laporkan hanya tersedia untuk Member.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION KOMENTAR */}
        <section data-reveal className="glass mt-12 rounded-3xl border border-white/15 p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="eyebrow">COMMUNITY DISCUSSION</p>
              <h2 className="font-display mt-1.5 text-3xl text-white">
                Komentar <span className="font-sans text-sm text-champagne-300/80">({comments.length})</span>
              </h2>
            </div>
          </div>

          {/* FORM TAMBAH KOMENTAR (KHUSUS MEMBER) */}
          {isMember ? (
            <form ref={commentFormRef} action={commentFormAction} className="mb-8 space-y-3">
              <input type="hidden" name="artworkId" value={artwork.id} />
              {commentState?.error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                  {commentState.error}
                </p>
              )}
              <textarea
                name="content"
                rows={3}
                maxLength={500}
                required
                placeholder="Tulis apresiasi atau masukan untuk karya ini..."
                className="input-lux"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCommenting}
                  className="btn-gold rounded-full px-6 py-2.5 text-[10px] uppercase tracking-[0.2em]"
                >
                  {isCommenting ? "Mengirim..." : "Kirim Komentar"}
                </button>
              </div>
            </form>
          ) : isGuest ? (
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-5 py-4 text-xs text-zinc-400">
              <span>Masuk sebagai Member untuk ikut menulis komentar pada karya ini.</span>
              <Link href="/" className="btn-gold rounded-full px-4 py-1.5 text-[10px] uppercase tracking-wider">
                Masuk Sekarang
              </Link>
            </div>
          ) : null}

          {/* DAFTAR KOMENTAR */}
          {comments.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-500">
              Belum ada komentar. Jadilah yang pertama mengapresiasi karya ini!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((cm) => {
                const isMyComment = isMember && Number(cm.user_id) === Number(currentUser.id);
                return (
                  <div key={cm.id} className="rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-white/20">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/creators/${cm.author_username}`} className="flex items-center gap-3 transition hover:opacity-80">
                        <div className="shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1px]">
                          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                            {cm.author_avatar ? (
                              <img src={cm.author_avatar} alt={cm.author_name} className="h-full w-full object-cover" />
                            ) : (
                              cm.author_name?.charAt(0).toUpperCase() || "U"
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{cm.author_name}</p>
                          <p className="text-[10px] text-zinc-500">@{cm.author_username} &bull; {formatDate(cm.created_at)}</p>
                        </div>
                      </Link>

                      {isMyComment && (
                        <button
                          type="button"
                          disabled={deletingCommentId === cm.id}
                          onClick={() => handleDeleteComment(cm.id)}
                          className="rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[10px] text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          {deletingCommentId === cm.id ? "..." : "Hapus"}
                        </button>
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">{cm.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* MODAL REPORT ARTWORK */}
      {showReportModal && isMember && !isOwnArtwork && (
        <div onClick={() => setShowReportModal(false)} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel w-full max-w-md rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] tracking-[0.3em] text-red-400">REPORT ARTWORK</p>
                <h2 className="font-display mt-1 text-3xl text-white">Laporkan Karya</h2>
              </div>
              <button type="button" onClick={() => setShowReportModal(false)} className="text-xl text-zinc-500 hover:text-white">×</button>
            </div>

            <p className="mt-2 text-xs text-zinc-400">
              Laporanmu akan ditinjau oleh Admin pada Moderation Queue. Satu akun hanya dapat melaporkan karya ini satu kali.
            </p>

            {reportState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {reportState.error}
              </div>
            )}

            <form action={reportFormAction} className="mt-5 space-y-4">
              <input type="hidden" name="artworkId" value={artwork.id} />

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Alasan Pelaporan</label>
                <select
                  name="reasonCategory"
                  required
                  defaultValue={REPORT_REASONS[0]}
                  className="input-lux bg-zinc-950"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Detail Tambahan (Opsional)</label>
                <textarea
                  name="reasonDetail"
                  rows={3}
                  placeholder="Jelaskan detail pelanggaran agar memudahkan peninjauan Admin..."
                  className="input-lux"
                />
              </div>

              <button
                type="submit"
                disabled={isReporting}
                className="w-full rounded-xl bg-red-600 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {isReporting ? "Mengirim Laporan..." : "Kirim Laporan ke Admin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
