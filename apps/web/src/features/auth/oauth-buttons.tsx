import { signInWithOAuth } from "./actions";

const providers = [
  {
    id: "google",
    label: "Continuer avec Google"
  },
  {
    id: "github",
    label: "Continuer avec GitHub"
  }
] as const;

export function OAuthButtons() {
  return (
    <div className="button-stack">
      {providers.map((provider) => (
        <form action={signInWithOAuth} key={provider.id}>
          <input type="hidden" name="provider" value={provider.id} />
          <button className="btn btn-ghost btn-full" type="submit">
            {provider.label}
          </button>
        </form>
      ))}
    </div>
  );
}
