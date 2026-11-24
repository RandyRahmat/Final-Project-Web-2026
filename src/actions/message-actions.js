"use server";

import { revalidatePath } from "next/cache";
import { query, ensureDirectMessagesTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function sendMessageAction(receiverId, content) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Silakan masuk terlebih dahulu untuk mengirim pesan." };
  }

  const targetId = Number(receiverId);
  const text = (content || "").trim();

  if (!targetId || Number.isNaN(targetId)) {
    return { error: "Penerima pesan tidak valid." };
  }

  if (targetId === Number(user.id)) {
    return { error: "Kamu tidak dapat mengirim pesan ke dirimu sendiri." };
  }

  if (!text) {
    return { error: "Pesan tidak boleh kosong." };
  }

  if (text.length > 1000) {
    return { error: "Pesan maksimal 1000 karakter." };
  }

  await ensureDirectMessagesTable();

  const receiverExists = await query("SELECT id FROM users WHERE id = $1", [targetId]);
  if (receiverExists.rows.length === 0) {
    return { error: "Pengguna tujuan tidak ditemukan." };
  }

  const inserted = await query(
    `INSERT INTO direct_messages (sender_id, receiver_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, receiver_id, content, is_read, created_at`,
    [user.id, targetId, text]
  );

  revalidatePath("/messages");
  return { success: true, message: inserted.rows[0] };
}

export async function markConversationReadAction(partnerId) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const targetId = Number(partnerId);
  if (!targetId || Number.isNaN(targetId)) return { error: "Invalid partner" };

  await ensureDirectMessagesTable();

  await query(
    `UPDATE direct_messages
     SET is_read = TRUE
     WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
    [targetId, user.id]
  );

  revalidatePath("/messages");
  return { success: true };
}
