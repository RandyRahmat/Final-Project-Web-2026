export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [contain:strict]">
      <div className="absolute -left-56 -top-56 h-[860px] w-[860px] rounded-full bg-[radial-gradient(circle,rgba(212,175,106,0.09)_0%,rgba(212,175,106,0.03)_38%,transparent_70%)]" />
      <div className="absolute -right-48 top-1/4 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.065)_0%,rgba(139,92,246,0.02)_40%,transparent_70%)]" />
      <div className="absolute -bottom-64 left-1/3 h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.045)_0%,transparent_68%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.62)_100%)]" />
    </div>
  );
}
