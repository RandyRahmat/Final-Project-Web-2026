"use server";

import crypto from "crypto";
import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query, withTransaction, ensureChallengeColumns, ensureUserProfileColumns } from "@/lib/db";
import { getCurrentUser, createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { parsePositiveInt, verifyImageMagicBytes } from "@/lib/validation";

const ALLOWED_BANNER_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_BANNER_BYTES = 8 * 1024 * 1024; // 8MB

function parseDateTimeLocalToIso(raw, tzOffsetRaw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;

  const [, datePart, timePart, secPart] = match;
  const seconds = secPart || "00";

  let offsetMinutes = new Date().getTimezoneOffset();
  if (typeof tzOffsetRaw === "string" && /^-?\d+$/.test(tzOffsetRaw.trim())) {
    const parsedOffset = Number(tzOffsetRaw.trim());
    if (Number.isInteger(parsedOffset) && parsedOffset >= -840 && parsedOffset <= 840) {
      offsetMinutes = parsedOffset;
    }
  }

  // getTimezoneOffset() mengembalikan (UTC - lokal), sehingga UTC+8 bernilai -480
  const totalEastMinutes = -offsetMinutes;
  const sign = totalEastMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(totalEastMinutes);
  const hh = String(Math.floor(absMinutes / 60)).padStart(2, "0");
  const mm = String(absMinutes % 60).padStart(2, "0");

  const iso = `${datePart}T${timePart}:${seconds}${sign}${hh}:${mm}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return { iso, date: parsed };
}

async function assertApprovedCurator(user) {
  if (!user || user.role !== "Curator") return false;
  const res = await query("SELECT role, curator_status FROM users WHERE id = $1", [user.id]);
  return (
    res.rows.length > 0 &&
    res.rows[0].role === "Curator" &&
    res.rows[0].curator_status === "Approved"
  );
}

async function saveBannerFile(bannerFile, curatorId) {
  const ext = ALLOWED_BANNER_TYPES.get(bannerFile.type);
  if (!ext) {
    return { error: "Format banner harus JPG, PNG, WEBP, atau GIF." };
  }
  if (bannerFile.size > MAX_BANNER_BYTES) {
    return { error: "Ukuran gambar banner maksimal 8 MB." };
  }

  const buffer = Buffer.from(await bannerFile.arrayBuffer());
  if (!verifyImageMagicBytes(buffer, bannerFile.type)) {
    return { error: "Isi file banner tidak cocok dengan format gambar yang valid (JPG/PNG/WEBP/GIF)." };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `challenge-${curatorId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  await writeFile(filepath, buffer);

  return { bannerUrl: `/uploads/${filename}`, filepath };
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

  const challengeId = parsePositiveInt(formData.get("challengeId"));
  const artworkId = parsePositiveInt(formData.get("artworkId"));

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
  revalidatePath("/curator");
  revalidatePath("/profile");
  revalidatePath("/home");

  return { success: true, message: "Karya berhasil didaftarkan ke challenge!" };
}

export async function withdrawSubmissionAction(challengeId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat menarik submisi." };
  }

  const targetChallengeId = parsePositiveInt(challengeId);
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
  revalidatePath("/curator");
  revalidatePath("/profile");
  revalidatePath("/home");

  return { success: true };
}

export async function selectChallengeWinnerAction(challengeId, submissionId, rank) {
  const user = await getCurrentUser();
  const isApproved = await assertApprovedCurator(user);
  if (!isApproved) {
    return { error: "Hanya Curator terverifikasi yang dapat menentukan pemenang challenge." };
  }

  const targetChallengeId = parsePositiveInt(challengeId);
  const targetSubmissionId = parsePositiveInt(submissionId);
  const parsedRank = rank === null || rank === "" ? null : Number(rank);

  if (!targetChallengeId || !targetSubmissionId) {
    return { error: "Data challenge atau submisi tidak valid." };
  }

  if (parsedRank !== null && ![1, 2, 3].includes(parsedRank)) {
    return { error: "Peringkat pemenang hanya boleh Juara 1, 2, atau 3." };
  }

  await ensureChallengeColumns();

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

  // 3 & 4. Jalankan secara atomik dalam transaksi (lock baris challenge agar anti race-condition)
  try {
    await withTransaction(async (client) => {
      await client.query("SELECT id FROM challenges WHERE id = $1 FOR UPDATE", [targetChallengeId]);

      if (parsedRank !== null) {
        await client.query(
          `UPDATE challenge_submissions
           SET winner_rank = NULL
           WHERE challenge_id = $1 AND winner_rank = $2 AND id <> $3`,
          [targetChallengeId, parsedRank, targetSubmissionId]
        );
      }

      await client.query(
        `UPDATE challenge_submissions
         SET winner_rank = $1
         WHERE id = $2 AND challenge_id = $3`,
        [parsedRank, targetSubmissionId, targetChallengeId]
      );
    });
  } catch (error) {
    console.error("Select challenge winner error:", error);
    return { error: "Gagal menyimpan peringkat juara. Silakan coba lagi." };
  }

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

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawRules = formData.get("rules");
  const rawPrize = formData.get("prize");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const rules = typeof rawRules === "string" ? rawRules.trim() : "";
  const prize = typeof rawPrize === "string" ? rawPrize.trim() : "";
  const startDateRaw = formData.get("startDate");
  const endDateRaw = formData.get("endDate");
  const tzOffsetRaw = formData.get("tzOffset");
  const bannerFile = formData.get("bannerFile");

  if (!title || !description || !rules || !prize || !startDateRaw || !endDateRaw) {
    return { error: "Semua field (judul, deskripsi, aturan, hadiah, tanggal mulai & selesai) wajib diisi." };
  }

  if (title.length > 150 || prize.length > 150) {
    return { error: "Judul dan hadiah challenge maksimal 150 karakter." };
  }

  const parsedStart = parseDateTimeLocalToIso(startDateRaw, tzOffsetRaw);
  const parsedEnd = parseDateTimeLocalToIso(endDateRaw, tzOffsetRaw);

  if (!parsedStart || !parsedEnd) {
    return { error: "Format tanggal mulai atau tanggal selesai tidak valid." };
  }

  if (parsedEnd.date <= parsedStart.date) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }

  if (!bannerFile || typeof bannerFile !== "object" || bannerFile.size === 0) {
    return { error: "Gambar banner challenge wajib diunggah." };
  }

  const saved = await saveBannerFile(bannerFile, user.id);
  if (saved.error) {
    return { error: saved.error };
  }

  try {
    await query(
      `INSERT INTO challenges (curator_id, title, description, rules, prize, start_date, end_date, banner_url)
       VALUES (
         $1, $2, $3, $4, $5,
         ($6::timestamptz AT TIME ZONE current_setting('TIMEZONE')),
         ($7::timestamptz AT TIME ZONE current_setting('TIMEZONE')),
         $8
       )`,
      [user.id, title, description, rules, prize, parsedStart.iso, parsedEnd.iso, saved.bannerUrl]
    );
  } catch (error) {
    if (saved.filepath) await unlink(saved.filepath).catch(() => {});
    console.error("Create challenge DB error:", error);
    return { error: "Gagal membuat challenge. Silakan coba lagi." };
  }

  revalidatePath("/curator");
  revalidatePath("/challenges");
  revalidatePath("/home");
  revalidatePath("/admin");

  return { success: true, message: "Challenge baru berhasil dibuat!" };
}

