import { z } from "zod";

/**
 * Provider de structuration Gemini (free tier).
 *
 * Sépare une offre brute en deux blocs — présentation entreprise et mission —
 * car l'API Business France colle souvent la présentation de la société dans le
 * champ mission. Sortie JSON garantie via `responseSchema` + validée par Zod.
 *
 * Seul point du code qui dépend de l'API Google pour la structuration. Pour
 * changer de fournisseur, réimplémenter `structureOffers` à signature identique.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
// flash-lite : ~1000 req/jour en free tier, suffisant pour le volume d'offres.
// (gemini-3.5-flash est plafonné à ~20 req/jour sur le free tier.)
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

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

/** Indique si la clé API est disponible (permet de skip proprement). */
export function isStructuringConfigured(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
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
- Renvoie EXACTEMENT un objet par offre, dans le même ordre, avec le même "id".`;

const responseSchema = {
  type: "OBJECT",
  properties: {
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          description: { type: "STRING" },
          companyDescription: { type: "STRING", nullable: true },
          companyDescriptionGenerated: { type: "BOOLEAN" }
        },
        required: ["id", "description", "companyDescription", "companyDescriptionGenerated"]
      }
    }
  },
  required: ["items"]
} as const;

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

const candidatesSchema = z.object({
  candidates: z
    .array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string() })) }) }))
    .min(1)
});

/**
 * Structure un lot d'offres en un seul appel `generateContent`.
 * Retourne un résultat par offre, réassocié par `id` (ordre d'entrée préservé).
 */
export async function structureOffers(offers: OfferToStructure[]): Promise<StructuredOffer[]> {
  if (offers.length === 0) {
    return [];
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY n'est pas définie.");
  }

  const model = process.env.GEMINI_STRUCTURING_MODEL || DEFAULT_MODEL;

  const payload = {
    items: offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      companyName: offer.companyName ?? null,
      description: offer.description,
      companyDescription: offer.companyDescription ?? null
    }))
  };

  const response = await fetch(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${PROMPT_INSTRUCTIONS}\n\n${JSON.stringify(payload)}` }] }],
      generationConfig: {
        temperature: 0,
        // Marge suffisante pour reproduire verbatim plusieurs missions par lot
        // sans troncature du JSON de sortie.
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Échec de la requête de structuration Gemini (${response.status}): ${body}`);
  }

  const candidates = candidatesSchema.parse(await response.json());
  const text = candidates.candidates[0].content.parts.map((part) => part.text).join("");
  const parsed = structuredResponseSchema.parse(JSON.parse(text));

  const byId = new Map(parsed.items.map((item) => [item.id, item]));

  return offers.map((offer) => {
    const item = byId.get(offer.id);
    if (!item) {
      throw new Error(`Gemini n'a pas renvoyé de structuration pour l'offre ${offer.id}.`);
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
