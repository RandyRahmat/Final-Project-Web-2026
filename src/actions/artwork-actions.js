"use server";

import crypto from "crypto";
import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import { revalidatePath } from "next/cache";
import { query, ensureCommentsTable, ensureReportsTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  parsePositiveInt,
  isValidReactionType,
  verifyImageMagicBytes,
} from "@/lib/validation";

const ALLOWED_ARTWORK_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_ARTWORK_BYTES = 8 * 1024 * 1024; // 8MB

export async function reactArtworkAction(artworkId, reactionType = "love") {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk memberi reaksi." };
  }

  const targetArtworkId = parsePositiveInt(artworkId);
  if (!targetArtworkId) {
    return { error: "Karya tidak valid." };
  }

  if (!isValidReactionType(reactionType)) {
    return { error: "Jenis reaksi tidak valid." };
  }

  const artworkRes = await query(
    `SELECT a.id, u.username
     FROM artworks a
     JOIN users u ON a.user_id = u.id
     WHERE a.id = $1`,
    [targetArtworkId]
  );

  if (artworkRes.rows.length === 0) {
    return { error: "Karya tidak ditemukan." };
  }

  const ownerUsername = artworkRes.rows[0].username;

  const existing = await query(
    "SELECT reaction_type FROM artwork_reactions WHERE user_id = $1 AND artwork_id = $2",
    [user.id, targetArtworkId]
  );

  if (existing.rows.length > 0 && existing.rows[0].reaction_type === reactionType) {
    await query(
      "DELETE FROM artwork_reactions WHERE user_id = $1 AND artwork_id = $2",
      [user.id, targetArtworkId]
    );
  } else {
    await query(
      `INSERT INTO artwork_reactions (user_id, artwork_id, reaction_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, artwork_id)
        DO UPDATE SET reaction_type = EXCLUDED.reaction_type`,
      [user.id, targetArtworkId, reactionType]
    );
  }

  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath("/profile");
  revalidatePath(`/artworks/${targetArtworkId}`);
  revalidatePath(`/creators/${ownerUsername}`);
  return { success: true };
}

export async function toggleFavoriteAction(artworkId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk menyimpan karya." };
  }

  const targetArtworkId = parsePositiveInt(artworkId);
  if (!targetArtworkId) {
    return { error: "Karya tidak valid." };
  }

  const artworkRes = await query(
    `SELECT a.id, u.username
     FROM artworks a
     JOIN users u ON a.user_id = u.id
     WHERE a.id = $1`,
    [targetArtworkId]
  );

  if (artworkRes.rows.length === 0) {
    return { error: "Karya tidak ditemukan." };
  }

  const ownerUsername = artworkRes.rows[0].username;

  const existing = await query(
    "SELECT 1 FROM favorites WHERE user_id = $1 AND artwork_id = $2",
    [user.id, targetArtworkId]
  );

  if (existing.rows.length > 0) {
    await query(
      "DELETE FROM favorites WHERE user_id = $1 AND artwork_id = $2",
      [user.id, targetArtworkId]
    );
    await query(
      `DELETE FROM collection_items
       WHERE artwork_id = $1
         AND collection_id IN (SELECT id FROM collections WHERE user_id = $2)`,
      [targetArtworkId, user.id]
    );
  } else {
    await query(
      "INSERT INTO favorites (user_id, artwork_id) VALUES ($1, $2) ON CONFLICT (user_id, artwork_id) DO NOTHING",
      [user.id, targetArtworkId]
    );
  }

  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath("/profile");
  revalidatePath(`/artworks/${targetArtworkId}`);
  revalidatePath(`/creators/${ownerUsername}`);
  return { success: true };
}

