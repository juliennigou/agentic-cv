import { listActiveOfferCountries } from "@agentic-cv/db";
import { listRegions } from "@agentic-cv/shared";

import { Eyebrow } from "@/components/eyebrow";
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
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="offres" />

      <section className="grid gap-5 pb-2 pt-10">
        <Eyebrow>Toutes les offres</Eyebrow>
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-[-0.01em]">
          Offres V.I.E
        </h1>
        <p className="max-w-[64ch] text-lg leading-normal text-muted-foreground">
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
