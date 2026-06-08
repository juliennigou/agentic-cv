import type { ApplicationWorkspace } from "@agentic-cv/db";
import { resumeSchema, type Resume } from "@agentic-cv/shared";

export type ContextPackInput = {
  offer: ApplicationWorkspace["offer"];
  profile: ApplicationWorkspace["profile"];
  /** Inclure email/téléphone (désactivé par défaut — PII). */
  includeContact?: boolean;
};

/**
 * Construit le « pack » texte copiable dans ChatGPT. Fonction **pure** et
 * **déterministe** (aucune date/aléa) : même entrée → même sortie.
 *
 * PII : email/téléphone/coordonnées ne sont inclus que si `includeContact`.
 * Les chemins de stockage, identifiants techniques et secrets ne sont jamais
 * exposés (ils ne font pas partie des données fournies).
 */
export function buildApplicationContextPack(input: ContextPackInput): string {
  const { offer, profile, includeContact = false } = input;
  const sections: string[] = [];

  sections.push(
    [
      "# CONTEXTE — PRÉPARER MA CANDIDATURE",
      "",
      "Tu es un assistant qui m'aide à préparer une candidature à l'offre ci-dessous.",
      "À partir UNIQUEMENT des informations fournies, produis trois éléments :",
      "un CV ciblé, une lettre de motivation et un message personnalisé pour le recruteur."
    ].join("\n")
  );

  sections.push(buildOfferSection(offer));
  sections.push(buildProfileSection(profile, includeContact));
  sections.push(buildResumeSection(profile.resumeData));
  sections.push(buildInstructionsSection());

  return sections.join("\n\n");
}

function buildOfferSection(offer: ContextPackInput["offer"]): string {
  const lines = ["## OFFRE", `Intitulé : ${offer.title}`];
  if (offer.companyName) lines.push(`Entreprise : ${offer.companyName}`);
  const location = [offer.city, offer.country].filter(Boolean).join(", ");
  if (location) lines.push(`Lieu : ${location}`);
  if (offer.contractType) lines.push(`Contrat : ${offer.contractType}`);
  if (offer.durationMonths) lines.push(`Durée : ${offer.durationMonths} mois`);

  lines.push("", "### Description du poste", offer.description.trim());
  if (offer.requirements?.trim()) {
    lines.push("", "### Exigences", offer.requirements.trim());
  }
  if (offer.companyDescription?.trim()) {
    lines.push("", "### Présentation de l'entreprise", offer.companyDescription.trim());
  }
  return lines.join("\n");
}

function buildProfileSection(
  profile: ContextPackInput["profile"],
  includeContact: boolean
): string {
  const lines = ["## MON PROFIL"];
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  if (name) lines.push(`Nom : ${name}`);
  if (profile.location) lines.push(`Localisation : ${profile.location}`);
  if (profile.targetRoles.length > 0)
    lines.push(`Postes visés : ${profile.targetRoles.join(", ")}`);
  if (profile.targetCountries.length > 0)
    lines.push(`Pays visés : ${profile.targetCountries.join(", ")}`);
  if (profile.skills.length > 0) lines.push(`Compétences : ${profile.skills.join(", ")}`);
  if (profile.languages.length > 0) lines.push(`Langues : ${profile.languages.join(", ")}`);

  if (includeContact) {
    const contact = [
      profile.firstName || profile.lastName ? `Nom complet : ${name}` : null,
      profile.phone ? `Téléphone : ${profile.phone}` : null
    ].filter((line): line is string => line !== null);
    if (contact.length > 0) lines.push("", "### Coordonnées", ...contact);
  }

  return lines.length > 1 ? lines.join("\n") : "## MON PROFIL\n(non renseigné)";
}

function buildResumeSection(resumeData: unknown): string {
  const parsed = resumeSchema.safeParse(resumeData ?? undefined);
  if (!parsed.success) {
    return "## MON CV\n(aucun CV structuré disponible — signale les informations manquantes)";
  }
  const resume: Resume = parsed.data;
  const lines = ["## MON CV"];

  if (resume.summary?.trim()) lines.push("", "### Résumé", resume.summary.trim());

  if (resume.experiences.length > 0) {
    lines.push("", "### Expériences");
    for (const exp of resume.experiences) {
      const head = [exp.title, exp.company].filter(Boolean).join(" — ");
      const meta = [[exp.startDate, exp.endDate].filter(Boolean).join(" → "), exp.location]
        .filter(Boolean)
        .join(", ");
      lines.push(`- ${head}${meta ? ` (${meta})` : ""}`);
      if (exp.description?.trim()) lines.push(`  ${exp.description.trim()}`);
    }
  }

  if (resume.education.length > 0) {
    lines.push("", "### Formation");
    for (const edu of resume.education) {
      const head = [edu.degree, edu.field, edu.school].filter(Boolean).join(" — ");
      const meta = [edu.startDate, edu.endDate].filter(Boolean).join(" → ");
      lines.push(`- ${head}${meta ? ` (${meta})` : ""}`);
    }
  }

  if (resume.projects.length > 0) {
    lines.push("", "### Projets");
    for (const project of resume.projects) {
      lines.push(
        `- ${project.name}${project.description ? ` : ${project.description.trim()}` : ""}`
      );
    }
  }

  if (resume.languages.length > 0) {
    lines.push(
      "",
      "### Langues (CV)",
      resume.languages
        .map((lang) => `${lang.language}${lang.level ? ` (${lang.level})` : ""}`)
        .join(", ")
    );
  }

  const skillsAndTools = [...resume.skills, ...resume.tools];
  if (skillsAndTools.length > 0) {
    lines.push("", "### Compétences & outils (CV)", skillsAndTools.join(", "));
  }

  return lines.join("\n");
}

function buildInstructionsSection(): string {
  return [
    "## CONSIGNES",
    "- Ne rien inventer. Si une information manque pour bien répondre, signale-le explicitement plutôt que de combler par des suppositions.",
    "- Adapte le CV et la lettre aux exigences de l'offre, en mettant en avant les expériences les plus pertinentes.",
    "- Reste factuel, professionnel et concis.",
    "- Réponds en produisant exactement trois blocs délimités comme suit :",
    "",
    "[CV CIBLÉ]",
    "…",
    "[/CV CIBLÉ]",
    "",
    "[LETTRE DE MOTIVATION]",
    "…",
    "[/LETTRE DE MOTIVATION]",
    "",
    "[MESSAGE AU RECRUTEUR]",
    "…",
    "[/MESSAGE AU RECRUTEUR]"
  ].join("\n");
}
