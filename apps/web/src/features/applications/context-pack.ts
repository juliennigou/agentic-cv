import type { ApplicationWorkspace } from "@agentic-cv/db";
import { resumeSchema, type Resume } from "@agentic-cv/shared";

/** Langue des documents produits (le pack et la consigne de sortie s'y adaptent). */
export type ContextPackLanguage = "fr" | "en";

export type ContextPackInput = {
  offer: ApplicationWorkspace["offer"];
  profile: ApplicationWorkspace["profile"];
  /** Langue des documents à produire (titres, instructions et consigne de sortie). */
  language: ContextPackLanguage;
  /** Inclure email/téléphone (désactivé par défaut — PII). */
  includeContact?: boolean;
};

/** Libellés localisés : même structure de pack, titres/instructions traduits. */
type PackCopy = {
  intro: string[];
  offer: {
    title: string;
    role: (value: string) => string;
    company: (value: string) => string;
    location: (value: string) => string;
    contract: (value: string) => string;
    duration: (months: number) => string;
    description: string;
    requirements: string;
    companyPresentation: string;
  };
  profile: {
    title: string;
    empty: string;
    name: (value: string) => string;
    location: (value: string) => string;
    targetRoles: (value: string) => string;
    targetCountries: (value: string) => string;
    skills: (value: string) => string;
    languages: (value: string) => string;
    contactTitle: string;
    fullName: (value: string) => string;
    phone: (value: string) => string;
  };
  resume: {
    title: string;
    unavailable: string;
    summary: string;
    experiences: string;
    education: string;
    projects: string;
    languages: string;
    skillsAndTools: string;
  };
  instructions: string[];
};

const COPY: Record<ContextPackLanguage, PackCopy> = {
  fr: {
    intro: [
      "# CONTEXTE — PRÉPARER MA CANDIDATURE",
      "",
      "Tu es un assistant qui m'aide à préparer une candidature à l'offre ci-dessous.",
      "À partir UNIQUEMENT des informations fournies, produis trois éléments :",
      "un CV ciblé, une lettre de motivation et un message personnalisé pour le recruteur."
    ],
    offer: {
      title: "## OFFRE",
      role: (value) => `Intitulé : ${value}`,
      company: (value) => `Entreprise : ${value}`,
      location: (value) => `Lieu : ${value}`,
      contract: (value) => `Contrat : ${value}`,
      duration: (months) => `Durée : ${months} mois`,
      description: "### Description du poste",
      requirements: "### Exigences",
      companyPresentation: "### Présentation de l'entreprise"
    },
    profile: {
      title: "## MON PROFIL",
      empty: "## MON PROFIL\n(non renseigné)",
      name: (value) => `Nom : ${value}`,
      location: (value) => `Localisation : ${value}`,
      targetRoles: (value) => `Postes visés : ${value}`,
      targetCountries: (value) => `Pays visés : ${value}`,
      skills: (value) => `Compétences : ${value}`,
      languages: (value) => `Langues : ${value}`,
      contactTitle: "### Coordonnées",
      fullName: (value) => `Nom complet : ${value}`,
      phone: (value) => `Téléphone : ${value}`
    },
    resume: {
      title: "## MON CV",
      unavailable:
        "## MON CV\n(aucun CV structuré disponible — signale les informations manquantes)",
      summary: "### Résumé",
      experiences: "### Expériences",
      education: "### Formation",
      projects: "### Projets",
      languages: "### Langues (CV)",
      skillsAndTools: "### Compétences & outils (CV)"
    },
    instructions: [
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
    ]
  },
  en: {
    intro: [
      "# CONTEXT — PREPARING MY APPLICATION",
      "",
      "You are an assistant helping me prepare an application for the offer below.",
      "Using ONLY the information provided, produce three deliverables:",
      "a tailored resume, a cover letter and a personalized message for the recruiter.",
      "Write all three deliverables in English."
    ],
    offer: {
      title: "## OFFER",
      role: (value) => `Title: ${value}`,
      company: (value) => `Company: ${value}`,
      location: (value) => `Location: ${value}`,
      contract: (value) => `Contract: ${value}`,
      duration: (months) => `Duration: ${months} months`,
      description: "### Job description",
      requirements: "### Requirements",
      companyPresentation: "### Company overview"
    },
    profile: {
      title: "## MY PROFILE",
      empty: "## MY PROFILE\n(not provided)",
      name: (value) => `Name: ${value}`,
      location: (value) => `Location: ${value}`,
      targetRoles: (value) => `Target roles: ${value}`,
      targetCountries: (value) => `Target countries: ${value}`,
      skills: (value) => `Skills: ${value}`,
      languages: (value) => `Languages: ${value}`,
      contactTitle: "### Contact details",
      fullName: (value) => `Full name: ${value}`,
      phone: (value) => `Phone: ${value}`
    },
    resume: {
      title: "## MY RESUME",
      unavailable: "## MY RESUME\n(no structured resume available — flag the missing information)",
      summary: "### Summary",
      experiences: "### Experience",
      education: "### Education",
      projects: "### Projects",
      languages: "### Languages (resume)",
      skillsAndTools: "### Skills & tools (resume)"
    },
    instructions: [
      "## INSTRUCTIONS",
      "- Do not make anything up. If information is missing to answer properly, flag it explicitly rather than filling gaps with assumptions.",
      "- Tailor the resume and letter to the offer's requirements, highlighting the most relevant experiences.",
      "- Stay factual, professional and concise.",
      "- Reply with exactly three blocks delimited as follows:",
      "",
      "[TAILORED RESUME]",
      "…",
      "[/TAILORED RESUME]",
      "",
      "[COVER LETTER]",
      "…",
      "[/COVER LETTER]",
      "",
      "[RECRUITER MESSAGE]",
      "…",
      "[/RECRUITER MESSAGE]"
    ]
  }
};

