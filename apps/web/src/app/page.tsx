import { OfferSearch } from "@/features/offers/offer-search";

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">Agentic CV</div>
        <nav className="nav" aria-label="Navigation principale">
          <a href="/offres">Offres</a>
          <a href="/compte">Compte</a>
        </nav>
      </header>

      <section className="hero">
        <h1>Offres V.I.E propres, filtrables et pretes pour candidater.</h1>
        <p>
          Premier jalon: scraper Business France, normaliser les offres et construire une base fiable avant
          d'ajouter les comptes, documents et generations IA.
        </p>
      </section>

      <OfferSearch />
    </main>
  );
}

