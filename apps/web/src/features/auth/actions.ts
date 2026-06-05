"use server";

import type { Provider } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

type CredentialsResult =
  | {
      ok: true;
      email: string;
      password: string;
    }
  | {
      ok: false;
      error: string;
    };

const defaultRedirect = "/compte";
const allowedOAuthProviders = new Set<Provider>(["github", "google"]);

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("host") ?? "localhost:3001";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
}

async function getAuthCallbackUrl(next = defaultRedirect) {
  const callbackUrl = new URL("/auth/callback", await getRequestOrigin());
  callbackUrl.searchParams.set("next", next);

  return callbackUrl.toString();
}

function readCredentials(formData: FormData): CredentialsResult {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      ok: false,
      error: "Email et mot de passe sont requis."
    };
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: "Le mot de passe doit contenir au moins 8 caractères."
    };
  }

  return {
    ok: true,
    email,
    password
  };
}

export async function signInWithPassword(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase Auth n'est pas encore configuré."
    };
  }

  const credentials = readCredentials(formData);

  if (!credentials.ok) {
    return {
      status: "error",
      message: credentials.error
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });

  if (error) {
    return {
      status: "error",
      message: "Connexion impossible. Vérifie l'email et le mot de passe."
    };
  }

  redirect(defaultRedirect);
}

export async function signUpWithPassword(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase Auth n'est pas encore configuré."
    };
  }

  const credentials = readCredentials(formData);

  if (!credentials.ok) {
    return {
      status: "error",
      message: credentials.error
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: await getAuthCallbackUrl()
    }
  });

  if (error) {
    return {
      status: "error",
      message: getSignUpErrorMessage(error)
    };
  }

  if (data.session) {
    redirect(defaultRedirect);
  }

  return {
    status: "success",
    message:
      "Compte créé. Supabase attend une confirmation email avant de créer la session."
  };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function signInWithOAuth(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/connexion?error=auth_not_configured");
  }

  const provider = String(formData.get("provider") ?? "");

  if (!allowedOAuthProviders.has(provider as Provider)) {
    redirect("/connexion?error=oauth_provider");
  }

  const redirectTo = await getAuthCallbackUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo
    }
  });

  if (error || !data.url) {
    redirect("/connexion?error=oauth_start");
  }

  redirect(data.url);
}

function getSignUpErrorMessage(error: { message: string; status?: number }) {
  if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
    return "Trop d'emails envoyés par Supabase. Réessaie plus tard ou utilise Google/GitHub.";
  }

  if (error.message.toLowerCase().includes("already registered")) {
    return "Un compte existe déjà avec cet email. Essaie de te connecter.";
  }

  return "Inscription impossible avec ces informations.";
}
