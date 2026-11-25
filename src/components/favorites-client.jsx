"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { reactArtworkAction, toggleFavoriteAction } from "@/actions/artwork-actions";
import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  toggleArtworkInCollectionAction,
} from "@/actions/collection-actions";

const REACTIONS = [
  { type: "love", icon: "❤️", label: "Love" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "fire", icon: "🔥", label: "Fire" },
  { type: "inspire", icon: "✧", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

export default function FavoritesClient({ currentUser, artworks, collections = [], categories }) {
  const [activeCollectionId, setActiveCollectionId] = useState("all");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("saved");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();

  // Modal states untuk Moodboards
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [assigningArtwork, setAssigningArtwork] = useState(null);
  const [togglingKey, setTogglingKey] = useState("");
  const [deletingColId, setDeletingColId] = useState(null);

  const [createState, createFormAction, isCreating] = useActionState(async (prevState, formData) => {
    const res = await createCollectionAction(prevState, formData);
    if (res?.success) {
      setShowCreateModal(false);
    }
    return res;
  }, null);

  const [editState, editFormAction, isEditing] = useActionState(async (prevState, formData) => {
    const res = await updateCollectionAction(prevState, formData);
    if (res?.success) {
      setEditingCollection(null);
    }
    return res;
  }, null);

  const selectedCollection = useMemo(
    () => (activeCollectionId === "all" ? null : collections.find((c) => Number(c.id) === Number(activeCollectionId)) || null),
    [collections, activeCollectionId]
  );

  // Sinkronkan referensi artwork yang sedang dibuka di modal checklist setelah revalidate
  const liveAssigningArtwork = useMemo(
    () => (assigningArtwork ? artworks.find((a) => a.id === assigningArtwork.id) || null : null),
    [artworks, assigningArtwork]
  );

  const filteredArtworks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = artworks.filter((art) => {
      const inCollection =
        activeCollectionId === "all" ||
        (art.collection_ids || []).map(Number).includes(Number(activeCollectionId));
      const matchesCategory = activeCategory === "All" || art.category_name === activeCategory;
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.artist_name.toLowerCase().includes(q) ||
        (art.tags || []).some((t) => t.toLowerCase().includes(q));
      return inCollection && matchesCategory && matchesSearch;
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
  }, [artworks, activeCollectionId, activeCategory, search, sortBy]);

  const handleReaction = async (artworkId, reactionType = "love") => {
    await reactArtworkAction(artworkId, reactionType);
  };

  const handleRemoveFavorite = async (artworkId) => {
    await toggleFavoriteAction(artworkId);
  };

  const handleDeleteCollection = async (col) => {
    if (!window.confirm(`Hapus moodboard "${col.name}"? Karya favorit di dalamnya tidak akan ikut terhapus.`)) return;
    setDeletingColId(col.id);
    await deleteCollectionAction(col.id);
    setDeletingColId(null);
    if (Number(activeCollectionId) === Number(col.id)) {
      setActiveCollectionId("all");
    }
  };

  const handleToggleArtworkInCollection = async (collectionId, artworkId) => {
    const key = `${collectionId}-${artworkId}`;
    setTogglingKey(key);
    await toggleArtworkInCollectionAction(collectionId, artworkId);
    setTogglingKey("");
  };

  const getReactionDisplay = (type) => {
    return REACTIONS.find((r) => r.type === type) || REACTIONS[0];
  };

  const allCovers = artworks.slice(0, 3).map((a) => a.image_url);

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
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
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/60 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              PERSONAL / <span className="text-champagne-200">FAVORITES &amp; MOODBOARDS</span>
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
              className="input-lux rounded-full py-2.5 pl-11 pr-5 text-[11px]"
            />
          </div>

          <Link href="/profile" className="flex items-center gap-3 transition hover:opacity-85">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-medium">{currentUser.displayName}</p>
              <p className="mt-0.5 text-[9px] text-zinc-600">MEMBER ACCOUNT</p>
            </div>
            <div className="rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-medium uppercase">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" />
                ) : (
                  currentUser.displayName.charAt(0)
                )}
              </div>
            </div>
          </Link>
        </header>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {/* HEADER FAVORITES */}
          <section data-reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="eyebrow">PERSONAL COLLECTIONS</p>
                <span className="rounded-full border border-champagne-300/30 bg-champagne-400/10 px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-champagne-200">
                  {artworks.length} SAVED &bull; {collections.length} MOODBOARDS
                </span>
              </div>
              <h1 className="font-display text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                Favorites &amp; <span className="italic text-gold">Moodboards</span><span className="text-champagne-400">.</span>
              </h1>
              <p className="mt-3 text-[11px] text-zinc-400 sm:text-xs">
                Kelompokkan karya favoritmu ke dalam folder moodboard bertema untuk referensi kreatifmu.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn-gold rounded-full px-5 py-2.5 text-[10px] uppercase tracking-[0.18em]"
              >
                ＋ Buat Moodboard
              </button>
              <Link href="/explore" className="btn-ghost rounded-full px-5 py-2.5 text-[10px] uppercase tracking-[0.18em]">
                Jelajahi Karya &rarr;
              </Link>
            </div>
          </section>

          {/* SECTION MOODBOARDS / COLLECTIONS (PINTEREST / BEHANCE STYLE) */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <p className="eyebrow">MY MOODBOARDS</p>
              {selectedCollection && (
                <button
                  type="button"
                  onClick={() => setActiveCollectionId("all")}
                  className="text-[10px] text-zinc-400 transition hover:text-champagne-200"
                >
                  &larr; Kembali ke Semua Favorites
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* KARTU SEMUA FAVORITES */}
              <button
                type="button"
                onClick={() => setActiveCollectionId("all")}
                className={`card-lux spotlight glass group overflow-hidden rounded-2xl border text-left transition ${
                  activeCollectionId === "all"
                    ? "border-champagne-300/60 bg-champagne-400/[0.12] shadow-[0_0_30px_-10px_rgba(212,175,106,0.45)]"
                    : "border-white/15 hover:border-champagne-300/45"
                }`}
              >
                <div className="grid h-28 grid-cols-3 gap-0.5 bg-zinc-950">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="overflow-hidden bg-zinc-900">
                      {allCovers[idx] ? (
                        <img src={allCovers[idx]} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-700">⚑</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display truncate text-lg text-white">Semua Favorites</p>
                    <span className="rounded-full bg-champagne-400/15 px-2 py-0.5 text-[9px] text-champagne-200">
                      {artworks.length}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[10px] text-zinc-500">Seluruh karya yang kamu simpan</p>
                </div>
              </button>

              {/* KARTU MOODBOARD KUSTOM */}
              {collections.map((col) => {
                const isSelected = Number(activeCollectionId) === Number(col.id);
                const covers = col.cover_images || [];
                return (
                  <div
                    key={col.id}
                    className={`card-lux spotlight glass group flex flex-col overflow-hidden rounded-2xl border transition ${
                      isSelected
                        ? "border-amber-400/70 bg-amber-500/[0.12] shadow-[0_0_30px_-10px_rgba(245,158,11,0.45)]"
                        : "border-white/15 hover:border-champagne-300/45"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveCollectionId(col.id)}
                      className="text-left"
                    >
                      <div className="grid h-28 grid-cols-3 gap-0.5 bg-zinc-950">
                        {[0, 1, 2].map((idx) => (
                          <div key={idx} className="overflow-hidden bg-zinc-900">
                            {covers[idx] ? (
                              <img src={covers[idx]} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-700">◈</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="px-4 pt-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display truncate text-lg text-white">{col.name}</p>
                          <span className="shrink-0 rounded-full bg-champagne-400/15 px-2 py-0.5 text-[9px] text-champagne-200">
                            {col.item_count}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[10px] text-zinc-500">
                          {col.description || "Moodboard inspirasi pribadi"}
                        </p>
                      </div>
                    </button>

                    <div className="mt-auto flex items-center justify-end gap-2 px-4 pb-3 pt-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingCollection(col)}
                        className="text-[10px] text-zinc-500 transition hover:text-champagne-200"
                      >
                        Edit
                      </button>
                      <span className="text-zinc-700">·</span>
                      <button
                        type="button"
                        disabled={deletingColId === col.id}
                        onClick={() => handleDeleteCollection(col)}
                        className="text-[10px] text-zinc-500 transition hover:text-red-400 disabled:opacity-50"
                      >
                        {deletingColId === col.id ? "..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* KARTU TAMBAH MOODBOARD CEPAT */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex min-h-[175px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.015] p-5 text-center transition hover:border-champagne-300/50 hover:bg-champagne-400/[0.05]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-champagne-300/30 bg-champagne-400/10 text-lg text-champagne-200">
                  ＋
                </span>
                <p className="font-display mt-3 text-lg text-zinc-100">Moodboard Baru</p>
                <p className="mt-1 text-[10px] text-zinc-500">Buat folder koleksi bertema</p>
              </button>
            </div>
          </section>

          {/* FILTER & GALERI KARYA FAVORIT */}
          {artworks.length > 0 && (
            <section className="mt-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">ACTIVE BOARD</p>
                  <h2 className="font-display mt-1.5 text-3xl text-white">
                    {selectedCollection ? selectedCollection.name : "Semua Karya Favorit"}
                    <span className="ml-2 font-sans text-sm text-champagne-300/80">({filteredArtworks.length})</span>
                  </h2>
                  {selectedCollection?.description && (
                    <p className="mt-1 text-xs text-zinc-400">{selectedCollection.description}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {["All", ...categories.map((c) => c.name)].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-[9px] tracking-[0.12em] transition-all duration-300 ${
                        activeCategory === category
                          ? "chip-active"
                          : "border-white/10 text-zinc-500 hover:border-champagne-300/40 hover:text-champagne-50"
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
                      sortBy === "saved" ? "chip-active" : "text-zinc-400 hover:text-champagne-50"
                    }`}
                  >
                    BARU DISIMPAN
                  </button>
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
              </div>

              {/* GRID KARYA FAVORIT */}
              <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredArtworks.map((art) => {
                  const userReaction = art.user_reaction ? getReactionDisplay(art.user_reaction) : null;
                  const boardCount = (art.collection_ids || []).length;

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

                        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAssigningArtwork(art)}
                            title="Masukkan ke Moodboard"
                            className={`flex h-8 items-center gap-1 rounded-full border px-2.5 text-[10px] backdrop-blur-md transition ${
                              boardCount > 0
                                ? "border-champagne-300/60 bg-black/70 font-medium text-champagne-100 hover:bg-champagne-200 hover:text-black"
                                : "border-white/20 bg-black/55 text-zinc-200 hover:border-champagne-300/60 hover:bg-champagne-200 hover:text-black"
                            }`}
                          >
                            <span>▤</span>
                            <span>{boardCount > 0 ? boardCount : "+ Board"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(art.id)}
                            title="Hapus dari Favorites"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-champagne-300 bg-gradient-to-br from-champagne-100 to-champagne-400 text-xs font-bold text-black shadow-[0_0_18px_rgba(212,175,106,0.45)] backdrop-blur-md transition hover:border-red-400 hover:from-red-500 hover:to-red-600 hover:text-white"
                          >
                            ⚑
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Link href={`/creators/${art.artist_username}`} className="min-w-0 transition hover:opacity-80">
                          <h3 className="truncate text-xs font-medium text-zinc-200 hover:text-champagne-200">{art.artist_name}</h3>
                          <p className="text-[10px] text-zinc-500">@{art.artist_username}</p>
                        </Link>

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
                      </div>
                    </article>
                  );
                })}
              </div>

              {filteredArtworks.length === 0 && (
                <div className="glass mt-6 rounded-2xl border border-white/10 py-20 text-center">
                  <p className="text-2xl text-zinc-600">▤</p>
                  <p className="mt-3 text-sm text-zinc-400">
                    {selectedCollection
                      ? `Moodboard "${selectedCollection.name}" masih kosong.`
                      : "Tidak ada karya favorit yang cocok dengan pencarian."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCollectionId("all");
                      setActiveCategory("All");
                      setSearch("");
                    }}
                    className="mt-3 text-xs text-champagne-200 underline hover:text-white"
                  >
                    Tampilkan semua Favorites
                  </button>
                </div>
              )}
            </section>
          )}

          {/* EMPTY STATE BELUM ADA FAVORITES */}
          {artworks.length === 0 && (
            <section className="glass mt-16 flex flex-col items-center justify-center rounded-3xl border border-white/15 px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-champagne-300/30 bg-champagne-400/10 text-xl text-champagne-200">
                ⚑
              </div>
              <h2 className="font-display mt-5 text-3xl text-white">Belum ada karya favorit tersimpan</h2>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-400">
                Tekan ikon bendera (⚑) pada karya yang kamu sukai di halaman Home atau Explore, lalu kelompokkan ke dalam Moodboard pribadimu.
              </p>
              <Link href="/explore" className="btn-gold mt-6 rounded-full px-6 py-2.5 text-[10px] uppercase tracking-[0.2em]">
                Mulai Jelajahi
              </Link>
            </section>
          )}

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span className="font-display text-sm italic normal-case tracking-normal text-zinc-500">Curate your visual moodboards.</span>
            <span>MADE FOR CREATORS.</span>
          </footer>
        </div>
      </div>

      {/* MODAL BUAT MOODBOARD BARU */}
      {showCreateModal && (
        <div onClick={() => setShowCreateModal(false)} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel w-full max-w-md rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">NEW MOODBOARD</p>
                <h2 className="font-display mt-1.5 text-3xl text-white">Buat Moodboard Baru</h2>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-xl text-zinc-500 hover:text-white">×</button>
            </div>

            {createState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {createState.error}
              </div>
            )}

            <form action={createFormAction} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Nama Moodboard</label>
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={100}
                  placeholder="Contoh: Inspirasi Desain Karakter"
                  className="input-lux"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi Singkat (Opsional)</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Kumpulan referensi palet warna, komposisi, dan pencahayaan..."
                  className="input-lux"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="btn-gold w-full rounded-xl py-3 text-[10px] uppercase tracking-[0.2em]"
              >
                {isCreating ? "Membuat..." : "Simpan Moodboard"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT MOODBOARD */}
      {editingCollection && (
        <div onClick={() => setEditingCollection(null)} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel w-full max-w-md rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">EDIT MOODBOARD</p>
                <h2 className="font-display mt-1.5 text-3xl text-white">Perbarui Moodboard</h2>
              </div>
              <button type="button" onClick={() => setEditingCollection(null)} className="text-xl text-zinc-500 hover:text-white">×</button>
            </div>

            {editState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {editState.error}
              </div>
            )}

            <form action={editFormAction} className="mt-5 space-y-4">
              <input type="hidden" name="collectionId" value={editingCollection.id} />

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Nama Moodboard</label>
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={editingCollection.name}
                  className="input-lux"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi Singkat</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingCollection.description || ""}
                  className="input-lux"
                />
              </div>

              <button
                type="submit"
                disabled={isEditing}
                className="btn-gold w-full rounded-xl py-3 text-[10px] uppercase tracking-[0.2em]"
              >
                {isEditing ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHECKLIST MASUKKAN KARYA KE MOODBOARD */}
      {liveAssigningArtwork && (
        <div onClick={() => setAssigningArtwork(null)} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel w-full max-w-md rounded-3xl p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">SAVE TO MOODBOARD</p>
                <h2 className="font-display mt-1.5 text-2xl text-white">{liveAssigningArtwork.title}</h2>
              </div>
              <button type="button" onClick={() => setAssigningArtwork(null)} className="text-xl text-zinc-500 hover:text-white">×</button>
            </div>

            {collections.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
                <p className="text-xs text-zinc-400">Kamu belum punya moodboard.</p>
                <button
                  type="button"
                  onClick={() => {
                    setAssigningArtwork(null);
                    setShowCreateModal(true);
                  }}
                  className="btn-gold mt-4 rounded-full px-5 py-2 text-[10px] uppercase tracking-wider"
                >
                  ＋ Buat Moodboard Pertama
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                <p className="mb-3 text-xs text-zinc-400">Centang moodboard untuk mengelompokkan karya ini:</p>
                {collections.map((col) => {
                  const isIn = (liveAssigningArtwork.collection_ids || []).map(Number).includes(Number(col.id));
                  const busy = togglingKey === `${col.id}-${liveAssigningArtwork.id}`;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      disabled={busy}
                      onClick={() => handleToggleArtworkInCollection(col.id, liveAssigningArtwork.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition disabled:opacity-50 ${
                        isIn
                          ? "border-champagne-300/60 bg-champagne-400/15 text-champagne-100"
                          : "border-white/10 bg-black/40 text-zinc-300 hover:border-champagne-300/40 hover:text-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{col.name}</p>
                        <p className="text-[10px] text-zinc-500">{col.item_count} karya</p>
                      </div>
                      <span className="ml-3 text-sm font-bold">{busy ? "..." : isIn ? "✓" : "＋"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
