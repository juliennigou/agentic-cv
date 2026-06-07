import { extractText, getDocumentProxy } from "unpdf";

/**
 * Erreur typée levée quand un PDF ne contient pas de texte exploitable
 * (typiquement un scan/image sans couche texte). L'OCR est hors scope (coût,
 * poids) : on remonte un message clair à l'utilisateur plutôt que de deviner.
 */
export class EmptyPdfTextError extends Error {
  constructor() {
    super("PDF sans texte extractible (probablement scanné ou composé d'images).");
    this.name = "EmptyPdfTextError";
  }
}

// En deçà de ce nombre de caractères utiles, on considère l'extraction comme vide.
const MIN_USEFUL_CHARS = 20;

/**
 * Extrait le texte brut d'un PDF, en local et sans aucune dépendance payante
 * (lib `unpdf`, dérivée de pdf.js). Les pages sont concaténées dans l'ordre.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });

  const trimmed = text.trim();

  // On évalue la « densité » de texte sans les blancs : un PDF scanné renvoie
  // souvent quelques caractères parasites mais pas de contenu réel.
  if (trimmed.replace(/\s/g, "").length < MIN_USEFUL_CHARS) {
    throw new EmptyPdfTextError();
  }

  return trimmed;
}