/**
 * Construit le « pack » texte copiable dans ChatGPT. Fonction **pure** et
 * **déterministe** (aucune date/aléa) : même entrée → même sortie.
 *
 * Le paramètre `language` choisit la langue des titres, instructions et de la
 * consigne de sortie ; les données de l'offre/profil restent inchangées.
 *
 * PII : email/téléphone/coordonnées ne sont inclus que si `includeContact`.
 * Les chemins de stockage, identifiants techniques et secrets ne sont jamais
 * exposés (ils ne font pas partie des données fournies).
 */
export function buildApplicationContextPack(input: ContextPackInput): string {
  const { offer, profile, language, includeContact = false } = input;
  const copy = COPY[language];
  const sections: string[] = [];

  sections.push(copy.intro.join("\n"));
  sections.push(buildOfferSection(offer, copy));
  sections.push(buildProfileSection(profile, includeContact, copy));
  sections.push(buildResumeSection(profile.resumeData, copy));
  sections.push(copy.instructions.join("\n"));

  return sections.join("\n\n");
}

function buildOfferSection(offer: ContextPackInput["offer"], copy: PackCopy): string {
  const c = copy.offer;
  const lines = [c.title, c.role(offer.title)];
  if (offer.companyName) lines.push(c.company(offer.companyName));
  const location = [offer.city, offer.country].filter(Boolean).join(", ");
  if (location) lines.push(c.location(location));
  if (offer.contractType) lines.push(c.contract(offer.contractType));
  if (offer.durationMonths) lines.push(c.duration(offer.durationMonths));

  lines.push("", c.description, offer.description.trim());
  if (offer.requirements?.trim()) {
    lines.push("", c.requirements, offer.requirements.trim());
  }
  if (offer.companyDescription?.trim()) {
    lines.push("", c.companyPresentation, offer.companyDescription.trim());
  }
  return lines.join("\n");
}

function buildProfileSection(
  profile: ContextPackInput["profile"],
  includeContact: boolean,
  copy: PackCopy
): string {
  const c = copy.profile;
  const lines = [c.title];
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  if (name) lines.push(c.name(name));
  if (profile.location) lines.push(c.location(profile.location));
  if (profile.targetRoles.length > 0) lines.push(c.targetRoles(profile.targetRoles.join(", ")));
  if (profile.targetCountries.length > 0)
    lines.push(c.targetCountries(profile.targetCountries.join(", ")));
  if (profile.skills.length > 0) lines.push(c.skills(profile.skills.join(", ")));
  if (profile.languages.length > 0) lines.push(c.languages(profile.languages.join(", ")));

  if (includeContact) {
    const contact = [
      profile.firstName || profile.lastName ? c.fullName(name) : null,
      profile.phone ? c.phone(profile.phone) : null
    ].filter((line): line is string => line !== null);
    if (contact.length > 0) lines.push("", c.contactTitle, ...contact);
  }

  return lines.length > 1 ? lines.join("\n") : c.empty;
}

function buildResumeSection(resumeData: unknown, copy: PackCopy): string {
  const c = copy.resume;
  const parsed = resumeSchema.safeParse(resumeData ?? undefined);
  if (!parsed.success) {
    return c.unavailable;
  }
  const resume: Resume = parsed.data;
  const lines = [c.title];

  if (resume.summary?.trim()) lines.push("", c.summary, resume.summary.trim());

  if (resume.experiences.length > 0) {
    lines.push("", c.experiences);
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
    lines.push("", c.education);
    for (const edu of resume.education) {
      const head = [edu.degree, edu.field, edu.school].filter(Boolean).join(" — ");
      const meta = [edu.startDate, edu.endDate].filter(Boolean).join(" → ");
      lines.push(`- ${head}${meta ? ` (${meta})` : ""}`);
    }
  }

  if (resume.projects.length > 0) {
    lines.push("", c.projects);
    for (const project of resume.projects) {
      lines.push(
        `- ${project.name}${project.description ? ` : ${project.description.trim()}` : ""}`
      );
    }
  }

  if (resume.languages.length > 0) {
    lines.push(
      "",
      c.languages,
      resume.languages
        .map((lang) => `${lang.language}${lang.level ? ` (${lang.level})` : ""}`)
        .join(", ")
    );
  }

  const skillsAndTools = [...resume.skills, ...resume.tools];
  if (skillsAndTools.length > 0) {
    lines.push("", c.skillsAndTools, skillsAndTools.join(", "));
  }

  return lines.join("\n");
}
