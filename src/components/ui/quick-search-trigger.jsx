"use client";

export function openQuickSearch() {
  window.dispatchEvent(new Event("aesthe:open-command"));
}

export default function QuickSearchTrigger({ className = "" }) {
  return (
    <button
      type="button"
      onClick={openQuickSearch}
      title="Buka Cari Cepat (Ctrl + K)"
      className={`group mx-4 hidden max-w-[390px] flex-1 items-center justify-between gap-3 rounded-full border border-white/[0.1] bg-black/45 px-4 py-2 text-left text-[11px] text-zinc-400 transition hover:border-champagne-300/45 hover:bg-white/[0.05] hover:text-champagne-100 md:flex ${className}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0 text-champagne-300/80 transition group-hover:text-champagne-200">
          <circle cx="11" cy="11" r="7.5" />
          <path d="M20 20l-3.6-3.6" />
        </svg>
        <span className="truncate">Cari cepat karya, kreator, atau menu...</span>
      </span>
      <kbd className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[9px] tracking-wider text-zinc-400 transition group-hover:border-champagne-300/35 group-hover:text-champagne-200">
        Ctrl K
      </kbd>
    </button>
  );
}

export function QuickSearchIconButton() {
  return (
    <button
      type="button"
      onClick={openQuickSearch}
      aria-label="Cari Cepat"
      title="Cari Cepat (Ctrl + K)"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-champagne-300/40 hover:text-champagne-100 md:hidden"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <circle cx="11" cy="11" r="7.5" />
        <path d="M20 20l-3.6-3.6" />
      </svg>
    </button>
  );
}
