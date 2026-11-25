"use client";

export default function Navbar({ pageTitle, searchQuery, onSearchChange, onOpenMobileMenu }) {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/[0.06] bg-[#090909]/80 backdrop-blur-md">
      <div className="flex h-[76px] items-center justify-between gap-3 px-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi admin"
            className="shrink-0 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 lg:hidden"
          >
            &#9776;
          </button>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.28em] text-champagne-300/80">Admin Console</p>
            <h1 className="font-display truncate text-xl tracking-wide text-white">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="relative hidden w-64 sm:block md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari pengguna, laporan, atau kategori..."
              className="input-lux rounded-full py-2 pl-4 pr-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                &#10005;
              </button>
            )}
          </div>

          <span className="whitespace-nowrap rounded-full border border-champagne-300/30 bg-champagne-400/10 px-3.5 py-1 text-[10px] uppercase tracking-[0.2em] text-champagne-200">
            Full Access
          </span>
        </div>
      </div>

      {/* Kolom Pencarian Mobile (< 640px) */}
      <div className="border-t border-white/[0.05] px-5 py-2.5 sm:hidden">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari pengguna, laporan, atau kategori..."
            className="input-lux rounded-full py-2 pl-4 pr-8 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Bersihkan pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              &#10005;
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
