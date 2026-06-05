import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/current-user";

export const dynamic = "force-dynamic";

export default async function AuthContinuePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/compte");
  }

  redirect("/connexion?error=session_missing");
}
