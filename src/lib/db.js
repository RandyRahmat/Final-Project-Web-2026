import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

let profileColumnsEnsured = false;
let directMessagesTableEnsured = false;
let challengeColumnsEnsured = false;

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