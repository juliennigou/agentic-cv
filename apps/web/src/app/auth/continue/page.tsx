import { saveJobForUser } from "@agentic-cv/db";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/current-user";
import { getSafeNextPath } from "@/features/auth/redirects";

export const dynamic = "force-dynamic";

type AuthContinuePageProps = {
  searchParams: Promise<{
    favoriteJobOfferId?: string;
    returnTo?: string;
  }>;
};

const favoriteJobOfferIdSchema = z.string().uuid();

export default async function AuthContinuePage({ searchParams }: AuthContinuePageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    const returnTo = getSafeNextPath(resolvedSearchParams.returnTo);

    const favoriteJobOfferIdResult = favoriteJobOfferIdSchema.safeParse(
      resolvedSearchParams.favoriteJobOfferId
    );

    if (favoriteJobOfferIdResult.success) {
      await saveJobForUser(user.id, favoriteJobOfferIdResult.data);
      redirect(returnTo);
    }

    redirect(returnTo);
  }

  redirect("/connexion?error=session_missing");
}
