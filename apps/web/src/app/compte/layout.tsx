import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { AccountNav } from "@/features/account/account-nav";
import { getCurrentUser } from "@/features/auth/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
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
          Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans l'environnement
          de l'app web.
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  return (
    <main className="page-shell">
      <SiteHeader active="compte" />

      <header className="account-head">
        <span className="eyebrow">Espace candidat</span>
        <h1>Mon espace</h1>
        <span className="count">{user.email ?? "Compte Supabase"}</span>
      </header>

      <div className="account-layout">
        <AccountNav />
        <div className="account-content">{children}</div>
      </div>
    </main>
  );
}
