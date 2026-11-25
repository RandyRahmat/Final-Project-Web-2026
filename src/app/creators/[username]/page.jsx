import { notFound } from "next/navigation";
import { query, ensureUserProfileColumns, ensureFollowsTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { safeDecodeURIComponent } from "@/lib/validation";
import CreatorProfileClient from "@/components/creator-profile-client";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage({ params }) {
  const { username } = await params;
  const decoded = safeDecodeURIComponent(username);
  if (!decoded) {
    notFound();
  }
  const decodedUsername = decoded.toLowerCase();

  await ensureUserProfileColumns();
  await ensureFollowsTable();

  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 0;

  // 1. Ambil data publik kreator berdasarkan username
  const creatorResult = await query(
    `SELECT id, display_name, username, role, curator_status, avatar_url, bio, external_link
     FROM users
     WHERE LOWER(username) = $1`,
    [decodedUsername]
  );

  if (creatorResult.rows.length === 0) {
    notFound();
  }

  const creator = creatorResult.rows[0];
  if (creator.role === "Curator" && creator.curator_status !== "Approved") {
    notFound();
  }

  // 2. Ambil semua karya milik kreator tersebut beserta reaksi & favorit user aktif
  const artworksResult = await query(
    `SELECT
      a.id,
      a.title,
      a.description,
      a.image_url,
      a.tags,
      a.created_at,
      c.name AS category_name,
      u.display_name AS artist_name,
      u.username AS artist_username,
      COUNT(DISTINCT ar.user_id)::int AS total_reactions,
      MAX(CASE WHEN ar.user_id = $1 THEN ar.reaction_type ELSE NULL END) AS user_reaction,
      BOOL_OR(f.user_id = $1) AS is_favorited
    FROM artworks a
    JOIN categories c ON a.category_id = c.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN artwork_reactions ar ON a.id = ar.artwork_id
    LEFT JOIN favorites f ON a.id = f.artwork_id AND f.user_id = $1
    WHERE a.user_id = $2
    GROUP BY a.id, c.name, u.display_name, u.username
    ORDER BY a.created_at DESC`,
    [userId, creator.id]
  );

  // 3. Ambil statistik Followers, Following, dan status follow user aktif
  const followStatsResult = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM follows WHERE following_id = $1) AS followers_count,
      (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) AS following_count,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = $1) AS is_following`,
    [creator.id, userId]
  );

  const followStats = followStatsResult.rows[0] || {
    followers_count: 0,
    following_count: 0,
    is_following: false,
  };

  return (
    <CreatorProfileClient
      currentUser={currentUser}
      creator={creator}
      artworks={artworksResult.rows}
      followStats={followStats}
    />
  );
}
