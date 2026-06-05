"use client";

import type { UserProfileDetail } from "@agentic-cv/db";
import { useActionState } from "react";

import { updateProfile } from "./actions";

type ProfileFormProps = {
  profile: UserProfileDetail;
};

function listToTextareaValue(items: string[]) {
  return items.join("\n");
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, {
    status: "idle" as const,
    message: null
  });

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

      <div className="form-grid two-columns">
        <label className="form-field">
          <span>Rôles visés</span>
          <textarea
            className="field textarea-field"
            name="targetRoles"
            defaultValue={listToTextareaValue(profile.targetRoles)}
            placeholder={"Business developer\nData analyst\nChef de projet"}
          />
        </label>

        <label className="form-field">
          <span>Pays visés</span>
          <textarea
            className="field textarea-field"
            name="targetCountries"
            defaultValue={listToTextareaValue(profile.targetCountries)}
            placeholder={"Canada\nEspagne\nÉtats-Unis"}
          />
        </label>

        <label className="form-field">
          <span>Compétences</span>
          <textarea
            className="field textarea-field"
            name="skills"
            defaultValue={listToTextareaValue(profile.skills)}
            placeholder={"Prospection B2B\nExcel\nSQL"}
          />
        </label>

        <label className="form-field">
          <span>Langues</span>
          <textarea
            className="field textarea-field"
            name="languages"
            defaultValue={listToTextareaValue(profile.languages)}
            placeholder={"Français natif\nAnglais C1\nEspagnol B2"}
          />
        </label>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer le profil"}
      </button>
    </form>
  );
}
