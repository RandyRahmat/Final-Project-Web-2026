"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, ensureUserProfileColumns } from "@/lib/db";
import { createSessionToken, createResetToken, verifyResetToken } from "@/lib/auth";

export async function registerUserAction(prevState, formData) {
    const displayName = formData.get("displayName")?.trim();
    const username = formData.get("username")?.trim().toLowerCase();
    const email = formData.get("email")?.trim().toLowerCase();
    const password = formData.get("password");
    const role = formData.get("role");

    if (!displayName || !username || !email || !password) {
        return { error: "Semua kolom wajib diisi." };
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
    });

    const cookieStore = await cookies();
    cookieStore.set("aesthe_session", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    if (user.role === "Curator") {
        redirect("/pending-curator");
    }
    redirect("/home");
}

export async function loginUserAction(prevState, formData) {
    const email = formData.get("email")?.trim().toLowerCase();
    const password = formData.get("password");

    if (!email || !password) {
        return { error: "Email dan kata sandi wajib diisi." };
    }

    await ensureUserProfileColumns();

    const result = await query(
        "SELECT id, display_name, username, password_hash, role, curator_status, avatar_url FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length === 0) {
        return { error: "Email tidak ditemukan." };
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        return { error: "Kata sandi salah." };
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
    cookieStore.set("aesthe_session", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

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
    const email = formData.get("email")?.trim().toLowerCase();
    const username = formData.get("username")?.trim().toLowerCase();

    if (!email || !username) {
        return { error: "Email dan username wajib diisi." };
    }

    const result = await query(
        "SELECT id, display_name, email FROM users WHERE email = $1 AND username = $2",
        [email, username]
    );

    if (result.rows.length === 0) {
        return { error: "Kombinasi email dan username tidak ditemukan." };
    }

    const user = result.rows[0];
    const resetToken = await createResetToken({
        userId: user.id,
        email: user.email,
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

    if (!resetToken) {
        return { error: "Sesi reset tidak valid. Silakan ulangi verifikasi akun." };
    }

    if (!newPassword || !confirmPassword) {
        return { error: "Kata sandi baru dan konfirmasi wajib diisi." };
    }

    if (newPassword.length < 6) {
        return { error: "Kata sandi baru minimal 6 karakter." };
    }

    if (newPassword !== confirmPassword) {
        return { error: "Konfirmasi kata sandi tidak cocok." };
    }

    const payload = await verifyResetToken(resetToken);
    if (!payload?.userId) {
        return { error: "Token reset sudah kedaluwarsa atau tidak valid. Silakan ulangi verifikasi." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        [passwordHash, payload.userId]
    );

    return {
        success: true,
        message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.",
    };
}