"use server";

import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, ensureChallengeColumns, ensureUserProfileColumns } from "@/lib/db";
import { getCurrentUser, createSessionToken } from "@/lib/auth";

const ALLOWED_BANNER_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_BANNER_BYTES = 8 * 1024 * 1024; // 8MB

async function assertApprovedCurator(user) {
  if (!user || user.role !== "Curator") return false;
  const res = await query("SELECT curator_status FROM users WHERE id = $1", [user.id]);
  return res.rows.length > 0 && res.rows[0].curator_status === "Approved";
}

async function saveBannerFile(bannerFile, curatorId) {
  const ext = ALLOWED_BANNER_TYPES.get(bannerFile.type);
  if (!ext) {
    return { error: "Format banner harus JPG, PNG, WEBP, atau GIF." };
  }
  if (bannerFile.size > MAX_BANNER_BYTES) {
    return { error: "Ukuran gambar banner maksimal 8 MB." };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `challenge-${curatorId}-${Date.now()}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  const arrayBuffer = await bannerFile.arrayBuffer();
  await writeFile(filepath, Buffer.from(arrayBuffer));

  return { bannerUrl: `/uploads/${filename}` };
}

async function removeLocalBanner(bannerUrl) {
  if (!bannerUrl || !bannerUrl.startsWith("/uploads/")) return;
  const safeFilename = path.basename(bannerUrl);
  const localPath = path.join(process.cwd(), "public", "uploads", safeFilename);
  try {
    await unlink(localPath);
  } catch {
    // Abaikan jika file sudah tidak ada
  }
}

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

export async function createChallengeAction(prevState, formData) {
  const user = await getCurrentUser();
  const isApproved = await assertApprovedCurator(user);
  if (!isApproved) {
    return { error: "Hanya Curator terverifikasi (Approved) yang dapat membuat challenge." };
  }

  await ensureChallengeColumns();

  const title = formData.get("title")?.trim();
  const description = formData.get("description")?.trim();
  const rules = formData.get("rules")?.trim();
  const prize = formData.get("prize")?.trim();
  const startDateRaw = formData.get("startDate")?.trim();
  const endDateRaw = formData.get("endDate")?.trim();
  const bannerFile = formData.get("bannerFile");

  if (!title || !description || !rules || !prize || !startDateRaw || !endDateRaw) {
    return { error: "Semua field (judul, deskripsi, aturan, hadiah, tanggal mulai & selesai) wajib diisi." };
  }

  const startDate = new Date(startDateRaw);
  const endDate = new Date(endDateRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Format tanggal mulai atau tanggal selesai tidak valid." };
  }

  if (endDate <= startDate) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }

  if (!bannerFile || typeof bannerFile !== "object" || bannerFile.size === 0) {
    return { error: "Gambar banner challenge wajib diunggah." };
  }

  const saved = await saveBannerFile(bannerFile, user.id);
  if (saved.error) {
    return { error: saved.error };
  }

  await query(
    `INSERT INTO challenges (curator_id, title, description, rules, prize, start_date, end_date, banner_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [user.id, title, description, rules, prize, startDate.toISOString(), endDate.toISOString(), saved.bannerUrl]
  );

  revalidatePath("/curator");
  revalidatePath("/challenges");
  revalidatePath("/home");

  return { success: true, message: "Challenge baru berhasil dibuat!" };
}

export async function updateChallengeAction(prevState, formData) {
  const user = await getCurrentUser();
  const isApproved = await assertApprovedCurator(user);
  if (!isApproved) {
    return { error: "Hanya Curator terverifikasi yang dapat mengubah challenge." };
  }

  await ensureChallengeColumns();

  const challengeId = Number(formData.get("challengeId"));
  const title = formData.get("title")?.trim();
  const description = formData.get("description")?.trim();
  const rules = formData.get("rules")?.trim();
  const prize = formData.get("prize")?.trim();
  const startDateRaw = formData.get("startDate")?.trim();
  const endDateRaw = formData.get("endDate")?.trim();
  const bannerFile = formData.get("bannerFile");

  if (!challengeId || !title || !description || !rules || !prize || !startDateRaw || !endDateRaw) {
    return { error: "Semua field wajib diisi dengan benar." };
  }

  const startDate = new Date(startDateRaw);
  const endDate = new Date(endDateRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Format tanggal tidak valid." };
  }

  if (endDate <= startDate) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }

  const existingResult = await query(
    "SELECT id, banner_url FROM challenges WHERE id = $1 AND curator_id = $2",
    [challengeId, user.id]
  );

  if (existingResult.rows.length === 0) {
    return { error: "Challenge tidak ditemukan atau bukan milikmu." };
  }

  let newBannerUrl = null;
  if (bannerFile && typeof bannerFile === "object" && bannerFile.size > 0) {
    const saved = await saveBannerFile(bannerFile, user.id);
    if (saved.error) {
      return { error: saved.error };
    }
    newBannerUrl = saved.bannerUrl;
  }

  await query(
    `UPDATE challenges
     SET title = $1,
         description = $2,
         rules = $3,
         prize = $4,
         start_date = $5,
         end_date = $6,
         banner_url = COALESCE($7, banner_url)
     WHERE id = $8 AND curator_id = $9`,
    [title, description, rules, prize, startDate.toISOString(), endDate.toISOString(), newBannerUrl, challengeId, user.id]
  );

  if (newBannerUrl && existingResult.rows[0].banner_url) {
    await removeLocalBanner(existingResult.rows[0].banner_url);
  }

  revalidatePath("/curator");
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath("/home");

  return { success: true, message: "Challenge berhasil diperbarui." };
}

