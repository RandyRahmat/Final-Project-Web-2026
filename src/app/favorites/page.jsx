import { redirect } from "next/navigation";
import { query } from "@/lib/db";
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

  // Ambil karya yang disimpan ke Favorites oleh Member yang sedang login
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
      TRUE AS is_favorited
    FROM favorites f
    JOIN artworks a ON f.artwork_id = a.id
    JOIN categories c ON a.category_id = c.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN artwork_reactions ar ON a.id = ar.artwork_id
    WHERE f.user_id = $1
    GROUP BY a.id, f.created_at, c.name, u.display_name, u.username
    ORDER BY f.created_at DESC`,
    [currentUser.id]
  );

  // Ambil daftar kategori untuk filter di halaman Favorites
  const categoriesResult = await query(
    "SELECT id, name FROM categories ORDER BY name ASC"
  );

  return (
    <FavoritesClient
      currentUser={currentUser}
      artworks={favoritesResult.rows}
      categories={categoriesResult.rows}
    />
  );
}
