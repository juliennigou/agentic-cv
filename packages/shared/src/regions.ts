/**
 * Taxonomie géographique région → codes pays ISO alpha-2.
 *
 * Les données Business France n'exposent pas de notion de région/continent ;
 * on la fournit ici, indexée sur `raw_data.countryId` (= `job_offers.country_code`).
 * Couvre les 76 pays présents en base. Cas transcontinentaux (TR, MX, AM) :
 * choix pragmatiques, ajustables sans impact technique.
 */

export const REGIONS = {
  europe: {
    label: "Europe",
    codes: [
      "AT",
      "BE",
      "BG",
      "CH",
      "CZ",
      "DE",
      "DK",
      "EE",
      "ES",
      "FI",
      "GB",
      "GR",
      "HU",
      "IE",
      "IT",
      "LU",
      "MD",
      "MT",
      "NL",
      "NO",
      "PL",
      "PT",
      "RO",
      "SE",
      "SI",
      "SK"
    ]
  },
  asie: {
    label: "Asie",
    codes: ["AM", "CN", "HK", "ID", "IN", "JP", "KH", "KR", "MY", "PH", "SG", "TH", "TW", "VN"]
  },
  moyen_orient: {
    label: "Moyen-Orient",
    codes: ["AE", "OM", "QA", "SA", "TR"]
  },
  amerique_nord: {
    label: "Amérique du Nord",
    codes: ["CA", "US", "MX", "PR"]
  },
  amerique_latine: {
    label: "Amérique latine",
    codes: ["AR", "BR", "CL", "CO", "PE"]
  },
  afrique: {
    label: "Afrique",
    codes: [
      "AO",
      "CD",
      "CG",
      "CI",
      "DJ",
      "ET",
      "GA",
      "GN",
      "KE",
      "KM",
      "MA",
      "MG",
      "MR",
      "MU",
      "NG",
      "SN",
      "TG",
      "TN",
      "TZ",
      "UG"
    ]
  },
  oceanie: {
    label: "Océanie",
    codes: ["AU", "NZ"]
  }
} as const satisfies Record<string, { label: string; codes: readonly string[] }>;

export type RegionKey = keyof typeof REGIONS;

/** Liste des régions pour alimenter un select (clé + libellé). */
export function listRegions(): { key: RegionKey; label: string }[] {
  return (Object.keys(REGIONS) as RegionKey[]).map((key) => ({
    key,
    label: REGIONS[key].label
  }));
}

/** Vrai si la chaîne est une clé de région connue. */
export function isRegionKey(value: string): value is RegionKey {
  return value in REGIONS;
}

/** Codes ISO d'une région (tableau vide si clé inconnue). */
export function regionCountryCodes(region: string): string[] {
  return isRegionKey(region) ? [...REGIONS[region].codes] : [];
}
