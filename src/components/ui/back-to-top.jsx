"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const HIDDEN_ROUTES = new Set(["/", "/messages"]);
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const isHiddenRoute = HIDDEN_ROUTES.has(pathname);

  useEffect(() => {
    if (isHiddenRoute) return;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setVisible(y > 360);
      setProgress(Math.min(1, Math.max(0, y / maxScroll)));
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    rafId = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHiddenRoute, pathname]);

  if (isHiddenRoute) return null;

  const handleClick = () => {
    if (document.documentElement.classList.contains("lenis")) {
      window.dispatchEvent(new Event("aesthe:scroll-top"));
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      className={`group fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#101014]/90 text-champagne-200 shadow-[0_14px_34px_-8px_rgba(0,0,0,0.9),0_0_24px_-8px_rgba(212,175,106,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-champagne-300/60 hover:bg-[#17171c] hover:text-champagne-100 lg:bottom-6 lg:right-6 ${
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {/* Scroll progress ring */}
      <svg viewBox="0 0 48 48" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.8" />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="url(#backToTopGold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
        <defs>
          <linearGradient id="backToTopGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5ead0" />
            <stop offset="100%" stopColor="#d4af6a" />
          </linearGradient>
        </defs>
      </svg>

      {/* Up arrow icon */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="relative h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5">
        <path d="M12 19V5" />
        <path d="M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
