"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavIcon from "@/components/ui/nav-icon";

const QUICK_PAGES = [
  { id: "page-home", title: "Home", subtitle: "Beranda & karya unggulan", href: "/home", icon: "home", keywords: "home beranda utama" },
  { id: "page-explore", title: "Explore Gallery", subtitle: "Jelajahi karya, tag & kreator", href: "/explore", icon: "explore", keywords: "explore jelajah galeri cari" },
  { id: "page-challenges", title: "Challenges & Events", subtitle: "Kompetisi seni aktif & pemenang", href: "/challenges", icon: "challenges", keywords: "challenge event lomba kompetisi" },
  { id: "page-favorites", title: "Favorites & Moodboards", subtitle: "Koleksi karya tersimpan", href: "/favorites", icon: "favorites", keywords: "favorites favorit moodboard simpan" },
  { id: "page-messages", title: "Messages", subtitle: "Pesan langsung antar pengguna", href: "/messages", icon: "messages", keywords: "messages pesan chat inbox dm" },
  { id: "page-profile", title: "My Profile", subtitle: "Kelola profil, karya & akun", href: "/profile", icon: "profile", keywords: "profile profil akun saya" },
  { id: "page-curator", title: "Curator Studio", subtitle: "Dashboard kelola challenge kurator", href: "/curator", icon: "curator", keywords: "curator kurator studio" },
  { id: "page-admin", title: "Admin Console", subtitle: "Panel moderasi & manajemen platform", href: "/admin", icon: "admin", keywords: "admin console moderasi" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ artworks: [], creators: [], challenges: [] });
  const inputRef = useRef(null);

  const openPalette = useCallback(() => {
    setOpen(true);
    setActiveIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQueryText("");
    setActiveIndex(0);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut & custom trigger event
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (!next) setQueryText("");
          setActiveIndex(0);
          return next;
        });
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const onCustomOpen = () => openPalette();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("aesthe:open-command", onCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("aesthe:open-command", onCustomOpen);
    };
  }, [openPalette]);

  // Focus input & lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open]);

  // Debounced live search fetch from PostgreSQL API
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(queryText.trim())}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults({
            artworks: data.artworks || [],
            creators: data.creators || [],
            challenges: data.challenges || [],
          });
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setResults({ artworks: [], creators: [], challenges: [] });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, queryText.trim() ? 180 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, queryText]);

  const flatItems = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const pages = QUICK_PAGES.filter(
      (p) => !q || p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q) || p.keywords.includes(q)
    ).slice(0, q ? 4 : 5);

    const items = [];

    for (const art of results.artworks) {
      items.push({
        id: `art-${art.id}`,
        group: q ? "Karya Ditemukan" : "Karya Populer",
        title: art.title,
        subtitle: `${art.artist_name} · ${art.category_name}`,
        href: `/artworks/${art.id}`,
        thumb: art.image_url,
      });
    }

    for (const creator of results.creators) {
      items.push({
        id: `creator-${creator.id}`,
        group: "Kreator",
        title: creator.display_name,
        subtitle: `@${creator.username} · ${creator.role}`,
        href: `/creators/${creator.username}`,
        avatar: creator.avatar_url,
        initial: creator.display_name?.charAt(0)?.toUpperCase() || "A",
      });
    }

    for (const ch of results.challenges) {
      items.push({
        id: `challenge-${ch.id}`,
        group: q ? "Challenges" : "Challenge Aktif",
        title: ch.title,
        subtitle: ch.prize ? `Hadiah: ${ch.prize}` : "Kompetisi Aesthe",
        href: `/challenges/${ch.id}`,
        icon: "challenges",
      });
    }

    for (const page of pages) {
      items.push({
        id: page.id,
        group: "Navigasi Cepat",
        title: page.title,
        subtitle: page.subtitle,
        href: page.href,
        icon: page.icon,
      });
    }

    return items;
  }, [queryText, results]);

  const safeActiveIndex = flatItems.length > 0 ? Math.min(activeIndex, flatItems.length - 1) : 0;

  const navigateTo = useCallback(
    (href) => {
      closePalette();
      router.push(href);
    },
    [closePalette, router]
  );

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % flatItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
    } else if (e.key === "Enter" && flatItems[safeActiveIndex]) {
      e.preventDefault();
      navigateTo(flatItems[safeActiveIndex].href);
    }
  };

  if (!open) return null;

  const grouped = flatItems.reduce((acc, item, index) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push({ ...item, flatIndex: index });
    return acc;
  }, {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Search Command Palette"
      onClick={closePalette}
      className="modal-overlay fixed inset-0 z-[160] flex items-start justify-center bg-black/75 px-4 pt-[10vh] backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-panel flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl text-zinc-100"
      >
        {/* SEARCH BAR */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-champagne-300">
            <circle cx="11" cy="11" r="7.5" />
            <path d="M20 20l-3.6-3.6" />
          </svg>
          <input
            ref={inputRef}
            value={queryText}
            onChange={(e) => {
              setQueryText(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Cari karya, kreator, challenge, atau pindah halaman..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {loading && (
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-champagne-300/30 border-t-champagne-300" />
          )}
          <button
            type="button"
            onClick={closePalette}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] tracking-wider text-zinc-400 transition hover:border-white/25 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* RESULTS LIST */}
        <div data-lenis-prevent className="overflow-y-auto px-3 py-3">
          {flatItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-display text-xl text-zinc-300">Tidak ada hasil ditemukan</p>
              <p className="mt-1 text-xs text-zinc-500">Coba kata kunci lain untuk karya, kreator, atau menu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([groupName, groupItems]) => (
                <div key={groupName}>
                  <p className="px-3 pb-1.5 text-[9px] font-medium uppercase tracking-[0.24em] text-zinc-500">
                    {groupName}
                  </p>
                  <div className="space-y-1">
                    {groupItems.map((item) => {
                      const isSelected = item.flatIndex === safeActiveIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(item.flatIndex)}
                          onClick={() => navigateTo(item.href)}
                          className={`flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition ${
                            isSelected
                              ? "border border-champagne-300/30 bg-gradient-to-r from-champagne-400/[0.16] via-white/[0.04] to-transparent text-white"
                              : "border border-transparent text-zinc-300 hover:bg-white/[0.04]"
                          }`}
                        >
                          {item.thumb ? (
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
                              <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : item.initial ? (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-champagne-300/30 bg-zinc-900 text-xs font-semibold text-champagne-200">
                              {item.avatar ? (
                                <img src={item.avatar} alt="" className="h-full w-full object-cover" />
                              ) : (
                                item.initial
                              )}
                            </div>
                          ) : (
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${isSelected ? "border-champagne-300/35 bg-champagne-400/15 text-champagne-200" : "border-white/[0.08] bg-white/[0.03] text-zinc-400"}`}>
                              <NavIcon name={item.icon || "explore"} className="h-4 w-4" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{item.title}</p>
                            <p className="truncate text-[10px] text-zinc-500">{item.subtitle}</p>
                          </div>

                          <span className={`text-[10px] transition ${isSelected ? "text-champagne-300" : "text-zinc-600"}`}>
                            ↵
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER HINTS */}
        <div className="flex items-center justify-between border-t border-white/[0.07] bg-black/30 px-5 py-2.5 text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-zinc-300">↑↓</kbd> Pilih</span>
            <span><kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-zinc-300">↵</kbd> Buka</span>
          </div>
          <span className="tracking-widest text-champagne-400/70">AESTHE QUICK SEARCH</span>
        </div>
      </div>
    </div>
  );
}