export async function updateChallengeAction(prevState, formData) {
  const user = await getCurrentUser();
  const isApproved = await assertApprovedCurator(user);
  if (!isApproved) {
    return { error: "Hanya Curator terverifikasi yang dapat mengubah challenge." };
  }

  await ensureChallengeColumns();

  const challengeId = parsePositiveInt(formData.get("challengeId"));
  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawRules = formData.get("rules");
  const rawPrize = formData.get("prize");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const rules = typeof rawRules === "string" ? rawRules.trim() : "";
  const prize = typeof rawPrize === "string" ? rawPrize.trim() : "";
  const startDateRaw = formData.get("startDate");
  const endDateRaw = formData.get("endDate");
  const tzOffsetRaw = formData.get("tzOffset");
  const bannerFile = formData.get("bannerFile");

  if (!challengeId || !title || !description || !rules || !prize || !startDateRaw || !endDateRaw) {
    return { error: "Semua field wajib diisi dengan benar." };
  }

  if (title.length > 150 || prize.length > 150) {
    return { error: "Judul dan hadiah challenge maksimal 150 karakter." };
  }

  const parsedStart = parseDateTimeLocalToIso(startDateRaw, tzOffsetRaw);
  const parsedEnd = parseDateTimeLocalToIso(endDateRaw, tzOffsetRaw);

  if (!parsedStart || !parsedEnd) {
    return { error: "Format tanggal tidak valid." };
  }

  if (parsedEnd.date <= parsedStart.date) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }

  const existingResult = await query(
    "SELECT id, banner_url FROM challenges WHERE id = $1 AND curator_id = $2",
    [challengeId, user.id]
  );

  if (existingResult.rows.length === 0) {
    return { error: "Challenge tidak ditemukan atau bukan milikmu." };
  }

  if (parsedEnd.date > new Date()) {
    const winnersCheck = await query(
      "SELECT 1 FROM challenge_submissions WHERE challenge_id = $1 AND winner_rank IS NOT NULL LIMIT 1",
      [challengeId]
    );
    if (winnersCheck.rows.length > 0) {
      return {
        error: "Challenge yang sudah memiliki pemenang tidak dapat diperpanjang. Batalkan peringkat juara terlebih dahulu jika ingin membuka ulang.",
      };
    }
  }

  let newBannerUrl = null;
  let newFilepath = null;
  if (bannerFile && typeof bannerFile === "object" && bannerFile.size > 0) {
    const saved = await saveBannerFile(bannerFile, user.id);
    if (saved.error) {
      return { error: saved.error };
    }
    newBannerUrl = saved.bannerUrl;
    newFilepath = saved.filepath;
  }

  try {
    await query(
      `UPDATE challenges
       SET title = $1,
           description = $2,
           rules = $3,
           prize = $4,
           start_date = ($5::timestamptz AT TIME ZONE current_setting('TIMEZONE')),
           end_date = ($6::timestamptz AT TIME ZONE current_setting('TIMEZONE')),
           banner_url = COALESCE($7, banner_url)
       WHERE id = $8 AND curator_id = $9`,
      [title, description, rules, prize, parsedStart.iso, parsedEnd.iso, newBannerUrl, challengeId, user.id]
    );
  } catch (error) {
    if (newFilepath) await unlink(newFilepath).catch(() => {});
    console.error("Update challenge DB error:", error);
    return { error: "Gagal memperbarui challenge. Silakan coba lagi." };
  }

  if (newBannerUrl && existingResult.rows[0].banner_url) {
    await removeLocalBanner(existingResult.rows[0].banner_url);
  }

  revalidatePath("/curator");
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
  revalidatePath("/home");
  revalidatePath("/admin");

  return { success: true, message: "Challenge berhasil diperbarui." };
}

