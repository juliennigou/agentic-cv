import { getOrCreateUserProfile } from "@agentic-cv/db";
import { redirect } from "next/navigation";

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
    <section className="account-section">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Profil</span>
          <h2>Identité &amp; contact</h2>
        </div>
      </div>

      <p className="muted-text">Tes informations de base, réutilisées sur tes candidatures.</p>

      <IdentityForm profile={profile} />
    </section>
  );
}
