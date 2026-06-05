import { listActiveJobOffers } from "@agentic-cv/db";

import { SiteHeader } from "@/components/site-header";
import { OfferSearch } from "@/features/offers/offer-search";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const offers = await listActiveJobOffers(50);

  return (
    <main className="page-shell">
      <SiteHeader active="offres" />

      <section className="hero" style={{ paddingBottom: "var(--space-2)" }}>
        <span className="eyebrow">Toutes les offres</span>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Offres V.I.E</h1>
        <p>
          Recherche par mot-clé, filtre par pays et trie par date pour trouver l'offre qui te
          correspond.
        </p>
      </section>

      <OfferSearch offers={offers} />
    </main>
  );
}
