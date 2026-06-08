import { Button } from "@/components/ui/button";

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

export function OAuthButtons({ next = "/compte" }: { next?: string }) {
  return (
    <div className="grid gap-3">
      {providers.map((provider) => (
        <form action={signInWithOAuth} key={provider.id}>
          <input type="hidden" name="provider" value={provider.id} />
          <input type="hidden" name="next" value={next} />
          <Button variant="outline" type="submit" className="w-full">
            {provider.label}
          </Button>
        </form>
      ))}
    </div>
  );
}
