import { query, ensureFollowsTable, ensureDirectMessagesTable } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import HomeClient from "@/components/home-client";

export const dynamic = "force-dynamic";

function formatRelativeTime(dateValue) {
  if (!dateValue) return "Baru saja";
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function formatDaysLeft(endDate) {
  if (!endDate) return "Sedang berlangsung";
  const diffMs = new Date(endDate).getTime() - Date.now();
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (hours <= 24) return "Berakhir < 24 jam lagi";
  const days = Math.ceil(hours / 24);
  return `Berakhir ${days} hari lagi`;
}

const REACTION_LABEL = {
  love: "menyukai",
  wow: "terkesima dengan",
  fire: "memberi api pada",
  inspire: "terinspirasi oleh",
  applause: "mengapresiasi",
};

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id || 0;
  const isAdmin = currentUser?.role === "Admin";

  await Promise.all([ensureFollowsTable(), ensureDirectMessagesTable()]);

  const [
    artworksResult,
    categoriesResult,
    challengesResult,
    podiumResult,
    unreadMsgResult,
    recentCommentsResult,
    recentReactionsResult,
    recentFollowsResult,
    adminPendingResult,
  ] = await Promise.all([
    query(
      `SELECT 
        a.id,
        a.title,
        a.description,
        a.image_url,
        a.tags,
        a.created_at,
        c.name AS category_name,
        u.display_name AS artist_name,
        u.username AS artist_username,
        COUNT(DISTINCT ar.user_id)::int AS total_reactions,
        MAX(CASE WHEN ar.user_id = $1 THEN ar.reaction_type ELSE NULL END) AS user_reaction,
        BOOL_OR(f.user_id = $1) AS is_favorited,
        EXISTS(SELECT 1 FROM follows fl WHERE fl.follower_id = $1 AND fl.following_id = a.user_id) AS is_following_artist
      FROM artworks a
      JOIN categories c ON a.category_id = c.id
      JOIN users u ON a.user_id = u.id
      LEFT JOIN artwork_reactions ar ON a.id = ar.artwork_id
      LEFT JOIN favorites f ON a.id = f.artwork_id AND f.user_id = $1
      GROUP BY a.id, c.name, u.display_name, u.username
      ORDER BY total_reactions DESC, a.created_at DESC`,
      [userId]
    ),
    query("SELECT id, name FROM categories ORDER BY name ASC"),
    query(
      `SELECT 
        ch.id,
        ch.title,
        ch.description,
        ch.prize,
        ch.end_date,
        u.display_name AS curator_name
      FROM challenges ch
      JOIN users u ON ch.curator_id = u.id
      WHERE ch.end_date >= NOW()
      ORDER BY ch.end_date ASC`
    ),
    query(
      `WITH latest_awarded_challenge AS (
        SELECT ch.id
        FROM challenges ch
        JOIN challenge_submissions cs ON cs.challenge_id = ch.id
        WHERE ch.end_date < NOW() AND cs.winner_rank IN (1, 2, 3)
        GROUP BY ch.id, ch.end_date
        ORDER BY ch.end_date DESC, ch.id DESC
        LIMIT 1
      )
      SELECT 
        cs.winner_rank,
        a.title,
        a.image_url,
        u.display_name AS artist_name,
        u.username AS artist_username,
        ch.id AS challenge_id,
        ch.title AS challenge_title,
        cu.display_name AS curator_name
      FROM challenge_submissions cs
      JOIN latest_awarded_challenge lac ON cs.challenge_id = lac.id
      JOIN challenges ch ON cs.challenge_id = ch.id
      JOIN users cu ON ch.curator_id = cu.id
      JOIN artworks a ON cs.artwork_id = a.id
      JOIN users u ON cs.member_id = u.id
      WHERE cs.winner_rank IN (1, 2, 3)
      ORDER BY cs.winner_rank ASC
      LIMIT 3`
    ),
    userId
      ? query(
          `SELECT
            COUNT(*)::int AS unread_count,
            MAX(dm.created_at) AS latest_at,
            (
              SELECT u.display_name
              FROM direct_messages dm2
              JOIN users u ON dm2.sender_id = u.id
              WHERE dm2.receiver_id = $1 AND dm2.is_read = FALSE
              ORDER BY dm2.created_at DESC
              LIMIT 1
            ) AS latest_sender
           FROM direct_messages dm
           WHERE dm.receiver_id = $1 AND dm.is_read = FALSE`,
          [userId]
        )
      : Promise.resolve({ rows: [] }),
    userId
      ? query(
          `SELECT cm.id, cm.artwork_id, cm.content, cm.created_at, a.title AS artwork_title, u.display_name AS actor_name
           FROM comments cm
           JOIN artworks a ON cm.artwork_id = a.id
           JOIN users u ON cm.user_id = u.id
           WHERE a.user_id = $1 AND cm.user_id <> $1
           ORDER BY cm.created_at DESC
           LIMIT 3`,
          [userId]
        )
      : Promise.resolve({ rows: [] }),
    userId
      ? query(
          `SELECT ar.id, ar.artwork_id, ar.reaction_type, ar.created_at, a.title AS artwork_title, u.display_name AS actor_name
           FROM artwork_reactions ar
           JOIN artworks a ON ar.artwork_id = a.id
           JOIN users u ON ar.user_id = u.id
           WHERE a.user_id = $1 AND ar.user_id <> $1
           ORDER BY ar.created_at DESC
           LIMIT 3`,
          [userId]
        )
      : Promise.resolve({ rows: [] }),
    userId
      ? query(
          `SELECT fl.id, fl.created_at, u.display_name AS actor_name, u.username AS actor_username
           FROM follows fl
           JOIN users u ON fl.follower_id = u.id
           WHERE fl.following_id = $1
           ORDER BY fl.created_at DESC
           LIMIT 2`,
          [userId]
        )
      : Promise.resolve({ rows: [] }),
    isAdmin
      ? query(
          `SELECT
            (SELECT COUNT(*)::int FROM users WHERE role = 'Curator' AND curator_status = 'Pending') AS pending_curators,
            (SELECT COUNT(*)::int FROM reports WHERE status = 'Pending') AS pending_reports`
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const notifications = [];

  // 1. Pesan langsung belum dibaca
  const unreadInfo = unreadMsgResult.rows[0];
  if (unreadInfo && unreadInfo.unread_count > 0) {
    notifications.push({
      id: "notif-unread-messages",
      kind: "message",
      title: `${unreadInfo.unread_count} Pesan Belum Dibaca`,
      subtitle: unreadInfo.latest_sender ? `Terbaru dari ${unreadInfo.latest_sender}` : "Buka kotak masuk Messages",
      href: "/messages",
      time: formatRelativeTime(unreadInfo.latest_at),
      highlight: true,
    });
  }

  // 2. Khusus Admin: antrean moderasi & verifikasi curator
  if (isAdmin && adminPendingResult.rows[0]) {
    const { pending_curators: pendingCurators, pending_reports: pendingReports } = adminPendingResult.rows[0];
    if (pendingCurators > 0) {
      notifications.push({
        id: "notif-admin-curators",
        kind: "admin",
        title: `${pendingCurators} Curator Menunggu Verifikasi`,
        subtitle: "Tinjau pendaftaran Curator di Admin Console",
        href: "/admin",
        time: "Perlu tindakan",
        highlight: true,
      });
    }
    if (pendingReports > 0) {
      notifications.push({
        id: "notif-admin-reports",
        kind: "admin",
        title: `${pendingReports} Laporan Konten Pending`,
        subtitle: "Buka tab Moderasi Konten di Admin Console",
        href: "/admin",
        time: "Perlu tindakan",
        highlight: true,
      });
    }
  }

  // 3. Komentar & reaksi & pengikut terbaru (digabung lalu diurutkan terbaru)
  const socialEvents = [
    ...recentCommentsResult.rows.map((cm) => ({
      id: `notif-comment-${cm.id}`,
      kind: "comment",
      title: `${cm.actor_name} mengomentari "${cm.artwork_title}"`,
      subtitle: cm.content.length > 60 ? `${cm.content.slice(0, 60)}...` : cm.content,
      href: `/artworks/${cm.artwork_id}`,
      time: formatRelativeTime(cm.created_at),
      ts: new Date(cm.created_at).getTime(),
      highlight: false,
    })),
    ...recentReactionsResult.rows.map((ar) => ({
      id: `notif-react-${ar.id}`,
      kind: "reaction",
      title: `${ar.actor_name} ${REACTION_LABEL[ar.reaction_type] || "memberi reaksi pada"} karyamu`,
      subtitle: ar.artwork_title,
      href: `/artworks/${ar.artwork_id}`,
      time: formatRelativeTime(ar.created_at),
      ts: new Date(ar.created_at).getTime(),
      highlight: false,
    })),
    ...recentFollowsResult.rows.map((fl) => ({
      id: `notif-follow-${fl.id}`,
      kind: "follow",
      title: `${fl.actor_name} mulai mengikutimu`,
      subtitle: `@${fl.actor_username}`,
      href: `/creators/${fl.actor_username}`,
      time: formatRelativeTime(fl.created_at),
      ts: new Date(fl.created_at).getTime(),
      highlight: false,
    })),
  ]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5)
    .map(({ ts: _ts, ...rest }) => rest);

  notifications.push(...socialEvents);

  // 4. Challenge aktif terdekat yang akan segera berakhir (untuk semua user termasuk Guest)
  const nearestChallenge = challengesResult.rows[0];
  if (nearestChallenge) {
    notifications.push({
      id: `notif-challenge-${nearestChallenge.id}`,
      kind: "challenge",
      title: `Challenge Aktif: ${nearestChallenge.title}`,
      subtitle: nearestChallenge.prize ? `Hadiah: ${nearestChallenge.prize}` : "Segera kirim karya terbaikmu",
      href: `/challenges/${nearestChallenge.id}`,
      time: formatDaysLeft(nearestChallenge.end_date),
      highlight: !currentUser,
    });
  }

  return (
    <HomeClient
      currentUser={currentUser}
      artworks={artworksResult.rows}
      categories={categoriesResult.rows}
      challenges={challengesResult.rows}
      podiumWinners={podiumResult.rows}
      notifications={notifications}
    />
  );
}
