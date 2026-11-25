"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import { useAuthPrompt } from "@/components/ui/auth-prompt-provider";
import ExhibitionMode from "@/components/ui/exhibition-mode";
import NavIcon from "@/components/ui/nav-icon";
import QuickSearchTrigger, { QuickSearchIconButton } from "@/components/ui/quick-search-trigger";
import ReactionPicker, { getReactionDisplay } from "@/components/ui/reaction-picker";
import { useToast } from "@/components/ui/toast-provider";
import { openUploadModal } from "@/components/ui/upload-artwork-modal";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { reactArtworkAction, toggleFavoriteAction } from "@/actions/artwork-actions";

export default function HomeClient({ currentUser, artworks, categories, challenges, podiumWinners, notifications = [] }) {
  const openAuthPrompt = useAuthPrompt();
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [followingOnly, setFollowingOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const [showExhibition, setShowExhibition] = useState(false);
  const notifContainerRef = useRef(null);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications]);

  const highlightCount = notifications.filter((n) => n.highlight).length;

  const role = currentUser?.role || "Guest";
  const isGuest = !currentUser;
  const isMember = role === "Member";
  const isCurator = role === "Curator";
  const isAdmin = role === "Admin";
  const isCuratorApproved = isCurator && currentUser?.curatorStatus === "Approved";

  const filteredArtworks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = artworks.filter((art) => {
      if (followingOnly && isMember && !art.is_following_artist) return false;
      const matchesCategory = activeCategory === "All" || art.category_name === activeCategory;
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.artist_name.toLowerCase().includes(q) ||
        (art.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return (b.total_reactions || 0) - (a.total_reactions || 0) || new Date(b.created_at) - new Date(a.created_at);
    });
  }, [artworks, activeCategory, search, isMember, sortBy, followingOnly]);

  const handleReaction = async (artworkId, reactionType = "love") => {
    if (isGuest) {
      openAuthPrompt({
        title: "Masuk untuk Memberi Reaksi",
        message: "Login sebagai Member Aesthe untuk memberikan apresiasi dan reaksi pada karya seni ini.",
      });
      return;
    }
    if (!isMember) return;
    const target = artworks.find((a) => a.id === artworkId);
    const removing = target?.user_reaction === reactionType;
    const reaction = getReactionDisplay(reactionType);
    const res = await reactArtworkAction(artworkId, reactionType);
    if (res?.error) {
      toast.error("Gagal mengirim reaksi", res.error);
      return;
    }
    toast.success(removing ? "Reaksi dibatalkan" : `Reaksi ${reaction.icon} ${reaction.label} dikirim`, target?.title);
  };

  const handleFavorite = async (artworkId) => {
    if (isGuest) {
      openAuthPrompt({
        title: "Masuk untuk Menyimpan Karya",
        message: "Login sebagai Member Aesthe untuk menyimpan karya favorit dan mengaturnya ke dalam moodboard.",
      });
      return;
    }
    if (!isMember) return;
    const target = artworks.find((a) => a.id === artworkId);
    const wasFav = Boolean(target?.is_favorited);
    const res = await toggleFavoriteAction(artworkId);
    if (res?.error) {
      toast.error("Gagal memperbarui Favorites", res.error);
      return;
    }
    toast.success(wasFav ? "Dihapus dari Favorites" : "Disimpan ke Favorites", target?.title);
  };

  const rank1 = podiumWinners.find((w) => Number(w.winner_rank) === 1);
  const rank2 = podiumWinners.find((w) => Number(w.winner_rank) === 2);
  const rank3 = podiumWinners.find((w) => Number(w.winner_rank) === 3);
  const podiumMeta = podiumWinners[0] || null;
  const featured = artworks[0] || null;

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      <AppSidebar
        currentUser={currentUser}
        activeItem="home"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileMenu={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
        challengesCount={challenges.length}
      />

      <div className={`relative z-10 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[78px]" : "lg:ml-[250px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/80 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenu(true)}
              className="text-xl text-zinc-400 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              DISCOVER / <span className="text-champagne-200">HOME</span>
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <img src="/images/aesthe-logo.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-xs tracking-[0.25em]">AESTHE</span>
            </div>
          </div>

          <QuickSearchTrigger />

          <div className="flex items-center gap-4 sm:gap-5">
            <QuickSearchIconButton />

            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  showNotifications
                    ? "border-champagne-300/45 bg-champagne-400/15 text-champagne-200"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white"
                }`}
                aria-label="Notifications"
                title="Notifikasi"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifications.length > 0 && (
                  highlightCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-champagne-200 to-champagne-500 px-1 text-[9px] font-bold text-black shadow-[0_0_12px_rgba(212,175,106,0.75)]">
                      {highlightCount}
                    </span>
                  ) : (
                    <span className="live-dot absolute right-1.5 top-1.5 text-champagne-300" />
                  )
                )}
              </button>

              {showNotifications && (
                <div className="modal-panel fixed inset-x-4 top-[72px] z-50 overflow-hidden rounded-2xl p-4 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[350px]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                    <div>
                      <p className="text-xs font-semibold text-white">Notifikasi</p>
                      <p className="text-[10px] text-zinc-500">Aktivitas real-time dari ruang karyamu</p>
                    </div>
                    <span className="rounded-full border border-champagne-300/25 bg-champagne-400/10 px-2.5 py-0.5 text-[9px] font-medium tracking-wider text-champagne-200">
                      {notifications.length} TERBARU
                    </span>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-zinc-400">Belum ada aktivitas terbaru.</p>
                      <p className="mt-1 text-[10px] text-zinc-600">Interaksi pada karyamu akan muncul di sini.</p>
                    </div>
                  ) : (
                    <div data-lenis-prevent className="mt-2.5 max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                      {notifications.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setShowNotifications(false)}
                          className={`group flex items-start gap-3 rounded-xl border p-2.5 transition ${
                            item.highlight
                              ? "border-champagne-300/25 bg-champagne-400/[0.08] hover:border-champagne-300/45 hover:bg-champagne-400/[0.14]"
                              : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                              item.kind === "message"
                                ? "bg-champagne-400/20 text-champagne-200"
                                : item.kind === "admin"
                                ? "bg-rose-500/20 text-rose-300"
                                : item.kind === "comment"
                                ? "bg-sky-500/15 text-sky-300"
                                : item.kind === "reaction"
                                ? "bg-rose-500/15 text-rose-300"
                                : item.kind === "follow"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-amber-500/15 text-amber-300"
                            }`}
                          >
                            {item.kind === "message"
                              ? "✉"
                              : item.kind === "admin"
                              ? "!"
                              : item.kind === "comment"
                              ? "✎"
                              : item.kind === "reaction"
                              ? "♥"
                              : item.kind === "follow"
                              ? "+"
                              : "✨"}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium leading-snug text-zinc-100 transition group-hover:text-champagne-100">
                              {item.title}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-zinc-400">{item.subtitle}</p>
                            <p className="mt-1 text-[9px] uppercase tracking-wider text-champagne-400/80">{item.time}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-white/10" />

            <Link href={currentUser ? "/profile" : "/?step=login"} className="flex items-center gap-3 transition hover:opacity-85">
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-medium">
                  {currentUser ? currentUser.displayName : "Guest Visitor"}
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-600">
                  {currentUser ? `${currentUser.role.toUpperCase()} ACCOUNT` : "PUBLIC VIEW"}
                </p>
              </div>
              <div className="rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-medium uppercase">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" />
                  ) : (
                    currentUser?.displayName?.charAt(0) || "G"
                  )}
                </div>
              </div>
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {isCurator && !isCuratorApproved && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-xs text-amber-200">
              <span>
                {currentUser?.curatorStatus === "Rejected"
                  ? "Pendaftaran akun Curator Anda ditolak oleh Admin. Anda masih dapat menjelajahi galeri atau menghapus akun melalui halaman status."
                  : "Akun Curator Anda sedang menunggu persetujuan Admin. Anda dapat menjelajahi galeri sambil menunggu verifikasi."}
              </span>
              <Link href="/pending-curator" className="rounded-full border border-amber-400/40 bg-amber-400/20 px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200 transition hover:bg-amber-400 hover:text-black">
                Lihat Status
              </Link>
            </div>
          )}

          <section data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="eyebrow">YOUR CREATIVE SPACE</p>
                <span className="rounded-full border border-champagne-300/25 bg-champagne-400/10 px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-champagne-200">
                  {role}
                </span>
              </div>
              <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-7xl">
                {currentUser ? (
                  <>
                    Welcome back, <span className="italic text-gold">{currentUser.displayName}</span>
                  </>
                ) : (
                  <>
                    Explore <span className="italic text-gold">Aesthe</span>
                  </>
                )}
                <span className="text-champagne-400">.</span>
              </h1>
              <p className="mt-3 text-[11px] text-zinc-400 sm:text-xs">
                {isCurator
                  ? "Explore community artworks and curate inspiring challenges."
                  : isAdmin
                  ? "Monitor community artworks, challenges, and platform integrity."
                  : "Discover inspiration. Explore imagination. Create something extraordinary."}
              </p>
            </div>

            {isMember && (
              <button
                type="button"
                onClick={openUploadModal}
                className="btn-gold group rounded-full px-6 py-3 text-[9px] tracking-[0.2em]"
              >
                <span className="text-base transition-transform duration-300 group-hover:rotate-90">＋</span>
                UPLOAD ARTWORK
              </button>
            )}

            {isCurator && isCuratorApproved && (
              <Link href="/curator" className="btn-ghost rounded-full border-champagne-400/40 px-5 py-3 text-[9px] font-medium tracking-[0.18em] text-champagne-200">
                <span className="text-sm">✦</span>
                CURATOR DASHBOARD
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin" className="btn-ghost rounded-full px-5 py-3 text-[9px] font-medium tracking-[0.18em]">
                <span className="text-sm">❖</span>
                ADMIN CONSOLE
              </Link>
            )}
          </section>

          <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="card-lux spotlight group relative h-[360px] overflow-hidden rounded-2xl border border-white/15 transition hover:border-champagne-300/45 xl:col-span-7 xl:h-[420px]">
              <img
                src={featured?.image_url || "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1800"}
                alt={featured?.title || "Featured artwork"}
                className="animate-ken-burns absolute inset-0 h-full w-full object-cover object-center opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/15" />

              <div className="absolute left-7 top-7 flex items-center gap-2.5">
                <span className="live-dot text-champagne-300" />
                <span className="text-[9px] tracking-[0.3em] text-champagne-100">EDITOR&apos;S SELECTION</span>
              </div>

              <div className="absolute bottom-8 left-7 right-7 max-w-lg">
                <h2 className="font-display text-4xl leading-[1.05] text-white sm:text-5xl">
                  {featured ? (
                    featured.title
                  ) : (
                    <>
                      Art Beyond <span className="italic text-gold">Boundaries.</span>
                    </>
                  )}
                </h2>
                {featured ? (
                  <>
                    <p className="mt-3 text-xs text-zinc-300">
                      by{" "}
                      <Link href={`/creators/${featured.artist_username}`} className="text-champagne-200 hover:underline">
                        {featured.artist_name}
                      </Link>{" "}
                      &middot; ♥ {featured.total_reactions}
                    </p>
                    <Link href={`/artworks/${featured.id}`} className="btn-gold mt-5 rounded-full px-6 py-2.5 text-[9px] tracking-[0.25em]">
                      LIHAT KARYA &rarr;
                    </Link>
                  </>
                ) : (
                  <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
                    Every creation tells a story. Every imagination deserves a space.
                  </p>
                )}
              </div>
            </div>

            <div className="glass spotlight flex flex-col justify-between rounded-2xl border border-white/15 p-6 transition hover:border-champagne-300/45 xl:col-span-5 xl:h-[420px]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="eyebrow">CURATOR&apos;S CHALLENGE PODIUM</p>
                  {podiumMeta?.challenge_id ? (
                    <Link
                      href={`/challenges/${podiumMeta.challenge_id}`}
                      className="font-display mt-1.5 block truncate text-xl tracking-wide text-white transition hover:text-champagne-200"
                    >
                      {podiumMeta.challenge_title}
                    </Link>
                  ) : (
                    <h3 className="font-display mt-1.5 truncate text-xl tracking-wide text-white">
                      Hall of Fame Podium
                    </h3>
                  )}
                  <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                    {podiumMeta ? `Dipilih oleh Curator: ${podiumMeta.curator_name}` : "Menunggu pengumuman resmi Curator"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-champagne-300/30 bg-champagne-400/10 px-3 py-1 text-[9px] tracking-widest text-champagne-200">
                  TOP 3
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 items-end gap-3 pt-2">
                <div className="flex flex-col items-center">
                  {rank3?.artwork_id ? (
                    <Link href={`/artworks/${rank3.artwork_id}`} className="mb-2 block h-24 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-800 transition hover:border-amber-600/60">
                      <img src={rank3.image_url} alt={rank3.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    </Link>
                  ) : (
                    <div className="mb-2 h-24 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
                      {rank3 ? (
                        <img src={rank3.image_url} alt={rank3.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">TBA</div>
                      )}
                    </div>
                  )}
                  {rank3?.artwork_id ? (
                    <Link href={`/artworks/${rank3.artwork_id}`} className="w-full truncate text-center text-[10px] font-medium text-zinc-300 transition hover:text-champagne-200">
                      {rank3.title}
                    </Link>
                  ) : (
                    <p className="w-full truncate text-center text-[10px] font-medium text-zinc-300">
                      {rank3 ? rank3.title : "Slot #3"}
                    </p>
                  )}
                  {rank3?.artist_username ? (
                    <Link href={`/creators/${rank3.artist_username}`} className="w-full truncate text-center text-[9px] text-zinc-500 transition hover:text-zinc-200">
                      {rank3.artist_name}
                    </Link>
                  ) : (
                    <p className="w-full truncate text-center text-[9px] text-zinc-500">
                      {rank3 ? rank3.artist_name : "Menunggu Curator"}
                    </p>
                  )}
                  <div className="mt-2 flex h-20 w-full flex-col items-center justify-center rounded-t-xl border-x border-t border-amber-700/30 bg-gradient-to-t from-zinc-900 to-amber-900/20">
                    <span className="font-display text-xl font-semibold text-amber-500">#3</span>
                    <span className="text-[8px] font-medium uppercase tracking-widest text-amber-500/90">Bronze</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  {rank1?.artwork_id ? (
                    <Link href={`/artworks/${rank1.artwork_id}`} className="shine mb-2 block h-24 w-full overflow-hidden rounded-xl border border-amber-400/70 bg-zinc-800 shadow-[0_0_35px_rgba(245,158,11,0.35)] transition hover:border-amber-300">
                      <img src={rank1.image_url} alt={rank1.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    </Link>
                  ) : (
                    <div className="shine mb-2 h-24 w-full overflow-hidden rounded-xl border border-amber-400/70 bg-zinc-800 shadow-[0_0_35px_rgba(245,158,11,0.35)]">
                      {rank1 ? (
                        <img src={rank1.image_url} alt={rank1.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">TBA</div>
                      )}
                    </div>
                  )}
                  {rank1?.artwork_id ? (
                    <Link href={`/artworks/${rank1.artwork_id}`} className="w-full truncate text-center text-[11px] font-semibold text-amber-100 transition hover:text-amber-300">
                      {rank1.title}
                    </Link>
                  ) : (
                    <p className="w-full truncate text-center text-[11px] font-semibold text-amber-100">
                      {rank1 ? rank1.title : "Champion #1"}
                    </p>
                  )}
                  {rank1?.artist_username ? (
                    <Link href={`/creators/${rank1.artist_username}`} className="w-full truncate text-center text-[9px] text-zinc-400 transition hover:text-amber-200">
                      {rank1.artist_name}
                    </Link>
                  ) : (
                    <p className="w-full truncate text-center text-[9px] text-zinc-400">
                      {rank1 ? rank1.artist_name : "Menunggu Curator"}
                    </p>
                  )}
                  <div className="shine mt-2 flex h-32 w-full flex-col items-center justify-center rounded-t-xl border-x border-t border-amber-400/65 bg-gradient-to-t from-zinc-950 via-amber-500/20 to-amber-300/35 shadow-[inset_0_1px_0_rgba(253,230,138,0.45),0_0_28px_rgba(245,158,11,0.18)]">
                    <span className="font-display text-2xl font-bold text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]">♛ #1</span>
                    <span className="text-[8px] font-semibold uppercase tracking-widest text-amber-300/95">Gold</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  {rank2?.artwork_id ? (
                    <Link href={`/artworks/${rank2.artwork_id}`} className="mb-2 block h-24 w-full overflow-hidden rounded-xl border border-slate-300/35 bg-zinc-800 shadow-[0_0_20px_rgba(203,213,225,0.15)] transition hover:border-slate-200/70">
                      <img src={rank2.image_url} alt={rank2.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    </Link>
                  ) : (
                    <div className="mb-2 h-24 w-full overflow-hidden rounded-xl border border-slate-300/35 bg-zinc-800 shadow-[0_0_20px_rgba(203,213,225,0.15)]">
                      {rank2 ? (
                        <img src={rank2.image_url} alt={rank2.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">TBA</div>
                      )}
                    </div>
                  )}
                  {rank2?.artwork_id ? (
                    <Link href={`/artworks/${rank2.artwork_id}`} className="w-full truncate text-center text-[10px] font-medium text-slate-100 transition hover:text-champagne-200">
                      {rank2.title}
                    </Link>
                  ) : (
                    <p className="w-full truncate text-center text-[10px] font-medium text-slate-100">
                      {rank2 ? rank2.title : "Slot #2"}
                    </p>
                  )}
                  {rank2?.artist_username ? (
                    <Link href={`/creators/${rank2.artist_username}`} className="w-full truncate text-center text-[9px] text-zinc-500 transition hover:text-slate-200">
                      {rank2.artist_name}
                    </Link>
                  ) : (
                    <p className="w-full truncate text-center text-[9px] text-zinc-500">
                      {rank2 ? rank2.artist_name : "Menunggu Curator"}
                    </p>
                  )}
                  <div className="mt-2 flex h-24 w-full flex-col items-center justify-center rounded-t-xl border-x border-t border-slate-300/35 bg-gradient-to-t from-zinc-900 to-slate-200/20 shadow-[inset_0_1px_0_rgba(226,232,240,0.3)]">
                    <span className="font-display text-xl font-semibold text-slate-100 drop-shadow-[0_0_8px_rgba(226,232,240,0.5)]">#2</span>
                    <span className="text-[8px] uppercase tracking-widest text-slate-300 font-medium">Silver</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {challenges.length > 0 && (
            <section id="challenges" className="mt-14">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="eyebrow">COMMUNITY EVENTS</p>
                  <h2 className="font-display mt-1.5 text-3xl text-white">
                    Active Challenges<span className="text-champagne-400">.</span>
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {challenges.map((ch) => (
                  <div key={ch.id}>
                    <Link
                      href={`/challenges/${ch.id}`}
                      className="card-lux spotlight glass group relative block overflow-hidden rounded-2xl border border-white/15 p-6 transition hover:border-champagne-300/45"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[9px] uppercase tracking-widest text-emerald-300">
                            <span className="live-dot text-emerald-400" />
                            Ongoing Event
                          </span>
                          <h3 className="font-display mt-3 text-2xl text-white transition group-hover:text-champagne-100">{ch.title}</h3>
                          <p className="mt-1 text-xs text-zinc-400">{ch.description}</p>
                          <p className="mt-3 text-[10px] text-zinc-500">
                            Curator: {ch.curator_name} &bull; Hadiah: {ch.prize}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">THE CREATIVE UNIVERSE</p>
                <h2 className="font-display text-3xl text-white sm:text-4xl">
                  Discover artworks<span className="text-champagne-400">.</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {filteredArtworks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowExhibition(true)}
                    className="rounded-full border border-champagne-300/40 bg-champagne-400/10 px-4 py-2 text-[9px] font-medium tracking-[0.16em] text-champagne-100 transition hover:border-champagne-200 hover:bg-champagne-200 hover:text-black"
                  >
                    ✨ MODE PAMERAN
                  </button>
                )}

                {isMember && (
                  <button
                    type="button"
                    onClick={() => setFollowingOnly(!followingOnly)}
                    className={`rounded-full border px-4 py-2 text-[9px] tracking-[0.14em] transition ${
                      followingOnly
                        ? "chip-active"
                        : "border-white/[0.08] bg-white/[0.025] text-zinc-400 hover:border-champagne-300/40 hover:text-champagne-50"
                    }`}
                  >
                    {followingOnly ? "✓ FOLLOWING" : "FOLLOWING"}
                  </button>
                )}

                <div className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.025] p-1">
                  <button
                    type="button"
                    onClick={() => setSortBy("popular")}
                    className={`rounded-full px-3.5 py-1.5 text-[9px] tracking-[0.14em] transition ${
                      sortBy === "popular" ? "chip-active" : "text-zinc-400 hover:text-champagne-50"
                    }`}
                  >
                    POPULER
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("latest")}
                    className={`rounded-full px-3.5 py-1.5 text-[9px] tracking-[0.14em] transition ${
                      sortBy === "latest" ? "chip-active" : "text-zinc-400 hover:text-champagne-50"
                    }`}
                  >
                    TERBARU
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setSortBy("popular");
                    setFollowingOnly(false);
                    setSearch("");
                  }}
                  className="text-[9px] tracking-[0.15em] text-zinc-500 transition hover:text-champagne-200"
                >
                  RESET FILTER ↺
                </button>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-[320px] lg:shrink-0">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter karya, kreator, atau #tag..."
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

              <div className="flex gap-2 overflow-x-auto pb-1">
                {["All", ...categories.map((c) => c.name)].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`shrink-0 rounded-full border px-5 py-2.5 text-[9px] tracking-[0.12em] transition-all duration-300 ${
                      activeCategory === category
                        ? "chip-active"
                        : "border-white/[0.08] text-zinc-500 hover:border-champagne-300/40 hover:text-champagne-50"
                    }`}
                  >
                    {category.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredArtworks.slice(0, 12).map((art) => {
                return (
                  <article key={art.id} className="group relative min-w-0">
                    <div className="card-lux spotlight relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-900">
                      <Link href={`/artworks/${art.id}`} className="block h-full w-full">
                        <img
                          src={art.image_url}
                          alt={art.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-80" />

                        <div className="absolute left-3 top-3">
                          <span className="rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-[8px] tracking-wider text-white">
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

                        <span className="absolute bottom-4 right-4 translate-y-3 rounded-full bg-black/80 px-3 py-1.5 text-[9px] tracking-[0.2em] text-champagne-100 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          LIHAT ↗
                        </span>
                      </Link>

                      {(isMember || isGuest) && (
                        <button
                          type="button"
                          onClick={() => handleFavorite(art.id)}
                          title={isGuest ? "Masuk sebagai Member untuk menyimpan karya" : art.is_favorited ? "Hapus dari Favorites" : "Simpan ke Favorites"}
                          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs transition ${
                            isMember && art.is_favorited
                              ? "border-champagne-300 bg-gradient-to-br from-champagne-100 to-champagne-400 font-bold text-black shadow-[0_0_20px_rgba(212,175,106,0.5)]"
                              : "border-white/20 bg-black/75 text-white hover:border-champagne-300/60 hover:bg-champagne-200 hover:text-black"
                          }`}
                        >
                          <NavIcon name="favorites" filled={Boolean(isMember && art.is_favorited)} className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Link href={`/creators/${art.artist_username}`} className="min-w-0 transition hover:opacity-80">
                        <h3 className="truncate text-xs font-medium text-zinc-200 hover:text-champagne-200">{art.artist_name}</h3>
                        <p className="text-[10px] text-zinc-500">@{art.artist_username}</p>
                      </Link>

                      {isMember ? (
                        <ReactionPicker
                          userReaction={art.user_reaction}
                          totalReactions={art.total_reactions}
                          onReact={(type) => handleReaction(art.id, type)}
                        />
                      ) : isGuest ? (
                        <button
                          type="button"
                          onClick={() => handleReaction(art.id, "love")}
                          title="Masuk sebagai Member untuk memberi reaksi"
                          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400 transition hover:border-white/30 hover:text-white"
                        >
                          <span>♥</span>
                          <span>{art.total_reactions}</span>
                        </button>
                      ) : (
                        <div title={`Mode baca saja (${role})`} className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1 text-[11px] text-zinc-500">
                          <span>♥</span>
                          <span>{art.total_reactions}</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {filteredArtworks.length > 0 && (
              <div className="mt-10 flex flex-col items-center justify-center gap-3.5 border-t border-white/[0.06] pt-8 text-center">
                <p className="text-[11px] text-zinc-500">
                  {filteredArtworks.length > 12
                    ? `Menampilkan 12 dari ${filteredArtworks.length} karya pilihan di halaman utama.`
                    : `Menampilkan ${filteredArtworks.length} karya. Ingin menyaring berdasarkan tag atau kreator?`}
                </p>
                <Link
                  href="/explore"
                  className={`${filteredArtworks.length > 12 ? "btn-gold" : "btn-ghost"} rounded-full px-7 py-3 text-[10px] uppercase tracking-[0.22em]`}
                >
                  Jelajahi Karya Lainnya &rarr;
                </Link>
              </div>
            )}

            {filteredArtworks.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-2xl text-zinc-600">⌕</p>
                <p className="mt-3 text-sm text-zinc-400">No artworks found.</p>
                <p className="mt-1 text-[10px] text-zinc-600">Try another keyword, category, or upload your first artwork.</p>
              </div>
            )}
          </section>

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span className="font-display text-sm italic normal-case tracking-normal text-zinc-500">Where art meets expression.</span>
            <span>MADE FOR CREATORS.</span>
          </footer>
        </div>
      </div>

      {showExhibition && filteredArtworks.length > 0 && (
        <ExhibitionMode
          artworks={filteredArtworks}
          onClose={() => setShowExhibition(false)}
        />
      )}
    </main>
  );
}