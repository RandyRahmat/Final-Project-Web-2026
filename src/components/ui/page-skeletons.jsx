function Bone({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton-shimmer ${className}`} />;
}

export function WorkspaceSkeletonShell({ children, hideTopBar = false }) {
  return (
    <div role="status" aria-label="Memuat halaman" className="min-h-screen w-full text-white">
      {/* Desktop Sidebar Placeholder */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-white/[0.07] bg-[#0a0a0b]/80 px-6 py-7 backdrop-blur-2xl lg:flex">
        <div className="mb-10 flex items-center gap-3">
          <Bone className="h-9 w-9 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Bone className="h-3.5 w-24 rounded-md" />
            <Bone className="h-2 w-16 rounded-md" />
          </div>
        </div>

        <Bone className="mb-4 h-2 w-20 rounded" />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <Bone className="h-14 w-full rounded-xl" />
          <Bone className="h-9 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main Area */}
      <div className="min-h-screen lg:pl-[250px]">
        {!hideTopBar && (
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b]/70 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-3">
              <Bone className="h-8 w-8 rounded-lg lg:hidden" />
              <Bone className="h-5 w-36 rounded-md" />
            </div>
            <div className="flex items-center gap-2.5">
              <Bone className="hidden h-9 w-48 rounded-full sm:block" />
              <Bone className="h-9 w-24 rounded-full" />
            </div>
          </header>
        )}

        <main className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-6 sm:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Bar Placeholder */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex h-16 w-full max-w-[420px] items-center justify-around rounded-[24px] border border-white/[0.08] bg-[#101014]/90 px-4 backdrop-blur-2xl">
          {[0, 1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-7 w-7 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <WorkspaceSkeletonShell>
      {/* Featured Hero */}
      <section className="mb-10 grid gap-6 lg:grid-cols-12">
        <Bone className="h-[300px] rounded-2xl sm:h-[360px] lg:col-span-7" />
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 lg:col-span-5">
          <div className="space-y-4">
            <Bone className="h-3 w-28 rounded" />
            <Bone className="h-9 w-4/5 rounded-lg" />
            <Bone className="h-4 w-full rounded" />
            <Bone className="h-4 w-3/4 rounded" />
          </div>
          <div className="mt-6 flex items-center justify-between pt-4">
            <div className="flex items-center gap-3">
              <Bone className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Bone className="h-3.5 w-28 rounded" />
                <Bone className="h-2.5 w-20 rounded" />
              </div>
            </div>
            <Bone className="h-9 w-28 rounded-full" />
          </div>
        </div>
      </section>

      {/* Podium Row */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <Bone className="h-6 w-48 rounded-md" />
          <Bone className="h-4 w-24 rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Bone className="h-6 w-40 rounded-md" />
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Bone key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <Bone className="aspect-[4/3] w-full rounded-none border-0" />
              <div className="space-y-2.5 p-4">
                <Bone className="h-4 w-3/4 rounded" />
                <Bone className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceSkeletonShell>
  );
}

export function GalleryGridSkeleton() {
  return (
    <WorkspaceSkeletonShell>
      <div className="mb-7 space-y-3">
        <Bone className="h-3 w-28 rounded" />
        <Bone className="h-9 w-64 rounded-lg" />
        <Bone className="h-4 w-96 max-w-full rounded" />
      </div>

      {/* Filter Chips */}
      <div className="mb-7 flex flex-wrap items-center gap-2.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <Bone className="aspect-[4/3] w-full rounded-none border-0" />
            <div className="space-y-2.5 p-4">
              <Bone className="h-4 w-3/4 rounded" />
              <div className="flex items-center justify-between">
                <Bone className="h-3 w-24 rounded" />
                <Bone className="h-5 w-12 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </WorkspaceSkeletonShell>
  );
}

export function ArtworkDetailSkeleton() {
  return (
    <WorkspaceSkeletonShell>
      <div className="mb-6 flex items-center justify-between">
        <Bone className="h-8 w-36 rounded-full" />
        <Bone className="h-8 w-32 rounded-full" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Bone className="aspect-[4/3] w-full rounded-2xl" />
        </div>

        <div className="space-y-5 lg:col-span-5">
          <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <Bone className="h-3 w-24 rounded" />
            <Bone className="h-8 w-4/5 rounded-lg" />
            <Bone className="h-4 w-full rounded" />
            <Bone className="h-4 w-2/3 rounded" />

            <div className="flex items-center gap-3 pt-4">
              <Bone className="h-11 w-11 rounded-full" />
              <div className="space-y-1.5">
                <Bone className="h-4 w-32 rounded" />
                <Bone className="h-3 w-20 rounded" />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4">
              <Bone className="h-10 flex-1 rounded-xl" />
              <Bone className="h-10 flex-1 rounded-xl" />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <Bone className="h-4 w-32 rounded" />
            <Bone className="h-16 w-full rounded-xl" />
            <Bone className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </WorkspaceSkeletonShell>
  );
}

export function ChallengesSkeleton() {
  return (
    <WorkspaceSkeletonShell>
      <div className="mb-7 space-y-3">
        <Bone className="h-3 w-32 rounded" />
        <Bone className="h-9 w-72 rounded-lg" />
        <Bone className="h-4 w-96 max-w-full rounded" />
      </div>

      <div className="mb-7 flex gap-2.5">
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between">
              <Bone className="h-6 w-24 rounded-full" />
              <Bone className="h-4 w-20 rounded" />
            </div>
            <Bone className="h-6 w-4/5 rounded-md" />
            <Bone className="h-4 w-full rounded" />
            <Bone className="h-4 w-2/3 rounded" />
            <div className="pt-2">
              <Bone className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </WorkspaceSkeletonShell>
  );
}

export function ProfileSkeleton() {
  return (
    <WorkspaceSkeletonShell>
      <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Bone className="h-20 w-20 shrink-0 rounded-full" />
          <div className="space-y-2.5">
            <Bone className="h-7 w-48 rounded-lg" />
            <Bone className="h-4 w-32 rounded" />
            <Bone className="h-3.5 w-64 max-w-full rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <Bone className="h-14 w-24 rounded-xl" />
          <Bone className="h-14 w-24 rounded-xl" />
          <Bone className="h-14 w-24 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <Bone className="aspect-[4/3] w-full rounded-none border-0" />
            <div className="space-y-2 p-4">
              <Bone className="h-4 w-3/4 rounded" />
              <Bone className="h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </WorkspaceSkeletonShell>
  );
}

export function MessagesSkeleton() {
  return (
    <WorkspaceSkeletonShell>
      <div className="grid h-[75vh] gap-5 lg:grid-cols-12">
        <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 lg:col-span-4">
          <Bone className="h-10 w-full rounded-xl" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl p-2">
              <Bone className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bone className="h-3.5 w-28 rounded" />
                <Bone className="h-3 w-40 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 lg:col-span-8 lg:flex">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
            <Bone className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Bone className="h-4 w-36 rounded" />
              <Bone className="h-3 w-20 rounded" />
            </div>
          </div>

          <div className="space-y-4 py-6">
            <Bone className="h-12 w-2/5 rounded-2xl" />
            <Bone className="ml-auto h-14 w-1/2 rounded-2xl" />
            <Bone className="h-12 w-1/3 rounded-2xl" />
          </div>

          <Bone className="h-12 w-full rounded-full" />
        </div>
      </div>
    </WorkspaceSkeletonShell>
  );
}

export function DashboardSkeleton() {
  return (
    <WorkspaceSkeletonShell>
      <div className="mb-7 space-y-3">
        <Bone className="h-3 w-32 rounded" />
        <Bone className="h-9 w-64 rounded-lg" />
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <Bone className="h-3 w-24 rounded" />
            <Bone className="h-8 w-16 rounded-md" />
            <Bone className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Table / List */}
      <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="mb-4 flex gap-2">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </WorkspaceSkeletonShell>
  );
}
