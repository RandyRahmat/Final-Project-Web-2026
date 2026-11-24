"use server";

import { revalidatePath } from "next/cache";
import { query, ensureChallengeColumns } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function submitArtworkToChallengeAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat mendaftarkan karya ke challenge." };
  }

  const challengeId = Number(formData.get("challengeId"));
  const artworkId = Number(formData.get("artworkId"));

  if (!challengeId || !artworkId) {
    return { error: "Pilih salah satu karya dari portofoliomu untuk didaftarkan." };
  }

  await ensureChallengeColumns();

  // 1. Validasi keberadaan challenge dan rentang waktu aktif di sisi backend
  const challengeResult = await query(
    `SELECT id, start_date, end_date
     FROM challenges
     WHERE id = $1`,
    [challengeId]
  );

  if (challengeResult.rows.length === 0) {
    return { error: "Challenge tidak ditemukan." };
  }

  const challenge = challengeResult.rows[0];
  const now = new Date();
  if (challenge.start_date && new Date(challenge.start_date) > now) {
    return { error: "Challenge belum dimulai." };
  }
  if (new Date(challenge.end_date) < now) {
    return { error: "Challenge sudah berakhir. Submisi ditutup." };
  }

  // 2. Validasi kepemilikan karya oleh Member
  const artworkResult = await query(
    "SELECT id FROM artworks WHERE id = $1 AND user_id = $2",
    [artworkId, user.id]
  );

  if (artworkResult.rows.length === 0) {
    return { error: "Karya tidak valid atau bukan milikmu." };
  }

  // 3. Validasi aturan 1 karya per Member per challenge
  const existing = await query(
    "SELECT id FROM challenge_submissions WHERE challenge_id = $1 AND member_id = $2",
    [challengeId, user.id]
  );

  if (existing.rows.length > 0) {
    return { error: "Kamu sudah mensubmit karya pada challenge ini." };
  }

  await query(
    `INSERT INTO challenge_submissions (challenge_id, artwork_id, member_id)
     VALUES ($1, $2, $3)`,
    [challengeId, artworkId, user.id]
  );

  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath("/challenges");
  revalidatePath("/profile");
  revalidatePath("/home");

  return { success: true, message: "Karya berhasil didaftarkan ke challenge!" };
}

export async function withdrawSubmissionAction(challengeId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat menarik submisi." };
  }

  const targetChallengeId = Number(challengeId);
  if (!targetChallengeId) {
    return { error: "Challenge tidak valid." };
  }

  await ensureChallengeColumns();

  const challengeResult = await query(
    "SELECT id, end_date FROM challenges WHERE id = $1",
    [targetChallengeId]
  );

  if (challengeResult.rows.length === 0) {
    return { error: "Challenge tidak ditemukan." };
  }

  if (new Date(challengeResult.rows[0].end_date) < new Date()) {
    return { error: "Challenge sudah berakhir. Submisi tidak dapat ditarik lagi." };
  }

  const deleted = await query(
    "DELETE FROM challenge_submissions WHERE challenge_id = $1 AND member_id = $2 RETURNING id",
    [targetChallengeId, user.id]
  );

  if (deleted.rows.length === 0) {
    return { error: "Submisi tidak ditemukan." };
  }

  revalidatePath(`/challenges/${targetChallengeId}`);
  revalidatePath("/challenges");
  revalidatePath("/profile");
  revalidatePath("/home");

  return { success: true };
}

export async function selectChallengeWinnerAction(challengeId, submissionId, rank) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Curator" || user.curatorStatus !== "Approved") {
    return { error: "Hanya Curator terverifikasi yang dapat menentukan pemenang challenge." };
  }

  const targetChallengeId = Number(challengeId);
  const targetSubmissionId = Number(submissionId);
  const parsedRank = rank === null || rank === "" ? null : Number(rank);

  if (!targetChallengeId || !targetSubmissionId) {
    return { error: "Data challenge atau submisi tidak valid." };
  }

  if (parsedRank !== null && ![1, 2, 3].includes(parsedRank)) {
    return { error: "Peringkat pemenang hanya boleh Juara 1, 2, atau 3." };
  }

  // 1. Validasi kepemilikan challenge & validasi waktu di sisi backend
  const challengeResult = await query(
    "SELECT id, curator_id, end_date FROM challenges WHERE id = $1",
    [targetChallengeId]
  );

  if (challengeResult.rows.length === 0) {
    return { error: "Challenge tidak ditemukan." };
  }

  const challenge = challengeResult.rows[0];
  if (Number(challenge.curator_id) !== Number(user.id)) {
    return { error: "Kamu hanya dapat menentukan pemenang untuk challenge milikmu sendiri." };
  }

  if (new Date(challenge.end_date) >= new Date()) {
    return { error: "Pemenang baru dapat dipilih setelah challenge berakhir (melewati deadline)." };
  }

  // 2. Validasi submisi memang milik challenge ini
  const subResult = await query(
    "SELECT id FROM challenge_submissions WHERE id = $1 AND challenge_id = $2",
    [targetSubmissionId, targetChallengeId]
  );

  if (subResult.rows.length === 0) {
    return { error: "Submisi tidak ditemukan pada challenge ini." };
  }

  // 3. Setiap peringkat hanya untuk satu karya: kosongkan peringkat yang sama pada submisi lain
  if (parsedRank !== null) {
    await query(
      `UPDATE challenge_submissions
       SET winner_rank = NULL
       WHERE challenge_id = $1 AND winner_rank = $2 AND id <> $3`,
      [targetChallengeId, parsedRank, targetSubmissionId]
    );
  }

  // 4. Tetapkan (atau hapus) peringkat pada submisi terpilih
  await query(
    `UPDATE challenge_submissions
     SET winner_rank = $1
     WHERE id = $2 AND challenge_id = $3`,
    [parsedRank, targetSubmissionId, targetChallengeId]
  );

  revalidatePath(`/challenges/${targetChallengeId}`);
  revalidatePath("/challenges");
  revalidatePath("/curator");
  revalidatePath("/home");
  revalidatePath("/profile");

  return { success: true };
}
