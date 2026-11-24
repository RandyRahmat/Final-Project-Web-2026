"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { logoutUserAction } from "@/actions/auth-actions";
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
  const role = profile.role || currentUser.role;
  const isMember = role === "Member";
  const isCurator = role === "Curator";
  const isAdmin = role === "Admin";
  const isCuratorApproved = isCurator && profile.curator_status === "Approved";

  const [activeTab, setActiveTab] = useState(isMember ? "artworks" : "profile");
  const [mobileMenu, setMobileMenu] = useState(false);
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
    const confirmed = window.confirm(`Hapus karya "${title}" secara permanen?`);
    if (!confirmed) return;
    setDeletingId(artworkId);
    await deleteArtworkAction(artworkId);
    setDeletingId(null);
  };

  const handleUnfollow = async (creatorId) => {
    setUnfollowingId(creatorId);
    await toggleFollowAction(creatorId);
    setUnfollowingId(null);
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
    <main className="min-h-screen overflow-x-hidden bg-[#090909] text-zinc-100">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-64 left-1/3 h-[600px] w-[600px] rounded-full bg-white/[0.035] blur-[140px]" />
        <div className="absolute right-0 top-[50%] h-[400px] w-[400px] rounded-full bg-zinc-500/[0.035] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:5px_5px]" />
      </div>

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div onClick={() => setMobileMenu(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-white/[0.07] bg-[#0b0b0c]/95 px-6 py-7 backdrop-blur-2xl transition-transform duration-500 lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/home" className="mb-12 flex items-center gap-3">
          <img src="/images/aesthe-logo.png" alt="Aesthe" className="h-9 w-9 object-contain mix-blend-screen" />
          <div>
            <h1 className="text-[17px] font-medium tracking-[0.35em]">AESTHE</h1>
            <p className="mt-0.5 text-[8px] tracking-[0.3em] text-zinc-600">ART SHOWCASE</p>
          </div>
        </Link>

        {/* WORKSPACE NAVIGATION */}
        <div>
          <p className="mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600">WORKSPACE</p>
          <nav className="space-y-1">
            <Link href="/home" className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-white">
              <span className="w-4 text-center text-base transition-transform duration-300 group-hover:scale-110">⌂</span>
              Home
            </Link>

            <Link href="/explore" className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-white">
              <span className="w-4 text-center text-base transition-transform duration-300 group-hover:scale-110">◈</span>
              Explore
            </Link>

            {isMember && (
              <Link href="/favorites" className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-white">
                <span className="w-4 text-center text-base transition-transform duration-300 group-hover:scale-110">⚑</span>
                Favorites
              </Link>
            )}

            <Link href="/challenges" className="group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-white">
              <span className="w-4 text-center text-base transition-transform duration-300 group-hover:scale-110">✧</span>
              Challenges
            </Link>
          </nav>
        </div>

        {/* PERSONAL SPACE */}
        <div className="mt-10">
          <p className="mb-4 text-[9px] font-medium tracking-[0.25em] text-zinc-600">PERSONAL SPACE</p>
          <Link href="/profile" className="flex w-full items-center gap-4 rounded-lg border border-white/[0.08] bg-white/[0.08] px-4 py-3 text-left text-[12px] text-white shadow-[inset_2px_0_0_white]">
            <span className="w-4 text-center text-base">◉</span>
            My Profile
          </Link>

          <Link href="/messages" className="mt-1 group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white">
            <span className="w-4 text-center text-sm">✉</span>
            Messages
          </Link>

          {isMember && (
            <Link href={`/creators/${profile.username}`} className="mt-1 group flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-white">
              <span className="w-4 text-center text-sm">↗</span>
              Public Portfolio
            </Link>
          )}

          {isCurator && isCuratorApproved && (
            <Link href="/curator" className="mt-1 flex w-full items-center gap-4 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left text-[12px] text-amber-200 transition hover:bg-amber-500/15">
              <span className="text-base">✦</span>
              Curator Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin" className="mt-1 flex w-full items-center gap-4 rounded-lg border border-white/15 bg-white/[0.05] px-4 py-3 text-left text-[12px] text-white transition hover:bg-white/10">
              <span className="text-base">❖</span>
              Admin Console
            </Link>
          )}
        </div>

        {/* SESSION CARD */}
        <div className="mt-auto border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-semibold text-white">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
              ) : (
                profile.display_name?.charAt(0).toUpperCase() || "U"
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium leading-tight text-white">{profile.display_name}</p>
              <form action={logoutUserAction} className="mt-0.5">
                <button type="submit" className="text-[10px] text-zinc-500 transition hover:text-red-400">
                  Logout
                </button>
              </form>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[8px] tracking-wider text-zinc-700">
            <span>AESTHE © 2026</span>
            <span>POSTGRESQL LIVE</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="relative z-10 min-h-screen lg:ml-[250px]">
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#090909]/75 px-5 backdrop-blur-2xl sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setMobileMenu(true)} className="text-xl text-zinc-400 hover:text-white lg:hidden" aria-label="Open menu">
              ☰
            </button>
            <div className="hidden text-[10px] tracking-[0.2em] text-zinc-600 sm:block">
              PERSONAL / <span className="text-zinc-300">PROFILE DASHBOARD</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <img src="/images/aesthe-logo.png" alt="" className="h-6 w-6 object-contain" />
              <span className="text-xs tracking-[0.25em]">AESTHE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isMember && (
              <Link href={`/creators/${profile.username}`} className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-1.5 text-[10px] tracking-[0.15em] text-zinc-300 transition hover:border-white hover:text-white">
                LIHAT PROFIL PUBLIK ↗
              </Link>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
          {/* PROFILE HERO CARD */}
          <section className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-zinc-700 to-zinc-900 text-3xl font-light text-white shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
                  ) : (
                    profile.display_name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-light tracking-tight text-white sm:text-3xl">
                      {profile.display_name}
                    </h1>
                    <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-300">
                      {role}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">@{profile.username} &bull; {profile.email}</p>
                  <p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-300">
                    {profile.bio || "Belum ada bio. Lengkapi deskripsi singkat profilmu di tab Edit Profile."}
                  </p>
                  {profile.external_link && (
                    <a
                      href={profile.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber-300 underline decoration-amber-400/40 underline-offset-4 transition hover:text-amber-200"
                    >
                      🔗 {profile.external_link.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>

              {isMember && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 md:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-center">
                    <p className="text-lg font-light text-white">{myArtworks.length}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Artworks</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-center">
                    <p className="text-lg font-light text-white">{followersCount}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Followers</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("following")} className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-center transition hover:border-white/25">
                    <p className="text-lg font-light text-white">{followingList.length}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Following</p>
                  </button>
                  <div className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-center">
                    <p className="text-lg font-light text-white">{totalReactionsReceived}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Reactions</p>
                  </div>
                  <Link href="/favorites" className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-center transition hover:border-white/25">
                    <p className="text-lg font-light text-amber-300">{favoritesCount}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Favorites</p>
                  </Link>
                  <button type="button" onClick={() => setActiveTab("submissions")} className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-center transition hover:border-white/25">
                    <p className="text-lg font-light text-white">{mySubmissions.length}</p>
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
                className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-2 text-[10px] tracking-[0.16em] uppercase transition ${
                  activeTab === tab.id
                    ? "border-white bg-white font-semibold text-black"
                    : "border-white/[0.08] text-zinc-400 hover:border-white/30 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeTab === tab.id ? "bg-black/15 text-black" : "bg-white/10 text-zinc-300"}`}>
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
                  <h2 className="text-xl font-light text-white">Karya yang Diunggah</h2>
                  <p className="mt-1 text-xs text-zinc-500">Kelola detail karya atau hapus karya milikmu sendiri.</p>
                </div>
                <Link href="/home" className="rounded-full border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-black">
                  ＋ Unggah Baru
                </Link>
              </div>

              {myArtworks.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Kamu belum mengunggah karya apa pun.</p>
                  <Link href="/home" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                    Upload di Home
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {myArtworks.map((art) => (
                    <article key={art.id} className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900/50">
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                        <img src={art.image_url} alt={art.title} className="h-full w-full object-cover" />
                        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[8px] tracking-wider text-white backdrop-blur-md">
                          {art.category_name.toUpperCase()}
                        </span>
                        <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] text-zinc-200 backdrop-blur-md">
                          ♥ {art.total_reactions}
                        </span>
                      </div>

                      <div className="p-4">
                        <h3 className="truncate text-sm font-medium text-white">{art.title}</h3>
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
                            className="flex-1 rounded-lg border border-white/15 bg-white/[0.04] py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-200 transition hover:bg-white hover:text-black"
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
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB FOLLOWING */}
          {activeTab === "following" && isMember && (
            <section className="mt-8">
              <h2 className="text-xl font-light text-white">Kreator yang Kamu Ikuti</h2>
              <p className="mt-1 text-xs text-zinc-500">Kelola daftar kreator favorit yang sedang kamu ikuti.</p>

              {followingList.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Kamu belum mengikuti kreator mana pun.</p>
                  <Link href="/explore" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                    Temukan Kreator di Explore
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {followingList.map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-4">
                      <Link href={`/creators/${creator.username}`} className="flex min-w-0 flex-1 items-center gap-3.5 transition hover:opacity-85">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-zinc-800 text-sm font-semibold text-white">
                          {creator.avatar_url ? (
                            <img src={creator.avatar_url} alt={creator.display_name} className="h-full w-full object-cover" />
                          ) : (
                            creator.display_name?.charAt(0).toUpperCase() || "C"
                          )}
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
              <h2 className="text-xl font-light text-white">Riwayat Submisi Challenge</h2>
              <p className="mt-1 text-xs text-zinc-500">Daftar karya yang pernah kamu daftarkan ke event atau challenge komunitas.</p>

              {mySubmissions.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
                  <p className="text-sm text-zinc-400">Belum ada karya yang di-submit ke challenge.</p>
                  <Link href="/home#challenges" className="mt-4 inline-block rounded-full border border-white/20 px-5 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-200 hover:bg-white hover:text-black">
                    Lihat Active Challenges
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {mySubmissions.map((sub) => {
                    const isEnded = new Date(sub.challenge_end_date) < new Date();
                    return (
                      <div key={sub.id} className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <img src={sub.artwork_image_url} alt={sub.artwork_title} className="h-16 w-16 shrink-0 rounded-lg border border-white/10 object-cover" />
                          <div>
                            <p className="text-sm font-medium text-white">{sub.artwork_title}</p>
                            <p className="mt-0.5 text-xs text-zinc-400">Challenge: {sub.challenge_title}</p>
                            <p className="mt-1 text-[10px] text-zinc-500">Hadiah: {sub.challenge_prize}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {sub.winner_rank ? (
                            <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
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
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 sm:p-8">
                <h2 className="text-xl font-light text-white">Informasi Profil Publik</h2>
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
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-zinc-800 text-2xl font-light text-white">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        profile.display_name?.charAt(0).toUpperCase() || "U"
                      )}
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
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1 file:text-[10px] file:font-semibold file:text-black"
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
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Bio / Deskripsi Singkat</label>
                    <textarea
                      name="bio"
                      rows={3}
                      defaultValue={profile.bio || ""}
                      placeholder="Ceritakan sedikit tentang gaya karyamu..."
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Tautan Eksternal (Instagram, Behance, atau Website)</label>
                    <input
                      type="url"
                      name="externalLink"
                      defaultValue={profile.external_link || ""}
                      placeholder="https://behance.net/username"
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-lg bg-white px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200 disabled:opacity-50"
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
              <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 sm:p-8">
                <h2 className="text-xl font-light text-white">Pengaturan Akun Privat</h2>
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
                      className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-white/40 focus:outline-none"
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
                          className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
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
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Konfirmasi Kata Sandi</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            minLength={6}
                            placeholder="Ulangi kata sandi baru"
                            className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/40 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingAccount}
                    className="rounded-lg bg-white px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200 disabled:opacity-50"
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
        <div onClick={() => setEditingArt(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-xl">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111] p-7 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] tracking-[0.3em] text-zinc-500">EDIT ARTWORK</p>
                <h2 className="mt-1 text-xl font-light text-white">Perbarui Detail Karya</h2>
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
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Kategori</label>
                <select
                  name="categoryId"
                  required
                  defaultValue={editingArt.category_id}
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
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
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-400">Deskripsi</label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  defaultValue={editingArt.description}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-white/40 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingArt}
                className="w-full rounded-lg bg-white py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200 disabled:opacity-50"
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
