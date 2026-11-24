"use client";

export default function Navbar({ pageTitle, searchQuery, onSearchChange, onOpenMobileMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#0b0b0c]/85 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 lg:hidden"
        >
          &#9776;
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Admin Console</p>
          <h1 className="text-sm font-medium tracking-wide text-white">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 sm:block md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari pengguna, laporan, atau kategori..."
            className="w-full rounded-full border border-white/10 bg-zinc-900/80 py-1.5 pl-4 pr-8 text-xs text-white placeholder-zinc-500 transition focus:border-white/30 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              &#10005;
            </button>
          )}
        </div>

        <span className="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
          Full Access
        </span>
      </div>
    </header>
  );
}