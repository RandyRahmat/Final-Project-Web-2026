export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090909]/95 text-white backdrop-blur-xl">
      <div className="relative flex flex-col items-center gap-7">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin-slow absolute inset-[-30%] -z-10 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(212,175,106,0.35),transparent_45%)] blur-2xl" />
          <img src="/images/aesthe-logo.png" alt="Aesthe Logo" className="logo-glow h-20 w-20 object-contain mix-blend-screen" />
        </div>
        <div className="h-[1px] w-40 overflow-hidden bg-white/10">
          <div className="loader-bar h-full w-1/3 bg-gradient-to-r from-transparent via-champagne-300 to-transparent" />
        </div>
        <p className="text-shimmer text-[11px] uppercase tracking-[0.35em]">Memuat Ruang Karya</p>
      </div>
    </div>
  );
}
