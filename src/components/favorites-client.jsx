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
  { type: "inspire", icon: "✧", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

export default function FavoritesClient({ currentUser, artworks, categories }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("saved");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();

  const filteredArtworks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = artworks.filter((art) => {
      const matchesCategory = activeCategory === "All" || art.category_name === activeCategory;
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.artist_name.toLowerCase().includes(q) ||
        (art.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "popular") {
        return (b.total_reactions || 0) - (a.total_reactions || 0);
      }
      if (sortBy === "latest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return new Date(b.favorited_at) - new Date(a.favorited_at);
    });
  }, [artworks, activeCategory, search, sortBy]);

  const handleReaction = async (artworkId, reactionType = "love") => {
    await reactArtworkAction(artworkId, reactionType);
  };

  const handleRemoveFavorite = async (artworkId) => {
    await toggleFavoriteAction(artworkId);
  };

  const getReactionDisplay = (type) => {
    return REACTIONS.find((r) => r.type === type) || REACTIONS[0];
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
        activeItem="favorites"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileMenu={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
        favoritesCount={artworks.length}
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
              PERSONAL / <span className="text-zinc-300">FAVORITES</span>
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
              placeholder="Search saved favorites..."
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.025] py-2.5 pl-11 pr-5 text-[11px] text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.05]"
            />
          </div>

          <Link href="/profile" className="flex items-center gap-3 transition hover:opacity-85">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-medium">{currentUser.displayName}</p>
              <p className="mt-0.5 text-[9px] text-zinc-600">MEMBER ACCOUNT</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-500 to-zinc-900 text-xs font-medium uppercase">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" />
              ) : (
                currentUser.displayName.charAt(0)
              )}
            </div>
          </Link>
        </header>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {/* HEADER FAVORITES */}
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="text-[9px] tracking-[0.35em] text-zinc-500">PERSONAL COLLECTION</p>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-amber-300">
                  {artworks.length} SAVED
                </span>
              </div>
              <h1 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl">
                Saved Favorites<span className="text-zinc-500">.</span>
              </h1>
              <p className="mt-3 text-[11px] text-zinc-500 sm:text-xs">
                Kumpulan karya pilihan yang telah kamu simpan sebagai inspirasi.
              </p>
            </div>

            <Link href="/explore" className="rounded-full border border-white/20 px-5 py-3 text-[9px] font-medium tracking-[0.18em] transition duration-300 hover:border-white hover:bg-white hover:text-black">
              JELAJAHI KARYA LAIN &rarr;
            </Link>
          </section>

          {/* FILTER & SORT CONTROLS */}
          {artworks.length > 0 && (
            <section className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {["All", ...categories.map((c) => c.name)].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-[9px] tracking-[0.12em] transition-all duration-300 ${
                        activeCategory === category
                          ? "border-white bg-white text-black"
                          : "border-white/[0.08] text-zinc-500 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {category.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.025] p-1">
                  <button
                    type="button"
                    onClick={() => setSortBy("saved")}
                    className={`rounded-full px-3.5 py-1.5 text-[9px] tracking-[0.14em] transition ${
                      sortBy === "saved" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    BARU DISIMPAN
                  </button>
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
              </div>

              {/* GRID KARYA FAVORIT */}
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

                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(art.id)}
                          title="Hapus dari Favorites"
                          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-amber-400 bg-amber-400 text-xs font-bold text-black backdrop-blur-md transition hover:border-red-400 hover:bg-red-500 hover:text-white"
                        >
                          ⚑
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Link href={`/creators/${art.artist_username}`} className="min-w-0 transition hover:opacity-80">
                          <h3 className="truncate text-xs font-medium text-zinc-200 hover:underline">{art.artist_name}</h3>
                          <p className="text-[10px] text-zinc-500">@{art.artist_username}</p>
                        </Link>

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
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredArtworks.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-2xl text-zinc-600">⌕</p>
                  <p className="mt-3 text-sm text-zinc-400">Tidak ada karya favorit yang cocok dengan pencarian.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("All");
                      setSearch("");
                    }}
                    className="mt-3 text-xs text-zinc-300 underline hover:text-white"
                  >
                    Reset filter
                  </button>
                </div>
              )}
            </section>
          )}

          {/* EMPTY STATE BELUM ADA FAVORITES */}
          {artworks.length === 0 && (
            <section className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-xl text-amber-300">
                ⚑
              </div>
              <h2 className="mt-5 text-lg font-light text-white">Belum ada karya favorit tersimpan</h2>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
                Tekan ikon bendera (⚑) pada karya yang kamu sukai di halaman Home atau Explore untuk menyimpannya ke koleksi pribadimu.
              </p>
              <Link href="/explore" className="mt-6 rounded-full bg-white px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200">
                Mulai Jelajahi
              </Link>
            </section>
          )}

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span>SAVED FAVORITES.</span>
            <span>MADE FOR CREATORS.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
