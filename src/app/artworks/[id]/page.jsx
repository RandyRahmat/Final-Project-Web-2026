import { notFound } from "next/navigation";
import {
  query,
  ensureUserProfileColumns,
  ensureCommentsTable,
  ensureReportsTable,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ArtworkDetailClient from "@/components/artwork-detail-client";

export const dynamic = "force-dynamic";

export default async function ArtworkDetailPage({ params }) {
  const { id } = await params;
  const artworkId = Number(id);
  if (!artworkId || Number.isNaN(artworkId)) {
    notFound();
  }

  await ensureUserProfileColumns();
  await ensureCommentsTable();
  await ensureReportsTable();

  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 0;

  // 1. Ambil detail lengkap karya beserta kreator, kategori, reaksi, favorit, dan status laporan
  const artworkResult = await query(
    `SELECT
      a.id,
      a.user_id AS artist_id,
      a.title,
      a.description,
      a.image_url,
      a.tags,
      a.created_at,
      c.name AS category_name,
      u.display_name AS artist_name,
      u.username AS artist_username,
      u.avatar_url AS artist_avatar,
      COUNT(DISTINCT ar.user_id)::int AS total_reactions,
      MAX(CASE WHEN ar.user_id = $1 THEN ar.reaction_type ELSE NULL END) AS user_reaction,
      BOOL_OR(f.user_id = $1) AS is_favorited,
      EXISTS(SELECT 1 FROM reports r WHERE r.artwork_id = a.id AND r.reporter_id = $1) AS has_reported
    FROM artworks a
    JOIN categories c ON a.category_id = c.id
    JOIN users u ON a.user_id = u.id
    LEFT JOIN artwork_reactions ar ON a.id = ar.artwork_id
    LEFT JOIN favorites f ON a.id = f.artwork_id AND f.user_id = $1
    WHERE a.id = $2
    GROUP BY a.id, c.name, u.display_name, u.username, u.avatar_url`,
    [userId, artworkId]
  );

  if (artworkResult.rows.length === 0) {
    notFound();
  }

  // 2. Ambil daftar komentar karya ini
  const commentsResult = await query(
    `SELECT
      cm.id,
      cm.user_id,
      cm.content,
      cm.created_at,
      u.display_name AS author_name,
      u.username AS author_username,
      u.avatar_url AS author_avatar
    FROM comments cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.artwork_id = $1
    ORDER BY cm.created_at DESC, cm.id DESC`,
    [artworkId]
  );

  return (
    <ArtworkDetailClient
      currentUser={currentUser}
      artwork={artworkResult.rows[0]}
      comments={commentsResult.rows}
    />
  );
}
