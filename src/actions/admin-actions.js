"use server";

import path from "path";
import { unlink } from "fs/promises";
import { revalidatePath } from "next/cache";
import { query, ensureReportsTable, ensureCommentReportsTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/validation";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "Admin") {
    return null;
  }
  return user;
}

function revalidateAllPublic() {
  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  revalidatePath("/challenges");
  revalidatePath("/profile");
}

// 1. Verifikasi Curator (Approve / Reject)
export async function verifyCuratorAction(curatorId, status) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetId = parsePositiveInt(curatorId);
  if (!targetId || (status !== "Approved" && status !== "Rejected")) {
    return { error: "Status verifikasi tidak valid." };
  }

  const updated = await query(
    `UPDATE users
     SET curator_status = $1
     WHERE id = $2 AND role = 'Curator'
     RETURNING id`,
    [status, targetId]
  );

  if (updated.rows.length === 0) {
    return { error: "Akun Curator tidak ditemukan." };
  }

  revalidatePath("/admin");
  revalidatePath("/home");
  revalidatePath("/pending-curator");
  revalidatePath("/curator");
  return { success: true };
}

// 2. Hapus Pengguna (Hanya Member dan Curator, dilarang menghapus Admin / diri sendiri)
export async function deleteUserAction(targetUserId) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetId = parsePositiveInt(targetUserId);
  if (!targetId) return { error: "ID pengguna tidak valid." };

  if (targetId === Number(admin.id)) {
    return { error: "Admin tidak dapat menghapus akunnya sendiri." };
  }

  const targetResult = await query("SELECT id, role, username, avatar_url FROM users WHERE id = $1", [targetId]);
  if (targetResult.rows.length === 0) {
    return { error: "Pengguna tidak ditemukan." };
  }

  if (targetResult.rows[0].role === "Admin") {
    return { error: "Tidak dapat menghapus akun Admin lain." };
  }

  const [artFilesRes, bannerFilesRes] = await Promise.all([
    query("SELECT image_url FROM artworks WHERE user_id = $1", [targetId]),
    query("SELECT banner_url FROM challenges WHERE curator_id = $1", [targetId]),
  ]);

  const localFilesToDelete = [
    targetResult.rows[0].avatar_url,
    ...artFilesRes.rows.map((r) => r.image_url),
    ...bannerFilesRes.rows.map((r) => r.banner_url),
  ].filter((url) => typeof url === "string" && url.startsWith("/uploads/"));

  await query("DELETE FROM users WHERE id = $1 AND role IN ('Member', 'Curator')", [targetId]);

  await Promise.all(
    localFilesToDelete.map(async (fileUrl) => {
      const safeFilename = path.basename(fileUrl);
      const localFilePath = path.join(process.cwd(), "public", "uploads", safeFilename);
      try {
        await unlink(localFilePath);
      } catch {
        // Abaikan jika file sudah tidak ada
      }
    })
  );

  revalidateAllPublic();
  revalidatePath("/curator");
  revalidatePath("/messages");
  revalidatePath(`/creators/${targetResult.rows[0].username}`);
  return { success: true };
}

// 3. Manajemen Kategori (CRUD)
export async function createCategoryAction(prevState, formData) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) {
    return { error: "Nama kategori wajib diisi." };
  }

  const duplicate = await query(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER($1)",
    [name]
  );
  if (duplicate.rows.length > 0) {
    return { error: `Kategori "${name}" sudah ada.` };
  }

  await query("INSERT INTO categories (name) VALUES ($1)", [name]);
  revalidateAllPublic();
  return { success: true, message: `Kategori "${name}" berhasil ditambahkan.` };
}

export async function updateCategoryAction(categoryId, name) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetId = parsePositiveInt(categoryId);
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!targetId || !cleanName) {
    return { error: "Nama kategori tidak boleh kosong." };
  }

  const duplicate = await query(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2",
    [cleanName, targetId]
  );
  if (duplicate.rows.length > 0) {
    return { error: `Nama kategori "${cleanName}" sudah digunakan.` };
  }

  await query("UPDATE categories SET name = $1 WHERE id = $2", [cleanName, targetId]);
  revalidateAllPublic();
  return { success: true };
}

export async function deleteCategoryAction(categoryId) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetId = parsePositiveInt(categoryId);
  if (!targetId) return { error: "ID kategori tidak valid." };

  const usage = await query("SELECT COUNT(*)::int AS total FROM artworks WHERE category_id = $1", [targetId]);
  if ((usage.rows[0]?.total || 0) > 0) {
    return { error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${usage.rows[0].total} karya.` };
  }

  await query("DELETE FROM categories WHERE id = $1", [targetId]);
  revalidateAllPublic();
  return { success: true };
}

// 4. Moderasi Konten (Dismiss Report / Take Down Artwork)
export async function dismissReportAction(artworkId) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetArtworkId = parsePositiveInt(artworkId);
  if (!targetArtworkId) return { error: "ID karya tidak valid." };

  await ensureReportsTable();

  await query(
    `UPDATE reports
     SET status = 'Dismissed'
     WHERE artwork_id = $1 AND status = 'Pending'`,
    [targetArtworkId]
  );

  revalidatePath("/admin");
  revalidatePath("/home");
  return { success: true };
}

export async function takeDownArtworkAction(artworkId) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetArtworkId = parsePositiveInt(artworkId);
  if (!targetArtworkId) return { error: "ID karya tidak valid." };

  await ensureReportsTable();

  const deleted = await query(
    "DELETE FROM artworks WHERE id = $1 RETURNING id, image_url",
    [targetArtworkId]
  );

  if (deleted.rows.length === 0) {
    return { error: "Karya tidak ditemukan atau sudah dihapus." };
  }

  const deletedImageUrl = deleted.rows[0].image_url;
  if (deletedImageUrl && deletedImageUrl.startsWith("/uploads/")) {
    const safeFilename = path.basename(deletedImageUrl);
    const localFilePath = path.join(process.cwd(), "public", "uploads", safeFilename);
    try {
      await unlink(localFilePath);
    } catch {
      // Abaikan jika file sudah tidak ada
    }
  }

  revalidateAllPublic();
  revalidatePath(`/artworks/${targetArtworkId}`);
  return { success: true };
}

// 5. Moderasi Komentar (Dismiss Report / Take Down Komentar)
export async function dismissCommentReportAction(commentId) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetCommentId = parsePositiveInt(commentId);
  if (!targetCommentId) return { error: "ID komentar tidak valid." };

  await ensureCommentReportsTable();

  await query(
    `UPDATE comment_reports
     SET status = 'Dismissed'
     WHERE comment_id = $1 AND status = 'Pending'`,
    [targetCommentId]
  );

  revalidatePath("/admin");
  revalidatePath("/home");
  return { success: true };
}

export async function takeDownCommentAction(commentId) {
  const admin = await requireAdmin();
  if (!admin) return { error: "Akses ditolak. Khusus Admin." };

  const targetCommentId = parsePositiveInt(commentId);
  if (!targetCommentId) return { error: "ID komentar tidak valid." };

  await ensureCommentReportsTable();

  const deleted = await query(
    "DELETE FROM comments WHERE id = $1 RETURNING id, artwork_id",
    [targetCommentId]
  );

  if (deleted.rows.length === 0) {
    return { error: "Komentar tidak ditemukan atau sudah dihapus." };
  }

  const artworkId = deleted.rows[0].artwork_id;
  revalidatePath("/admin");
  revalidatePath("/home");
  if (artworkId) {
    revalidatePath(`/artworks/${artworkId}`);
  }
  return { success: true };
}
