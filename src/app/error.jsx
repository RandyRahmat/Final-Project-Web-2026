"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("Application error boundary:", error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-transparent px-5 py-16 text-zinc-100">
      <div className="glass gradient-border relative z-10 w-full max-w-md rounded-3xl p-8 text-center sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-xl text-red-300">
          !
        </div>

        <p className="eyebrow">TERJADI KESALAHAN</p>
        <h1 className="font-display mt-3 text-3xl text-white sm:text-4xl">
          Ada Gangguan Sementara<span className="text-champagne-400">.</span>
        </h1>

        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          Permintaan tidak dapat diproses saat ini. Silakan coba muat ulang halaman atau kembali ke beranda galeri Aesthe.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="btn-gold rounded-full px-6 py-2.5 text-[10px] uppercase tracking-[0.18em]"
          >
            Coba Lagi
          </button>
          <Link
            href="/home"
            className="btn-ghost rounded-full px-6 py-2.5 text-[10px] uppercase tracking-[0.18em]"
          >
            Kembali ke Home
          </Link>
        </div>
      </div>
    </main>
  );
}
