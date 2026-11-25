"use server";

import crypto from "crypto";
import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { query, ensureUserProfileColumns, ensureFollowsTable } from "@/lib/db";
import { getCurrentUser, createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { parsePositiveInt, verifyImageMagicBytes } from "@/lib/validation";

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

async function removeLocalUpload(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  const safeFilename = path.basename(fileUrl);
  const localPath = path.join(process.cwd(), "public", "uploads", safeFilename);
  try {
    await unlink(localPath);
  } catch {
    // Abaikan jika file sudah tidak ada di disk
  }
}

export async function updateProfileAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Silakan masuk terlebih dahulu untuk memperbarui profil." };
  }

  await ensureUserProfileColumns();

  const rawDisplayName = formData.get("displayName");
  const rawBio = formData.get("bio");
  const rawExternalLink = formData.get("externalLink");
  const displayName = typeof rawDisplayName === "string" ? rawDisplayName.trim() : "";
  const bio = typeof rawBio === "string" ? rawBio.trim() : "";
  const externalLink = typeof rawExternalLink === "string" ? rawExternalLink.trim() : "";
  const avatarFile = formData.get("avatar");

  if (!displayName) {
    return { error: "Nama tampilan wajib diisi." };
  }

  if (displayName.length > 100) {
    return { error: "Nama tampilan maksimal 100 karakter." };
  }

  if (externalLink) {
    try {
      const parsed = new URL(externalLink);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { error: "Tautan eksternal harus diawali dengan http:// atau https://." };
      }
    } catch {
      return { error: "Format tautan eksternal tidak valid (contoh: https://instagram.com/username)." };
    }
  }

  const prevAvatarRes = await query("SELECT avatar_url FROM users WHERE id = $1", [user.id]);
  const prevAvatarUrl = prevAvatarRes.rows[0]?.avatar_url || null;

  let newAvatarUrl = null;
  let newAvatarFilepath = null;
  if (avatarFile && typeof avatarFile === "object" && avatarFile.size > 0) {
    const ext = ALLOWED_IMAGE_TYPES.get(avatarFile.type);
    if (!ext) {
      return { error: "Format foto profil harus JPG, PNG, WEBP, atau GIF." };
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { error: "Ukuran foto profil maksimal 5 MB." };
    }

    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    if (!verifyImageMagicBytes(buffer, avatarFile.type)) {
      return { error: "Isi file foto profil tidak cocok dengan format gambar yang valid (JPG/PNG/WEBP/GIF)." };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `avatar-${user.id}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    newAvatarUrl = `/uploads/${filename}`;
    newAvatarFilepath = filepath;
  }

  let updated;
  try {
    updated = await query(
      `UPDATE users
       SET display_name = $1,
           bio = $2,
           external_link = $3,
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, display_name, username, role, curator_status, avatar_url`,
      [displayName, bio || null, externalLink || null, newAvatarUrl, user.id]
    );
  } catch (error) {
    if (newAvatarFilepath) await unlink(newAvatarFilepath).catch(() => {});
    console.error("Update profile DB error:", error);
    return { error: "Gagal memperbarui profil. Silakan coba lagi." };
  }

  if (updated.rows.length === 0) {
    if (newAvatarFilepath) await unlink(newAvatarFilepath).catch(() => {});
    return { error: "Pengguna tidak ditemukan." };
  }

  if (newAvatarUrl && prevAvatarUrl && prevAvatarUrl !== newAvatarUrl) {
    await removeLocalUpload(prevAvatarUrl);
  }

  const freshUser = updated.rows[0];
  const token = await createSessionToken({
    id: freshUser.id,
    displayName: freshUser.display_name,
    username: freshUser.username,
    role: freshUser.role,
    curatorStatus: freshUser.curator_status,
    avatarUrl: freshUser.avatar_url || null,
  });

  const cookieStore = await cookies();
  cookieStore.set("aesthe_session", token, SESSION_COOKIE_OPTIONS);

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath("/messages");
  revalidatePath(`/creators/${freshUser.username}`);

  return { success: true, message: "Informasi profil berhasil diperbarui." };
}

export async function updateAccountAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Silakan masuk terlebih dahulu." };
  }

  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const currentPassword = typeof formData.get("currentPassword") === "string" ? formData.get("currentPassword") : "";
  const newPassword = typeof formData.get("newPassword") === "string" ? formData.get("newPassword") : "";
  const confirmPassword = typeof formData.get("confirmPassword") === "string" ? formData.get("confirmPassword") : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format alamat email tidak valid." };
  }

  const currentAccount = await query(
    "SELECT email, password_hash FROM users WHERE id = $1",
    [user.id]
  );
  if (currentAccount.rows.length === 0) {
    return { error: "Akun tidak ditemukan." };
  }

  const isEmailChanging = email !== String(currentAccount.rows[0].email || "").toLowerCase();
  const isPasswordChanging = Boolean(newPassword || confirmPassword);

  if (!isEmailChanging && !isPasswordChanging) {
    return { error: "Tidak ada perubahan pada email maupun kata sandi." };
  }

  const emailTaken = await query(
    "SELECT id FROM users WHERE email = $1 AND id <> $2",
    [email, user.id]
  );

  if (emailTaken.rows.length > 0) {
    return { error: "Email tersebut sudah digunakan oleh akun lain." };
  }

  if (!currentPassword) {
    return {
      error: isPasswordChanging
        ? "Masukkan kata sandi saat ini untuk mengganti kata sandi."
        : "Masukkan kata sandi saat ini untuk mengonfirmasi perubahan email.",
    };
  }

  const isValid = await bcrypt.compare(currentPassword, currentAccount.rows[0].password_hash);
  if (!isValid) {
    return { error: "Kata sandi saat ini salah." };
  }

  if (isPasswordChanging) {
    if (newPassword.length < 6) {
      return { error: "Kata sandi baru minimal 6 karakter." };
    }
    if (newPassword !== confirmPassword) {
      return { error: "Konfirmasi kata sandi baru tidak cocok." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(
      "UPDATE users SET email = $1, password_hash = $2 WHERE id = $3",
      [email, passwordHash, user.id]
    );

    revalidatePath("/profile");
    return { success: true, message: "Email dan kata sandi berhasil diperbarui." };
  }

  await query("UPDATE users SET email = $1 WHERE id = $2", [email, user.id]);
  revalidatePath("/profile");
  return { success: true, message: "Alamat email berhasil diperbarui." };
}

export async function updateArtworkAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat mengubah karyanya." };
  }

  const artworkId = parsePositiveInt(formData.get("artworkId"));
  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawTags = formData.get("tags");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const categoryId = parsePositiveInt(formData.get("categoryId"));

  const tags = Array.from(
    new Set(
      (typeof rawTags === "string" ? rawTags : "")
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (!artworkId || !title || !description || !categoryId || tags.length === 0) {
    return { error: "Judul, deskripsi, kategori, dan minimal 1 tag wajib diisi." };
  }

  if (title.length > 150) {
    return { error: "Judul karya maksimal 150 karakter." };
  }

  const categoryExists = await query("SELECT id FROM categories WHERE id = $1", [categoryId]);
  if (categoryExists.rows.length === 0) {
    return { error: "Kategori yang dipilih tidak ditemukan." };
  }

  const updated = await query(
    `UPDATE artworks
     SET title = $1, description = $2, category_id = $3, tags = $4
     WHERE id = $5 AND user_id = $6
     RETURNING id`,
    [title, description, categoryId, tags, artworkId, user.id]
  );

  if (updated.rows.length === 0) {
    return { error: "Karya tidak ditemukan atau kamu tidak memiliki izin mengubahnya." };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath(`/artworks/${artworkId}`);
  revalidatePath(`/creators/${user.username}`);

  return { success: true, message: "Detail karya berhasil diperbarui." };
}

export async function deleteArtworkAction(artworkId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat menghapus karyanya sendiri." };
  }

  const targetArtworkId = parsePositiveInt(artworkId);
  if (!targetArtworkId) {
    return { error: "Karya tidak valid." };
  }

  const deleted = await query(
    "DELETE FROM artworks WHERE id = $1 AND user_id = $2 RETURNING id, image_url",
    [targetArtworkId, user.id]
  );

  if (deleted.rows.length === 0) {
    return { error: "Karya tidak ditemukan atau kamu tidak berhak menghapusnya." };
  }

  await removeLocalUpload(deleted.rows[0].image_url);

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath("/challenges");
  revalidatePath("/curator");
  revalidatePath("/admin");
  revalidatePath(`/artworks/${targetArtworkId}`);
  revalidatePath(`/creators/${user.username}`);

  return { success: true };
}

export async function toggleFollowAction(targetUserId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk mengikuti kreator." };
  }

  const targetId = parsePositiveInt(targetUserId);
  if (!targetId) {
    return { error: "Kreator tidak valid." };
  }

  if (targetId === Number(user.id)) {
    return { error: "Kamu tidak dapat mengikuti dirimu sendiri." };
  }

  await ensureFollowsTable();

  const targetRes = await query("SELECT id, username FROM users WHERE id = $1", [targetId]);
  if (targetRes.rows.length === 0) {
    return { error: "Kreator tidak ditemukan." };
  }

  const targetUsername = targetRes.rows[0].username;

  const existing = await query(
    "SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2",
    [user.id, targetId]
  );

  let following = false;
  if (existing.rows.length > 0) {
    await query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [user.id, targetId]
    );
    following = false;
  } else {
    await query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT (follower_id, following_id) DO NOTHING",
      [user.id, targetId]
    );
    following = true;
  }

  revalidatePath(`/creators/${targetUsername}`);
  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/explore");

  return { success: true, following };
}
