"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
      <div className="mb-4 mt-8 flex items-baseline justify-between gap-4">
        <p className="whitespace-nowrap font-mono text-sm tracking-[0.02em] text-muted-foreground">
          <strong className="text-foreground">{offers.length}</strong> offre
          {offers.length > 1 ? "s" : ""} active{offers.length > 1 ? "s" : ""}
        </p>
        <Select
          value={sort}
          onValueChange={(value) => setSort(value === "date" ? "date" : "relevance")}
        >
          <SelectTrigger className="w-auto min-w-[10rem]" aria-label="Trier les offres affichées">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Pertinence</SelectItem>
            <SelectItem value="date">Plus récentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <OfferList offers={sortedOffers} returnTo={returnTo} />
    </>
  );
}

function OfferList({ offers, returnTo }: { offers: OfferListItem[]; returnTo: string }) {
  if (offers.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
        Aucune offre ne correspond à ta recherche. Élargis les filtres ou modifie les mots-clés.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} returnTo={returnTo} />
      ))}
    </div>
  );
}
