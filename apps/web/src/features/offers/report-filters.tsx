"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { SALARY_FILTER_STEPS } from "./match-report-constants";

type ReportFiltersProps = {
  countries: Array<{ code: string; name: string }>;
  countryCode: string | null;
  minSalary: number | null;
};

const ALL = "all";

// Filtres rapides du rapport : pays + revenu minimal. On écrit dans l'URL (tab
// conservé, page réinitialisée) pour rester aligné avec la pagination serveur.
export function ReportFilters({ countries, countryCode, minSalary }: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: "country" | "minSalary", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Select value={countryCode ?? ALL} onValueChange={(value) => update("country", value)}>
        <SelectTrigger className="w-auto min-w-[11rem]" aria-label="Filtrer par pays">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les pays</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={minSalary ? String(minSalary) : ALL}
        onValueChange={(value) => update("minSalary", value)}
      >
        <SelectTrigger className="w-auto min-w-[11rem]" aria-label="Filtrer par revenu minimal">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les revenus</SelectItem>
          {SALARY_FILTER_STEPS.map((step) => (
            <SelectItem key={step} value={String(step)}>
              ≥ {step.toLocaleString("fr-FR")} €/mois
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
