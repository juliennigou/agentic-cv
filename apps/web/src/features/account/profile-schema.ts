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

export const profileFormSchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  phone: optionalText(40),
  location: optionalText(120),
  targetRoles: listFromTextarea(20),
  targetCountries: listFromTextarea(30),
  skills: listFromTextarea(80),
  languages: listFromTextarea(30)
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
