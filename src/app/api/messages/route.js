import { NextResponse } from "next/server";
import { query, ensureDirectMessagesTable, ensureUserProfileColumns } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/validation";

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partnerId = parsePositiveInt(searchParams.get("with"));
    const includeConversations = searchParams.get("includeConversations") === "1";

    if (!partnerId) {
      return NextResponse.json({ error: "Parameter 'with' tidak valid." }, { status: 400 });
    }

    await Promise.all([ensureUserProfileColumns(), ensureDirectMessagesTable()]);

    // Tandai pesan masuk dari lawan bicara sebagai sudah dibaca
    await query(
      `UPDATE direct_messages
       SET is_read = TRUE
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [partnerId, user.id]
    );

    const queries = [
      query(
        `SELECT id, sender_id, receiver_id, content, is_read, created_at
         FROM direct_messages
         WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at ASC, id ASC`,
        [user.id, partnerId]
      ),
    ];

    if (includeConversations) {
      queries.push(
        query(
          `WITH partners AS (
            SELECT DISTINCT
              CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id
            FROM direct_messages
            WHERE sender_id = $1 OR receiver_id = $1
          )
          SELECT
            u.id,
            u.display_name,
            u.username,
            u.role,
            u.avatar_url,
            (
              SELECT dm.content
              FROM direct_messages dm
              WHERE (dm.sender_id = $1 AND dm.receiver_id = u.id)
                 OR (dm.sender_id = u.id AND dm.receiver_id = $1)
              ORDER BY dm.created_at DESC, dm.id DESC
              LIMIT 1
            ) AS last_message,
            (
              SELECT dm.created_at
              FROM direct_messages dm
              WHERE (dm.sender_id = $1 AND dm.receiver_id = u.id)
                 OR (dm.sender_id = u.id AND dm.receiver_id = $1)
              ORDER BY dm.created_at DESC, dm.id DESC
              LIMIT 1
            ) AS last_message_at,
            (
              SELECT COUNT(*)::int
              FROM direct_messages dm
              WHERE dm.sender_id = u.id AND dm.receiver_id = $1 AND dm.is_read = FALSE
            ) AS unread_count
          FROM partners p
          JOIN users u ON u.id = p.partner_id
          ORDER BY last_message_at DESC NULLS LAST`,
          [user.id]
        )
      );
    }

    const [messagesRes, conversationsRes] = await Promise.all(queries);

    return NextResponse.json({
      messages: messagesRes.rows,
      ...(conversationsRes ? { conversations: conversationsRes.rows } : {}),
    });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json({ error: "Gagal memuat pesan." }, { status: 500 });
  }
}
