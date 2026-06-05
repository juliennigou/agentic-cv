import { z } from "zod";

/**
 * Provider d'embeddings Gemini (free tier).
 *
 * Seul point du code qui dépend de l'API Google. Pour basculer vers un autre
 * fournisseur (modèle local, OpenAI…), il suffit de réimplémenter `embedTexts`
 * en conservant la même signature.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-embedding-001";

/** Dimension MRL retenue côté DB (`vector(768)`). */
export const EMBEDDING_DIMENSION = 768;

/**
 * `RETRIEVAL_DOCUMENT` pour le contenu indexé (offres),
 * `RETRIEVAL_QUERY` pour une requête utilisateur.
 */
export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

type EmbedTextsOptions = {
  taskType?: EmbeddingTaskType;
};

const embedResponseSchema = z.object({
  embeddings: z.array(z.object({ values: z.array(z.number()) }))
});

/** Indique si la clé API est disponible (permet de skip proprement). */
export function isEmbeddingConfigured(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

/**
 * Calcule les embeddings d'un lot de textes en un seul appel batch.
 * Retourne les vecteurs dans le même ordre que `texts`.
 */
export async function embedTexts(
  texts: string[],
  options: EmbedTextsOptions = {}
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY n'est pas définie.");
  }

  const model = process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_MODEL;
  const taskType = options.taskType ?? "RETRIEVAL_DOCUMENT";

  const response = await fetch(`${API_BASE}/models/${model}:batchEmbedContents?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSION
      }))
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Échec de la requête d'embedding Gemini (${response.status}): ${body}`);
  }

  const parsed = embedResponseSchema.parse(await response.json());

  if (parsed.embeddings.length !== texts.length) {
    throw new Error(
      `Gemini a renvoyé ${parsed.embeddings.length} embeddings pour ${texts.length} entrées.`
    );
  }

  return parsed.embeddings.map((embedding, index) => {
    if (embedding.values.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding ${index} de dimension ${embedding.values.length}, attendu ${EMBEDDING_DIMENSION}.`
      );
    }
    return embedding.values;
  });
}