export async function createArtworkAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat mengunggah karya." };
  }

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawTags = formData.get("tags");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const categoryId = parsePositiveInt(formData.get("categoryId"));
  const imageFile = formData.get("imageFile");

  const tags = Array.from(
    new Set(
      (typeof rawTags === "string" ? rawTags : "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (!title || !description || !categoryId || tags.length === 0) {
    return { error: "Semua field wajib diisi (minimal 1 tag dipisahkan koma)." };
  }

  if (title.length > 150) {
    return { error: "Judul karya maksimal 150 karakter." };
  }

  if (!imageFile || typeof imageFile !== "object" || imageFile.size === 0) {
    return { error: "File gambar karya wajib dipilih dari perangkatmu." };
  }

  const ext = ALLOWED_ARTWORK_TYPES.get(imageFile.type);
  if (!ext) {
    return { error: "Format gambar harus JPG, PNG, WEBP, atau GIF." };
  }

  if (imageFile.size > MAX_ARTWORK_BYTES) {
    return { error: "Ukuran file gambar maksimal 8 MB." };
  }

  const categoryExists = await query("SELECT id FROM categories WHERE id = $1", [categoryId]);
  if (categoryExists.rows.length === 0) {
    return { error: "Kategori yang dipilih tidak ditemukan." };
  }

  const buffer = Buffer.from(await imageFile.arrayBuffer());
  if (!verifyImageMagicBytes(buffer, imageFile.type)) {
    return { error: "Isi file tidak cocok dengan format gambar yang valid (JPG/PNG/WEBP/GIF)." };
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const filename = `artwork-${user.id}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/${filename}`;

  try {
    await query(
      `INSERT INTO artworks (user_id, category_id, title, description, image_url, tags)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, categoryId, title, description, imageUrl, tags]
    );
  } catch (error) {
    await unlink(filepath).catch(() => {});
    console.error("Create artwork DB error:", error);
    return { error: "Gagal menyimpan karya ke database. Silakan coba lagi." };
  }

  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath("/profile");
  revalidatePath("/admin");
  revalidatePath(`/creators/${user.username}`);
  return { success: true };
}

export async function addCommentAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk menambahkan komentar." };
  }

  const artworkId = parsePositiveInt(formData.get("artworkId"));
  const rawContent = formData.get("content");
  const content = typeof rawContent === "string" ? rawContent.trim() : "";

  if (!artworkId || !content) {
    return { error: "Komentar tidak boleh kosong." };
  }

  if (content.length > 500) {
    return { error: "Komentar maksimal 500 karakter." };
  }

  await ensureCommentsTable();

  const artExists = await query("SELECT id FROM artworks WHERE id = $1", [artworkId]);
  if (artExists.rows.length === 0) {
    return { error: "Karya tidak ditemukan." };
  }

  await query(
    "INSERT INTO comments (artwork_id, user_id, content) VALUES ($1, $2, $3)",
    [artworkId, user.id, content]
  );

  revalidatePath(`/artworks/${artworkId}`);
  revalidatePath("/home");
  return { success: true };
}

export async function deleteCommentAction(commentId, artworkId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat menghapus komentarnya sendiri." };
  }

  const targetCommentId = parsePositiveInt(commentId);
  if (!targetCommentId) {
    return { error: "Komentar tidak valid." };
  }

  await ensureCommentsTable();

  const deleted = await query(
    "DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id, artwork_id",
    [targetCommentId, user.id]
  );

  if (deleted.rows.length === 0) {
    return { error: "Komentar tidak ditemukan atau kamu tidak berhak menghapusnya." };
  }

  const realArtworkId = deleted.rows[0].artwork_id || parsePositiveInt(artworkId);
  if (realArtworkId) {
    revalidatePath(`/artworks/${realArtworkId}`);
  }
  revalidatePath("/home");
  return { success: true };
}

export async function reportArtworkAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk melaporkan karya." };
  }

  const artworkId = parsePositiveInt(formData.get("artworkId"));
  const rawCategory = formData.get("reasonCategory");
  const rawDetail = formData.get("reasonDetail");
  const reasonCategory = typeof rawCategory === "string" ? rawCategory.trim() : "";
  const reasonDetail = typeof rawDetail === "string" ? rawDetail.trim() : "";

  if (!artworkId || !reasonCategory) {
    return { error: "Pilih alasan pelaporan terlebih dahulu." };
  }

  const finalReason = reasonDetail ? `${reasonCategory}: ${reasonDetail}` : reasonCategory;

  await ensureReportsTable();

  const artworkRes = await query("SELECT id, user_id FROM artworks WHERE id = $1", [artworkId]);
  if (artworkRes.rows.length === 0) {
    return { error: "Karya tidak ditemukan." };
  }

  if (Number(artworkRes.rows[0].user_id) === Number(user.id)) {
    return { error: "Kamu tidak dapat melaporkan karyamu sendiri." };
  }

  const alreadyReported = await query(
    "SELECT id FROM reports WHERE artwork_id = $1 AND reporter_id = $2",
    [artworkId, user.id]
  );

  if (alreadyReported.rows.length > 0) {
    return { error: "Kamu sudah pernah melaporkan karya ini sebelumnya." };
  }

  await query(
    `INSERT INTO reports (artwork_id, reporter_id, reason, status)
     VALUES ($1, $2, $3, 'Pending')`,
    [artworkId, user.id, finalReason]
  );

  revalidatePath(`/artworks/${artworkId}`);
  revalidatePath("/admin");
  revalidatePath("/home");
  return { success: true, message: "Laporan telah dikirim ke antrian moderasi Admin. Terima kasih!" };
}
