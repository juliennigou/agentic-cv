"use client";

import type { UserProfileDetail } from "@agentic-cv/db";
import { useActionState } from "react";

import { updateIdentity, type ProfileActionState } from "./actions";

type IdentityFormProps = {
  profile: UserProfileDetail;
};

const initialState: ProfileActionState = { status: "idle", message: null };

export function IdentityForm({ profile }: IdentityFormProps) {
  const [state, formAction, pending] = useActionState(updateIdentity, initialState);

  return (
    <form className="form-panel" action={formAction}>
      <div className="form-grid two-columns">
        <label className="form-field">
          <span>Prénom</span>
          <input className="field" name="firstName" defaultValue={profile.firstName ?? ""} />
        </label>

        <label className="form-field">
          <span>Nom</span>
          <input className="field" name="lastName" defaultValue={profile.lastName ?? ""} />
        </label>

        <label className="form-field">
          <span>Téléphone</span>
          <input
            className="field"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={profile.phone ?? ""}
          />
        </label>

        <label className="form-field">
          <span>Localisation</span>
          <input
            className="field"
            name="location"
            autoComplete="address-level2"
            defaultValue={profile.location ?? ""}
            placeholder="Paris, Lyon, Montréal..."
          />
        </label>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
