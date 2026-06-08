import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { AccountNav } from "@/features/account/account-nav";
import { getCurrentUser } from "@/features/auth/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
        <SiteHeader active="compte" />

        <section className="grid gap-5 pb-2 pt-10">
          <Eyebrow>Configuration requise</Eyebrow>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">
            Compte candidat
          </h1>
          <p className="max-w-[64ch] text-lg leading-normal text-muted-foreground">
            L'espace compte est prêt côté code, mais Supabase Auth doit être configuré avant
            d'autoriser les connexions.
          </p>
        </section>

        <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
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
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="compte" />

      <header className="grid gap-2 pb-5 pt-2">
        <Eyebrow>Espace candidat</Eyebrow>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Mon espace</h1>
        <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
          {user.email ?? "Compte Supabase"}
        </span>
      </header>

      <div className="grid gap-5 md:grid-cols-[248px_minmax(0,1fr)] md:items-start md:gap-7">
        <AccountNav />
        <div className="grid min-w-0 gap-5">{children}</div>
      </div>
    </main>
  );
}
