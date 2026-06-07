"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { OfferCard } from "./offer-card";
import type { OfferListItem } from "./offer-view";

type OfferSort = "relevance" | "date";

export function OfferResults({
  offers,
  initialSort
}: {
  offers: OfferListItem[];
  initialSort: OfferSort;
}) {
  const [sort, setSort] = useState<OfferSort>(initialSort);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`;
  const sortedOffers = useMemo(() => {
    if (sort === "relevance") {
      return offers;
    }

    return [...offers].sort((left, right) => {
      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return rightTime - leftTime;
    });
  }, [offers, sort]);

  return (
    <>
      <div className="section-head">
        <p className="count">
          <strong>{offers.length}</strong> offre{offers.length > 1 ? "s" : ""} active
          {offers.length > 1 ? "s" : ""}
        </p>
        <select
          className="field"
          aria-label="Trier les offres affichées"
          value={sort}
          onChange={(event) => setSort(event.currentTarget.value === "date" ? "date" : "relevance")}
        >
          <option value="relevance">Pertinence</option>
          <option value="date">Plus récentes</option>
        </select>
      </div>

      <OfferList offers={sortedOffers} returnTo={returnTo} />
    </>
  );
}

function OfferList({ offers, returnTo }: { offers: OfferListItem[]; returnTo: string }) {
  if (offers.length === 0) {
    return (
      <div className="empty-state">
        Aucune offre ne correspond à ta recherche. Élargis les filtres ou modifie les mots-clés.
      </div>
    );
  }

  return (
    <div className="offer-list">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} returnTo={returnTo} />
      ))}
    </div>
  );
}
