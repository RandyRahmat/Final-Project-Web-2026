"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function reactArtworkAction(artworkId, reactionType = "love") {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk memberi reaksi." };
  }

  const existing = await query(
    "SELECT reaction_type FROM artwork_reactions WHERE user_id = $1 AND artwork_id = $2",
    [user.id, artworkId]
  );

  if (existing.rows.length > 0 && existing.rows[0].reaction_type === reactionType) {
    await query(
      "DELETE FROM artwork_reactions WHERE user_id = $1 AND artwork_id = $2",
      [user.id, artworkId]
    );
  } else {
    await query(
      `INSERT INTO artwork_reactions (user_id, artwork_id, reaction_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, artwork_id)
        DO UPDATE SET reaction_type = EXCLUDED.reaction_type`,
      [user.id, artworkId, reactionType]
    );
  }

  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  return { success: true };
}

export async function toggleFavoriteAction(artworkId) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Silakan masuk sebagai Member untuk menyimpan karya." };
  }

  const existing = await query(
    "SELECT 1 FROM favorites WHERE user_id = $1 AND artwork_id = $2",
    [user.id, artworkId]
  );

  if (existing.rows.length > 0) {
    await query(
      "DELETE FROM favorites WHERE user_id = $1 AND artwork_id = $2",
      [user.id, artworkId]
    );
  } else {
    await query(
      "INSERT INTO favorites (user_id, artwork_id) VALUES ($1, $2)",
      [user.id, artworkId]
    );
  }

  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  return { success: true };
}

export async function createArtworkAction(prevState, formData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "Member") {
    return { error: "Hanya Member yang dapat mengunggah karya." };
  }

  const title = formData.get("title")?.trim();
  const description = formData.get("description")?.trim();
  const categoryId = Number(formData.get("categoryId"));
  const imageUrl = formData.get("imageUrl")?.trim();
  const rawTags = formData.get("tags")?.trim() || "";

  const tags = rawTags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  if (!title || !description || !categoryId || !imageUrl || tags.length === 0) {
    return { error: "Semua field wajib diisi (minimal 1 tag dipisahkan koma)." };
  }

  await query(
    `INSERT INTO artworks (user_id, category_id, title, description, image_url, tags)
      VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, categoryId, title, description, imageUrl, tags]
  );

  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/favorites");
  return { success: true };
}