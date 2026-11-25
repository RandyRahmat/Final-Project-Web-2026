import { notFound } from "next/navigation";
import { query, ensureChallengeColumns, ensureUserProfileColumns } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/validation";
import ChallengeDetailClient from "@/components/challenge-detail-client";

export const dynamic = "force-dynamic";

export default async function ChallengeDetailPage({ params }) {
  const { id } = await params;
  const challengeId = parsePositiveInt(id);
  if (!challengeId) {
    notFound();
  }

  await ensureChallengeColumns();
  await ensureUserProfileColumns();

  const currentUser = await getCurrentUser();

  // 1. Ambil detail lengkap challenge beserta informasi Curator
  const challengeResult = await query(
    `SELECT
      ch.id,
      ch.title,
      ch.description,
      ch.rules,
      ch.prize,
      ch.start_date,
      ch.end_date,
      ch.banner_url,
      u.id AS curator_id,
      u.display_name AS curator_name,
      u.username AS curator_username,
      u.avatar_url AS curator_avatar
    FROM challenges ch
    JOIN users u ON ch.curator_id = u.id
    WHERE ch.id = $1`,
    [challengeId]
  );

  if (challengeResult.rows.length === 0) {
    notFound();
  }

  const challenge = challengeResult.rows[0];

  // 2. Ambil semua submisi karya untuk challenge ini
  const submissionsResult = await query(
    `SELECT
      cs.id,
      cs.artwork_id,
      cs.member_id,
      cs.winner_rank,
      a.title AS artwork_title,
      a.description AS artwork_description,
      a.image_url AS artwork_image_url,
      c.name AS category_name,
      u.display_name AS artist_name,
      u.username AS artist_username
    FROM challenge_submissions cs
    JOIN artworks a ON cs.artwork_id = a.id
    JOIN categories c ON a.category_id = c.id
    JOIN users u ON cs.member_id = u.id
    WHERE cs.challenge_id = $1
    ORDER BY
      CASE WHEN cs.winner_rank IS NULL THEN 1 ELSE 0 END ASC,
      cs.winner_rank ASC,
      cs.id DESC`,
    [challengeId]
  );

  // 3. Jika login sebagai Member, ambil daftar karya portofolio Member untuk modal Submit Your Work
  let memberArtworks = [];
  if (currentUser?.role === "Member") {
    const memberArtResult = await query(
      `SELECT a.id, a.title, a.image_url, c.name AS category_name
       FROM artworks a
       JOIN categories c ON a.category_id = c.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [currentUser.id]
    );
    memberArtworks = memberArtResult.rows;
  }

  const userSubmission =
    currentUser?.role === "Member"
      ? submissionsResult.rows.find((s) => Number(s.member_id) === Number(currentUser.id)) || null
      : null;

  return (
    <ChallengeDetailClient
      currentUser={currentUser}
      challenge={challenge}
      submissions={submissionsResult.rows}
      memberArtworks={memberArtworks}
      userSubmission={userSubmission}
    />
  );
}
