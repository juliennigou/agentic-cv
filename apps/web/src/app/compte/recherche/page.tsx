import { getOrCreateUserProfile } from "@agentic-cv/db";
import { redirect } from "next/navigation";

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
    <section className="account-section">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Recherche</span>
          <h2>Préférences d'offres</h2>
        </div>
      </div>

      <p className="muted-text">
        Indique les rôles et pays qui t'intéressent pour cibler les offres pertinentes.
      </p>

      <PreferencesForm profile={profile} />
    </section>
  );
}
