"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import ExhibitionMode from "@/components/ui/exhibition-mode";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { reactArtworkAction, toggleFavoriteAction } from "@/actions/artwork-actions";

const REACTIONS = [
  { type: "love", icon: "❤️", label: "Love" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "fire", icon: "🔥", label: "Fire" },
  { type: "inspire", icon: "✨", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

export default function ExploreClient({ currentUser, artworks, categories, creators }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTag, setActiveTag] = useState("");
  const [activeCreator, setActiveCreator] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const [authNotice, setAuthNotice] = useState("");
  const [showExhibition, setShowExhibition] = useState(false);

  const role = currentUser?.role || "Guest";
  const isGuest = !currentUser;
  const isMember = role === "Member";

  // Kumpulkan tag populer dari semua karya
  const trendingTags = useMemo(() => {
    const counts = new Map();
    artworks.forEach((art) => {
      (art.tags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  }, [artworks]);

  const filteredArtworks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = artworks.filter((art) => {
      const matchesCategory = activeCategory === "All" || art.category_name === activeCategory;
      const matchesTag = !activeTag || (art.tags || []).includes(activeTag);
      const matchesCreator = !activeCreator || art.artist_username === activeCreator;
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.artist_name.toLowerCase().includes(q) ||
        (art.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesTag && matchesCreator && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return (b.total_reactions || 0) - (a.total_reactions || 0) || new Date(b.created_at) - new Date(a.created_at);
    });
  }, [artworks, activeCategory, activeTag, activeCreator, search, sortBy]);

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

  const resetFilters = () => {
    setActiveCategory("All");
    setActiveTag("");
    setActiveCreator("");
    setSortBy("popular");
    setSearch("");
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      <AppSidebar
        currentUser={currentUser}
        activeItem="explore"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileMenu={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
      />

      {/* MAIN CONTENT */}
      <div className={`relative z-10 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[78px]" : "lg:ml-[250px]"}`}>
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/60 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              DISCOVER / <span className="text-champagne-200">EXPLORE</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <img src="/images/aesthe-logo.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-xs tracking-[0.25em]">AESTHE</span>
            </div>
          </div>

          <div className="relative mx-4 hidden max-w-[380px] flex-1 md:block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artworks, creators, or #tags..."
              className="input-lux rounded-full py-2.5 pl-11 pr-5 text-[11px]"
            />
          </div>

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
        </header>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {authNotice && (
            <div className="glass mb-6 flex items-center justify-between rounded-xl border border-champagne-300/25 px-5 py-3 text-xs text-zinc-200">
              <span>{authNotice}</span>
              <Link href="/" className="btn-gold rounded-full px-4 py-1 text-[10px] uppercase tracking-wider">
                Login Sekarang
              </Link>
            </div>
          )}

          {/* EXPLORE HERO HEADER */}
          <section data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="eyebrow">CURATED DISCOVERY</p>
                <span className="rounded-full border border-champagne-300/25 bg-champagne-400/10 px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-champagne-200">
                  {role}
                </span>
              </div>
              <h1 className="font-display text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                Explore <span className="italic text-gold">Universe</span><span className="text-champagne-400">.</span>
              </h1>
              <p className="mt-3 max-w-xl text-[11px] text-zinc-400 sm:text-xs">
                Jelajahi karya visual terbaik berdasarkan kategori, tag populer, dan kreator pilihan komunitas Aesthe.
              </p>
            </div>

            {/* Mobile Search */}
            <div className="relative w-full md:hidden">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search artworks, creators, tags..."
                className="input-lux rounded-full py-2.5 pl-11 pr-5 text-[11px]"
              />
            </div>
          </section>

          {/* SECTION 1: KATEGORI SPOTLIGHT */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">BROWSE BY CATEGORY</p>
              <span className="text-[10px] text-zinc-500">{categories.length} Categories</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className={`spotlight rounded-2xl border p-4 text-left transition duration-300 ${
                  activeCategory === "All"
                    ? "chip-active"
                    : "glass border-white/15 text-zinc-200 hover:border-champagne-300/45"
                }`}
              >
                <p className="text-xs font-medium">All Works</p>
                <p className={`mt-1 text-[10px] ${activeCategory === "All" ? "text-zinc-800" : "text-zinc-500"}`}>
                  {artworks.length} karya
                </p>
              </button>

              {categories.map((cat) => {
                const isSelected = activeCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.name)}
                    className={`spotlight rounded-2xl border p-4 text-left transition duration-300 ${
                      isSelected
                        ? "chip-active"
                        : "glass border-white/15 text-zinc-200 hover:border-champagne-300/45"
                    }`}
                  >
                    <p className="truncate text-xs font-medium">{cat.name}</p>
                    <p className={`mt-1 text-[10px] ${isSelected ? "text-zinc-800" : "text-zinc-500"}`}>
                      {cat.artwork_count} karya
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: TRENDING TAGS */}
          {trendingTags.length > 0 && (
            <section className="mt-9">
              <p className="eyebrow mb-3">TRENDING TAGS</p>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(({ tag, count }) => {
                  const isSelected = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(isSelected ? "" : tag)}
                      className={`rounded-full border px-3.5 py-1.5 text-[10px] transition ${
                        isSelected
                          ? "chip-active"
                          : "border-white/10 bg-white/[0.025] text-zinc-400 hover:border-champagne-300/40 hover:text-champagne-100"
                      }`}
                    >
                      #{tag} <span className="ml-1 opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 3: CREATORS SPOTLIGHT */}
          {creators.length > 0 && (
            <section className="mt-10">
              <p className="eyebrow mb-4">CREATORS SPOTLIGHT</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {creators.map((creator) => {
                  const isSelected = activeCreator === creator.username;
                  return (
                    <button
                      key={creator.id}
                      type="button"
                      onClick={() => setActiveCreator(isSelected ? "" : creator.username)}
                      className={`spotlight flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-300 ${
                        isSelected
                          ? "border-champagne-300/60 bg-champagne-400/15 text-white shadow-[0_0_25px_-8px_rgba(212,175,106,0.45)]"
                          : "glass border-white/15 text-zinc-300 hover:border-champagne-300/40"
                      }`}
                    >
                      <div className="rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                          {creator.display_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{creator.display_name}</p>
                        <p className="text-[10px] text-zinc-500">
                          @{creator.username} &bull; {creator.artwork_count} karya
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 4: EXPLORE GALLERY */}
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-1.5">GALLERY RESULTS</p>
                <h2 className="font-display text-3xl text-white">
                  {activeCategory === "All" ? "All Artworks" : activeCategory}
                  {activeTag ? ` · #${activeTag}` : ""}
                  {activeCreator ? ` · @${activeCreator}` : ""}
                  <span className="ml-2 font-sans text-sm text-champagne-300/80">({filteredArtworks.length})</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {filteredArtworks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowExhibition(true)}
                    className="rounded-full border border-champagne-300/40 bg-champagne-400/10 px-4 py-2 text-[9px] font-medium tracking-[0.16em] text-champagne-100 transition hover:border-champagne-200 hover:bg-champagne-200 hover:text-black"
                  >
                    ✧ MODE PAMERAN
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

                <button type="button" onClick={resetFilters} className="text-[9px] tracking-[0.15em] text-zinc-500 transition hover:text-champagne-200">
                  RESET FILTER ↺
                </button>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredArtworks.map((art) => {
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
                      <Link href={`/creators/${art.artist_username}`} className="min-w-0 transition hover:opacity-80">
                        <h3 className="truncate text-xs font-medium text-zinc-200 hover:text-champagne-200">{art.artist_name}</h3>
                        <p className="text-[10px] text-zinc-500">@{art.artist_username}</p>
                      </Link>

                      {isMember ? (
                        <div className="group/react relative flex items-center">
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
                                ? "border-rose-500/50 bg-rose-500/15 text-rose-300 font-medium"
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

            {filteredArtworks.length === 0 && (
              <div className="glass mt-6 rounded-2xl border border-white/10 py-20 text-center">
                <p className="text-2xl text-zinc-600">⌕</p>
                <p className="mt-3 text-sm text-zinc-400">Tidak ada karya yang cocok dengan filter.</p>
                <button type="button" onClick={resetFilters} className="mt-3 text-xs text-champagne-200 underline hover:text-white">
                  Reset semua filter
                </button>
              </div>
            )}
          </section>

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span className="font-display text-sm italic normal-case tracking-normal text-zinc-500">Explore the creative universe.</span>
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
