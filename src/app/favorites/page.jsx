import { redirect } from "next/navigation";
import { query, ensureCollectionsTables, getOngoingChallengesCount } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import FavoritesClient from "@/components/favorites-client";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/");
  }

  if (currentUser.role !== "Member") {
    redirect("/home");
  }

  await ensureCollectionsTables();

  // 1. Ambil karya yang disimpan ke Favorites beserta daftar ID moodboard tempat karya tergabung
  const favoritesResult = await query(
    `SELECT 
      a.id,
      a.title,
      a.description,
      a.image_url,
      a.tags,
      a.created_at,
      f.created_at AS favorited_at,
      c.name AS category_name,
      u.display_name AS artist_name,
      u.username AS artist_username,
      COUNT(DISTINCT ar.user_id)::int AS total_reactions,
      MAX(CASE WHEN ar.user_id = $1 THEN ar.reaction_type ELSE NULL END) AS user_reaction,
      TRUE AS is_favorited,
      COALESCE(
        ARRAY_AGG(DISTINCT col.id) FILTER (WHERE col.id IS NOT NULL),
        '{}'
      ) AS collection_ids
    FROM favorites f
    JOIN artworks a ON f.artwork_id = a.id
    JOIN categories c ON a.category_id = c.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN artwork_reactions ar ON a.id = ar.artwork_id
    LEFT JOIN collection_items ci ON ci.artwork_id = a.id
    LEFT JOIN collections col ON col.id = ci.collection_id AND col.user_id = $1
    WHERE f.user_id = $1
    GROUP BY a.id, f.created_at, c.name, u.display_name, u.username
    ORDER BY f.created_at DESC`,
    [currentUser.id]
  );

  // 2. Ambil daftar Moodboards / Collections milik Member beserta hingga 3 cover image
  const collectionsResult = await query(
    `SELECT
      col.id,
      col.name,
      col.description,
      col.created_at,
      COUNT(DISTINCT fav_art.id)::int AS item_count,
      COALESCE(
        (ARRAY_AGG(fav_art.image_url ORDER BY f.created_at DESC) FILTER (WHERE fav_art.image_url IS NOT NULL))[1:3],
        '{}'
      ) AS cover_images
    FROM collections col
    LEFT JOIN collection_items ci ON ci.collection_id = col.id
    LEFT JOIN favorites f ON f.artwork_id = ci.artwork_id AND f.user_id = col.user_id
    LEFT JOIN artworks fav_art ON fav_art.id = f.artwork_id
    WHERE col.user_id = $1
    GROUP BY col.id
    ORDER BY col.created_at DESC, col.id DESC`,
    [currentUser.id]
  );

  // 3. Ambil daftar kategori & jumlah challenge ongoing
  const [categoriesResult, ongoingChallengesCount] = await Promise.all([
    query("SELECT id, name FROM categories ORDER BY name ASC"),
    getOngoingChallengesCount(),
  ]);

  return (
    <FavoritesClient
      currentUser={currentUser}
      artworks={favoritesResult.rows}
      collections={collectionsResult.rows}
      categories={categoriesResult.rows}
      ongoingChallengesCount={ongoingChallengesCount}
    />
  );
}
