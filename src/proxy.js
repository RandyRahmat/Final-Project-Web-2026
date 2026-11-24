import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function getSessionFromRequest(request) {
  const token = request.cookies.get("aesthe_session")?.value;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
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
  const curatorStatus = session.curatorStatus;

  // 1. /favorites -> khusus Member
  if (pathname.startsWith("/favorites") && role !== "Member") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 2. /admin -> khusus Admin
  if (pathname.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 3. /curator -> khusus Curator yang sudah Approved
  if (pathname.startsWith("/curator")) {
    if (role !== "Curator") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    if (curatorStatus !== "Approved") {
      return NextResponse.redirect(new URL("/pending-curator", request.url));
    }
  }

  // 4. /pending-curator -> khusus Curator yang masih Pending / Rejected
  if (pathname.startsWith("/pending-curator")) {
    if (role !== "Curator") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    if (curatorStatus === "Approved") {
      return NextResponse.redirect(new URL("/curator", request.url));
    }
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