export async function deleteChallengeAction(challengeId) {
  const user = await getCurrentUser();
  const isApproved = await assertApprovedCurator(user);
  if (!isApproved) {
    return { error: "Hanya Curator terverifikasi yang dapat menghapus challenge." };
  }

  const targetId = parsePositiveInt(challengeId);
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
  revalidatePath(`/challenges/${targetId}`);
  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath("/admin");

  return { success: true };
}

export async function deleteRejectedCuratorAccountAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== "Curator") {
    return { error: "Aksi tidak diizinkan." };
  }

  const existing = await query("SELECT id, curator_status, avatar_url FROM users WHERE id = $1", [user.id]);
  if (existing.rows.length === 0) {
    return { error: "Akun tidak ditemukan." };
  }

  if (existing.rows[0].curator_status !== "Rejected") {
    return { error: "Penghapusan akun melalui halaman ini hanya tersedia jika pendaftaran Curator ditolak Admin." };
  }

  const oldAvatar = existing.rows[0].avatar_url;
  await query("DELETE FROM users WHERE id = $1", [user.id]);
  if (oldAvatar) {
    await removeLocalBanner(oldAvatar);
  }

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
  cookieStore.set("aesthe_session", token, SESSION_COOKIE_OPTIONS);

  if (fresh.curator_status === "Approved") {
    redirect("/curator");
  }
  revalidatePath("/pending-curator");
}
