"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast-provider";
import { reactArtworkAction, toggleFavoriteAction } from "@/actions/artwork-actions";
import { sendMessageAction } from "@/actions/message-actions";
import { toggleFollowAction } from "@/actions/profile-actions";

const REACTIONS = [
  { type: "love", icon: "❤️", label: "Love" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "fire", icon: "🔥", label: "Fire" },
  { type: "inspire", icon: "✧", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

export default function CreatorProfileClient({ currentUser, creator, artworks, followStats }) {
  const toast = useToast();
  const [authNotice, setAuthNotice] = useState("");
  const [togglingFollow, setTogglingFollow] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatBottomRef = useRef(null);

  const role = currentUser?.role || "Guest";
  const isGuest = !currentUser;
  const isMember = role === "Member";
  const isOwnProfile = Number(currentUser?.id) === Number(creator.id);

  const totalReactions = artworks.reduce((sum, art) => sum + (art.total_reactions || 0), 0);

  useEffect(() => {
    if (!showChat || isGuest || isOwnProfile) return;
    let cancelled = false;

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/messages?with=${creator.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        }
      } catch {
        // Abaikan error sementara saat polling
      } finally {
        if (!cancelled) setLoadingChat(false);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showChat, isGuest, isOwnProfile, creator.id]);

  useEffect(() => {
    if (showChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length, showChat]);

  const handleToggleFollow = async () => {
    if (isGuest) {
      setAuthNotice(`Silakan masuk sebagai Member untuk mengikuti ${creator.display_name}.`);
      toast.info("Masuk diperlukan", `Login untuk mengikuti @${creator.username}.`);
      return;
    }
    if (!isMember || isOwnProfile || togglingFollow) return;
    setTogglingFollow(true);
    setAuthNotice("");
    const wasFollowing = Boolean(followStats?.isFollowing);
    await toggleFollowAction(creator.id);
    setTogglingFollow(false);
    if (wasFollowing) {
      toast.info(`Berhenti mengikuti @${creator.username}`, creator.display_name);
    } else {
      toast.success(`Mengikuti @${creator.username}`, creator.display_name);
    }
  };

  const handleOpenChat = () => {
    if (isGuest) {
      setAuthNotice(`Silakan masuk terlebih dahulu untuk mengirim pesan pribadi ke ${creator.display_name}.`);
      toast.info("Masuk diperlukan", "Login untuk mengirim pesan pribadi.");
      return;
    }
    setAuthNotice("");
    setChatError("");
    setLoadingChat(true);
    setShowChat(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setChatError("");
    const res = await sendMessageAction(creator.id, draft.trim());
    setSending(false);
    if (res?.error) {
      setChatError(res.error);
      toast.error("Pesan gagal terkirim", res.error);
      return;
    }
    if (res?.message) {
      setChatMessages((prev) => [...prev, res.message]);
      setDraft("");
      toast.success("Pesan terkirim", `Ke ${creator.display_name}`);
    }
  };

  const handleReaction = async (artworkId, reactionType = "love") => {
    if (isGuest) {
      setAuthNotice("Silakan masuk sebagai Member untuk memberi reaksi pada karya.");
      toast.info("Masuk diperlukan", "Login sebagai Member untuk memberi reaksi.");
      return;
    }
    if (!isMember) return;
    setAuthNotice("");
    const target = artworks.find((a) => a.id === artworkId);
    const r = REACTIONS.find((x) => x.type === reactionType) || REACTIONS[0];
    await reactArtworkAction(artworkId, reactionType);
    toast.success(target?.user_reaction === reactionType ? "Reaksi dibatalkan" : `Reaksi ${r.icon} ${r.label} dikirim`, target?.title);
  };

  const handleFavorite = async (artworkId) => {
    if (isGuest) {
      setAuthNotice("Silakan masuk sebagai Member untuk menyimpan karya ke Favorites.");
      toast.info("Masuk diperlukan", "Login sebagai Member untuk menyimpan karya.");
      return;
    }
    if (!isMember) return;
    setAuthNotice("");
    const target = artworks.find((a) => a.id === artworkId);
    const wasFav = Boolean(target?.is_favorited);
    await toggleFavoriteAction(artworkId);
    toast.success(wasFav ? "Dihapus dari Favorites" : "Disimpan ke Favorites", target?.title);
  };

  const getReactionDisplay = (type) => {
    return REACTIONS.find((r) => r.type === type) || REACTIONS[0];
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
            CREATOR PROFILE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/explore" className="btn-ghost rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em]">
            Explore
          </Link>
          {isOwnProfile ? (
            <Link href="/profile" className="btn-gold rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em]">
              Kelola Profil
            </Link>
          ) : (
            <Link href="/home" className="btn-ghost rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.15em]">
              &larr; Home
            </Link>
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-10 sm:px-10">
        {authNotice && (
          <div className="glass mb-6 flex items-center justify-between rounded-xl border border-champagne-300/25 px-5 py-3 text-xs text-zinc-200">
            <span>{authNotice}</span>
            <Link href="/" className="btn-gold rounded-full px-4 py-1 text-[10px] uppercase tracking-wider">
              Login Sekarang
            </Link>
          </div>
        )}

        {/* CREATOR HEADER */}
        <section className="glass spotlight relative overflow-hidden rounded-3xl border border-white/15 p-6 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-champagne-400/[0.08] via-transparent to-transparent" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="w-fit shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-400 to-champagne-700 p-[2px] shadow-[0_0_35px_rgba(212,175,106,0.28)]">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-3xl font-light text-white">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" />
                  ) : (
                    creator.display_name?.charAt(0).toUpperCase() || "C"
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-4xl text-white sm:text-5xl">
                    {creator.display_name}
                  </h1>
                  <span className="rounded-full border border-champagne-300/30 bg-champagne-400/10 px-3 py-0.5 text-[9px] uppercase tracking-[0.2em] text-champagne-200">
                    {creator.role}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">@{creator.username}</p>
                {creator.bio && (
                  <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-300">{creator.bio}</p>
                )}
                {creator.external_link && (
                  <a
                    href={creator.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-champagne-300 underline decoration-champagne-400/40 underline-offset-4 transition hover:text-champagne-100"
                  >
                    🔗 {creator.external_link.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isOwnProfile && (isMember || isGuest) && (
                <button
                  type="button"
                  disabled={togglingFollow}
                  onClick={handleToggleFollow}
                  className={`rounded-full px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition disabled:opacity-50 ${
                    isMember && followStats?.is_following
                      ? "btn-ghost hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-300"
                      : "btn-gold"
                  }`}
                >
                  <span>{isMember && followStats?.is_following ? "✓ Following" : "＋ Follow"}</span>
                </button>
              )}
              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                >
                  <span>✉</span>
                  <span>Kirim Pesan</span>
                </button>
              )}
              <div className="glass rounded-2xl border border-white/10 px-4 py-3 text-center">
                <p className="font-display text-2xl text-gold">{followStats?.followers_count || 0}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Followers</p>
              </div>
              <div className="glass rounded-2xl border border-white/10 px-4 py-3 text-center">
                <p className="font-display text-2xl text-gold">{artworks.length}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Karya</p>
              </div>
              <div className="glass rounded-2xl border border-white/10 px-4 py-3 text-center">
                <p className="font-display text-2xl text-gold">{totalReactions}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Reaksi</p>
              </div>
            </div>
          </div>
        </section>

        {/* PORTFOLIO GALLERY */}
        <section className="mt-12">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="eyebrow">PORTFOLIO SHOWCASE</p>
              <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">
                Karya oleh <span className="italic text-gold">{creator.display_name}</span>
                <span className="text-champagne-400">.</span>
              </h2>
            </div>
          </div>

          {artworks.length === 0 ? (
            <div className="glass rounded-2xl border border-white/10 px-6 py-20 text-center">
              <p className="text-sm text-zinc-400">Kreator ini belum mengunggah karya apa pun.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {artworks.map((art) => {
                const userReaction = art.user_reaction ? getReactionDisplay(art.user_reaction) : null;

                return (
                  <article key={art.id} data-reveal className="group relative min-w-0">
                    <div className="card-lux spotlight relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/15 bg-zinc-900">
                      <Link href={`/artworks/${art.id}`} className="block h-full w-full">
                        <img
                          src={art.image_url}
                          alt={art.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-80" />

                        <div className="absolute left-3 top-3">
                          <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[8px] tracking-wider text-white backdrop-blur-md">
                            {art.category_name.toUpperCase()}
                          </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="font-display text-lg text-white transition group-hover:text-champagne-100">{art.title}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {(art.tags || []).map((tag) => (
                              <span key={tag} className="text-[9px] text-zinc-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <span className="absolute bottom-4 right-4 translate-y-3 rounded-full bg-black/60 px-3 py-1.5 text-[9px] tracking-[0.2em] text-champagne-100 opacity-0 backdrop-blur-md transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                          LIHAT ↗
                        </span>
                      </Link>

                      {(isMember || isGuest) && (
                        <button
                          type="button"
                          onClick={() => handleFavorite(art.id)}
                          title={isGuest ? "Masuk sebagai Member untuk menyimpan karya" : art.is_favorited ? "Hapus dari Favorites" : "Simpan ke Favorites"}
                          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs backdrop-blur-md transition ${
                            isMember && art.is_favorited
                              ? "border-champagne-300 bg-gradient-to-br from-champagne-100 to-champagne-400 font-bold text-black shadow-[0_0_20px_rgba(212,175,106,0.5)]"
                              : "border-white/20 bg-black/50 text-white hover:border-champagne-300/60 hover:bg-champagne-200 hover:text-black"
                          }`}
                        >
                          ⚑
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-zinc-400">{art.description}</p>

                      {isMember ? (
                        <div className="group/react relative flex shrink-0 items-center">
                          <div className="glass pointer-events-none absolute bottom-full right-0 mb-2 flex items-center gap-1 rounded-full px-2.5 py-1.5 opacity-0 transition-all duration-200 group-hover/react:pointer-events-auto group-hover/react:opacity-100">
                            {REACTIONS.map((r) => (
                              <button
                                key={r.type}
                                type="button"
                                onClick={() => handleReaction(art.id, r.type)}
                                title={r.label}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:scale-125 hover:bg-white/10"
                              >
                                {r.icon}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleReaction(art.id, userReaction ? userReaction.type : "love")}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition ${
                              userReaction
                                ? "border-rose-500/50 bg-rose-500/15 font-medium text-rose-300"
                                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            <span>{userReaction ? userReaction.icon : "♥"}</span>
                            <span>{art.total_reactions}</span>
                          </button>
                        </div>
                      ) : isGuest ? (
                        <button
                          type="button"
                          onClick={() => handleReaction(art.id, "love")}
                          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400 transition hover:border-white/30 hover:text-white"
                        >
                          <span>♥</span>
                          <span>{art.total_reactions}</span>
                        </button>
                      ) : (
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1 text-[11px] text-zinc-500">
                          <span>♥</span>
                          <span>{art.total_reactions}</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* QUICK PRIVATE MESSAGE MODAL */}
      {showChat && !isGuest && !isOwnProfile && (
        <div onClick={() => setShowChat(false)} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel flex h-[540px] max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" />
                    ) : (
                      creator.display_name?.charAt(0).toUpperCase() || "C"
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{creator.display_name}</p>
                  <p className="text-[10px] text-champagne-300/80">@{creator.username} · Private Message</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/messages?to=${creator.username}`} className="text-[10px] text-zinc-400 transition hover:text-champagne-200">
                  Inbox ↗
                </Link>
                <button type="button" onClick={() => setShowChat(false)} className="text-lg text-zinc-500 transition hover:text-white">
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
              {loadingChat ? (
                <p className="py-12 text-center text-xs text-zinc-500">Memuat percakapan...</p>
              ) : chatMessages.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-xs text-zinc-400">Belum ada pesan dengan {creator.display_name}.</p>
                  <p className="mt-1 text-[10px] text-zinc-600">Kirim pesan pribadi untuk berdiskusi atau kolaborasi.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = Number(msg.sender_id) === Number(currentUser.id);
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${isMine ? "rounded-br-sm bg-gradient-to-br from-champagne-100 to-champagne-300 text-black" : "glass rounded-bl-sm text-zinc-100"}`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`mt-1 text-right text-[9px] ${isMine ? "text-zinc-700" : "text-zinc-500"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="border-t border-white/[0.08] p-3.5">
              {chatError && <p className="mb-2 text-[11px] text-red-400">{chatError}</p>}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={1000}
                  placeholder={`Tulis pesan ke ${creator.display_name}...`}
                  className="input-lux flex-1 rounded-full py-2"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="btn-gold rounded-full px-4 py-2 text-[10px] uppercase tracking-wider"
                >
                  {sending ? "..." : "Kirim"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
