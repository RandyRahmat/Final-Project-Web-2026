"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, ensureUserProfileColumns } from "@/lib/db";
import {
  createSessionToken,
  createResetToken,
  verifyResetToken,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";
import { parsePositiveInt } from "@/lib/validation";

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

function getPasswordFingerprint(passwordHash) {
  return crypto.createHash("sha256").update(String(passwordHash || "")).digest("hex").slice(0, 24);
}

export async function registerUserAction(prevState, formData) {
  const rawDisplayName = formData.get("displayName");
  const rawUsername = formData.get("username");
  const rawEmail = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");

  const displayName = typeof rawDisplayName === "string" ? rawDisplayName.trim() : "";
  const username = typeof rawUsername === "string" ? rawUsername.trim().toLowerCase() : "";
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!displayName || !username || !email || typeof password !== "string" || !password) {
    return { error: "Semua kolom wajib diisi." };
  }

  if (!USERNAME_REGEX.test(username)) {
    return { error: "Username harus 3–30 karakter dan hanya boleh huruf kecil, angka, atau underscore (_)." };
  }

  if (password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }

  if (role !== "Member" && role !== "Curator") {
    return { error: "Peran pendaftaran tidak valid." };
  }

  const existing = await query(
    "SELECT id FROM users WHERE email = $1 OR username = $2",
    [email, username]
  );

  if (existing.rows.length > 0) {
    return { error: "Email atau username sudah digunakan." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const curatorStatus = role === "Curator" ? "Pending" : "Approved";

  const result = await query(
    `INSERT INTO users (display_name, username, email, password_hash, role, curator_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, display_name, username, email, role, curator_status`,
    [displayName, username, email, passwordHash, role, curatorStatus]
  );

  const user = result.rows[0];
  const token = await createSessionToken({
    id: user.id,
    displayName: user.display_name,
    username: user.username,
    role: user.role,
    curatorStatus: user.curator_status,
    avatarUrl: null,
  });

  const cookieStore = await cookies();
  cookieStore.set("aesthe_session", token, SESSION_COOKIE_OPTIONS);

  if (user.role === "Curator") {
    redirect("/pending-curator");
  }
  redirect("/home");
}

export async function loginUserAction(prevState, formData) {
  const rawEmail = formData.get("email");
  const password = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email || typeof password !== "string" || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  await ensureUserProfileColumns();

  const result = await query(
    "SELECT id, display_name, username, password_hash, role, curator_status, avatar_url FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return { error: "Email atau kata sandi salah." };
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return { error: "Email atau kata sandi salah." };
  }

  const token = await createSessionToken({
    id: user.id,
    displayName: user.display_name,
    username: user.username,
    role: user.role,
    curatorStatus: user.curator_status,
    avatarUrl: user.avatar_url || null,
  });

  const cookieStore = await cookies();
  cookieStore.set("aesthe_session", token, SESSION_COOKIE_OPTIONS);

  if (user.role === "Admin") {
    redirect("/admin");
  }
  if (user.role === "Curator") {
    if (user.curator_status !== "Approved") {
      redirect("/pending-curator");
    }
    redirect("/curator");
  }
  redirect("/home");
}

export async function logoutUserAction() {
  const cookieStore = await cookies();
  cookieStore.delete("aesthe_session");
  redirect("/");
}

export async function verifyAccountForResetAction(prevState, formData) {
  const rawEmail = formData.get("email");
  const rawUsername = formData.get("username");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const username = typeof rawUsername === "string" ? rawUsername.trim().toLowerCase() : "";

  if (!email || !username) {
    return { error: "Email dan username wajib diisi." };
  }

  const result = await query(
    "SELECT id, display_name, email, role, password_hash FROM users WHERE email = $1 AND username = $2",
    [email, username]
  );

  if (result.rows.length === 0 || result.rows[0].role === "Admin") {
    return { error: "Kombinasi email dan username tidak ditemukan atau tidak dapat direset melalui formulir ini." };
  }

  const user = result.rows[0];
  const resetToken = await createResetToken({
    userId: user.id,
    email: user.email,
    pwdFingerprint: getPasswordFingerprint(user.password_hash),
  });

  return {
    verified: true,
    resetToken,
    displayName: user.display_name,
  };
}

export async function resetPasswordAction(prevState, formData) {
  const resetToken = formData.get("resetToken");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof resetToken !== "string" || !resetToken) {
    return { error: "Sesi reset tidak valid. Silakan ulangi verifikasi akun." };
  }

  if (typeof newPassword !== "string" || typeof confirmPassword !== "string" || !newPassword || !confirmPassword) {
    return { error: "Kata sandi baru dan konfirmasi wajib diisi." };
  }

  if (newPassword.length < 6) {
    return { error: "Kata sandi baru minimal 6 karakter." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi kata sandi tidak cocok." };
  }

  const payload = await verifyResetToken(resetToken);
  const userId = parsePositiveInt(payload?.userId);
  if (!userId || typeof payload?.pwdFingerprint !== "string") {
    return { error: "Token reset sudah kedaluwarsa atau tidak valid. Silakan ulangi verifikasi." };
  }

  const userRes = await query(
    "SELECT id, role, password_hash FROM users WHERE id = $1",
    [userId]
  );

  if (userRes.rows.length === 0 || userRes.rows[0].role === "Admin") {
    return { error: "Token reset tidak valid. Silakan ulangi verifikasi." };
  }

  const currentFingerprint = getPasswordFingerprint(userRes.rows[0].password_hash);
  if (currentFingerprint !== payload.pwdFingerprint) {
    return { error: "Token reset sudah pernah digunakan atau kedaluwarsa. Silakan ulangi verifikasi." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await query(
    "UPDATE users SET password_hash = $1 WHERE id = $2",
    [passwordHash, userId]
  );

  return {
    success: true,
    message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.",
  };
}
