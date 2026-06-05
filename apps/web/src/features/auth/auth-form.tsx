"use client";

import { useActionState } from "react";

import { signInWithPassword, signUpWithPassword } from "./actions";

type AuthFormProps = {
  mode: "signin" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState(action, {
    status: "idle" as const,
    message: null
  });
  const submitLabel = mode === "signin" ? "Se connecter" : "Créer le compte";

  return (
    <form className="form-panel" action={formAction}>
      <div className="form-grid">
        <label className="form-field">
          <span>Email</span>
          <input
            className="field"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="prenom.nom@email.com"
          />
        </label>

        <label className="form-field">
          <span>Mot de passe</span>
          <input
            className="field"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={8}
            required
            placeholder="8 caractères minimum"
          />
        </label>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "En cours..." : submitLabel}
      </button>
    </form>
  );
}
