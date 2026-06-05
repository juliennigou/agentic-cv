import { getOrCreateUserProfile } from "@agentic-cv/db";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { ProfileForm } from "@/features/account/profile-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="page-shell">
        <SiteHeader active="compte" />

        <section className="hero" style={{ paddingBottom: "var(--space-2)" }}>
          <span className="eyebrow">Configuration requise</span>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Compte candidat</h1>
          <p>
            L'espace compte est prêt côté code, mais Supabase Auth doit être configuré avant
            d'autoriser les connexions.
          </p>
        </section>

        <div className="empty-state">
          Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans
          l'environnement de l'app web.
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const profile = await getOrCreateUserProfile({
    userId: user.id
  });

  return (
    <main className="page-shell">
      <SiteHeader active="compte" />

      <section className="hero" style={{ paddingBottom: "var(--space-2)" }}>
        <span className="eyebrow">Espace candidat</span>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Ton espace candidat</h1>
        <p>
          Centralise tes informations de base pour retrouver tes offres et préparer les prochaines
          étapes de candidature.
        </p>
      </section>

      <div className="account-grid">
        <section className="account-section account-section-wide">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Profil</span>
              <h2>Informations candidat</h2>
            </div>
            <span className="count">{user.email ?? "Compte Supabase"}</span>
          </div>

          <ProfileForm profile={profile} />
        </section>

        <aside className="account-section">
          <span className="eyebrow">Documents</span>
          <h2>CV et lettres</h2>
          <p className="muted-text">
            L'upload de CV arrive à l'étape suivante. Le profil est déjà structuré pour alimenter
            les documents et les candidatures.
          </p>
        </aside>
      </div>
    </main>
  );
}
