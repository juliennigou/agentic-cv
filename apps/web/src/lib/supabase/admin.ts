import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserEnv } from "./env";

/** Bucket privé hébergeant les documents utilisateur (CV, lettres…). */
export const USER_DOCUMENTS_BUCKET = "user-documents";

function readServiceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return value && value.trim().length > 0 ? value : null;
}

/**
 * Indique si l'upload de documents est possible : il requiert la clé service-role
 * (jamais exposée au navigateur) en plus de la config Supabase de base.
 */
export function isStorageConfigured(): boolean {
  return readServiceRoleKey() !== null;
}

/**
 * Client Supabase à privilèges service-role, réservé au serveur (upload storage,
 * tâches admin). Ne JAMAIS l'importer dans un composant client.
 */
export function createAdminClient(): SupabaseClient {
  const serviceRoleKey = readServiceRoleKey();
  if (serviceRoleKey === null) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant : upload de documents impossible.");
  }

  const { url } = getSupabaseBrowserEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * URL signée temporaire vers un document du bucket privé (consultation du PDF).
 * Renvoie null si le storage n'est pas configuré ou si la signature échoue.
 */
export async function createUserDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!isStorageConfigured()) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(USER_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}
