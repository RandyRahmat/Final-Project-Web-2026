"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { reactArtworkAction, toggleFavoriteAction } from "@/actions/artwork-actions";
import { sendMessageAction } from "@/actions/message-actions";

const REACTIONS = [
  { type: "love", icon: "❤️", label: "Love" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "fire", icon: "🔥", label: "Fire" },
  { type: "inspire", icon: "✧", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

export default function CreatorProfileClient({ currentUser, creator, artworks }) {
  const [authNotice, setAuthNotice] = useState("");
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

  const handleOpenChat = () => {
    if (isGuest) {
      setAuthNotice(`Silakan masuk terlebih dahulu untuk mengirim pesan pribadi ke ${creator.display_name}.`);
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
      return;
    }
    if (res?.message) {
      setChatMessages((prev) => [...prev, res.message]);
      setDraft("");
    }
  };

  const handleReaction = async (artworkId, reactionType = "love") => {
    if (isGuest) {
      setAuthNotice("Silakan masuk sebagai Member untuk memberi reaksi pada karya.");
      return;
    }
    if (!isMember) return;
    setAuthNotice("");
    await reactArtworkAction(artworkId, reactionType);
  };

  const handleFavorite = async (artworkId) => {
    if (isGuest) {
      setAuthNotice("Silakan masuk sebagai Member untuk menyimpan karya ke Favorites.");
      return;
    }
    if (!isMember) return;
    setAuthNotice("");
    await toggleFavoriteAction(artworkId);
  };

  const getReactionDisplay = (type) => {
    return REACTIONS.find((r) => r.type === type) || REACTIONS[0];
  };

  return (
    <main className="min-h-screen bg-[#090909] text-zinc-100">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 left-1/3 h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
      </div>

      {/* TOP BAR */}
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/80 px-5 backdrop-blur-2xl sm:px-10">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-3">
            <img src="/images/aesthe-logo.png" alt="Aesthe" className="h-8 w-8 object-contain mix-blend-screen" />
            <span className="text-sm font-medium tracking-[0.3em] text-white">AESTHE</span>
          </Link>
          <span className="hidden text-zinc-700 sm:inline">/</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-zinc-400 sm:inline">
            CREATOR PROFILE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/explore" className="rounded-full border border-white/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-400 transition hover:border-white/30 hover:text-white">
            Explore
          </Link>
          {isOwnProfile ? (
            <Link href="/profile" className="rounded-full bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-zinc-200">
              Kelola Profil
            </Link>
          ) : (
            <Link href="/home" className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-200 transition hover:bg-white hover:text-black">
              &larr; Home
            </Link>
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-10 sm:px-10">
        {authNotice && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-xs text-zinc-200">
            <span>{authNotice}</span>
            <Link href="/" className="rounded-full bg-white px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
              Login Sekarang
            </Link>
          </div>
        )}

        {/* CREATOR HEADER */}
        <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 sm:p-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-700 to-zinc-900 text-3xl font-light text-white shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" />
                ) : (
                  creator.display_name?.charAt(0).toUpperCase() || "C"
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-light tracking-tight text-white sm:text-3xl">
                    {creator.display_name}
                  </h1>
                  <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-0.5 text-[9px] uppercase tracking-[0.2em] text-zinc-300">
                    {creator.role}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">@{creator.username}</p>
                {creator.bio && (
                  <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-300">{creator.bio}</p>
                )}
                {creator.external_link && (
                  <a
                    href={creator.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-amber-300 underline decoration-amber-400/40 underline-offset-4 transition hover:text-amber-200"
                  >
                    🔗 {creator.external_link.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-zinc-200"
                >
                  <span>✉</span>
                  <span>Kirim Pesan</span>
                </button>
              )}
              <div className="rounded-xl border border-white/[0.07] bg-black/30 px-5 py-3 text-center">
                <p className="text-xl font-light text-white">{artworks.length}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Karya</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/30 px-5 py-3 text-center">
                <p className="text-xl font-light text-white">{totalReactions}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Reaksi</p>
              </div>
            </div>
          </div>
        </section>

        {/* PORTFOLIO GALLERY */}
        <section className="mt-12">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-[9px] tracking-[0.3em] text-zinc-600">PORTFOLIO SHOWCASE</p>
              <h2 className="mt-1 text-2xl font-light tracking-tight">
                Karya oleh {creator.display_name}
                <span className="text-zinc-600">.</span>
              </h2>
            </div>
          </div>

          {artworks.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-20 text-center">
              <p className="text-sm text-zinc-400">Kreator ini belum mengunggah karya apa pun.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {artworks.map((art) => {
                const userReaction = art.user_reaction ? getReactionDisplay(art.user_reaction) : null;

                return (
                  <article key={art.id} className="group relative min-w-0">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900">
                      <Link href={`/artworks/${art.id}`} className="block h-full w-full">
                        <img
                          src={art.image_url}
                          alt={art.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-75"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-80" />

                        <div className="absolute left-3 top-3">
                          <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[8px] tracking-wider text-white backdrop-blur-md">
                            {art.category_name.toUpperCase()}
                          </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-4">
                          <p className="text-sm font-medium text-white group-hover:underline">{art.title}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {(art.tags || []).map((tag) => (
                              <span key={tag} className="text-[9px] text-zinc-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>

                      {(isMember || isGuest) && (
                        <button
                          type="button"
                          onClick={() => handleFavorite(art.id)}
                          title={isGuest ? "Masuk sebagai Member untuk menyimpan karya" : art.is_favorited ? "Hapus dari Favorites" : "Simpan ke Favorites"}
                          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs backdrop-blur-md transition ${
                            isMember && art.is_favorited
                              ? "border-amber-400 bg-amber-400 font-bold text-black"
                              : "border-white/20 bg-black/50 text-white hover:bg-white hover:text-black"
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
                          <div className="pointer-events-none absolute bottom-full right-0 mb-2 flex items-center gap-1 rounded-full border border-white/15 bg-[#161618] px-2.5 py-1.5 opacity-0 shadow-2xl transition-all duration-200 group-hover/react:pointer-events-auto group-hover/react:opacity-100">
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
        <div onClick={() => setShowChat(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="flex h-[540px] max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#101012] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-zinc-800 text-xs font-semibold text-white">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" />
                  ) : (
                    creator.display_name?.charAt(0).toUpperCase() || "C"
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{creator.display_name}</p>
                  <p className="text-[10px] text-zinc-500">@{creator.username} · Private Message</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/messages?to=${creator.username}`} className="text-[10px] text-zinc-400 transition hover:text-white">
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
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${isMine ? "rounded-br-sm bg-white text-black" : "rounded-bl-sm border border-white/10 bg-zinc-900 text-zinc-100"}`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`mt-1 text-right text-[9px] ${isMine ? "text-zinc-600" : "text-zinc-500"}`}>
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
                  className="flex-1 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs text-white placeholder-zinc-600 focus:border-white/35 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-black transition hover:bg-zinc-200 disabled:opacity-40"
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
