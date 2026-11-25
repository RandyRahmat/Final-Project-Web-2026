import { redirect } from "next/navigation";
import { query, ensureReportsTable, ensureCommentReportsTable, ensureUserProfileColumns } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import AdminDashboardClient from "@/components/admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/");
  }
  if (currentUser.role !== "Admin") {
    redirect("/home");
  }

  await ensureUserProfileColumns();
  await ensureReportsTable();
  await ensureCommentReportsTable();

  // 1. Data Admin yang sedang login
  const adminResult = await query(
    "SELECT id, display_name, username, email, avatar_url FROM users WHERE id = $1 AND role = 'Admin'",
    [currentUser.id]
  );
  if (adminResult.rows.length === 0) {
    redirect("/");
  }
  const adminUser = adminResult.rows[0];

  // 2. Query Agregasi Statistik Platform
  const roleStatsResult = await query(
    `SELECT role, COUNT(*)::int AS total
     FROM users
     GROUP BY role`
  );
  const roleCounts = { Admin: 0, Member: 0, Curator: 0 };
  roleStatsResult.rows.forEach((row) => {
    if (row.role in roleCounts) {
      roleCounts[row.role] = row.total;
    }
  });

  const summaryStatsResult = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM artworks) AS total_artworks,
      (SELECT COUNT(*)::int FROM reports WHERE status = 'Pending') AS pending_artwork_reports,
      (SELECT COUNT(*)::int FROM comment_reports WHERE status = 'Pending') AS pending_comment_reports,
      ((SELECT COUNT(*)::int FROM reports WHERE status = 'Pending') + (SELECT COUNT(*)::int FROM comment_reports WHERE status = 'Pending')) AS pending_reports,
      (SELECT COUNT(*)::int FROM challenges WHERE (start_date IS NULL OR start_date <= NOW()) AND end_date >= NOW()) AS active_challenges,
      (SELECT COUNT(*)::int FROM users WHERE role = 'Curator' AND curator_status = 'Pending') AS pending_curators`
  );
  const summary = summaryStatsResult.rows[0] || {
    total_artworks: 0,
    pending_artwork_reports: 0,
    pending_comment_reports: 0,
    pending_reports: 0,
    active_challenges: 0,
    pending_curators: 0,
  };

  // 3. Daftar Curator Pending untuk Verifikasi
  const pendingCuratorsResult = await query(
    `SELECT id, display_name, username, email, curator_status, created_at
     FROM users
     WHERE role = 'Curator' AND curator_status = 'Pending'
     ORDER BY created_at DESC, id DESC`
  );

  // 4. Antrian Moderasi (Karya yang dilaporkan dengan status Pending)
  const moderationQueueResult = await query(
    `SELECT
      a.id AS artwork_id,
      a.title AS artwork_title,
      a.image_url AS artwork_image_url,
      c.name AS category_name,
      owner.display_name AS artist_name,
      owner.username AS artist_username,
      COUNT(r.id)::int AS report_count,
      MAX(r.created_at) AS latest_report_at,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', r.id,
          'reason', r.reason,
          'reporter_name', rep.display_name,
          'reporter_username', rep.username,
          'created_at', r.created_at
        ) ORDER BY r.created_at DESC
      ) AS reports
    FROM reports r
    JOIN artworks a ON r.artwork_id = a.id
    JOIN categories c ON a.category_id = c.id
    JOIN users owner ON a.user_id = owner.id
    JOIN users rep ON r.reporter_id = rep.id
    WHERE r.status = 'Pending'
    GROUP BY a.id, c.name, owner.display_name, owner.username
    ORDER BY report_count DESC, latest_report_at DESC`
  );

  // 4b. Antrian Moderasi Komentar (Komentar yang dilaporkan dengan status Pending)
  const commentModerationQueueResult = await query(
    `SELECT
      cm.id AS comment_id,
      cm.content AS comment_content,
      cm.created_at AS comment_created_at,
      a.id AS artwork_id,
      a.title AS artwork_title,
      author.display_name AS author_name,
      author.username AS author_username,
      COUNT(cr.id)::int AS report_count,
      MAX(cr.created_at) AS latest_report_at,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', cr.id,
          'reason', cr.reason,
          'reporter_name', rep.display_name,
          'reporter_username', rep.username,
          'created_at', cr.created_at
        ) ORDER BY cr.created_at DESC
      ) AS reports
    FROM comment_reports cr
    JOIN comments cm ON cr.comment_id = cm.id
    JOIN artworks a ON cm.artwork_id = a.id
    JOIN users author ON cm.user_id = author.id
    JOIN users rep ON cr.reporter_id = rep.id
    WHERE cr.status = 'Pending'
    GROUP BY cm.id, a.id, a.title, author.display_name, author.username
    ORDER BY report_count DESC, latest_report_at DESC`
  );

  // 5. Daftar Seluruh Pengguna
  const usersResult = await query(
    `SELECT
      u.id,
      u.display_name,
      u.username,
      u.email,
      u.role,
      u.curator_status,
      u.created_at,
      COUNT(DISTINCT a.id)::int AS artwork_count
    FROM users u
    LEFT JOIN artworks a ON a.user_id = u.id
    GROUP BY u.id
    ORDER BY
      CASE u.role WHEN 'Admin' THEN 0 WHEN 'Curator' THEN 1 ELSE 2 END ASC,
      u.created_at DESC,
      u.id DESC`
  );

  // 6. Daftar Kategori beserta jumlah karya
  const categoriesResult = await query(
    `SELECT
      c.id,
      c.name,
      COUNT(a.id)::int AS artwork_count
    FROM categories c
    LEFT JOIN artworks a ON a.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name ASC`
  );

  return (
    <AdminDashboardClient
      adminUser={adminUser}
      stats={{ ...roleCounts, ...summary }}
      pendingCurators={pendingCuratorsResult.rows}
      moderationQueue={moderationQueueResult.rows}
      commentModerationQueue={commentModerationQueueResult.rows}
      users={usersResult.rows}
      categories={categoriesResult.rows}
    />
  );
}
