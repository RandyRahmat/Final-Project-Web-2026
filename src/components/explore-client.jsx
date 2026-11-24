"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
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
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-zinc-100">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 left-1/3 h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-[140px]" />
        <div className="absolute right-0 top-[50%] h-[400px] w-[400px] rounded-full bg-zinc-500/[0.035] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
      </div>

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
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/75 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              DISCOVER / <span className="text-zinc-300">EXPLORE</span>
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

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {authNotice && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-xs text-zinc-200">
              <span>{authNotice}</span>
              <Link href="/" className="rounded-full bg-white px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                Login Sekarang
              </Link>
            </div>
          )}

          {/* EXPLORE HERO HEADER */}
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="text-[9px] tracking-[0.35em] text-zinc-500">CURATED DISCOVERY</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  {role}
                </span>
              </div>
              <h1 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl">
                Explore Universe<span className="text-zinc-500">.</span>
              </h1>
              <p className="mt-3 max-w-xl text-[11px] text-zinc-500 sm:text-xs">
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
                className="w-full rounded-full border border-white/[0.08] bg-white/[0.025] py-2.5 pl-11 pr-5 text-[11px] text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30"
              />
            </div>
          </section>

          {/* SECTION 1: KATEGORI SPOTLIGHT */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[9px] tracking-[0.3em] text-zinc-500">BROWSE BY CATEGORY</p>
              <span className="text-[10px] text-zinc-600">{categories.length} Categories</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <button
                type="button"
                onClick={() => setActiveCategory("All")}
                className={`rounded-xl border p-4 text-left transition ${
                  activeCategory === "All"
                    ? "border-white bg-white text-black"
                    : "border-white/[0.08] bg-white/[0.025] text-zinc-300 hover:border-white/25"
                }`}
              >
                <p className="text-xs font-medium">All Works</p>
                <p className={`mt-1 text-[10px] ${activeCategory === "All" ? "text-zinc-700" : "text-zinc-500"}`}>
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
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-white bg-white text-black"
                        : "border-white/[0.08] bg-white/[0.025] text-zinc-300 hover:border-white/25"
                    }`}
                  >
                    <p className="truncate text-xs font-medium">{cat.name}</p>
                    <p className={`mt-1 text-[10px] ${isSelected ? "text-zinc-700" : "text-zinc-500"}`}>
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
              <p className="mb-3 text-[9px] tracking-[0.3em] text-zinc-500">TRENDING TAGS</p>
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
                          ? "border-white bg-white text-black font-medium"
                          : "border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/30 hover:text-white"
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
              <p className="mb-4 text-[9px] tracking-[0.3em] text-zinc-500">CREATORS SPOTLIGHT</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {creators.map((creator) => {
                  const isSelected = activeCreator === creator.username;
                  return (
                    <button
                      key={creator.id}
                      type="button"
                      onClick={() => setActiveCreator(isSelected ? "" : creator.username)}
                      className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-white bg-white/10 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:border-white/25"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-zinc-800 text-xs font-semibold text-white">
                        {creator.display_name.charAt(0).toUpperCase()}
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
                <p className="mb-1 text-[9px] tracking-[0.3em] text-zinc-600">GALLERY RESULTS</p>
                <h2 className="text-xl font-light tracking-tight">
                  {activeCategory === "All" ? "All Artworks" : activeCategory}
                  {activeTag ? ` · #${activeTag}` : ""}
                  {activeCreator ? ` · @${activeCreator}` : ""}
                  <span className="ml-2 text-sm text-zinc-500">({filteredArtworks.length})</span>
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.025] p-1">
                  <button
                    type="button"
                    onClick={() => setSortBy("popular")}
                    className={`rounded-full px-3.5 py-1.5 text-[9px] tracking-[0.14em] transition ${
                      sortBy === "popular" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    POPULER
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy("latest")}
                    className={`rounded-full px-3.5 py-1.5 text-[9px] tracking-[0.14em] transition ${
                      sortBy === "latest" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    TERBARU
                  </button>
                </div>

                <button type="button" onClick={resetFilters} className="text-[9px] tracking-[0.15em] text-zinc-500 transition hover:text-white">
                  RESET FILTER ↺
                </button>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredArtworks.map((art) => {
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
                              ? "border-amber-400 bg-amber-400 text-black font-bold"
                              : "border-white/20 bg-black/50 text-white hover:bg-white hover:text-black"
                          }`}
                        >
                          ⚑
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Link href={`/creators/${art.artist_username}`} className="min-w-0 transition hover:opacity-80">
                        <h3 className="truncate text-xs font-medium text-zinc-200 hover:underline">{art.artist_name}</h3>
                        <p className="text-[10px] text-zinc-500">@{art.artist_username}</p>
                      </Link>

                      {isMember ? (
                        <div className="group/react relative flex items-center">
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
              <div className="py-20 text-center">
                <p className="text-2xl text-zinc-600">⌕</p>
                <p className="mt-3 text-sm text-zinc-400">Tidak ada karya yang cocok dengan filter.</p>
                <button type="button" onClick={resetFilters} className="mt-3 text-xs text-zinc-300 underline hover:text-white">
                  Reset semua filter
                </button>
              </div>
            )}
          </section>

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span>EXPLORE UNIVERSE.</span>
            <span>MADE FOR CREATORS.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
