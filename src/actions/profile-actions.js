"use server";

import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { query, ensureUserProfileColumns, ensureFollowsTable } from "@/lib/db";
import { getCurrentUser, createSessionToken } from "@/lib/auth";

const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

export async function updateProfileAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Silakan masuk terlebih dahulu untuk memperbarui profil." };
  }

  await ensureUserProfileColumns();

  const displayName = formData.get("displayName")?.trim();
  const bio = formData.get("bio")?.trim() || "";
  const externalLink = formData.get("externalLink")?.trim() || "";
  const avatarFile = formData.get("avatar");

  if (!displayName) {
    return { error: "Nama tampilan wajib diisi." };
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

  let newAvatarUrl = null;
  if (avatarFile && typeof avatarFile === "object" && avatarFile.size > 0) {
    const ext = ALLOWED_IMAGE_TYPES.get(avatarFile.type);
    if (!ext) {
      return { error: "Format foto profil harus JPG, PNG, WEBP, atau GIF." };
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      return { error: "Ukuran foto profil maksimal 5 MB." };
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `avatar-${user.id}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const arrayBuffer = await avatarFile.arrayBuffer();
    await writeFile(filepath, Buffer.from(arrayBuffer));

    newAvatarUrl = `/uploads/${filename}`;
  }

  const updated = await query(
    `UPDATE users
     SET display_name = $1,
         bio = $2,
         external_link = $3,
         avatar_url = COALESCE($4, avatar_url)
     WHERE id = $5
     RETURNING id, display_name, username, role, curator_status, avatar_url`,
    [displayName, bio || null, externalLink || null, newAvatarUrl, user.id]
  );

  if (updated.rows.length === 0) {
    return { error: "Pengguna tidak ditemukan." };
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
  cookieStore.set("aesthe_session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath(`/creators/${freshUser.username}`);

  return { success: true, message: "Informasi profil berhasil diperbarui." };
}

export async function updateAccountAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Silakan masuk terlebih dahulu." };
  }

  const email = formData.get("email")?.trim().toLowerCase();
  const currentPassword = formData.get("currentPassword") || "";
  const newPassword = formData.get("newPassword") || "";
  const confirmPassword = formData.get("confirmPassword") || "";

  if (!email) {
    return { error: "Alamat email wajib diisi." };
  }

  const emailTaken = await query(
    "SELECT id FROM users WHERE email = $1 AND id <> $2",
    [email, user.id]
  );

  if (emailTaken.rows.length > 0) {
    return { error: "Email tersebut sudah digunakan oleh akun lain." };
  }

  if (newPassword || confirmPassword) {
    if (!currentPassword) {
      return { error: "Masukkan kata sandi saat ini untuk mengganti kata sandi." };
    }
    if (newPassword.length < 6) {
      return { error: "Kata sandi baru minimal 6 karakter." };
    }
    if (newPassword !== confirmPassword) {
      return { error: "Konfirmasi kata sandi baru tidak cocok." };
    }

    const existing = await query("SELECT password_hash FROM users WHERE id = $1", [user.id]);
    if (existing.rows.length === 0) {
      return { error: "Akun tidak ditemukan." };
    }

    const isValid = await bcrypt.compare(currentPassword, existing.rows[0].password_hash);
    if (!isValid) {
      return { error: "Kata sandi saat ini salah." };
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

  const artworkId = Number(formData.get("artworkId"));
  const title = formData.get("title")?.trim();
  const description = formData.get("description")?.trim();
  const categoryId = Number(formData.get("categoryId"));
  const rawTags = formData.get("tags")?.trim() || "";

  const tags = rawTags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  if (!artworkId || !title || !description || !categoryId || tags.length === 0) {
    return { error: "Judul, deskripsi, kategori, dan minimal 1 tag wajib diisi." };
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
  revalidatePath(`/creators/${user.username}`);

  return { success: true, message: "Detail karya berhasil diperbarui." };
}

export async function deleteArtworkAction(artworkId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat menghapus karyanya sendiri." };
  }

  const deleted = await query(
    "DELETE FROM artworks WHERE id = $1 AND user_id = $2 RETURNING id, image_url",
    [Number(artworkId), user.id]
  );

  if (deleted.rows.length === 0) {
    return { error: "Karya tidak ditemukan atau kamu tidak berhak menghapusnya." };
  }

  const deletedImageUrl = deleted.rows[0].image_url;
  if (deletedImageUrl && deletedImageUrl.startsWith("/uploads/")) {
    const safeFilename = path.basename(deletedImageUrl);
    const localFilePath = path.join(process.cwd(), "public", "uploads", safeFilename);
    try {
      await unlink(localFilePath);
    } catch {
      // Abaikan jika file sudah tidak ada di disk
    }
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath(`/creators/${user.username}`);

  return { success: true };
}

export async function toggleFollowAction(targetUserId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk mengikuti kreator." };
  }

  const targetId = Number(targetUserId);
  if (!targetId || Number.isNaN(targetId)) {
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
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
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
