import { z } from "zod";

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : null));
}

function listFromTextarea(maxItems: number) {
  return z
    .string()
    .max(2_000)
    .transform((value) =>
      value
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, maxItems)
    );
}

/** Onglet « Profil » : identité & contact. */
export const identitySchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  phone: optionalText(40),
  location: optionalText(120)
});

/** Onglet « Recherche » : préférences pour les futures alertes. */
export const preferencesSchema = z.object({
  targetRoles: listFromTextarea(20),
  targetCountries: listFromTextarea(30)
});

export type IdentityFormData = z.infer<typeof identitySchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
