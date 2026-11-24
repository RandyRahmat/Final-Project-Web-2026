import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import PendingCuratorClient from "@/components/pending-curator-client";

export const dynamic = "force-dynamic";

export default async function PendingCuratorPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/");
  }

  if (currentUser.role !== "Curator") {
    redirect("/home");
  }

  const userResult = await query(
    "SELECT id, display_name, username, email, curator_status FROM users WHERE id = $1",
    [currentUser.id]
  );

  if (userResult.rows.length === 0) {
    redirect("/");
  }

  return <PendingCuratorClient curator={userResult.rows[0]} />;
}
