"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import {
  verifyCuratorAction,
  deleteUserAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  dismissReportAction,
  takeDownArtworkAction,
} from "@/actions/admin-actions";

const TAB_TITLES = {
  overview: "Statistik Platform",
  curators: "Verifikasi Curator",
  moderation: "Moderasi Konten",
  users: "Manajemen Pengguna",
  categories: "Manajemen Kategori",
};

function formatDate(dateValue) {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboardClient({
  adminUser,
  stats,
  pendingCurators,
  moderationQueue,
  users,
  categories,
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const [busyKey, setBusyKey] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });

  // Edit category inline state
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");

  const [createCatState, createCatAction, isCreatingCat] = useActionState(createCategoryAction, null);

  const q = searchQuery.trim().toLowerCase();

  const filteredCurators = useMemo(() => {
    if (!q) return pendingCurators;
    return pendingCurators.filter(
      (c) =>
        c.display_name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [pendingCurators, q]);

  const filteredModeration = useMemo(() => {
    if (!q) return moderationQueue;
    return moderationQueue.filter(
      (item) =>
        item.artwork_title.toLowerCase().includes(q) ||
        item.artist_name.toLowerCase().includes(q) ||
        (item.reports || []).some((r) => (r.reason || "").toLowerCase().includes(q))
    );
  }, [moderationQueue, q]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesSearch =
        !q ||
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, q]);

  const filteredCategories = useMemo(() => {
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, q]);

  const runAction = async (key, fn, successMessage) => {
    setBusyKey(key);
    setNotice({ type: "", text: "" });
    const res = await fn();
    setBusyKey("");
    if (res?.error) {
      setNotice({ type: "error", text: res.error });
      toast.error("Tindakan gagal", res.error);
    } else if (successMessage) {
      setNotice({ type: "success", text: successMessage });
      toast.success(successMessage);
    }
    return res;
  };

  const handleVerifyCurator = async (curator, status) => {
    const isApprove = status === "Approved";
    const ok = await confirm({
      title: isApprove ? "Setujui Curator" : "Tolak Curator",
      message: `Yakin ingin ${isApprove ? "menyetujui (Approve)" : "menolak (Reject)"} pendaftaran Curator "${curator.display_name}"?`,
      confirmText: isApprove ? "Ya, Setujui" : "Ya, Tolak",
      variant: isApprove ? "gold" : "danger",
    });
    if (!ok) return;
    runAction(
      `curator-${curator.id}`,
      () => verifyCuratorAction(curator.id, status),
      `Curator ${curator.display_name} berhasil diubah menjadi ${status}.`
    );
  };

  const handleDeleteUser = async (u) => {
    const ok = await confirm({
      title: "Hapus Pengguna",
      message: `Hapus akun ${u.role} "${u.display_name}" (@${u.username}) secara permanen?`,
      confirmText: "Ya, Hapus Akun",
      variant: "danger",
    });
    if (!ok) return;
    runAction(
      `user-${u.id}`,
      () => deleteUserAction(u.id),
      `Pengguna ${u.display_name} berhasil dihapus.`
    );
  };

  const handleDismissReport = async (item) => {
    const ok = await confirm({
      title: "Tolak Laporan",
      message: `Tolak (Dismiss) semua laporan untuk karya "${item.artwork_title}"?`,
      confirmText: "Ya, Dismiss",
      variant: "gold",
    });
    if (!ok) return;
    runAction(
      `dismiss-${item.artwork_id}`,
      () => dismissReportAction(item.artwork_id),
      `Laporan untuk "${item.artwork_title}" berhasil di-dismiss.`
    );
  };

  const handleTakeDown = async (item) => {
    const ok = await confirm({
      title: "Take Down Karya",
      message: `Take down karya "${item.artwork_title}"? Karya akan dihapus permanen dari platform.`,
      confirmText: "Ya, Take Down",
      variant: "danger",
    });
    if (!ok) return;
    runAction(
      `takedown-${item.artwork_id}`,
      () => takeDownArtworkAction(item.artwork_id),
      `Karya "${item.artwork_title}" berhasil di-take down.`
    );
  };

  const handleSaveCategoryEdit = async (categoryId) => {
    const res = await runAction(
      `edit-cat-${categoryId}`,
      () => updateCategoryAction(categoryId, editingCatName),
      "Kategori berhasil diperbarui."
    );
    if (res?.success) {
      setEditingCatId(null);
      setEditingCatName("");
    }
  };

  const handleDeleteCategory = async (cat) => {
    const ok = await confirm({
      title: "Hapus Kategori",
      message: `Hapus kategori "${cat.name}" secara permanen?`,
      confirmText: "Ya, Hapus",
      variant: "danger",
    });
    if (!ok) return;
    runAction(
      `del-cat-${cat.id}`,
      () => deleteCategoryAction(cat.id),
      `Kategori "${cat.name}" berhasil dihapus.`
    );
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCuratorsCount={pendingCurators.length}
        pendingReportsCount={moderationQueue.length}
        adminUser={adminUser}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      <div className={`relative z-10 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <Navbar
          pageTitle={TAB_TITLES[activeTab]}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
          {notice.text && (
            <div
              className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-xs ${
                notice.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              <span>{notice.text}</span>
              <button type="button" onClick={() => setNotice({ type: "", text: "" })} className="ml-4 text-sm opacity-70 hover:opacity-100">
                ×
              </button>
            </div>
          )}

          {/* TAB 1: STATISTIK PLATFORM */}
          {activeTab === "overview" && (
            <section className="space-y-8">
              <div>
                <p className="eyebrow">PLATFORM ANALYTICS</p>
                <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">Ringkasan Data Agregasi Platform</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="glass spotlight card-lux rounded-2xl border border-white/15 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Total Pengguna</p>
                  <p className="font-display mt-2 text-4xl text-gold">
                    {stats.Admin + stats.Member + stats.Curator}
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-400">
                    Admin: {stats.Admin} &bull; Member: {stats.Member} &bull; Curator: {stats.Curator}
                  </p>
                </div>

                <div className="glass spotlight card-lux rounded-2xl border border-white/15 p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Total Karya Seni</p>
                  <p className="font-display mt-2 text-4xl text-gold">{stats.total_artworks}</p>
                  <p className="mt-2 text-[11px] text-zinc-500">Tersebar di {categories.length} kategori</p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("moderation")}
                  className="glass spotlight card-lux rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-5 text-left transition hover:border-red-400/50"
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-red-300/80">Laporan Pending</p>
                  <p className="font-display mt-2 text-4xl text-red-300">{stats.pending_reports}</p>
                  <p className="mt-2 text-[11px] text-zinc-400">{moderationQueue.length} karya menunggu moderasi &rarr;</p>
                </button>

                <div className="glass spotlight card-lux rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">Challenge Aktif</p>
                  <p className="font-display mt-2 text-4xl text-emerald-300">{stats.active_challenges}</p>
                  <p className="mt-2 text-[11px] text-zinc-400">{stats.pending_curators} Curator menunggu verifikasi</p>
                </div>
              </div>

              {/* Aksi Cepat */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="glass rounded-2xl border border-white/15 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl text-white">Antrian Verifikasi Curator</h3>
                    <button type="button" onClick={() => setActiveTab("curators")} className="text-[11px] text-champagne-200 hover:text-white">
                      Lihat semua &rarr;
                    </button>
                  </div>
                  {pendingCurators.length === 0 ? (
                    <p className="mt-6 text-xs text-zinc-500">Tidak ada pendaftaran Curator yang menunggu persetujuan.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {pendingCurators.slice(0, 4).map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white">{c.display_name}</p>
                            <p className="truncate text-[10px] text-zinc-500">@{c.username} &bull; {c.email}</p>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <button type="button" disabled={busyKey === `curator-${c.id}`} onClick={() => handleVerifyCurator(c, "Approved")} className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-300 transition hover:bg-emerald-500 hover:text-black">
                              Approve
                            </button>
                            <button type="button" disabled={busyKey === `curator-${c.id}`} onClick={() => handleVerifyCurator(c, "Rejected")} className="rounded-lg bg-red-500/20 px-2.5 py-1 text-[10px] font-medium text-red-300 transition hover:bg-red-500 hover:text-white">
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass rounded-2xl border border-white/15 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl text-white">Distribusi Pengguna per Peran</h3>
                    <button type="button" onClick={() => setActiveTab("users")} className="text-[11px] text-champagne-200 hover:text-white">
                      Kelola &rarr;
                    </button>
                  </div>
                  <div className="mt-5 space-y-4">
                    {[
                      { label: "Member (Kreator)", count: stats.Member, color: "bg-gradient-to-r from-champagne-200 to-champagne-400" },
                      { label: "Curator (Penyelenggara)", count: stats.Curator, color: "bg-amber-400" },
                      { label: "Admin (Pengelola)", count: stats.Admin, color: "bg-emerald-400" },
                    ].map((row) => {
                      const totalUsers = Math.max(1, stats.Admin + stats.Member + stats.Curator);
                      const pct = Math.round((row.count / totalUsers) * 100);
                      return (
                        <div key={row.label}>
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="text-zinc-300">{row.label}</span>
                            <span className="text-zinc-400">{row.count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: VERIFIKASI CURATOR */}
          {activeTab === "curators" && (
            <section>
              <div className="mb-6">
                <p className="eyebrow">CURATOR VERIFICATION</p>
                <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">Pendaftaran Curator Menunggu Persetujuan ({filteredCurators.length})</h2>
              </div>

              {filteredCurators.length === 0 ? (
                <div className="glass rounded-2xl border border-white/10 px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Tidak ada pendaftar Curator berstatus Pending saat ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCurators.map((c) => (
                    <div key={c.id} className="glass spotlight flex flex-col gap-4 rounded-2xl border border-white/15 p-5 transition hover:border-champagne-300/40 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-medium text-white">{c.display_name}</h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-300">
                            <span className="live-dot text-amber-400" />
                            Pending
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">@{c.username} &bull; {c.email}</p>
                        <p className="mt-1 text-[10px] text-zinc-500">Mendaftar pada {formatDate(c.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyKey === `curator-${c.id}`}
                          onClick={() => handleVerifyCurator(c, "Approved")}
                          className="rounded-lg bg-emerald-500 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-emerald-400 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `curator-${c.id}`}
                          onClick={() => handleVerifyCurator(c, "Rejected")}
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 3: MODERASI KONTEN */}
          {activeTab === "moderation" && (
            <section>
              <div className="mb-6">
                <p className="eyebrow">MODERATION QUEUE</p>
                <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">Antrian Moderasi Laporan Karya ({filteredModeration.length})</h2>
              </div>

              {filteredModeration.length === 0 ? (
                <div className="glass rounded-2xl border border-white/10 px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Tidak ada laporan karya yang perlu ditinjau saat ini.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredModeration.map((item) => (
                    <div key={item.artwork_id} className="glass spotlight grid grid-cols-1 gap-5 rounded-2xl border border-white/15 p-5 lg:grid-cols-12">
                      <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900 lg:col-span-3">
                        <img src={item.artwork_image_url} alt={item.artwork_title} className="h-48 w-full object-cover" />
                      </div>

                      <div className="flex flex-col justify-between lg:col-span-9">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="rounded-full border border-champagne-300/30 bg-champagne-400/10 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-champagne-200">
                                {item.category_name}
                              </span>
                              <h3 className="font-display mt-2 text-2xl text-white">{item.artwork_title}</h3>
                              <p className="text-xs text-zinc-400">
                                Kreator:{" "}
                                <Link href={`/creators/${item.artist_username}`} className="text-champagne-200 underline hover:text-white">
                                  {item.artist_name} (@{item.artist_username})
                                </Link>
                              </p>
                            </div>
                            <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-[10px] font-semibold text-red-300">
                              ⚑ {item.report_count} Laporan
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/40 p-3.5">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Alasan Pelapor</p>
                            {(item.reports || []).map((rep) => (
                              <div key={rep.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-2 text-xs last:border-0 last:pb-0">
                                <span className="text-zinc-200">&ldquo;{rep.reason}&rdquo;</span>
                                <span className="text-[10px] text-zinc-500">
                                  oleh @{rep.reporter_username} · {formatDate(rep.created_at)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
                          <button
                            type="button"
                            disabled={busyKey === `dismiss-${item.artwork_id}`}
                            onClick={() => handleDismissReport(item)}
                            className="btn-ghost rounded-lg px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] disabled:opacity-50"
                          >
                            Dismiss Report
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `takedown-${item.artwork_id}`}
                            onClick={() => handleTakeDown(item)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-red-500 disabled:opacity-50"
                          >
                            Take Down Karya
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 4: MANAJEMEN PENGGUNA */}
          {activeTab === "users" && (
            <section>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">USER MANAGEMENT</p>
                  <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">Daftar Pengguna ({filteredUsers.length})</h2>
                </div>

                <div className="flex gap-2">
                  {["All", "Admin", "Member", "Curator"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleFilter(r)}
                      className={`rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] transition ${
                        roleFilter === r
                          ? "chip-active"
                          : "border-white/10 text-zinc-400 hover:border-champagne-300/40 hover:text-champagne-50"
                      }`}
                    >
                      {r === "All" ? "Semua" : r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass overflow-x-auto rounded-2xl border border-white/15">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="border-b border-white/[0.08] bg-black/40 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <tr>
                      <th className="px-5 py-3.5">Pengguna</th>
                      <th className="px-5 py-3.5">Peran</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Karya</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {filteredUsers.map((u) => {
                      const canDelete = u.role !== "Admin" && Number(u.id) !== Number(adminUser.id);
                      return (
                        <tr key={u.id} className="transition hover:bg-white/[0.03]">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-white">{u.display_name}</p>
                            <p className="text-[10px] text-zinc-500">@{u.username} &bull; {u.email}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                                u.role === "Admin"
                                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                  : u.role === "Curator"
                                  ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
                                  : "border-champagne-300/25 bg-champagne-400/10 text-champagne-200"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-400">
                            {u.role === "Curator" ? u.curator_status : "Active"}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-400">{u.artwork_count}</td>
                          <td className="px-5 py-3.5 text-right">
                            {canDelete ? (
                              <button
                                type="button"
                                disabled={busyKey === `user-${u.id}`}
                                onClick={() => handleDeleteUser(u)}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                              >
                                Hapus
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-600">Dilindungi</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 5: MANAJEMEN KATEGORI (CRUD) */}
          {activeTab === "categories" && (
            <section className="max-w-3xl space-y-6">
              <div>
                <p className="eyebrow">CATEGORY MANAGEMENT</p>
                <h2 className="font-display mt-1.5 text-3xl text-white sm:text-4xl">Manajemen Kategori Karya ({categories.length})</h2>
              </div>

              {/* Form Tambah Kategori */}
              <div className="glass rounded-2xl border border-white/15 p-5">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-400">Tambah Kategori Baru</p>
                {createCatState?.error && (
                  <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {createCatState.error}
                  </p>
                )}
                {createCatState?.success && (
                  <p className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    {createCatState.message}
                  </p>
                )}
                <form action={createCatAction} className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: Fotografi, UI/UX, 3D Art..."
                    className="input-lux flex-1"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingCat}
                    className="btn-gold rounded-xl px-5 py-2.5 text-[10px] uppercase tracking-[0.18em]"
                  >
                    {isCreatingCat ? "Menambah..." : "＋ Tambah"}
                  </button>
                </form>
              </div>

              {/* Daftar Kategori */}
              <div className="glass divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/15">
                {filteredCategories.map((cat) => {
                  const isEditingThis = editingCatId === cat.id;
                  return (
                    <div key={cat.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-white/[0.02]">
                      {isEditingThis ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="input-lux flex-1 py-1.5"
                          />
                          <button
                            type="button"
                            disabled={busyKey === `edit-cat-${cat.id}`}
                            onClick={() => handleSaveCategoryEdit(cat.id)}
                            className="btn-gold rounded-lg px-3 py-1.5 text-[10px]"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(null);
                              setEditingCatName("");
                            }}
                            className="btn-ghost rounded-lg px-3 py-1.5 text-[10px]"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-medium text-white">{cat.name}</p>
                            <p className="text-[10px] text-zinc-500">{cat.artwork_count} karya menggunakan kategori ini</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              className="btn-ghost rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-wider"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={busyKey === `del-cat-${cat.id}`}
                              onClick={() => handleDeleteCategory(cat)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                            >
                              Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
