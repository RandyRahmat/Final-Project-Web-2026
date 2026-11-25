export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-blob absolute -left-40 -top-40 h-[620px] w-[620px] rounded-full bg-champagne-400/[0.07] blur-[140px]" />
      <div className="aurora-blob aurora-blob-delay absolute -right-32 top-1/3 h-[520px] w-[520px] rounded-full bg-violet-500/[0.05] blur-[150px]" />
      <div className="aurora-blob aurora-blob-slow absolute -bottom-52 left-1/3 h-[560px] w-[560px] rounded-full bg-cyan-400/[0.035] blur-[150px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]" />
    </div>
  );
}
