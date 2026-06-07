import { listActiveOfferCountries } from "@agentic-cv/db";
import { listRegions } from "@agentic-cv/shared";

import { SiteHeader } from "@/components/site-header";
import { OfferSearch } from "@/features/offers/offer-search";
import { parseSearchCriteria, runOfferSearch } from "@/features/offers/search";
import { getCurrentUser } from "@/features/auth/current-user";

export const dynamic = "force-dynamic";

type OffersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const criteria = parseSearchCriteria(await searchParams);
  const user = await getCurrentUser();
  const [offers, countries] = await Promise.all([
    runOfferSearch(criteria, user?.id),
    listActiveOfferCountries()
  ]);

  return (
    <main className="page-shell">
      <SiteHeader active="offres" />

      <section className="hero" style={{ paddingBottom: "var(--space-2)" }}>
        <span className="eyebrow">Toutes les offres</span>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Offres V.I.E</h1>
        <p>
          Recherche par mot-clé (sémantique + plein texte), filtre par région ou pays — seules les
          offres actives sont affichées.
        </p>
      </section>

      <OfferSearch
        offers={offers}
        criteria={criteria}
        regions={listRegions()}
        countries={countries}
      />
    </main>
  );
}
