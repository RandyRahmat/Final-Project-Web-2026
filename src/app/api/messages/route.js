import { NextResponse } from "next/server";
import { query, ensureDirectMessagesTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const partnerId = Number(searchParams.get("with"));

  if (!partnerId || Number.isNaN(partnerId)) {
    return NextResponse.json({ error: "Parameter 'with' tidak valid." }, { status: 400 });
  }

  await ensureDirectMessagesTable();

  // Tandai pesan masuk dari lawan bicara sebagai sudah dibaca
  await query(
    `UPDATE direct_messages
     SET is_read = TRUE
     WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
    [partnerId, user.id]
  );

  const result = await query(
    `SELECT id, sender_id, receiver_id, content, is_read, created_at
     FROM direct_messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC, id ASC`,
    [user.id, partnerId]
  );

  return NextResponse.json({ messages: result.rows });
}
