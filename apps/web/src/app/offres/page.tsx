import { OfferSearch } from "@/features/offers/offer-search";

export default function OffersPage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/">
          Agentic CV
        </a>
      </header>
      <OfferSearch />
    </main>
  );
}
