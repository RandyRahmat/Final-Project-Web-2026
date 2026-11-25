"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/app-sidebar";
import { useConfirm } from "@/components/ui/confirm-provider";
import QuickSearchTrigger, { QuickSearchIconButton } from "@/components/ui/quick-search-trigger";
import { useToast } from "@/components/ui/toast-provider";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import {
  updateProfileAction,
  updateAccountAction,
  updateArtworkAction,
  deleteArtworkAction,
  toggleFollowAction,
} from "@/actions/profile-actions";

export default function ProfileClient({
  currentUser,
  profile,
  myArtworks,
  categories,
  mySubmissions,
  favoritesCount,
  followersCount = 0,
  followingList = [],
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const role = profile.role || currentUser.role;
  const isMember = role === "Member";

  const [activeTab, setActiveTab] = useState(isMember ? "artworks" : "profile");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, toggleSidebarCollapsed] = useSidebarCollapsed();
  const [editingArt, setEditingArt] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [unfollowingId, setUnfollowingId] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");

  const [profileState, profileFormAction, isSavingProfile] = useActionState(updateProfileAction, null);
  const [accountState, accountFormAction, isSavingAccount] = useActionState(updateAccountAction, null);
  const [editArtState, editArtFormAction, isSavingArt] = useActionState(async (prevState, formData) => {
    const res = await updateArtworkAction(prevState, formData);
    if (res?.success) {
      setEditingArt(null);
    }
    return res;
  }, null);

  const totalReactionsReceived = myArtworks.reduce((sum, art) => sum + (art.total_reactions || 0), 0);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleDeleteArtwork = async (artworkId, title) => {
    const confirmed = await confirm({
      title: "Hapus Karya",
      message: `Hapus karya "${title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: "Ya, Hapus Karya",
      variant: "danger",
    });
    if (!confirmed) return;
    setDeletingId(artworkId);
    await deleteArtworkAction(artworkId);
    setDeletingId(null);
    toast.success("Karya berhasil dihapus", title);
  };

  const handleUnfollow = async (creatorId) => {
    const target = followingList.find((c) => c.id === creatorId);
    setUnfollowingId(creatorId);
    await toggleFollowAction(creatorId);
    setUnfollowingId(null);
    toast.info("Berhenti mengikuti kreator", target ? `@${target.username}` : "");
  };

  const tabs = isMember
    ? [
        { id: "artworks", label: "My Artworks", count: myArtworks.length },
        { id: "following", label: "Following", count: followingList.length },
        { id: "submissions", label: "My Submissions", count: mySubmissions.length },
        { id: "profile", label: "Edit Profile" },
        { id: "account", label: "Account Settings" },
      ]
    : [
        { id: "profile", label: "Edit Profile" },
        { id: "account", label: "Account Settings" },
      ];

  return (
    <main className="min-h-screen overflow-x-clip bg-transparent text-zinc-100">
      <AppSidebar
        currentUser={{
          ...currentUser,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          curatorStatus: profile.curator_status,
        }}
        activeItem="profile"
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        mobileMenu={mobileMenu}
        onCloseMobile={() => setMobileMenu(false)}
        publicPortfolioUsername={profile.username}
      />

      {/* MAIN CONTENT */}
      <div className={`relative z-10 min-h-screen transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[78px]" : "lg:ml-[250px]"}`}>
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/80 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              PERSONAL / <span className="text-champagne-200">PROFILE DASHBOARD</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <img src="/images/aesthe-logo.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-xs tracking-[0.25em]">AESTHE</span>
            </div>
          </div>

          <QuickSearchTrigger />

          <div className="flex items-center gap-3">
            <QuickSearchIconButton />
            {isMember && (
              <Link href={`/creators/${profile.username}`} className="btn-ghost rounded-full px-4 py-1.5 text-[10px] tracking-[0.15em]">
                LIHAT PROFIL PUBLIK ↗
              </Link>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {/* PROFILE HERO CARD */}
          <section className="glass spotlight relative overflow-hidden rounded-3xl border border-white/15 p-6 sm:p-9">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-champagne-400/[0.08] via-transparent to-transparent" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="w-fit shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-400 to-champagne-700 p-[2px] shadow-[0_0_35px_rgba(212,175,106,0.28)]">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-3xl font-light text-white">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
                    ) : (
                      profile.display_name?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-display text-4xl text-white sm:text-5xl">
                      {profile.display_name}
                    </h1>
                    <span className="rounded-full border border-champagne-300/30 bg-champagne-400/10 px-3 py-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-champagne-200">
                      {role}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">@{profile.username} &bull; {profile.email}</p>
                  <p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-300">
                    {profile.bio || "Belum ada bio. Lengkapi deskripsi singkat profilmu di tab Edit Profile."}
                  </p>
                  {profile.external_link && (
                    <a
                      href={profile.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-champagne-300 underline decoration-champagne-400/40 underline-offset-4 transition hover:text-champagne-100"
                    >
                      🔗 {profile.external_link.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>

              {isMember && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 md:grid-cols-3">
                  <div className="glass rounded-2xl border border-white/10 px-4 py-3 text-center">
                    <p className="font-display text-2xl text-gold">{myArtworks.length}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Artworks</p>
                  </div>
                  <div className="glass rounded-2xl border border-white/10 px-4 py-3 text-center">
                    <p className="font-display text-2xl text-gold">{followersCount}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Followers</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("following")} className="glass rounded-2xl border border-white/10 px-4 py-3 text-center transition hover:border-champagne-300/45">
                    <p className="font-display text-2xl text-gold">{followingList.length}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Following</p>
                  </button>
                  <div className="glass rounded-2xl border border-white/10 px-4 py-3 text-center">
                    <p className="font-display text-2xl text-gold">{totalReactionsReceived}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Reactions</p>
                  </div>
                  <Link href="/favorites" className="glass rounded-2xl border border-white/10 px-4 py-3 text-center transition hover:border-champagne-300/45">
                    <p className="font-display text-2xl text-amber-300">{favoritesCount}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Favorites</p>
                  </Link>
                  <button type="button" onClick={() => setActiveTab("submissions")} className="glass rounded-2xl border border-white/10 px-4 py-3 text-center transition hover:border-champagne-300/45">
                    <p className="font-display text-2xl text-gold">{mySubmissions.length}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Submissions</p>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* TABS */}
          <div className="mt-8 flex gap-2 overflow-x-auto border-b border-white/[0.08] pb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-2 text-[10px] uppercase tracking-[0.16em] transition ${
                  activeTab === tab.id
                    ? "chip-active"
                    : "border-white/10 text-zinc-400 hover:border-champagne-300/40 hover:text-champagne-50"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? "bg-black/15 text-black" : "bg-champagne-400/15 text-champagne-200"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: MY ARTWORKS */}
          {activeTab === "artworks" && isMember && (
            <section className="mt-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-3xl text-white">Karya yang Diunggah</h2>
                  <p className="mt-1 text-xs text-zinc-500">Kelola detail karya atau hapus karya milikmu sendiri.</p>
                </div>
                <Link href="/home" className="btn-gold rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.15em]">
                  ＋ Unggah Baru
                </Link>
              </div>

              {myArtworks.length === 0 ? (
                <div className="glass rounded-2xl border border-white/10 px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Kamu belum mengunggah karya apa pun.</p>
                  <Link href="/home" className="btn-gold mt-4 inline-flex rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.18em]">
                    Upload di Home
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {myArtworks.map((art) => (
                    <div key={art.id} data-reveal>
                      <article className="card-lux spotlight glass overflow-hidden rounded-2xl border border-white/15">
                        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                          <img src={art.image_url} alt={art.title} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
                          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[8px] tracking-wider text-white backdrop-blur-md">
                            {art.category_name.toUpperCase()}
                          </span>
                          <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] text-champagne-200 backdrop-blur-md">
                            ♥ {art.total_reactions}
                          </span>
                        </div>

                        <div className="p-4">
                          <Link href={`/artworks/${art.id}`} className="font-display block truncate text-xl text-white transition hover:text-champagne-200">
                            {art.title}
                          </Link>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">{art.description}</p>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {(art.tags || []).map((tag) => (
                              <span key={tag} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] text-zinc-400">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3">
                            <button
                              type="button"
                              onClick={() => setEditingArt(art)}
                              className="btn-ghost flex-1 rounded-lg py-2 text-[10px] font-medium uppercase tracking-[0.15em]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === art.id}
                              onClick={() => handleDeleteArtwork(art.id, art.title)}
                              className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                            >
                              {deletingId === art.id ? "Menghapus..." : "Hapus"}
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB FOLLOWING */}
          {activeTab === "following" && isMember && (
            <section className="mt-8">
              <h2 className="font-display text-3xl text-white">Kreator yang Kamu Ikuti</h2>
              <p className="mt-1 text-xs text-zinc-500">Kelola daftar kreator favorit yang sedang kamu ikuti.</p>

              {followingList.length === 0 ? (
                <div className="glass mt-6 rounded-2xl border border-white/10 px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Kamu belum mengikuti kreator mana pun.</p>
                  <Link href="/explore" className="btn-gold mt-4 inline-flex rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.18em]">
                    Temukan Kreator di Explore
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {followingList.map((creator) => (
                    <div key={creator.id} className="glass spotlight flex items-center justify-between gap-4 rounded-2xl border border-white/15 p-4 transition hover:border-champagne-300/40">
                      <Link href={`/creators/${creator.username}`} className="flex min-w-0 flex-1 items-center gap-3.5 transition hover:opacity-85">
                        <div className="shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[1.5px]">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-sm font-semibold text-white">
                            {creator.avatar_url ? (
                              <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" />
                            ) : (
                              creator.display_name?.charAt(0).toUpperCase() || "C"
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{creator.display_name}</p>
                          <p className="truncate text-[11px] text-zinc-500">
                            @{creator.username} &bull; {creator.artwork_count} karya
                          </p>
                          {creator.bio && (
                            <p className="mt-0.5 truncate text-[10px] text-zinc-400">{creator.bio}</p>
                          )}
                        </div>
                      </Link>

                      <button
                        type="button"
                        disabled={unfollowingId === creator.id}
                        onClick={() => handleUnfollow(creator.id)}
                        className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-[10px] uppercase tracking-wider text-zinc-300 transition hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50"
                      >
                        {unfollowingId === creator.id ? "..." : "Unfollow"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: MY SUBMISSIONS */}
          {activeTab === "submissions" && isMember && (
            <section className="mt-8">
              <h2 className="font-display text-3xl text-white">Riwayat Submisi Challenge</h2>
              <p className="mt-1 text-xs text-zinc-500">Daftar karya yang pernah kamu daftarkan ke event atau challenge komunitas.</p>

              {mySubmissions.length === 0 ? (
                <div className="glass mt-6 rounded-2xl border border-white/10 px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Belum ada karya yang di-submit ke challenge.</p>
                  <Link href="/challenges" className="btn-gold mt-4 inline-flex rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.18em]">
                    Lihat Active Challenges
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {mySubmissions.map((sub) => {
                    const isEnded = new Date(sub.challenge_end_date) < new Date();
                    return (
                      <div key={sub.id} className="glass spotlight flex flex-col gap-4 rounded-2xl border border-white/15 p-4 transition hover:border-champagne-300/40 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <img src={sub.artwork_image_url} alt={sub.artwork_title} className="h-16 w-16 shrink-0 rounded-xl border border-white/15 object-cover" />
                          <div>
                            <p className="font-display text-lg text-white">{sub.artwork_title}</p>
                            <p className="mt-0.5 text-xs text-zinc-400">Challenge: {sub.challenge_title}</p>
                            <p className="mt-1 text-[10px] text-champagne-300/90">Hadiah: {sub.challenge_prize}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {sub.winner_rank ? (
                            <span className="shine rounded-full border border-amber-400/50 bg-amber-500/20 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200">
                              ♛ Juara #{sub.winner_rank}
                            </span>
                          ) : (
                            <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider ${isEnded ? "border-zinc-700 bg-zinc-800/70 text-zinc-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>
                              {isEnded ? "Selesai" : "Berlangsung"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* TAB 3: EDIT PROFILE (PUBLIK) */}
          {activeTab === "profile" && (
            <section className="mt-8 max-w-2xl">
              <div className="glass rounded-3xl border border-white/15 p-6 sm:p-8">
                <h2 className="font-display text-3xl text-white">Informasi Profil Publik</h2>
                <p className="mt-1 text-xs text-zinc-500">Informasi ini akan tampil di halaman profil dan galeri karyamu.</p>

                {profileState?.error && (
                  <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                    {profileState.error}
                  </div>
                )}
                {profileState?.success && (
                  <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
                    {profileState.message}
                  </div>
                )}

                <form action={profileFormAction} className="mt-6 space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="w-fit shrink-0 rounded-full bg-gradient-to-br from-champagne-200 via-champagne-500 to-champagne-700 p-[2px]">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-2xl font-light text-white">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          profile.display_name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">
                        Foto Profil (JPG/PNG/WEBP, maks. 5MB)
                      </label>
                      <input
                        type="file"
                        name="avatar"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarChange}
                        className="input-lux file:mr-3 file:rounded-md file:border-0 file:bg-champagne-200 file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Nama Tampilan (Display Name)</label>
                    <input
                      type="text"
                      name="displayName"
                      required
                      defaultValue={profile.display_name}
                      className="input-lux"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Bio / Deskripsi Singkat</label>
                    <textarea
                      name="bio"
                      rows={3}
                      defaultValue={profile.bio || ""}
                      placeholder="Ceritakan sedikit tentang gaya karyamu..."
                      className="input-lux"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Tautan Eksternal (Instagram, Behance, atau Website)</label>
                    <input
                      type="url"
                      name="externalLink"
                      defaultValue={profile.external_link || ""}
                      placeholder="https://behance.net/username"
                      className="input-lux"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="btn-gold rounded-xl px-6 py-3 text-[10px] uppercase tracking-[0.2em]"
                  >
                    {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* TAB 4: ACCOUNT SETTINGS (PRIVAT) */}
          {activeTab === "account" && (
            <section className="mt-8 max-w-2xl">
              <div className="glass rounded-3xl border border-white/15 p-6 sm:p-8">
                <h2 className="font-display text-3xl text-white">Pengaturan Akun Privat</h2>
                <p className="mt-1 text-xs text-zinc-500">Perbarui alamat email atau ganti kata sandi akunmu.</p>

                {accountState?.error && (
                  <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                    {accountState.error}
                  </div>
                )}
                {accountState?.success && (
                  <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
                    {accountState.message}
                  </div>
                )}

                <form action={accountFormAction} className="mt-6 space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Alamat Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={profile.email}
                      className="input-lux"
                    />
                  </div>

                  <div className="border-t border-white/[0.08] pt-5">
                    <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Ubah Kata Sandi (Opsional)</p>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Kata Sandi Saat Ini</label>
                        <input
                          type="password"
                          name="currentPassword"
                          placeholder="Kosongkan jika tidak mengubah kata sandi"
                          className="input-lux"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Kata Sandi Baru</label>
                          <input
                            type="password"
                            name="newPassword"
                            minLength={6}
                            placeholder="Minimal 6 karakter"
                            className="input-lux"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Konfirmasi Kata Sandi</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            minLength={6}
                            placeholder="Ulangi kata sandi baru"
                            className="input-lux"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingAccount}
                    className="btn-gold rounded-xl px-6 py-3 text-[10px] uppercase tracking-[0.2em]"
                  >
                    {isSavingAccount ? "Menyimpan..." : "Simpan Pengaturan Akun"}
                  </button>
                </form>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* MODAL EDIT KARYA */}
      {editingArt && (
        <div onClick={() => setEditingArt(null)} className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="modal-panel w-full max-w-lg rounded-3xl p-7 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">EDIT ARTWORK</p>
                <h2 className="font-display mt-1.5 text-3xl text-white">Perbarui Detail Karya</h2>
              </div>
              <button type="button" onClick={() => setEditingArt(null)} className="text-xl text-zinc-500 transition hover:text-white">
                ×
              </button>
            </div>

            <p className="mt-2 text-[11px] text-zinc-500">
              File gambar karya tidak dapat diganti. Untuk mengganti gambar, hapus lalu unggah ulang karya baru.
            </p>

            {editArtState?.error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs text-red-300">
                {editArtState.error}
              </div>
            )}

            <form action={editArtFormAction} className="mt-5 space-y-4">
              <input type="hidden" name="artworkId" value={editingArt.id} />

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Judul Karya</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingArt.title}
                  className="input-lux"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Kategori</label>
                <select
                  name="categoryId"
                  required
                  defaultValue={editingArt.category_id}
                  className="input-lux bg-zinc-950"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Tags (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  name="tags"
                  required
                  defaultValue={(editingArt.tags || []).join(", ")}
                  className="input-lux"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  defaultValue={editingArt.description}
                  className="input-lux"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingArt}
                className="btn-gold w-full rounded-xl py-3 text-[10px] uppercase tracking-[0.2em]"
              >
                {isSavingArt ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
