import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createSessionToken(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secretKey);
}

export async function verifySessionToken(token) {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch {
        return null;
    }
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("aesthe_session")?.value;
    if (!token) return null;
    return await verifySessionToken(token);
}

export async function createResetToken(payload) {
    return await new SignJWT({ ...payload, purpose: "password_reset" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(secretKey);
}

export async function verifyResetToken(token) {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        if (payload.purpose !== "password_reset") return null;
        return payload;
    } catch {
        return null;
    }
}