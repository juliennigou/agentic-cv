"use client";

import type { UserProfileDetail } from "@agentic-cv/db";
import { useActionState } from "react";

import { updatePreferences, type ProfileActionState } from "./actions";

type PreferencesFormProps = {
  profile: UserProfileDetail;
};

function listToTextareaValue(items: string[]) {
  return items.join("\n");
}

const initialState: ProfileActionState = { status: "idle", message: null };

export function PreferencesForm({ profile }: PreferencesFormProps) {
  const [state, formAction, pending] = useActionState(updatePreferences, initialState);

  return (
    <form className="form-panel" action={formAction}>
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
      </div>

      <p className="muted-text">
        Ces préférences serviront à t'alerter quand une nouvelle offre correspond à ton profil.
      </p>

      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
