"use client";

import { regionCountryCodes, type RegionKey } from "@agentic-cv/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import type { OfferSearchCriteria } from "./search";
import { OfferResults } from "./offer-sort-select";
import type { OfferListItem } from "./offer-view";

type OfferSearchProps = {
  offers: OfferListItem[];
  criteria: OfferSearchCriteria;
  regions: { key: RegionKey; label: string }[];
  countries: { code: string; name: string }[];
};

// Sentinelle Radix : SelectItem interdit value="" → "all" représente « aucun filtre ».
const ALL = "all";

/**
 * Barre de recherche interactive : champ + selects région/pays (shadcn). La
 * soumission pousse les filtres en query params et la page serveur se re-rend.
 * Le select pays est restreint à la région sélectionnée le cas échéant.
 */
export function OfferSearch({ offers, criteria, regions, countries }: OfferSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(criteria.query);
  const [region, setRegion] = useState<string>(criteria.region ?? ALL);
  const [country, setCountry] = useState<string>(criteria.country ?? ALL);

  const countryOptions = useMemo(() => {
    if (region === ALL) {
      return countries;
    }
    const codes = new Set(regionCountryCodes(region as RegionKey));
    return countries.filter((c) => codes.has(c.code));
  }, [countries, region]);

  function handleRegionChange(value: string) {
    setRegion(value);
    // Si le pays sélectionné n'appartient plus à la région, on le réinitialise.
    if (value !== ALL) {
      const codes = new Set(regionCountryCodes(value as RegionKey));
      if (country !== ALL && !codes.has(country)) {
        setCountry(ALL);
      }
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (region !== ALL) params.set("region", region);
    if (country !== ALL) params.set("country", country);
    const qs = params.toString();
    router.push(qs ? `/offres?${qs}` : "/offres");
  }

  return (
    <section aria-label="Recherche d'offres">
      <form
        className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
        role="search"
        onSubmit={handleSubmit}
      >
        <Input
          type="search"
          aria-label="Rechercher une offre"
          placeholder="Métier, compétence, mission (ex. ingénieur IA)"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <Select value={region} onValueChange={handleRegionChange}>
          <SelectTrigger className="sm:w-[12rem]" aria-label="Filtrer par région">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes les régions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="sm:w-[12rem]" aria-label="Filtrer par pays">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {region !== ALL ? "Tous les pays de la région" : "Tous les pays"}
            </SelectItem>
            {countryOptions.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Rechercher</Button>
      </form>

      <OfferResults
        offers={offers}
        initialSort={criteria.query.length > 0 ? "relevance" : "date"}
      />
    </section>
  );
}
