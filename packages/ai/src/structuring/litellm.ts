import { z } from "zod";

import { createChatCompletion, isLiteLlmConfigured } from "../litellm/client";

const DEFAULT_MODEL = "deepseek/deepseek-chat";

/** Offre brute à structurer. */
export type OfferToStructure = {
  /** Identifiant opaque, renvoyé tel quel pour réassocier la sortie. */
  id: string;
  title: string;
  /** Nom de l'entreprise, utilisé pour la génération si aucun bloc société n'existe. */
  companyName?: string | null;
  /** Description brute (contient souvent mission + présentation entreprise). */
  description: string;
  /** Présentation entreprise déjà isolée par le scraper, si disponible. */
  companyDescription?: string | null;
};

/** Résultat structuré pour une offre. */
export type StructuredOffer = {
  id: string;
  /** Texte de la mission seule (sans le bruit entreprise). */
  description: string;
  /** Présentation de l'entreprise, ou null si absente et entreprise inconnue. */
  companyDescription: string | null;
  /** true si `companyDescription` a été générée par le modèle (badge « IA » en UI). */
  companyDescriptionGenerated: boolean;
};

/** Indique si le proxy LiteLLM est disponible (permet de skip proprement). */
export function isStructuringConfigured(): boolean {
  return isLiteLlmConfigured();
}

const PROMPT_INSTRUCTIONS = `Tu reçois un tableau JSON d'offres d'emploi V.I.E (champ "items").
Pour chaque offre, produis :
- "description" : UNIQUEMENT la mission, le poste et les responsabilités du candidat.
- "companyDescription" : la présentation de la société / de l'employeur.
- "companyDescriptionGenerated" : booléen indiquant l'origine de companyDescription.

Marche à suivre pour companyDescription :
1. Si l'offre contient un bloc de présentation de la société (même mélangé dans la
   mission), EXTRAIS-le mot pour mot et mets companyDescriptionGenerated = false.
2. Sinon, si tu CONNAIS RÉELLEMENT l'entreprise "companyName" (groupe ou marque
   identifiable de façon fiable), GÉNÈRE EN FRANÇAIS 1 à 3 phrases factuelles et
   neutres (secteur, activité principale) et mets companyDescriptionGenerated = true.
3. Sinon (aucun bloc ET entreprise inconnue / ambiguë), mets companyDescription = null
   et companyDescriptionGenerated = false. NE DEVINE JAMAIS.

Règles strictes :
- Pour l'extraction (cas 1) et la mission : ne RÉSUME pas, n'INVENTE rien, ne traduis
  pas — réutilise les phrases d'origine mot pour mot.
- Pour la génération (cas 2) : reste factuel et prudent, aucune donnée chiffrée inventée,
  aucune affirmation invérifiable (pas de "leader", "n°1"…). En cas de doute → cas 3.
- Retire les en-têtes parasites ("Présentation de la société :", "Poste et missions :"…).
- "description" ne doit jamais être vide : si la mission est introuvable, recopie
  le texte source restant.
- Renvoie EXACTEMENT un objet JSON par offre, dans le même ordre, avec le même "id".
- La réponse doit être un objet JSON valide de forme {"items":[...]}, sans Markdown.`;

const structuredResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      companyDescription: z.string().nullable(),
      companyDescriptionGenerated: z.boolean()
    })
  )
});

function extractJsonObject(text: string): string {
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

/**
 * Structure un lot d'offres en un seul appel de chat completion.
 * Retourne un résultat par offre, réassocié par `id` (ordre d'entrée préservé).
 */
export async function structureOffers(offers: OfferToStructure[]): Promise<StructuredOffer[]> {
  if (offers.length === 0) {
    return [];
  }

  const model = process.env.LITELLM_STRUCTURING_MODEL || DEFAULT_MODEL;
  const payload = {
    items: offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      companyName: offer.companyName ?? null,
      description: offer.description,
      companyDescription: offer.companyDescription ?? null
    }))
  };

  const text = await createChatCompletion({
    model,
    temperature: 0,
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: PROMPT_INSTRUCTIONS
      },
      {
        role: "user",
        content: JSON.stringify(payload)
      }
    ]
  });

  const parsed = structuredResponseSchema.parse(JSON.parse(extractJsonObject(text)));
  const byId = new Map(parsed.items.map((item) => [item.id, item]));

  return offers.map((offer) => {
    const item = byId.get(offer.id);
    if (!item) {
      throw new Error(`LiteLLM n'a pas renvoyé de structuration pour l'offre ${offer.id}.`);
    }

    const description = item.description.trim();
    const companyDescription = item.companyDescription?.trim();
    const hasCompanyDescription = Boolean(companyDescription && companyDescription.length > 0);

    return {
      id: offer.id,
      // Garde-fou : ne jamais vider la mission si le modèle renvoie du vide.
      description: description.length > 0 ? description : offer.description,
      companyDescription: hasCompanyDescription ? companyDescription! : null,
      // Le flag « généré » n'a de sens que si une description existe réellement.
      companyDescriptionGenerated: hasCompanyDescription && item.companyDescriptionGenerated
    };
  });
}
