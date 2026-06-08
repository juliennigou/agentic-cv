import { getOrCreateUserProfile } from "@agentic-cv/db";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/ui/card";
import { PreferencesForm } from "@/features/account/preferences-form";
import { getCurrentUser } from "@/features/auth/current-user";

export const dynamic = "force-dynamic";

export default async function RechercheTabPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const profile = await getOrCreateUserProfile({ userId: user.id });

  return (
    <Card className="grid gap-5 p-5">
      <div className="grid gap-1">
        <Eyebrow>Recherche</Eyebrow>
        <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">
          Préférences d'offres
        </h2>
      </div>

      <p className="text-sm leading-snug text-muted-foreground">
        Indique les rôles et pays qui t'intéressent pour cibler les offres pertinentes.
      </p>

      <PreferencesForm profile={profile} />
    </Card>
  );
}
