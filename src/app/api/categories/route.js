import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query("SELECT id, name FROM categories ORDER BY name ASC");
    return NextResponse.json({ categories: result.rows });
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
