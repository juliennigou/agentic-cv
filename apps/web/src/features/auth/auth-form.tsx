"use client";

import { useActionState, useState } from "react";

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
  const [passwordVisible, setPasswordVisible] = useState(false);
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
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="prenom.nom@email.com"
          />
        </label>

        <label className="form-field">
          <span>Mot de passe</span>
          <div className="field-affix">
            <input
              className="field field-affix-input"
              name="password"
              type={passwordVisible ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              required
              placeholder="8 caractères minimum"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-pressed={passwordVisible}
              aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {passwordVisible ? "Masquer" : "Afficher"}
            </button>
          </div>
        </label>
      </div>

      {state.message ? (
        <p
          className={state.status === "error" ? "form-error" : "form-success"}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button className="btn btn-primary btn-full" type="submit" disabled={pending}>
        {pending ? "En cours..." : submitLabel}
      </button>
    </form>
  );
}
