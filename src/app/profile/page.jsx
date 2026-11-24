import { redirect } from "next/navigation";
import { query, ensureUserProfileColumns, ensureFollowsTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "@/components/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/");
  }

  await ensureUserProfileColumns();
  await ensureFollowsTable();

  // 1. Ambil data lengkap profil pengguna dari PostgreSQL
  const userResult = await query(
    `SELECT id, display_name, username, email, role, curator_status, avatar_url, bio, external_link
     FROM users
     WHERE id = $1`,
    [currentUser.id]
  );

  if (userResult.rows.length === 0) {
    redirect("/");
  }

  const profile = userResult.rows[0];

  // 2. Ambil daftar karya milik user beserta jumlah reaksi & kategori
  const myArtworksResult = await query(
    `SELECT
      a.id,
      a.title,
      a.description,
      a.image_url,
      a.tags,
      a.category_id,
      a.created_at,
      c.name AS category_name,
      COUNT(DISTINCT ar.user_id)::int AS total_reactions
    FROM artworks a
    JOIN categories c ON a.category_id = c.id
    LEFT JOIN artwork_reactions ar ON a.id = ar.artwork_id
    WHERE a.user_id = $1
    GROUP BY a.id, c.name
    ORDER BY a.created_at DESC`,
    [currentUser.id]
  );

  // 3. Ambil daftar kategori aktif (untuk modal Edit Karya)
  const categoriesResult = await query(
    "SELECT id, name FROM categories ORDER BY name ASC"
  );

  // 4. Ambil riwayat submisi challenge milik Member
  const submissionsResult = await query(
    `SELECT
      cs.id,
      cs.winner_rank,
      ch.id AS challenge_id,
      ch.title AS challenge_title,
      ch.prize AS challenge_prize,
      ch.end_date AS challenge_end_date,
      a.id AS artwork_id,
      a.title AS artwork_title,
      a.image_url AS artwork_image_url
    FROM challenge_submissions cs
    JOIN challenges ch ON cs.challenge_id = ch.id
    JOIN artworks a ON cs.artwork_id = a.id
    WHERE cs.member_id = $1
    ORDER BY ch.end_date DESC, cs.id DESC`,
    [currentUser.id]
  );

  // 5. Hitung total karya favorit yang disimpan user
  const favCountResult = await query(
    "SELECT COUNT(*)::int AS total FROM favorites WHERE user_id = $1",
    [currentUser.id]
  );

  // 6. Hitung total followers dan daftar kreator yang diikuti (Following)
  const followersCountResult = await query(
    "SELECT COUNT(*)::int AS total FROM follows WHERE following_id = $1",
    [currentUser.id]
  );

  const followingListResult = await query(
    `SELECT
      u.id,
      u.display_name,
      u.username,
      u.avatar_url,
      u.bio,
      COUNT(a.id)::int AS artwork_count
    FROM follows f
    JOIN users u ON f.following_id = u.id
    LEFT JOIN artworks a ON a.user_id = u.id
    WHERE f.follower_id = $1
    GROUP BY u.id, f.created_at
    ORDER BY f.created_at DESC`,
    [currentUser.id]
  );

  return (
    <ProfileClient
      currentUser={currentUser}
      profile={profile}
      myArtworks={myArtworksResult.rows}
      categories={categoriesResult.rows}
      mySubmissions={submissionsResult.rows}
      favoritesCount={favCountResult.rows[0]?.total || 0}
      followersCount={followersCountResult.rows[0]?.total || 0}
      followingList={followingListResult.rows}
    />
  );
}
