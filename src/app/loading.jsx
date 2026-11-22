export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0b0c] text-white">
        <div className="relative flex flex-col items-center gap-6">
            <img src="/images/aesthe-logo.png" alt="Aesthe Logo" className="h-20 w-20 object-contain mix-blend-screen logo-glow" />
            <div className="h-[1px] w-32 overflow-hidden bg-zinc-800">
            <div className="h-full w-1/2 animate-pulse bg-white" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Memuat Ruang Karya</p>
        </div>
        </div>
    );
}