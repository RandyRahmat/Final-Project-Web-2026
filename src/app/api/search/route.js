import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get("q") || "").trim();
    const pattern = `%${raw}%`;

    const [currentUser, artworksRes, creatorsRes, challengesRes] = await Promise.all([
      getCurrentUser(),
      raw
        ? query(
            `SELECT a.id, a.title, a.image_url, c.name AS category_name, u.display_name AS artist_name
             FROM artworks a
             JOIN categories c ON a.category_id = c.id
             JOIN users u ON a.user_id = u.id
             WHERE a.title ILIKE $1
                OR c.name ILIKE $1
                OR u.display_name ILIKE $1
                OR EXISTS (SELECT 1 FROM unnest(a.tags) t WHERE t ILIKE $1)
             ORDER BY a.created_at DESC
             LIMIT 5`,
            [pattern]
          )
        : query(
            `SELECT a.id, a.title, a.image_url, c.name AS category_name, u.display_name AS artist_name
             FROM artworks a
             JOIN categories c ON a.category_id = c.id
             JOIN users u ON a.user_id = u.id
             LEFT JOIN artwork_reactions ar ON a.id = ar.artwork_id
             GROUP BY a.id, c.name, u.display_name
             ORDER BY COUNT(DISTINCT ar.user_id) DESC, a.created_at DESC
             LIMIT 4`
          ),
      raw
        ? query(
            `SELECT id, display_name, username, avatar_url, role
             FROM users
             WHERE (role = 'Member' OR (role = 'Curator' AND curator_status = 'Approved'))
               AND (display_name ILIKE $1 OR username ILIKE $1)
             ORDER BY display_name ASC
             LIMIT 4`,
            [pattern]
          )
        : query(
            `SELECT u.id, u.display_name, u.username, u.avatar_url, u.role
             FROM users u
             LEFT JOIN artworks a ON a.user_id = u.id
             WHERE u.role = 'Member'
             GROUP BY u.id
             ORDER BY COUNT(a.id) DESC, u.display_name ASC
             LIMIT 3`
          ),
      raw
        ? query(
            `SELECT id, title, prize, end_date
             FROM challenges
             WHERE title ILIKE $1 OR description ILIKE $1 OR COALESCE(prize, '') ILIKE $1
             ORDER BY end_date DESC
             LIMIT 4`,
            [pattern]
          )
        : query(
            `SELECT id, title, prize, end_date
             FROM challenges
             WHERE (start_date IS NULL OR start_date <= NOW()) AND end_date >= NOW()
             ORDER BY end_date ASC
             LIMIT 3`
          ),
    ]);

    return NextResponse.json({
      role: currentUser?.role || "Guest",
      curatorStatus: currentUser?.curatorStatus || null,
      artworks: artworksRes.rows,
      creators: creatorsRes.rows,
      challenges: challengesRes.rows,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { role: "Guest", curatorStatus: null, artworks: [], creators: [], challenges: [] },
      { status: 500 }
    );
  }
}
