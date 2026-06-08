"use client";

import type { UserProfileDetail } from "@agentic-cv/db";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { updateIdentity, type ProfileActionState } from "./actions";

type IdentityFormProps = {
  profile: UserProfileDetail;
};

const initialState: ProfileActionState = { status: "idle", message: null };

const labelClass = "font-mono text-sm tracking-[0.02em] text-muted-foreground";

export function IdentityForm({ profile }: IdentityFormProps) {
  const [state, formAction, pending] = useActionState(updateIdentity, initialState);

  return (
    <form className="grid gap-5" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Prénom</span>
          <Input name="firstName" defaultValue={profile.firstName ?? ""} />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Nom</span>
          <Input name="lastName" defaultValue={profile.lastName ?? ""} />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Téléphone</span>
          <Input name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone ?? ""} />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Localisation</span>
          <Input
            name="location"
            autoComplete="address-level2"
            defaultValue={profile.location ?? ""}
            placeholder="Paris, Lyon, Montréal..."
          />
        </label>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-[var(--danger)]"
              : "text-sm text-[var(--success)]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="justify-self-start" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
