import { embedTexts, isEmbeddingConfigured } from "../embeddings/litellm";

/**
 * Embedding d'une requête de recherche (taskType RETRIEVAL_QUERY), avec cache
 * mémoire pour économiser les appels d'embedding sur les requêtes répétées.
 *
 * Renvoie `null` si LiteLLM est indisponible/non configuré ou en cas d'erreur :
 * la recherche hybride retombe alors proprement sur le full-text seul.
 */

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;

type CacheEntry = { vector: number[]; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Vecteur de requête (768 dim) ou `null` si indisponible. */
export async function embedQuery(text: string): Promise<number[] | null> {
  const key = normalize(text);
  if (key.length === 0 || !isEmbeddingConfigured()) {
    return null;
  }

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.vector;
  }

  try {
    const [vector] = await embedTexts([key], { taskType: "RETRIEVAL_QUERY" });
    if (!vector) {
      return null;
    }

    if (cache.size >= MAX_ENTRIES) {
      // Éviction simple : on vide l'entrée la plus ancienne insérée.
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }
    cache.set(key, { vector, expiresAt: Date.now() + TTL_MS });
    return vector;
  } catch {
    // Dégradation gracieuse : pas de vecteur -> full-text seul.
    return null;
  }
}
