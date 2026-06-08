import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/auth-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { OAuthButtons } from "@/features/auth/oauth-buttons";
import { getSafeNextPath } from "@/features/auth/redirects";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
    next?: string;
  }>;
};

const authErrorMessages: Record<string, string> = {
  auth_not_configured: "Supabase Auth n'est pas encore configuré.",
  callback: "La confirmation ou la connexion externe a échoué. Réessaie.",
  oauth_provider: "Ce fournisseur de connexion n'est pas autorisé.",
  oauth_start: "Impossible de démarrer la connexion externe.",
  session_missing: "La connexion a abouti côté Supabase, mais la session n'a pas été retrouvée."
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const mode = resolvedSearchParams.mode === "signup" ? "signup" : "signin";
  const next = getSafeNextPath(resolvedSearchParams.next);
  const authErrorMessage = resolvedSearchParams.error
    ? authErrorMessages[resolvedSearchParams.error]
    : null;
  const pageTitle = mode === "signup" ? "Créer un compte" : "Connexion";
  const pageCopy =
    mode === "signup"
      ? "Crée ton compte pour sauvegarder tes offres et préparer ton profil candidat."
      : "Connecte-toi pour sauvegarder des offres et préparer progressivement ton profil candidat.";

  if (user) {
    redirect(next);
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="connexion" />

      <div className="grid justify-items-center pb-16 pt-12">
        <Card className="grid w-[min(100%,420px)] gap-5 p-5">
          <header className="grid justify-items-center gap-2 text-center">
            <Eyebrow>Compte candidat</Eyebrow>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">{pageTitle}</h1>
            <p className="max-w-[42ch] text-sm leading-snug text-muted-foreground">{pageCopy}</p>
          </header>

          {!isSupabaseConfigured() ? (
            <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
              Supabase Auth n'est pas encore configuré. Renseigne les variables d'environnement
              avant d'activer la connexion.
            </div>
          ) : (
            <>
              <nav
                className="grid grid-cols-2 gap-1 rounded-sm border border-border bg-secondary p-1"
                aria-label="Choisir une action"
              >
                <a
                  href="/connexion"
                  aria-current={mode === "signin" ? "page" : undefined}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-sm border border-transparent font-mono text-sm tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-border aria-[current=page]:bg-card aria-[current=page]:text-foreground"
                >
                  Se connecter
                </a>
                <a
                  href="/connexion?mode=signup"
                  aria-current={mode === "signup" ? "page" : undefined}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-sm border border-transparent font-mono text-sm tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-border aria-[current=page]:bg-card aria-[current=page]:text-foreground"
                >
                  S'inscrire
                </a>
              </nav>

              {authErrorMessage ? (
                <p className="text-sm text-[var(--danger)]" role="alert">
                  {authErrorMessage}
                </p>
              ) : null}

              <OAuthButtons next={next} />

              <div className="flex items-center gap-3 font-mono text-xs text-[var(--faint)]">
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span>ou avec ton email</span>
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>

              <AuthForm mode={mode} next={next} />
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
