import { query, getOngoingChallengesCount } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ExploreClient from "@/components/explore-client";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 0;

  // Ambil karya, kategori, kreator aktif, dan jumlah challenge ongoing secara paralel
  const [artworksResult, categoriesResult, creatorsResult, ongoingChallengesCount] = await Promise.all([
    query(
      `SELECT 
        a.id,
        a.title,
        a.description,
        a.image_url,
        a.tags,
        a.created_at,
        c.name AS category_name,
        u.id AS artist_id,
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
      GROUP BY a.id, c.name, u.id, u.display_name, u.username
      ORDER BY total_reactions DESC, a.created_at DESC`,
      [userId]
    ),
    query(
      `SELECT 
        c.id,
        c.name,
        COUNT(a.id)::int AS artwork_count
      FROM categories c
      LEFT JOIN artworks a ON a.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY artwork_count DESC, c.name ASC`
    ),
    query(
      `SELECT 
        u.id,
        u.display_name,
        u.username,
        u.avatar_url,
        COUNT(a.id)::int AS artwork_count
      FROM users u
      LEFT JOIN artworks a ON a.user_id = u.id
      WHERE u.role = 'Member'
      GROUP BY u.id, u.display_name, u.username, u.avatar_url
      HAVING COUNT(a.id) > 0
      ORDER BY artwork_count DESC, u.display_name ASC
      LIMIT 8`
    ),
    getOngoingChallengesCount(),
  ]);

  return (
    <ExploreClient
      currentUser={currentUser}
      artworks={artworksResult.rows}
      categories={categoriesResult.rows}
      creators={creatorsResult.rows}
      ongoingChallengesCount={ongoingChallengesCount}
    />
  );
}
