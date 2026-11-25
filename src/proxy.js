import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function getSessionFromRequest(request) {
  const token = request.cookies.get("aesthe_session")?.value;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    if (payload.purpose === "password_reset") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = await getSessionFromRequest(request);

  // Semua rute pada matcher bersifat privat -> wajib memiliki sesi JWT valid
  if (!session) {
    const response = NextResponse.redirect(new URL("/", request.url));
    if (request.cookies.has("aesthe_session")) {
      response.cookies.delete("aesthe_session");
    }
    return response;
  }

  const role = session.role;

  // 1. /favorites -> khusus Member
  if (pathname.startsWith("/favorites") && role !== "Member") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 2. /admin -> khusus Admin
  if (pathname.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 3 & 4. /curator & /pending-curator -> khusus role Curator;
  // pengecekan curator_status live dilakukan di Server Component agar tidak redirect loop saat status berubah di DB
  if ((pathname.startsWith("/curator") || pathname.startsWith("/pending-curator")) && role !== "Curator") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 5. /profile & /messages -> diizinkan untuk semua role yang sudah login
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/messages/:path*",
    "/favorites/:path*",
    "/admin/:path*",
    "/curator/:path*",
    "/pending-curator/:path*",
  ],
};
