import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/features/auth/auth-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { OAuthButtons } from "@/features/auth/oauth-buttons";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
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
  const authErrorMessage = resolvedSearchParams.error
    ? authErrorMessages[resolvedSearchParams.error]
    : null;
  const pageTitle = mode === "signup" ? "Créer un compte" : "Connexion";
  const pageCopy =
    mode === "signup"
      ? "Crée ton compte pour sauvegarder tes offres et préparer ton profil candidat."
      : "Connecte-toi pour sauvegarder des offres et préparer progressivement ton profil candidat.";

  if (user) {
    redirect("/compte");
  }

  return (
    <main className="page-shell">
      <SiteHeader active="connexion" />

      <div className="auth-shell">
        <section className="account-section auth-card">
          <header className="auth-card-head">
            <span className="eyebrow">Compte candidat</span>
            <h1 className="auth-title">{pageTitle}</h1>
            <p className="auth-copy">{pageCopy}</p>
          </header>

          {!isSupabaseConfigured() ? (
            <div className="empty-state">
              Supabase Auth n'est pas encore configuré. Renseigne les variables d'environnement
              avant d'activer la connexion.
            </div>
          ) : (
            <>
              <nav className="auth-tabs" aria-label="Choisir une action">
                <a
                  className="auth-tab"
                  href="/connexion"
                  aria-current={mode === "signin" ? "page" : undefined}
                >
                  Se connecter
                </a>
                <a
                  className="auth-tab"
                  href="/connexion?mode=signup"
                  aria-current={mode === "signup" ? "page" : undefined}
                >
                  S'inscrire
                </a>
              </nav>

              {authErrorMessage ? (
                <p className="form-error" role="alert">
                  {authErrorMessage}
                </p>
              ) : null}

              <OAuthButtons />

              <div className="divider">
                <span>ou avec ton email</span>
              </div>

              <AuthForm mode={mode} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
