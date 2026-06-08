"use client";

import type { UserProfileDetail } from "@agentic-cv/db";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { updatePreferences, type ProfileActionState } from "./actions";

type PreferencesFormProps = {
  profile: UserProfileDetail;
};

function listToTextareaValue(items: string[]) {
  return items.join("\n");
}

const initialState: ProfileActionState = { status: "idle", message: null };

const labelClass = "font-mono text-sm tracking-[0.02em] text-muted-foreground";

export function PreferencesForm({ profile }: PreferencesFormProps) {
  const [state, formAction, pending] = useActionState(updatePreferences, initialState);

  return (
    <form className="grid gap-5" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Rôles visés</span>
          <Textarea
            name="targetRoles"
            defaultValue={listToTextareaValue(profile.targetRoles)}
            placeholder={"Business developer\nData analyst\nChef de projet"}
          />
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Pays visés</span>
          <Textarea
            name="targetCountries"
            defaultValue={listToTextareaValue(profile.targetCountries)}
            placeholder={"Canada\nEspagne\nÉtats-Unis"}
          />
        </label>
      </div>

      <p className="text-sm leading-snug text-muted-foreground">
        Ces préférences serviront à t'alerter quand une nouvelle offre correspond à ton profil.
      </p>

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
