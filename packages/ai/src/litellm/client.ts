import { z } from "zod";

const DEFAULT_BASE_URL = "http://localhost:4000/v1";

const chatResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string()
        })
      })
    )
    .min(1)
});

const embeddingResponseSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().optional(),
      embedding: z.array(z.number())
    })
  )
});

export type LiteLlmChatMessage = {
  role: "system" | "user";
  content: string;
};

type LiteLlmRequestOptions = {
  path: string;
  body: Record<string, unknown>;
};

function getBaseUrl(): string {
  return (process.env.LITELLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function getHeaders(): HeadersInit {
  const apiKey = process.env.LITELLM_API_KEY?.trim();

  return {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
  };
}

export function isLiteLlmConfigured(): boolean {
  return Boolean(process.env.LITELLM_BASE_URL?.trim() || process.env.LITELLM_API_KEY?.trim());
}

async function postLiteLlmJson({ path, body }: LiteLlmRequestOptions): Promise<unknown> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Échec de la requête LiteLLM ${path} (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * Isole l'objet JSON d'une réponse de chat completion, même si le modèle l'a
 * entouré de texte ou de balises Markdown malgré `response_format: json_object`.
 */
export function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("LiteLLM n'a pas renvoyé un objet JSON exploitable.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

export async function createChatCompletion(body: Record<string, unknown>): Promise<string> {
  const parsed = chatResponseSchema.parse(
    await postLiteLlmJson({
      path: "/chat/completions",
      body
    })
  );

  return parsed.choices[0].message.content;
}

export async function createEmbeddings(body: Record<string, unknown>): Promise<number[][]> {
  const parsed = embeddingResponseSchema.parse(
    await postLiteLlmJson({
      path: "/embeddings",
      body
    })
  );

  return [...parsed.data]
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .map((item) => item.embedding);
}
