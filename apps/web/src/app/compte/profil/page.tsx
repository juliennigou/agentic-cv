import { getOrCreateUserProfile } from "@agentic-cv/db";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/ui/card";
import { IdentityForm } from "@/features/account/identity-form";
import { getCurrentUser } from "@/features/auth/current-user";

export const dynamic = "force-dynamic";

export default async function ProfilTabPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const profile = await getOrCreateUserProfile({ userId: user.id });

  return (
    <Card className="grid gap-5 p-5">
      <div className="grid gap-1">
        <Eyebrow>Profil</Eyebrow>
        <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">
          Identité &amp; contact
        </h2>
      </div>

      <p className="text-sm leading-snug text-muted-foreground">
        Tes informations de base, réutilisées sur tes candidatures.
      </p>

      <IdentityForm profile={profile} />
    </Card>
  );
}
