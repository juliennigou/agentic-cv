import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseBrowserEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return redirectTo(requestUrl, "/connexion?error=auth_not_configured");
  }

  if (authError) {
    return redirectTo(requestUrl, "/connexion?error=callback");
  }

  if (!code) {
    return redirectTo(requestUrl, "/connexion?error=callback");
  }

  const response = redirectTo(requestUrl, next);
  const { url, publishableKey } = getSupabaseBrowserEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers = {}) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
    }
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectTo(requestUrl, "/connexion?error=callback");
  }

  if (!data.session) {
    return redirectTo(requestUrl, "/connexion?error=session_missing");
  }

  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/compte";
  }

  return next;
}

function redirectTo(requestUrl: URL, path: string) {
  return NextResponse.redirect(new URL(path, requestUrl.origin));
}
