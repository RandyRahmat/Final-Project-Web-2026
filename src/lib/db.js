import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

let profileColumnsEnsured = false;
let directMessagesTableEnsured = false;
let challengeColumnsEnsured = false;
let reportsTableEnsured = false;
let commentsTableEnsured = false;
let followsTableEnsured = false;

export async function query(text, params) {
    const res = await pool.query(text, params);
    return res;
}

export async function ensureUserProfileColumns() {
    if (profileColumnsEnsured) return;
    try {
        await pool.query(
            `ALTER TABLE users
             ADD COLUMN IF NOT EXISTS avatar_url TEXT,
             ADD COLUMN IF NOT EXISTS bio TEXT,
             ADD COLUMN IF NOT EXISTS external_link TEXT`
        );
        profileColumnsEnsured = true;
    } catch {
        // Abaikan jika user DB tidak memiliki izin ALTER atau kolom sudah tersedia
    }
}

export async function ensureDirectMessagesTable() {
    if (directMessagesTableEnsured) return;
    try {
        await pool.query(
            `CREATE TABLE IF NOT EXISTS direct_messages (
                id SERIAL PRIMARY KEY,
                sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        );
        directMessagesTableEnsured = true;
    } catch {
        // Abaikan jika user DB tidak memiliki izin CREATE atau tabel sudah tersedia
    }
}

export async function ensureChallengeColumns() {
    if (challengeColumnsEnsured) return;
    try {
        await pool.query(
            `ALTER TABLE challenges
             ADD COLUMN IF NOT EXISTS rules TEXT,
             ADD COLUMN IF NOT EXISTS start_date TIMESTAMP DEFAULT NOW(),
             ADD COLUMN IF NOT EXISTS banner_url TEXT`
        );
        challengeColumnsEnsured = true;
    } catch {
        // Abaikan jika user DB tidak memiliki izin ALTER atau kolom sudah tersedia
    }
}

export async function ensureReportsTable() {
    if (reportsTableEnsured) return;
    try {
        await pool.query(
            `CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
                reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (artwork_id, reporter_id)
            )`
        );
        reportsTableEnsured = true;
    } catch {
        // Abaikan jika user DB tidak memiliki izin CREATE atau tabel sudah tersedia
    }
}

export async function ensureCommentsTable() {
    if (commentsTableEnsured) return;
    try {
        await pool.query(
            `CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                artwork_id INT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        );
        commentsTableEnsured = true;
    } catch {
        // Abaikan jika user DB tidak memiliki izin CREATE atau tabel sudah tersedia
    }
}

export async function ensureFollowsTable() {
    if (followsTableEnsured) return;
    try {
        await pool.query(
            `CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (follower_id, following_id),
                CHECK (follower_id <> following_id)
            )`
        );
        followsTableEnsured = true;
    } catch {
        // Abaikan jika user DB tidak memiliki izin CREATE atau tabel sudah tersedia
    }
}