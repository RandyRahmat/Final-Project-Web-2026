"use server";

import { revalidatePath } from "next/cache";
import { query, ensureCollectionsTables } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function createCollectionAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat membuat moodboard koleksi." };
  }

  const name = formData.get("name")?.trim();
  const description = formData.get("description")?.trim() || "";

  if (!name) {
    return { error: "Nama moodboard wajib diisi." };
  }

  if (name.length > 100) {
    return { error: "Nama moodboard maksimal 100 karakter." };
  }

  await ensureCollectionsTables();

  const duplicate = await query(
    "SELECT id FROM collections WHERE user_id = $1 AND LOWER(name) = LOWER($2)",
    [user.id, name]
  );

  if (duplicate.rows.length > 0) {
    return { error: `Moodboard "${name}" sudah ada di koleksimu.` };
  }

  await query(
    `INSERT INTO collections (user_id, name, description)
     VALUES ($1, $2, $3)`,
    [user.id, name, description || null]
  );

  revalidatePath("/favorites");
  return { success: true, message: `Moodboard "${name}" berhasil dibuat.` };
}

export async function updateCollectionAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Aksi tidak diizinkan." };
  }

  const collectionId = Number(formData.get("collectionId"));
  const name = formData.get("name")?.trim();
  const description = formData.get("description")?.trim() || "";

  if (!collectionId || !name) {
    return { error: "Nama moodboard wajib diisi." };
  }

  if (name.length > 100) {
    return { error: "Nama moodboard maksimal 100 karakter." };
  }

  await ensureCollectionsTables();

  const duplicate = await query(
    "SELECT id FROM collections WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id <> $3",
    [user.id, name, collectionId]
  );

  if (duplicate.rows.length > 0) {
    return { error: `Nama moodboard "${name}" sudah digunakan.` };
  }

  const updated = await query(
    `UPDATE collections
     SET name = $1, description = $2
     WHERE id = $3 AND user_id = $4
     RETURNING id`,
    [name, description || null, collectionId, user.id]
  );

  if (updated.rows.length === 0) {
    return { error: "Moodboard tidak ditemukan." };
  }

  revalidatePath("/favorites");
  return { success: true, message: "Moodboard berhasil diperbarui." };
}

export async function deleteCollectionAction(collectionId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Aksi tidak diizinkan." };
  }

  const targetId = Number(collectionId);
  if (!targetId) {
    return { error: "Moodboard tidak valid." };
  }

  await ensureCollectionsTables();

  const deleted = await query(
    "DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id",
    [targetId, user.id]
  );

  if (deleted.rows.length === 0) {
    return { error: "Moodboard tidak ditemukan." };
  }

  revalidatePath("/favorites");
  return { success: true };
}

export async function toggleArtworkInCollectionAction(collectionId, artworkId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat mengatur moodboard." };
  }

  const targetCollectionId = Number(collectionId);
  const targetArtworkId = Number(artworkId);

  if (!targetCollectionId || !targetArtworkId) {
    return { error: "Data koleksi atau karya tidak valid." };
  }

  await ensureCollectionsTables();

  // Pastikan moodboard milik user aktif
  const colCheck = await query(
    "SELECT id FROM collections WHERE id = $1 AND user_id = $2",
    [targetCollectionId, user.id]
  );
  if (colCheck.rows.length === 0) {
    return { error: "Moodboard tidak ditemukan." };
  }

  // Pastikan karya memang ada di Favorites user aktif
  const favCheck = await query(
    "SELECT 1 FROM favorites WHERE user_id = $1 AND artwork_id = $2",
    [user.id, targetArtworkId]
  );
  if (favCheck.rows.length === 0) {
    return { error: "Simpan karya ke Favorites terlebih dahulu sebelum dimasukkan ke moodboard." };
  }

  const existing = await query(
    "SELECT 1 FROM collection_items WHERE collection_id = $1 AND artwork_id = $2",
    [targetCollectionId, targetArtworkId]
  );

  let included = false;
  if (existing.rows.length > 0) {
    await query(
      "DELETE FROM collection_items WHERE collection_id = $1 AND artwork_id = $2",
      [targetCollectionId, targetArtworkId]
    );
    included = false;
  } else {
    await query(
      "INSERT INTO collection_items (collection_id, artwork_id) VALUES ($1, $2)",
      [targetCollectionId, targetArtworkId]
    );
    included = true;
  }

  revalidatePath("/favorites");
  return { success: true, included };
}
