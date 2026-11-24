import { redirect } from "next/navigation";
import { query, ensureChallengeColumns, ensureUserProfileColumns } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import CuratorDashboardClient from "@/components/curator-dashboard-client";

export const dynamic = "force-dynamic";

export default async function CuratorDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/");
  }

  if (currentUser.role !== "Curator") {
    redirect("/home");
  }

  await ensureUserProfileColumns();
  await ensureChallengeColumns();

  // Verifikasi status Curator terbaru langsung dari PostgreSQL
  const userResult = await query(
    "SELECT id, display_name, username, role, curator_status, avatar_url FROM users WHERE id = $1",
    [currentUser.id]
  );

  if (userResult.rows.length === 0) {
    redirect("/");
  }

  const curator = userResult.rows[0];
  if (curator.curator_status !== "Approved") {
    redirect("/pending-curator");
  }

  // 1. Ambil semua challenge yang dibuat oleh Curator ini
  const challengesResult = await query(
    `SELECT
      ch.id,
      ch.title,
      ch.description,
      ch.rules,
      ch.prize,
      ch.start_date,
      ch.end_date,
      ch.banner_url,
      COUNT(DISTINCT cs.id)::int AS submission_count,
      COUNT(DISTINCT CASE WHEN ch.end_date < NOW() AND cs.winner_rank IS NOT NULL THEN cs.id END)::int AS winner_count
    FROM challenges ch
    LEFT JOIN challenge_submissions cs ON cs.challenge_id = ch.id
    WHERE ch.curator_id = $1
    GROUP BY ch.id
    ORDER BY ch.end_date DESC, ch.id DESC`,
    [curator.id]
  );

  // 2. Ambil seluruh submisi yang masuk ke challenge-challenge milik Curator ini
  const submissionsResult = await query(
    `SELECT
      cs.id,
      cs.challenge_id,
      cs.artwork_id,
      cs.member_id,
      cs.winner_rank,
      a.title AS artwork_title,
      a.image_url AS artwork_image_url,
      c.name AS category_name,
      u.display_name AS artist_name,
      u.username AS artist_username
    FROM challenge_submissions cs
    JOIN challenges ch ON cs.challenge_id = ch.id
    JOIN artworks a ON cs.artwork_id = a.id
    JOIN categories c ON a.category_id = c.id
    JOIN users u ON cs.member_id = u.id
    WHERE ch.curator_id = $1
    ORDER BY
      CASE WHEN cs.winner_rank IS NULL THEN 1 ELSE 0 END ASC,
      cs.winner_rank ASC,
      cs.id DESC`,
    [curator.id]
  );

  return (
    <CuratorDashboardClient
      curator={curator}
      challenges={challengesResult.rows}
      submissions={submissionsResult.rows}
    />
  );
}
