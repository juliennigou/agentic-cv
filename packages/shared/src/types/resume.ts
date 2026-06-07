import { z } from "zod";

/**
 * Contrat du CV structuré, partagé par la structuration LLM (`@agentic-cv/ai`),
 * le stockage (`resume_data` sur `user_profiles`) et l'UI de relecture.
 *
 * Tout est optionnel/défaut [] : un CV incomplet ne doit jamais faire échouer la
 * validation. Les dates restent des chaînes libres (formats CV trop hétérogènes
 * pour être normalisés de façon fiable, ex. "Sept. 2020 – Juin 2023").
 */

const trimmedString = z.string().trim();

const contactSchema = z
  .object({
    firstName: trimmedString.nullish(),
    lastName: trimmedString.nullish(),
    email: trimmedString.nullish(),
    phone: trimmedString.nullish(),
    location: trimmedString.nullish()
  })
  .partial();

const educationSchema = z.object({
  school: trimmedString.default(""),
  degree: trimmedString.nullish(),
  field: trimmedString.nullish(),
  startDate: trimmedString.nullish(),
  endDate: trimmedString.nullish(),
  location: trimmedString.nullish(),
  description: trimmedString.nullish()
});

const experienceSchema = z.object({
  title: trimmedString.default(""),
  company: trimmedString.nullish(),
  startDate: trimmedString.nullish(),
  endDate: trimmedString.nullish(),
  location: trimmedString.nullish(),
  description: trimmedString.nullish()
});

const projectSchema = z.object({
  name: trimmedString.default(""),
  description: trimmedString.nullish(),
  link: trimmedString.nullish(),
  date: trimmedString.nullish()
});

const extracurricularSchema = z.object({
  title: trimmedString.default(""),
  description: trimmedString.nullish()
});

const languageSchema = z.object({
  language: trimmedString.default(""),
  level: trimmedString.nullish()
});

export const resumeSchema = z.object({
  summary: trimmedString.nullish(),
  contact: contactSchema.default({}),
  education: z.array(educationSchema).default([]),
  experiences: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  extracurriculars: z.array(extracurricularSchema).default([]),
  languages: z.array(languageSchema).default([]),
  // Compétences générales.
  skills: z.array(trimmedString).default([]),
  // Logiciels / outils maîtrisés, distingués des compétences générales.
  tools: z.array(trimmedString).default([])
});

export type Resume = z.infer<typeof resumeSchema>;

/** CV vide (toutes sections par défaut) — point de départ pour la saisie manuelle. */
export function createEmptyResume(): Resume {
  return resumeSchema.parse({});
}

export type ResumeContact = z.infer<typeof contactSchema>;
export type ResumeEducation = z.infer<typeof educationSchema>;
export type ResumeExperience = z.infer<typeof experienceSchema>;
export type ResumeProject = z.infer<typeof projectSchema>;
export type ResumeExtracurricular = z.infer<typeof extracurricularSchema>;
export type ResumeLanguage = z.infer<typeof languageSchema>;
