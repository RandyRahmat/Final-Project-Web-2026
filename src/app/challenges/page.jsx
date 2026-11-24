import { query, ensureChallengeColumns } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ChallengesClient from "@/components/challenges-client";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const currentUser = await getCurrentUser();
  await ensureChallengeColumns();

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
      u.display_name AS curator_name,
      u.username AS curator_username,
      COUNT(DISTINCT cs.id)::int AS submission_count,
      COUNT(DISTINCT CASE WHEN ch.end_date < NOW() AND cs.winner_rank IS NOT NULL THEN cs.id END)::int AS winner_count
    FROM challenges ch
    JOIN users u ON ch.curator_id = u.id
    LEFT JOIN challenge_submissions cs ON cs.challenge_id = ch.id
    GROUP BY ch.id, u.display_name, u.username
    ORDER BY
      CASE
        WHEN ch.end_date >= NOW() AND (ch.start_date IS NULL OR ch.start_date <= NOW()) THEN 0
        WHEN ch.start_date > NOW() THEN 1
        ELSE 2
      END ASC,
      ch.end_date ASC`
  );

  return (
    <ChallengesClient
      currentUser={currentUser}
      challenges={challengesResult.rows}
    />
  );
}
