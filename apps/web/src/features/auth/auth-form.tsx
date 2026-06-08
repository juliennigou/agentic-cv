"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signInWithPassword, signUpWithPassword } from "./actions";

type AuthFormProps = {
  mode: "signin" | "signup";
  next?: string;
};

export function AuthForm({ mode, next = "/compte" }: AuthFormProps) {
  const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState(action, {
    status: "idle" as const,
    message: null
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const submitLabel = mode === "signin" ? "Se connecter" : "Créer le compte";

  return (
    <form className="grid gap-5" action={formAction}>
      <input type="hidden" name="next" value={next} />

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="auth-email" className="text-muted-foreground">
            Email
          </Label>
          <Input
            id="auth-email"
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
        </div>

        <div className="grid gap-2">
          <Label htmlFor="auth-password" className="text-muted-foreground">
            Mot de passe
          </Label>
          <div className="relative">
            <Input
              id="auth-password"
              name="password"
              type={passwordVisible ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              required
              placeholder="8 caractères minimum"
              className="pr-24"
            />
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-pressed={passwordVisible}
              aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {passwordVisible ? "Masquer" : "Afficher"}
            </Button>
          </div>
        </div>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-[var(--danger)]"
              : "text-sm text-[var(--success)]"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "En cours..." : submitLabel}
      </Button>
    </form>
  );
}
