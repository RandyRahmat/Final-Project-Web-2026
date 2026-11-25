import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-transparent px-6 py-20 text-center text-zinc-100">
      <p className="eyebrow">KARYA TIDAK DITEMUKAN</p>

      <div className="font-display italic text-gold mt-4 text-[8rem] leading-none sm:text-[11rem]">
        404
      </div>

      <h1 className="font-display mt-4 text-3xl text-white sm:text-4xl">
        Karya ini telah hilang dari pameran.
      </h1>

      <p className="mt-3 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
        Halaman atau karya seni yang kamu cari mungkin telah dipindahkan, dihapus, atau alamat URL tidak sesuai.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link href="/home" className="btn-gold rounded-full px-7 py-3 text-[10px] tracking-[0.25em]">
          KEMBALI KE GALERI
        </Link>
        <Link href="/explore" className="btn-ghost rounded-full px-7 py-3 text-[10px] tracking-[0.25em]">
          JELAJAHI KARYA
        </Link>
      </div>
    </main>
  );
}
