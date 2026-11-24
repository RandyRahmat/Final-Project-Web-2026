import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import HomeClient from "@/components/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 0;

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
    GROUP BY a.id, c.name, u.display_name, u.username
    ORDER BY total_reactions DESC, a.created_at DESC`,
    [userId]
  );

  const categoriesResult = await query(
    "SELECT id, name FROM categories ORDER BY name ASC"
  );

  const challengesResult = await query(
    `SELECT 
      ch.id,
      ch.title,
      ch.description,
      ch.prize,
      ch.end_date,
      u.display_name AS curator_name
    FROM challenges ch
    JOIN users u ON ch.curator_id = u.id
    WHERE ch.end_date >= NOW()
    ORDER BY ch.end_date ASC`
  );

  const podiumResult = await query(
    `SELECT 
      cs.winner_rank,
      a.title,
      a.image_url,
      u.display_name AS artist_name
    FROM challenge_submissions cs
    JOIN artworks a ON cs.artwork_id = a.id
    JOIN users u ON cs.member_id = u.id
    WHERE cs.winner_rank IS NOT NULL
    ORDER BY cs.winner_rank ASC
    LIMIT 3`
  );

  const submissionWinners = podiumResult.rows;
  const usedTitles = new Set(submissionWinners.map((w) => w.title));

  const resolvedPodium = [1, 2, 3].map((rank) => {
    const existing = submissionWinners.find((w) => Number(w.winner_rank) === rank);
    if (existing) return existing;

    const fallbackArt = artworksResult.rows.find((a) => !usedTitles.has(a.title));
    if (fallbackArt) {
      usedTitles.add(fallbackArt.title);
      return {
        winner_rank: rank,
        title: fallbackArt.title,
        image_url: fallbackArt.image_url,
        artist_name: fallbackArt.artist_name,
      };
    }
    return null;
  }).filter(Boolean);

  return (
    <HomeClient
      currentUser={currentUser}
      artworks={artworksResult.rows}
      categories={categoriesResult.rows}
      challenges={challengesResult.rows}
      podiumWinners={resolvedPodium}
    />
  );
}