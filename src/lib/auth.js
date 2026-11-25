import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query, ensureUserProfileColumns } from "@/lib/db";
import { parsePositiveInt } from "@/lib/validation";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error("JWT_SECRET environment variable is not configured.");
  }
  return new TextEncoder().encode(secret);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function createSessionToken(payload) {
  return await new SignJWT({ ...payload, purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.purpose === "password_reset") return null;
    if (!parsePositiveInt(payload.id) || typeof payload.role !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("aesthe_session")?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const userId = parsePositiveInt(payload.id);
  if (!userId) return null;

  try {
    await ensureUserProfileColumns();
    const res = await query(
      `SELECT id, display_name, username, role, curator_status, avatar_url
       FROM users
       WHERE id = $1`,
      [userId]
    );
    if (res.rows.length === 0) {
      return null;
    }
    const row = res.rows[0];
    return {
      id: row.id,
      displayName: row.display_name,
      username: row.username,
      role: row.role,
      curatorStatus: row.curator_status,
      avatarUrl: row.avatar_url || null,
    };
  } catch {
    return null;
  }
});

export async function createResetToken(payload) {
  return await new SignJWT({ ...payload, purpose: "password_reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecretKey());
}

export async function verifyResetToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.purpose !== "password_reset") return null;
    return payload;
  } catch {
    return null;
  }
}
