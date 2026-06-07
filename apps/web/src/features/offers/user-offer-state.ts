import "server-only";

import { listUserOfferStates } from "@agentic-cv/db";

import type { OfferUserState } from "./offer-view";

type OfferWithId = {
  id: string;
};

export async function withUserOfferStates<TOffer extends OfferWithId>(
  offers: TOffer[],
  userId: string | null | undefined
): Promise<Array<TOffer & { userState: OfferUserState }>> {
  if (!userId || offers.length === 0) {
    return offers.map((offer) => ({
      ...offer,
      userState: {
        favorite: false,
        applicationStatus: null
      }
    }));
  }

  const states = await listUserOfferStates(
    userId,
    offers.map((offer) => offer.id)
  );
  const stateByOfferId = new Map(states.map((state) => [state.jobOfferId, state]));

  return offers.map((offer) => {
    const state = stateByOfferId.get(offer.id);

    return {
      ...offer,
      userState: {
        favorite: state?.favorite ?? false,
        applicationStatus: state?.applicationStatus ?? null
      }
    };
  });
}
