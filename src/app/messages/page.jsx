import { redirect } from "next/navigation";
import { query, ensureUserProfileColumns, ensureDirectMessagesTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import MessagesClient from "@/components/messages-client";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/");
  }

  await ensureUserProfileColumns();
  await ensureDirectMessagesTable();

  const resolvedParams = await searchParams;
  const targetUsername = resolvedParams?.to ? String(resolvedParams.to).trim().toLowerCase() : "";

  // 1. Ambil daftar percakapan yang sudah pernah terjadi beserta pesan terakhir & jumlah belum dibaca
  const conversationsResult = await query(
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
    [currentUser.id]
  );

  const conversations = [...conversationsResult.rows];
  let initialPartnerId = conversations[0]?.id || null;

  // 2. Jika ada parameter ?to=<username>, pastikan user tujuan masuk ke daftar & terpilih
  if (targetUsername) {
    const existingConv = conversations.find((c) => c.username.toLowerCase() === targetUsername);
    if (existingConv) {
      initialPartnerId = existingConv.id;
    } else {
      const targetUserResult = await query(
        `SELECT id, display_name, username, role, avatar_url
         FROM users
         WHERE LOWER(username) = $1 AND id <> $2`,
        [targetUsername, currentUser.id]
      );
      if (targetUserResult.rows.length > 0) {
        const targetUser = targetUserResult.rows[0];
        conversations.unshift({
          ...targetUser,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        });
        initialPartnerId = targetUser.id;
      }
    }
  }

  // 3. Ambil riwayat pesan awal untuk percakapan yang sedang terpilih
  let initialMessages = [];
  if (initialPartnerId) {
    await query(
      `UPDATE direct_messages
       SET is_read = TRUE
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [initialPartnerId, currentUser.id]
    );

    const messagesResult = await query(
      `SELECT id, sender_id, receiver_id, content, is_read, created_at
       FROM direct_messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC, id ASC`,
      [currentUser.id, initialPartnerId]
    );
    initialMessages = messagesResult.rows;

    const selectedConv = conversations.find((c) => c.id === initialPartnerId);
    if (selectedConv) {
      selectedConv.unread_count = 0;
    }
  }

  return (
    <MessagesClient
      currentUser={currentUser}
      initialConversations={conversations}
      initialPartnerId={initialPartnerId}
      initialMessages={initialMessages}
    />
  );
}
