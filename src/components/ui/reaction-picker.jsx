"use client";

import { useEffect, useRef, useState } from "react";

export const REACTIONS = [
  { type: "love", icon: "❤️", label: "Love" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "fire", icon: "🔥", label: "Fire" },
  { type: "inspire", icon: "✨", label: "Inspire" },
  { type: "applause", icon: "👏", label: "Applause" },
];

export function getReactionDisplay(type) {
  return REACTIONS.find((r) => r.type === type) || REACTIONS[0];
}

export default function ReactionPicker({
  userReaction = null,
  totalReactions = 0,
  onReact,
  align = "right",
  size = "sm",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const lastPointerTypeRef = useRef("mouse");

  const activeDisplay = userReaction ? getReactionDisplay(userReaction) : null;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleMouseEnter = () => {
    if (disabled) return;
    clearCloseTimer();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    if (lastPointerTypeRef.current === "touch") {
      setOpen((prev) => !prev);
      return;
    }
    setOpen(false);
    onReact?.(activeDisplay ? activeDisplay.type : "love");
  };

  const handlePickReaction = (type) => {
    if (disabled) return;
    clearCloseTimer();
    setOpen(false);
    onReact?.(type);
  };

  const triggerClass =
    size === "md"
      ? `flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition disabled:opacity-60 ${
          activeDisplay
            ? "border-rose-500/50 bg-rose-500/15 font-medium text-rose-300"
            : "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-champagne-300/50 hover:text-champagne-100"
        }`
      : `flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition disabled:opacity-60 ${
          activeDisplay
            ? "border-rose-500/50 bg-rose-500/15 font-medium text-rose-300"
            : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/30 hover:text-white"
        }`;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex shrink-0 items-center"
    >
      {/* Jembatan pb-2 berada di dalam area hover sehingga tidak ada celah mati 8px */}
      <div
        className={`absolute bottom-full z-30 pb-2 transition-all duration-150 ${
          align === "left" ? "left-0" : "right-0"
        } ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"}`}
      >
        <div className="glass flex items-center gap-1 rounded-full border border-white/15 bg-[#111113]/95 px-2.5 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.65)] backdrop-blur-md">
          {REACTIONS.map((r) => {
            const isSelected = activeDisplay?.type === r.type;
            return (
              <button
                key={r.type}
                type="button"
                disabled={disabled}
                onClick={() => handlePickReaction(r.type)}
                title={r.label}
                aria-label={r.label}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:scale-125 hover:bg-white/10 ${
                  isSelected ? "bg-champagne-400/20 ring-1 ring-champagne-300/60" : ""
                }`}
              >
                {r.icon}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        onPointerDown={(e) => {
          lastPointerTypeRef.current = e.pointerType || "mouse";
        }}
        onClick={handleTriggerClick}
        className={triggerClass}
      >
        <span>{activeDisplay ? activeDisplay.icon : "♥"}</span>
        <span>{size === "md" ? `${totalReactions} Reaksi` : totalReactions}</span>
      </button>
    </div>
  );
}
