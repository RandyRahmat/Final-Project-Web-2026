"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const SLIDE_DURATION_MS = 7000;

export default function ExhibitionMode({ artworks = [], initialIndex = 0, onClose }) {
  const safeInitial = artworks.length > 0 ? Math.min(Math.max(0, initialIndex), artworks.length - 1) : 0;
  const [index, setIndex] = useState(safeInitial);
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioOn, setAudioOn] = useState(false);
  const [wallFrame, setWallFrame] = useState(true);
  const [showStrip, setShowStrip] = useState(true);

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const nodesRef = useRef([]);

  const total = artworks.length;
  const activeIndex = total > 0 ? ((index % total) + total) % total : 0;
  const currentArt = artworks[activeIndex] || null;

  const stopAmbientAudio = useCallback(() => {
    const ctx = audioCtxRef.current;
    const gain = masterGainRef.current;
    if (ctx && gain) {
      try {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      } catch {
        // Abaikan jika AudioContext sudah tertutup
      }
      const oldNodes = nodesRef.current;
      const oldCtx = ctx;
      setTimeout(() => {
        oldNodes.forEach((n) => {
          try {
            if (typeof n.stop === "function") n.stop();
            n.disconnect();
          } catch {
            // Abaikan
          }
        });
        oldCtx.close().catch(() => {});
      }, 420);
    }
    audioCtxRef.current = null;
    masterGainRef.current = null;
    nodesRef.current = [];
  }, []);

  const startAmbientAudio = useCallback(() => {
    if (typeof window === "undefined") return false;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      stopAmbientAudio();
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.065, ctx.currentTime + 1.8);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(480, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      // LFO lembut untuk membuat filter bernapas pelan seperti ruang galeri
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Akord Dmaj9 hangat & menenangkan (D3, A3, E4, F#4)
      const voices = [
        { freq: 146.83, type: "sine", vol: 0.42 },
        { freq: 220.0, type: "sine", vol: 0.28 },
        { freq: 329.63, type: "sine", vol: 0.16 },
        { freq: 369.99, type: "triangle", vol: 0.08 },
      ];

      const createdNodes = [lfo, lfoGain, filter, masterGain];
      voices.forEach((v) => {
        const osc = ctx.createOscillator();
        const vGain = ctx.createGain();
        osc.type = v.type;
        osc.frequency.setValueAtTime(v.freq, ctx.currentTime);
        vGain.gain.setValueAtTime(v.vol, ctx.currentTime);
        osc.connect(vGain);
        vGain.connect(filter);
        osc.start();
        createdNodes.push(osc, vGain);
      });

      lfo.start();
      audioCtxRef.current = ctx;
      masterGainRef.current = masterGain;
      nodesRef.current = createdNodes;
      return true;
    } catch {
      return false;
    }
  }, [stopAmbientAudio]);

  const toggleAudio = useCallback(() => {
    setAudioOn((prev) => {
      if (prev) {
        stopAmbientAudio();
        return false;
      }
      return startAmbientAudio();
    });
  }, [startAmbientAudio, stopAmbientAudio]);

  const handleClose = useCallback(() => {
    stopAmbientAudio();
    onClose();
  }, [onClose, stopAmbientAudio]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  // Bersihkan audio & kunci scroll body saat Mode Pameran aktif
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      stopAmbientAudio();
    };
  }, [stopAmbientAudio]);

  // Autoplay tiap 7 detik
  useEffect(() => {
    if (!isPlaying || total <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [isPlaying, total]);

  // Shortcut keyboard: Esc, Left/Right, Space, M
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "m" || e.key === "M") {
        toggleAudio();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, handleNext, handlePrev, toggleAudio]);

  if (!currentArt) return null;

  const paddedCurrent = String(activeIndex + 1).padStart(2, "0");
  const paddedTotal = String(total).padStart(2, "0");

  return (
    <div className="modal-overlay fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#060607] text-zinc-100 select-none">
      <style>{`
        @keyframes exhibitionProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes exhibitionReveal {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* DYNAMIC AMBIENT BACKDROP */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          key={`bg-${currentArt.id}`}
          src={currentArt.image_url}
          alt=""
          className="h-full w-full scale-110 object-cover opacity-25 blur-[95px] transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(236,220,180,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/95" />
      </div>

      {/* TOP EXHIBITION BAR */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-black/40 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow h-7 w-7 object-contain mix-blend-screen" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.32em] text-champagne-300">AESTHE VIRTUAL EXHIBITION</p>
            <p className="text-[11px] text-zinc-400">
              Karya <span className="font-mono text-champagne-100">{paddedCurrent}</span> / {paddedTotal}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWallFrame((v) => !v)}
            className={`rounded-full border px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${
              wallFrame
                ? "border-champagne-300/50 bg-champagne-400/15 text-champagne-100"
                : "border-white/15 bg-white/[0.04] text-zinc-400 hover:text-white"
            }`}
          >
            {wallFrame ? "▣ Bingkai ON" : "▢ Kanvas Polos"}
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            title="Toggle Ambient Gallery Soundscape (M)"
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${
              audioOn
                ? "border-champagne-300/60 bg-champagne-400/20 text-champagne-100 shadow-[0_0_20px_-6px_rgba(212,175,106,0.6)]"
                : "border-white/15 bg-white/[0.04] text-zinc-400 hover:border-white/30 hover:text-white"
            }`}
          >
            {audioOn && <span className="live-dot text-champagne-300" />}
            <span>{audioOn ? "♪ Suara Galeri ON" : "♪ Suara Galeri"}</span>
          </button>

          {total > 1 && (
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              title="Play / Pause Autoplay (Space)"
              className="btn-ghost rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em]"
            >
              {isPlaying ? "❚❚ Jeda" : "▶ Putar"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowStrip((s) => !s)}
            className="hidden rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition hover:text-white sm:inline-flex"
          >
            {showStrip ? "Sembunyikan Strip" : "Tampilkan Strip"}
          </button>

          <button
            type="button"
            onClick={handleClose}
            title="Keluar Mode Pameran (Esc)"
            className="rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white transition hover:border-champagne-300 hover:bg-champagne-200 hover:text-black"
          >
            × Keluar
          </button>
        </div>
      </header>

      {/* MAIN GALLERY STAGE */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-4 py-5 sm:px-14">
        {total > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Karya sebelumnya"
            className="glass absolute left-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-xl text-zinc-200 transition hover:border-champagne-300/60 hover:text-champagne-200 sm:left-6 sm:h-12 sm:w-12"
          >
            ‹
          </button>
        )}

        <div
          key={currentArt.id}
          style={{ animation: "exhibitionReveal 750ms cubic-bezier(0.22,1,0.36,1) both" }}
          className="flex max-h-full w-full max-w-6xl flex-col items-center justify-center gap-5 lg:flex-row lg:gap-10"
        >
          {/* FRAME / ARTWORK */}
          <div className="flex max-h-[56vh] items-center justify-center lg:max-h-[68vh] lg:flex-1">
            {wallFrame ? (
              <div className="relative rounded-sm border-[10px] border-[#151412] bg-gradient-to-br from-champagne-200/45 via-champagne-500/20 to-champagne-700/45 p-[2px] shadow-[0_35px_85px_-12px_rgba(0,0,0,0.98),0_0_50px_-18px_rgba(212,175,106,0.28)] ring-1 ring-champagne-300/30">
                <div className="bg-[#ece6db] p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.35)] sm:p-5">
                  <div className="overflow-hidden bg-black">
                    <img
                      src={currentArt.image_url}
                      alt={currentArt.title}
                      className={`max-h-[46vh] max-w-[78vw] object-contain lg:max-h-[56vh] lg:max-w-[46vw] ${isPlaying ? "animate-ken-burns" : ""}`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/60 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.95)]">
                <img
                  src={currentArt.image_url}
                  alt={currentArt.title}
                  className={`max-h-[54vh] max-w-[85vw] object-contain lg:max-h-[66vh] lg:max-w-[52vw] ${isPlaying ? "animate-ken-burns" : ""}`}
                />
              </div>
            )}
          </div>

          {/* PLAKAT KURASI MUSEUM */}
          <aside className="glass w-full max-w-md rounded-2xl border border-white/15 p-5 sm:p-6 lg:w-[340px] lg:shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full border border-champagne-300/30 bg-champagne-400/10 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-champagne-200">
                {currentArt.category_name}
              </span>
              <span className="font-mono text-[10px] text-zinc-500">NO. {paddedCurrent}</span>
            </div>

            <h2 className="font-display mt-3.5 text-3xl leading-[1.08] text-white sm:text-4xl">
              {currentArt.title}
            </h2>

            <p className="mt-2 text-xs text-zinc-400">
              Karya oleh{" "}
              <Link
                href={`/creators/${currentArt.artist_username}`}
                onClick={handleClose}
                className="text-champagne-200 underline decoration-champagne-300/35 underline-offset-4 transition hover:text-white"
              >
                {currentArt.artist_name}
              </Link>
            </p>

            {currentArt.description && (
              <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-zinc-300">
                {currentArt.description}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs text-zinc-400">
                ♥ <span className="text-white">{currentArt.total_reactions || 0}</span> Reaksi
              </span>
              <Link
                href={`/artworks/${currentArt.id}`}
                onClick={handleClose}
                className="btn-gold rounded-full px-4 py-2 text-[9px] uppercase tracking-[0.2em]"
              >
                Detail Karya ↗
              </Link>
            </div>
          </aside>
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Karya berikutnya"
            className="glass absolute right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-xl text-zinc-200 transition hover:border-champagne-300/60 hover:text-champagne-200 sm:right-6 sm:h-12 sm:w-12"
          >
            ›
          </button>
        )}
      </div>

      {/* BOTTOM THUMBNAIL STRIP & PROGRESS */}
      <footer className="relative z-20 border-t border-white/[0.06] bg-black/50 backdrop-blur-xl">
        {showStrip && total > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto px-5 py-3">
            {artworks.map((art, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  title={art.title}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border transition-all duration-300 ${
                    isActive
                      ? "scale-110 border-champagne-300 shadow-[0_0_18px_rgba(212,175,106,0.55)]"
                      : "border-white/10 opacity-45 hover:border-white/40 hover:opacity-90"
                  }`}
                >
                  <img src={art.image_url} alt={art.title} className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        )}

        <div className="hidden items-center justify-between px-6 py-1.5 text-[9px] uppercase tracking-[0.22em] text-zinc-600 sm:flex">
          <span>← / → Ganti Karya &bull; Space Putar/Jeda</span>
          <span>M Suara Galeri &bull; Esc Keluar</span>
        </div>

        {isPlaying && total > 1 && (
          <div className="h-[2px] w-full overflow-hidden bg-white/10">
            <div
              key={`bar-${currentArt.id}-${isPlaying}`}
              style={{
                transformOrigin: "left",
                animation: `exhibitionProgress ${SLIDE_DURATION_MS}ms linear forwards`,
              }}
              className="h-full w-full bg-gradient-to-r from-champagne-200 via-champagne-400 to-amber-300"
            />
          </div>
        )}
      </footer>
    </div>
  );
}
