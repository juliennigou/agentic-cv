import { resumeSchema, type Resume } from "@agentic-cv/shared";

import { createChatCompletion, extractJsonObject, isLiteLlmConfigured } from "../litellm/client";

const DEFAULT_MODEL = "deepseek/deepseek-chat";

/** Indique si le proxy LiteLLM est disponible (permet de skip proprement). */
export function isResumeStructuringConfigured(): boolean {
  return isLiteLlmConfigured();
}

const PROMPT_INSTRUCTIONS = `Tu reçois le TEXTE BRUT d'un CV (extrait d'un PDF, mise en page perdue).
Structure-le en un objet JSON conforme au schéma suivant (toutes les clés sont
optionnelles ; omets une section absente plutôt que de l'inventer) :

{
  "summary": string,                         // accroche / résumé, si présent
  "contact": {
    "firstName": string, "lastName": string,
    "email": string, "phone": string, "location": string
  },
  "education": [
    { "school": string, "degree": string, "field": string,
      "startDate": string, "endDate": string, "location": string, "description": string }
  ],
  "experiences": [
    { "title": string, "company": string,
      "startDate": string, "endDate": string, "location": string, "description": string }
  ],
  "projects": [ { "name": string, "description": string, "link": string, "date": string } ],
  "extracurriculars": [ { "title": string, "description": string } ],
  "languages": [ { "language": string, "level": string } ],
  "skills": [ string ],   // compétences générales / savoir-faire
  "tools": [ string ]     // logiciels et outils (ex. Excel, Python, Figma, SQL)
}

Règles strictes :
- N'INVENTE rien. N'extrais que ce qui figure réellement dans le texte. Si une
  information manque, omets la clé/l'entrée.
- Réutilise les libellés d'origine (ne traduis pas, ne reformule pas les intitulés).
- Les dates restent telles quelles (chaînes libres), ne les normalise pas.
- Sépare bien "skills" (compétences) de "tools" (logiciels/outils). En cas de doute,
  une techno ou un logiciel nommé va dans "tools".
- "description" reprend les puces/phrases d'origine, condensées si besoin sans rien inventer.
- Renvoie UNIQUEMENT un objet JSON valide, sans Markdown ni texte autour.`;

/**
 * Structure le texte brut d'un CV en un objet `Resume` validé.
 * Un seul appel de chat completion ; la sortie est validée par `resumeSchema`
 * (les champs absents prennent leurs valeurs par défaut [] / null).
 */
export async function structureResume(rawText: string): Promise<Resume> {
  const model = process.env.LITELLM_RESUME_MODEL || DEFAULT_MODEL;

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
        content: rawText
      }
    ]
  });

  return resumeSchema.parse(JSON.parse(extractJsonObject(text)));
}
