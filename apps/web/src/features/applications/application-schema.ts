import type { APPLICATION_ARTIFACT_KINDS } from "@agentic-cv/db";
import { z } from "zod";

/** Type de document, dérivé du tuple exporté par le repo (pas de dépendance Prisma côté web). */
export type ApplicationArtifactKind = (typeof APPLICATION_ARTIFACT_KINDS)[number];

/** Taille max d'un contenu collé (garde-fou anti-payload, ~quelques pages). */
const CONTENT_MAX = 20000;

const contentField = z.string().max(CONTENT_MAX, "Contenu trop long.").default("");
const requiredContentField = z
  .string()
  .trim()
  .min(1, "Ce champ est requis pour valider.")
  .max(CONTENT_MAX, "Contenu trop long.");

/** URL de conversation ChatGPT : optionnelle, mais valide si fournie. */
const conversationUrlField = z
  .string()
  .trim()
  .max(2000)
  .url("URL invalide.")
  .or(z.literal(""))
  .optional();

/** CTA « Préparer ma candidature » depuis une offre. */
export const prepareApplicationSchema = z.object({
  jobOfferId: z.string().uuid(),
  returnTo: z.string().default("/mes-vie")
});

/** Enregistrement d'un brouillon : contenus facultatifs (travail en cours). */
export const applicationDraftSchema = z.object({
  applicationId: z.string().uuid(),
  chatgptConversationUrl: conversationUrlField,
  targetedResume: contentField,
  coverLetter: contentField,
  recruiterMessage: contentField
});

/** Validation finale : les trois contenus deviennent obligatoires. */
export const applicationValidateSchema = applicationDraftSchema.extend({
  targetedResume: requiredContentField,
  coverLetter: requiredContentField,
  recruiterMessage: requiredContentField
});

export type ApplicationDraftInput = z.infer<typeof applicationDraftSchema>;

/** Mappe les champs du formulaire vers la forme attendue par le repository. */
export function toArtifactInputs(
  input: Pick<ApplicationDraftInput, "targetedResume" | "coverLetter" | "recruiterMessage">
): Array<{ kind: ApplicationArtifactKind; contentText: string }> {
  return [
    { kind: "targeted_resume", contentText: input.targetedResume },
    { kind: "cover_letter", contentText: input.coverLetter },
    { kind: "recruiter_message", contentText: input.recruiterMessage }
  ];
}
