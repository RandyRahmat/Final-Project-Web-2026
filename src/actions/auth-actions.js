"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";

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

    const result = await query(
        "SELECT id, display_name, username, password_hash, role, curator_status FROM users WHERE email = $1",
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