"use client";

import { useState } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-provider";
import { logoutUserAction } from "@/actions/auth-actions";
import {
  deleteRejectedCuratorAccountAction,
  refreshCuratorSessionAction,
} from "@/actions/challenge-actions";

export default function PendingCuratorClient({ curator }) {
  const confirm = useConfirm();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const status = curator.curator_status || "Pending";
  const isApproved = status === "Approved";
  const isRejected = status === "Rejected";

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: "Hapus Akun Curator",
      message: "Hapus akun Curator ini secara permanen? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus Akun",
      variant: "danger",
    });
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    const res = await deleteRejectedCuratorAccountAction();
    setDeleting(false);
    if (res?.error) {
      setError(res.error);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-clip bg-transparent px-5 py-12 text-zinc-100">
      <div className="glass gradient-border relative z-10 w-full max-w-md rounded-3xl p-8 text-center sm:p-10">
        <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
          <div className="animate-spin-slow absolute inset-[-30%] -z-10 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(212,175,106,0.3),transparent_45%)] blur-xl" />
          <img src="/images/aesthe-logo.png" alt="Aesthe" className="logo-glow h-12 w-12 object-contain mix-blend-screen" />
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            isApproved
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
              : isRejected
              ? "border-red-500/40 bg-red-500/15 text-red-300"
              : "border-amber-400/40 bg-amber-500/15 text-amber-300"
          }`}
        >
          {!isApproved && !isRejected && <span className="live-dot text-amber-400" />}
          Status Curator: {status}
        </span>

        <h1 className="font-display mt-5 text-3xl text-white sm:text-4xl">
          {isApproved
            ? "Akun Anda Telah Disetujui!"
            : isRejected
            ? "Pendaftaran Curator Ditolak"
            : "Akun Anda Sedang Ditinjau"}
        </h1>

        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {isApproved
            ? `Selamat ${curator.display_name}! Admin telah menyetujui pendaftaran Curator Anda. Klik tombol di bawah untuk masuk ke Curator Dashboard.`
            : isRejected
            ? `Mohon maaf ${curator.display_name}, pendaftaran akun Curator Anda (@${curator.username}) ditolak oleh Admin. Anda dapat menghapus akun ini untuk mendaftar kembali.`
            : `Halo ${curator.display_name}, akun Curator Anda (@${curator.username}) sedang menunggu persetujuan dari Admin sebelum dapat mengakses Curator Dashboard. Sementara menunggu, Anda tetap dapat menjelajahi galeri.`}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="mt-7 space-y-3">
          {isApproved && (
            <form action={refreshCuratorSessionAction}>
              <button type="submit" className="btn-gold w-full rounded-full py-3 text-[10px] uppercase tracking-[0.2em]">
                Masuk ke Curator Dashboard &rarr;
              </button>
            </form>
          )}

          {isRejected && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteAccount}
              className="w-full rounded-full border border-red-500/50 bg-red-500/15 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
            >
              {deleting ? "Menghapus Akun..." : "Delete Account"}
            </button>
          )}

          <Link href="/home" className="btn-ghost block w-full rounded-full py-2.5 text-[10px] uppercase tracking-[0.18em]">
            Jelajahi Galeri (/home)
          </Link>

          <form action={logoutUserAction}>
            <button type="submit" className="w-full py-2 text-[11px] text-zinc-500 transition hover:text-red-400">
              Keluar (Logout)
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
