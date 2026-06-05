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

      <section className="hero" style={{ paddingBottom: "var(--space-2)" }}>
        <span className="eyebrow">Compte candidat</span>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>{pageTitle}</h1>
        <p>{pageCopy}</p>
      </section>

      {!isSupabaseConfigured() ? (
        <div className="empty-state">
          Supabase Auth n'est pas encore configuré. Renseigne les variables d'environnement
          avant d'activer la connexion.
        </div>
      ) : (
        <div className="auth-layout">
          <section className="account-section auth-card">
            <h2>{mode === "signup" ? "Inscription" : "Se connecter"}</h2>
            {authErrorMessage ? <p className="form-error">{authErrorMessage}</p> : null}
            <OAuthButtons />
            <AuthForm mode={mode} />
            {mode === "signup" ? (
              <p className="auth-switch">
                Déjà inscrit ? <a href="/connexion">Se connecter</a>
              </p>
            ) : (
              <p className="auth-switch">
                Pas encore de compte ? <a href="/connexion?mode=signup">S'inscrire</a>
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
