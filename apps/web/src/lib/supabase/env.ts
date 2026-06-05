type SupabaseBrowserEnv = {
  url: string;
  publishableKey: string;
};

function readEnv(name: string) {
  const value = process.env[name];

  return value && value.trim().length > 0 ? value : null;
}

function readRequiredEnv(name: string) {
  const value = readEnv(name);

  if (value === null) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }

  return value;
}

export function isSupabaseConfigured() {
  return (
    readEnv("NEXT_PUBLIC_SUPABASE_URL") !== null &&
    (readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") !== null ||
      readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") !== null)
  );
}

export function getSupabaseBrowserEnv(): SupabaseBrowserEnv {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}