export async function deleteChallengeAction(challengeId) {
  const user = await getCurrentUser();
  const isApproved = await assertApprovedCurator(user);
  if (!isApproved) {
    return { error: "Hanya Curator terverifikasi yang dapat menghapus challenge." };
  }

  const targetId = Number(challengeId);
  if (!targetId) {
    return { error: "Challenge tidak valid." };
  }

  await ensureChallengeColumns();

  const deleted = await query(
    "DELETE FROM challenges WHERE id = $1 AND curator_id = $2 RETURNING id, banner_url",
    [targetId, user.id]
  );

  if (deleted.rows.length === 0) {
    return { error: "Challenge tidak ditemukan atau bukan milikmu." };
  }

  await removeLocalBanner(deleted.rows[0].banner_url);

  revalidatePath("/curator");
  revalidatePath("/challenges");
  revalidatePath("/home");

  return { success: true };
}

export async function deleteRejectedCuratorAccountAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== "Curator") {
    return { error: "Aksi tidak diizinkan." };
  }

  const existing = await query("SELECT id, curator_status FROM users WHERE id = $1", [user.id]);
  if (existing.rows.length === 0) {
    return { error: "Akun tidak ditemukan." };
  }

  if (existing.rows[0].curator_status !== "Rejected") {
    return { error: "Penghapusan akun melalui halaman ini hanya tersedia jika pendaftaran Curator ditolak Admin." };
  }

  await query("DELETE FROM users WHERE id = $1", [user.id]);

  const cookieStore = await cookies();
  cookieStore.delete("aesthe_session");
  redirect("/");
}

export async function refreshCuratorSessionAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== "Curator") {
    redirect("/");
  }

  await ensureUserProfileColumns();

  const result = await query(
    "SELECT id, display_name, username, role, curator_status, avatar_url FROM users WHERE id = $1",
    [user.id]
  );

  if (result.rows.length === 0) {
    const cookieStore = await cookies();
    cookieStore.delete("aesthe_session");
    redirect("/");
  }

  const fresh = result.rows[0];
  const token = await createSessionToken({
    id: fresh.id,
    displayName: fresh.display_name,
    username: fresh.username,
    role: fresh.role,
    curatorStatus: fresh.curator_status,
    avatarUrl: fresh.avatar_url || null,
  });

  const cookieStore = await cookies();
  cookieStore.set("aesthe_session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (fresh.curator_status === "Approved") {
    redirect("/curator");
  }
  revalidatePath("/pending-curator");
}
