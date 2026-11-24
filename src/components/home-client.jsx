"use client";

import { useMemo, useState, useActionState } from "react";
import Link from "next/link";
import { logoutUserAction } from "@/actions/auth-actions";
import { reactArtworkAction, toggleFavoriteAction, createArtworkAction } from "@/actions/artwork-actions";

const REACTIONS = [
  { type: "love", icon: "❤️", label: "Love" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "fire", icon: "🔥", label: "Fire" },
  { type: "inspire", icon: "✧", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

const NAVIGATION = [
  { label: "Home", href: "/home", icon: "⌂" },
  { label: "Explore", href: "/explore", icon: "◈" },
  { label: "Favorites", href: "/favorites", icon: "⚑" },
  { label: "Challenges", href: "/challenges", icon: "✧" },
];

export default function HomeClient({ currentUser, artworks, categories, challenges, podiumWinners }) {
  const [activeNav, setActiveNav] = useState("Home");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authNotice, setAuthNotice] = useState("");

  const role = currentUser?.role || "Guest";
  const isGuest = !currentUser;
  const isMember = role === "Member";
  const isCurator = role === "Curator";
  const isAdmin = role === "Admin";
  const isCuratorApproved = isCurator && currentUser?.curatorStatus === "Approved";

  const closeUploadModal = () => {
    setShowUpload(false);
    setUploadPreview("");
  };

  const handleArtworkFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadPreview("");
      return;
    }
    setUploadPreview(URL.createObjectURL(file));
  };

  const [uploadState, uploadFormAction, isUploading] = useActionState(async (prevState, formData) => {
    const res = await createArtworkAction(prevState, formData);
    if (res?.success) {
      closeUploadModal();
    }
    return res;
  }, null);

  const visibleNavigation = useMemo(() => {
    return NAVIGATION.filter((item) => item.label !== "Favorites" || isMember);
  }, [isMember]);

  const filteredArtworks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = artworks.filter((art) => {
      if (activeNav === "Favorites" && isMember && !art.is_favorited) return false;
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
  }, [artworks, activeCategory, search, activeNav, isMember, sortBy]);

  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return challenges;
    return challenges.filter(
      (ch) =>
        ch.title.toLowerCase().includes(q) ||
        (ch.description || "").toLowerCase().includes(q) ||
        (ch.curator_name || "").toLowerCase().includes(q)
    );
  }, [challenges, search]);

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

  const rank1 = podiumWinners.find((w) => Number(w.winner_rank) === 1);
  const rank2 = podiumWinners.find((w) => Number(w.winner_rank) === 2);
  const rank3 = podiumWinners.find((w) => Number(w.winner_rank) === 3);
  const podiumMeta = podiumWinners[0] || null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 left-1/3 h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-[140px]" />
        <div className="absolute right-0 top-[50%] h-[400px] w-[400px] rounded-full bg-zinc-500/[0.035] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
      </div>

      {mobileMenu && (
        <div onClick={() => setMobileMenu(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-white/[0.07] bg-[#0b0b0c]/95 px-6 py-7 backdrop-blur-2xl transition-transform duration-500 lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/home" className="mb-12 flex items-center gap-3">
          <img src="/images/aesthe-logo.png" alt="Aesthe" className="h-9 w-9 object-contain mix-blend-screen" />
          <div>
            <h1 className="text-[17px] font-medium tracking-[0.35em]">AESTHE</h1>
            <p className="mt-0.5 text-[8px] tracking-[0.3em] text-zinc-600">ART SHOWCASE</p>
          </div>
        </Link>

        <div>
          <p className="mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600">WORKSPACE</p>
          <nav className="space-y-1">
            {visibleNavigation.map((item) =>
              item.label === "Explore" || item.label === "Favorites" || item.label === "Challenges" ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-white"
                >
                  <span className="w-4 text-center text-base transition-transform duration-300 group-hover:scale-110">
                    {item.icon}
                  </span>
                  {item.label}
                  {item.label === "Challenges" && (
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-zinc-300">
                      {filteredChallenges.length}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.label);
                    setMobileMenu(false);
                  }}
                  className={`group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] transition-all duration-300 ${
                    activeNav === item.label
                      ? "border border-white/[0.08] bg-white/[0.08] text-white shadow-[inset_2px_0_0_white]"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="w-4 text-center text-base transition-transform duration-300 group-hover:scale-110">
                    {item.icon}
                  </span>
                  {item.label}
                  {item.label === "Challenges" && (
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-zinc-300">
                      {filteredChallenges.length}
                    </span>
                  )}
                </button>
              )
            )}
          </nav>
        </div>

        <div className="mt-10">
          <p className="mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600">PERSONAL SPACE</p>
          {isMember && (
            <button type="button" onClick={() => setShowUpload(true)} className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white">
              <span className="text-lg">＋</span>
              Upload Artwork
            </button>
          )}

          {currentUser && (
            <Link href="/messages" className="mt-1 group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white">
              <span className="w-4 text-center text-sm">✉</span>
              Messages
            </Link>
          )}

          {isCurator && isCuratorApproved && (
            <Link href="/curator" className="flex w-full items-center gap-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-[12px] text-amber-200 transition hover:border-amber-400/40 hover:bg-amber-500/15">
              <span className="text-base">✦</span>
              Curator Dashboard
            </Link>
          )}

          {isCurator && !isCuratorApproved && (
            <Link href="/pending-curator" className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-[11px] text-amber-300 transition hover:bg-amber-500/15">
              <span className="flex items-center gap-3">
                <span>⏳</span>
                Status Verifikasi
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[8px] uppercase tracking-wider">
                {currentUser?.curatorStatus || "Pending"}
              </span>
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin" className="flex w-full items-center gap-4 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-3 text-left text-[12px] text-white transition hover:bg-white/10">
              <span className="text-base">❖</span>
              Admin Console
            </Link>
          )}

          {isGuest && (
            <Link href="/" className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white">
              <span className="text-lg">→</span>
              Login / Register
            </Link>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/[0.06]">
          {currentUser ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 transition hover:border-white/20">
              <Link href="/profile" title="Buka Profil" className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-semibold text-white">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" />
                ) : (
                  currentUser.displayName?.charAt(0).toUpperCase() || "U"
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black bg-emerald-400" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link href="/profile" className="block truncate text-xs font-medium leading-tight text-white transition hover:text-zinc-300">
                  {currentUser.displayName}
                </Link>
                <form action={logoutUserAction} className="mt-0.5">
                  <button
                    type="submit"
                    className="text-[10px] text-zinc-500 hover:text-red-400 transition"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-xs text-zinc-400">
                G
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white leading-tight">
                  Guest
                </p>
                <Link
                  href="/"
                  className="text-[10px] text-zinc-400 hover:text-white transition"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-[8px] tracking-wider text-zinc-700">
            <span>AESTHE © 2026</span>
          </div>
        </div>
      </aside>

      <div className="relative z-10 min-h-screen lg:ml-[250px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/75 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
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
              DISCOVER / <span className="text-zinc-300">{activeNav.toUpperCase()}</span>
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
              placeholder="Search artworks, artists, challenges..."
              className="w-full rounded-full border border-white/[0.08] bg-white/[0.025] py-2.5 pl-11 pr-5 text-[11px] text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30 focus:bg-white/[0.05]"
            />
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-lg text-zinc-500 transition hover:text-white"
              aria-label="Notifications"
            >
              ♧
              <span className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full bg-white" />
            </button>

            <div className="h-5 w-px bg-white/10" />

            <Link href={currentUser ? "/profile" : "/"} className="flex items-center gap-3 transition hover:opacity-85">
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-medium">
                  {currentUser ? currentUser.displayName : "Guest Visitor"}
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-600">
                  {currentUser ? `${currentUser.role.toUpperCase()} ACCOUNT` : "PUBLIC VIEW"}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-500 to-zinc-900 text-xs font-medium uppercase">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="h-full w-full object-cover" />
                ) : (
                  currentUser ? currentUser.displayName.charAt(0) : "G"
                )}
              </div>
            </Link>
          </div>

          {showNotifications && (
            <div className="absolute right-5 top-[65px] w-[290px] rounded-xl border border-white/10 bg-[#151515] p-5 shadow-2xl sm:right-12">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Notifications</p>
                <span className="text-[9px] text-zinc-500">LATEST</span>
              </div>
              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="text-lg">✧</span>
                  <div>
                    <p className="text-[11px]">Welcome to Aesthe!</p>
                    <p className="mt-1 text-[9px] text-zinc-500">Connected live to PostgreSQL.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {authNotice && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-xs text-zinc-200">
              <span>{authNotice}</span>
              <Link href="/" className="rounded-full bg-white px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                Login Sekarang
              </Link>
            </div>
          )}

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

          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <p className="text-[9px] tracking-[0.35em] text-zinc-500">YOUR CREATIVE SPACE</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                  {role}
                </span>
              </div>
              <h1 className="text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl">
                {currentUser ? `Welcome back, ${currentUser.displayName}` : "Explore Aesthe"}
                <span className="text-zinc-500">.</span>
              </h1>
              <p className="mt-3 text-[11px] text-zinc-500 sm:text-xs">
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
                onClick={() => setShowUpload(true)}
                className="group flex items-center gap-3 rounded-full border border-white/20 px-5 py-3 text-[9px] font-medium tracking-[0.18em] transition duration-300 hover:border-white hover:bg-white hover:text-black"
              >
                <span className="text-base transition-transform group-hover:rotate-90">＋</span>
                UPLOAD ARTWORK
              </button>
            )}

            {isCurator && isCuratorApproved && (
              <Link href="/curator" className="flex items-center gap-3 rounded-full border border-amber-400/40 bg-amber-500/10 px-5 py-3 text-[9px] font-medium tracking-[0.18em] text-amber-200 transition duration-300 hover:border-amber-300 hover:bg-amber-300 hover:text-black">
                <span className="text-sm">✦</span>
                CURATOR DASHBOARD
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-5 py-3 text-[9px] font-medium tracking-[0.18em] text-white transition duration-300 hover:border-white hover:bg-white hover:text-black">
                <span className="text-sm">❖</span>
                ADMIN CONSOLE
              </Link>
            )}
          </section>

          <section className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="group relative h-[360px] overflow-hidden rounded-2xl border border-white/[0.08] xl:col-span-7 xl:h-[420px]">
              <img
                src={artworks[0]?.image_url || "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1800"}
                alt="Featured artwork"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-50 transition duration-[1200ms] group-hover:scale-105 group-hover:opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/65 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

              <div className="absolute left-7 top-7 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                <span className="text-[9px] tracking-[0.3em] text-zinc-300">EDITOR&apos;S SELECTION</span>
              </div>

              <div className="absolute bottom-8 left-7 max-w-md">
                <p className="mb-3 text-[9px] tracking-[0.3em] text-zinc-400">ARTWORK OF THE DAY / 001</p>
                <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
                  Art Beyond <span className="text-zinc-400">Boundaries.</span>
                </h2>
                <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
                  Every creation tells a story. Every imagination deserves a space.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 xl:col-span-5 xl:h-[420px]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] tracking-[0.3em] text-zinc-500">CURATOR&apos;S CHALLENGE PODIUM</p>
                  <h3 className="mt-1 truncate text-base font-light tracking-wide text-white">
                    {podiumMeta ? podiumMeta.challenge_title : "Hall of Fame Podium"}
                  </h3>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                    {podiumMeta ? `Dipilih oleh Curator: ${podiumMeta.curator_name}` : "Menunggu pengumuman resmi Curator"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] tracking-widest text-zinc-300">
                  TOP 3
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 items-end gap-3 pt-2">
                <div className="flex flex-col items-center">
                  <div className="mb-2 h-16 w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
                    {rank3 ? (
                      <img src={rank3.image_url} alt={rank3.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">TBA</div>
                    )}
                  </div>
                  <p className="w-full truncate text-center text-[10px] font-medium text-zinc-300">
                    {rank3 ? rank3.title : "Slot #3"}
                  </p>
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
                    <span className="text-sm font-semibold text-amber-500">#3</span>
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500">Bronze</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="mb-2 h-24 w-full overflow-hidden rounded-xl border border-amber-400/40 bg-zinc-800 shadow-[0_0_25px_rgba(251,191,36,0.2)]">
                    {rank1 ? (
                      <img src={rank1.image_url} alt={rank1.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">TBA</div>
                    )}
                  </div>
                  <p className="w-full truncate text-center text-[11px] font-semibold text-amber-100">
                    {rank1 ? rank1.title : "Champion #1"}
                  </p>
                  {rank1?.artist_username ? (
                    <Link href={`/creators/${rank1.artist_username}`} className="w-full truncate text-center text-[9px] text-zinc-400 transition hover:text-amber-200">
                      {rank1.artist_name}
                    </Link>
                  ) : (
                    <p className="w-full truncate text-center text-[9px] text-zinc-400">
                      {rank1 ? rank1.artist_name : "Menunggu Curator"}
                    </p>
                  )}
                  <div className="mt-2 flex h-32 w-full flex-col items-center justify-center rounded-t-xl border-x border-t border-amber-400/40 bg-gradient-to-t from-zinc-900 to-amber-500/20 shadow-[inset_0_1px_0_rgba(251,191,36,0.3)]">
                    <span className="text-lg font-bold text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">♛ #1</span>
                    <span className="text-[8px] uppercase tracking-widest text-amber-400/90 font-medium">Gold</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="mb-2 h-20 w-full overflow-hidden rounded-xl border border-slate-300/35 bg-zinc-800 shadow-[0_0_20px_rgba(203,213,225,0.15)]">
                    {rank2 ? (
                      <img src={rank2.image_url} alt={rank2.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">TBA</div>
                    )}
                  </div>
                  <p className="w-full truncate text-center text-[10px] font-medium text-slate-100">
                    {rank2 ? rank2.title : "Slot #2"}
                  </p>
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
                    <span className="text-base font-semibold text-slate-100 drop-shadow-[0_0_8px_rgba(226,232,240,0.5)]">#2</span>
                    <span className="text-[8px] uppercase tracking-widest text-slate-300 font-medium">Silver</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {filteredChallenges.length > 0 && (
            <section id="challenges" className="mt-14">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-zinc-600">COMMUNITY EVENTS</p>
                  <h2 className="mt-1 text-xl font-light tracking-tight">
                    Active Challenges<span className="text-zinc-600">.</span>
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {filteredChallenges.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/challenges/${ch.id}`}
                    className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition hover:border-white/25"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[9px] uppercase tracking-widest text-emerald-300">
                          Ongoing Event
                        </span>
                        <h3 className="mt-3 text-lg font-medium text-white group-hover:underline">{ch.title}</h3>
                        <p className="mt-1 text-xs text-zinc-400">{ch.description}</p>
                        <p className="mt-3 text-[10px] text-zinc-500">
                          Curator: {ch.curator_name} &bull; Hadiah: {ch.prize}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[9px] tracking-[0.3em] text-zinc-600">THE CREATIVE UNIVERSE</p>
                <h2 className="text-2xl font-light tracking-tight">
                  {activeNav === "Favorites" ? "Saved Favorites" : "Discover artworks"}
                  <span className="text-zinc-600">.</span>
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

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory("All");
                    setActiveNav("Home");
                    setSortBy("popular");
                    setSearch("");
                  }}
                  className="text-[9px] tracking-[0.15em] text-zinc-500 transition hover:text-white"
                >
                  RESET FILTER ↺
                </button>
              </div>
            </div>

            <div className="mt-7 flex gap-2 overflow-x-auto pb-3">
              {["All", ...categories.map((c) => c.name)].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-full border px-5 py-2.5 text-[9px] tracking-[0.12em] transition-all duration-300 ${
                    activeCategory === category
                      ? "border-white bg-white text-black"
                      : "border-white/[0.08] text-zinc-500 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {category.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredArtworks.map((art) => {
                const userReaction = art.user_reaction ? getReactionDisplay(art.user_reaction) : null;

                return (
                  <article key={art.id} className="group relative min-w-0">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900">
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

                      {(isMember || isGuest) && (
                        <button
                          type="button"
                          onClick={() => handleFavorite(art.id)}
                          title={isGuest ? "Masuk sebagai Member untuk menyimpan karya" : art.is_favorited ? "Hapus dari Favorites" : "Simpan ke Favorites"}
                          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-xs backdrop-blur-md transition ${
                            isMember && art.is_favorited
                              ? "border-amber-400 bg-amber-400 text-black font-bold"
                              : "border-white/20 bg-black/50 text-white hover:bg-white hover:text-black"
                          }`}
                        >
                          ⚑
                        </button>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-medium text-white">{art.title}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(art.tags || []).map((tag) => (
                            <span key={tag} className="text-[9px] text-zinc-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
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
                <p className="mt-3 text-sm text-zinc-400">No artworks found.</p>
                <p className="mt-1 text-[10px] text-zinc-600">Try another keyword, category, or upload your first artwork.</p>
              </div>
            )}
          </section>

          <footer className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-8 text-[9px] tracking-[0.2em] text-zinc-700">
            <span>AESTHE © 2026</span>
            <span>WHERE ART MEETS EXPRESSION.</span>
            <span>MADE FOR CREATORS.</span>
          </footer>
        </div>
      </div>

      {showUpload && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-xl"
          onClick={closeUploadModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-7 shadow-2xl sm:p-9"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] tracking-[0.3em] text-zinc-500">CREATOR STUDIO</p>
                <h2 className="mt-2 text-2xl font-light">
                  Upload Artwork<span className="text-zinc-600">.</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={closeUploadModal}
                className="text-xl text-zinc-500 transition hover:text-white"
              >
                ×
              </button>
            </div>

            {uploadState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {uploadState.error}
              </div>
            )}

            <form action={uploadFormAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Judul Karya</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Contoh: Midnight Horizon"
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Kategori</label>
                <select
                  name="categoryId"
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
                  File Gambar Karya (JPG/PNG/WEBP/GIF, maks. 8MB)
                </label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  onChange={handleArtworkFileChange}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-black focus:border-white/40 focus:outline-none"
                />
                {uploadPreview && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                    <img src={uploadPreview} alt="Preview karya" className="max-h-48 w-full object-contain" />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
                  Tags (Pisahkan dengan koma, min. 1)
                </label>
                <input
                  type="text"
                  name="tags"
                  required
                  placeholder="ilustrasi, cyberpunk, digital"
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi Karya</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  placeholder="Ceritakan konsep di balik karyamu..."
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="mt-2 w-full rounded-lg bg-white py-3 text-[10px] font-semibold tracking-[0.2em] text-black transition hover:bg-zinc-300 disabled:opacity-50"
              >
                {isUploading ? "MENYIMPAN KARYA..." : "PUBLISH ARTWORK"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}