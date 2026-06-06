import { createEmbeddings, isLiteLlmConfigured } from "../litellm/client";

const DEFAULT_MODEL = "openai/text-embedding-3-small";

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

/** Indique si le proxy LiteLLM est disponible (permet de skip proprement). */
export function isEmbeddingConfigured(): boolean {
  return isLiteLlmConfigured();
}

function shouldSendTaskType(model: string): boolean {
  const normalizedModel = model.toLowerCase();
  return normalizedModel.includes("gemini") || normalizedModel.includes("vertex");
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

  const model = process.env.LITELLM_EMBEDDING_MODEL || DEFAULT_MODEL;
  const taskType = options.taskType ?? "RETRIEVAL_DOCUMENT";
  const body: Record<string, unknown> = {
    model,
    input: texts,
    dimensions: EMBEDDING_DIMENSION,
    encoding_format: "float"
  };

  if (shouldSendTaskType(model)) {
    body.input_type = taskType;
  }

  const embeddings = await createEmbeddings(body);

  if (embeddings.length !== texts.length) {
    throw new Error(
      `LiteLLM a renvoyé ${embeddings.length} embeddings pour ${texts.length} entrées.`
    );
  }

  return embeddings.map((embedding, index) => {
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding ${index} de dimension ${embedding.length}, attendu ${EMBEDDING_DIMENSION}.`
      );
    }
    return embedding;
  });
}
