"use client";

import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { updateJobApplicationStatus } from "./actions";
import type { OfferApplicationStatus } from "./offer-view";
import { OFFER_STATUS_LABELS, TRACKED_OFFER_STATUSES } from "./status";

type StatusSelectProps = {
  offerId: string;
  status: OfferApplicationStatus;
  returnTo: string;
};

// Select interactif qui soumet l'action serveur dès qu'on change de statut.
// L'input caché `status` est synchronisé pour préserver le contrat du form.
export function StatusSelect({ offerId, status, returnTo }: StatusSelectProps) {
  const [value, setValue] = useState<OfferApplicationStatus>(status);
  const formRef = useRef<HTMLFormElement>(null);
  const skipInitial = useRef(true);

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }
    formRef.current?.requestSubmit();
  }, [value]);

  return (
    <form ref={formRef} action={updateJobApplicationStatus}>
      <input type="hidden" name="jobOfferId" value={offerId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="status" value={value} />
      <Select value={value} onValueChange={(next) => setValue(next as OfferApplicationStatus)}>
        <SelectTrigger className="h-9" aria-label="Changer le statut de candidature">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRACKED_OFFER_STATUSES.map((option) => (
            <SelectItem key={option} value={option}>
              {OFFER_STATUS_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
