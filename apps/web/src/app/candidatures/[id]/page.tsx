import { getApplicationWorkspace } from "@agentic-cv/db";
import { ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveApplicationDraft, validateApplicationDraft } from "@/features/applications/actions";
import { buildApplicationContextPack } from "@/features/applications/context-pack";
import { ContextPackPanel } from "@/features/applications/context-pack-panel";
import { getCurrentUser } from "@/features/auth/current-user";
import { formatDuration, formatLocation } from "@/features/offers/offer-view";

export const dynamic = "force-dynamic";

type ApplicationWorkspacePageProps = {
  params: Promise<{ id: string }>;
};

const idSchema = z.string().uuid();

const fieldLabelClass = "font-mono text-xs uppercase tracking-[0.06em] text-[var(--faint)]";

export default async function ApplicationWorkspacePage({ params }: ApplicationWorkspacePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(`/candidatures/${id}`)}`);
  }

  if (!idSchema.safeParse(id).success) {
    notFound();
  }

  const workspace = await getApplicationWorkspace({ userId: user.id, applicationId: id });
  if (!workspace) {
    notFound();
  }

  const { offer, artifacts } = workspace;
  const pack = buildApplicationContextPack({ offer, profile: workspace.profile });
  const location = formatLocation(offer.city, offer.country);
  const duration = formatDuration(offer.durationMonths);
  const validated = Boolean(workspace.validatedAt);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="mes-vie" />

      <a
        className="inline-flex items-center gap-2 font-mono text-sm tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground"
        href="/mes-vie"
      >
        ← Mes V.I.E
      </a>

      <header className="grid gap-4 border-b border-border pb-8 pt-5">
        <Eyebrow>Préparer ma candidature</Eyebrow>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em]">
          {offer.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          {offer.companyName ? <Badge variant="accent">{offer.companyName}</Badge> : null}
          {location ? <Badge>{location}</Badge> : null}
          {duration ? <Badge>{duration}</Badge> : null}
          <Badge variant={validated ? "accent" : "default"}>
            {validated ? "Validée" : "Brouillon"}
          </Badge>
        </div>
      </header>

      <div className="grid gap-8 pt-8 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-10">
          <section className="grid gap-4">
            <div className="grid gap-1">
              <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">
                1. Copier le pack de contexte
              </h2>
              <p className="text-sm text-muted-foreground">
                Copie ce pack, ouvre ChatGPT, colle-le et itère jusqu&apos;à obtenir un CV ciblé,
                une lettre et un message qui te conviennent. Aucune coordonnée personnelle
                n&apos;est incluse par défaut.
              </p>
            </div>
            <ContextPackPanel pack={pack} />
          </section>

          <section className="grid gap-4">
            <div className="grid gap-1">
              <h2 className="font-display text-xl font-semibold tracking-[-0.01em]">
                2. Recoller le travail finalisé
              </h2>
              <p className="text-sm text-muted-foreground">
                Colle ici les sorties de ChatGPT. Enregistre un brouillon à tout moment&nbsp;;
                valide quand les trois éléments sont prêts.
              </p>
            </div>

            <form action={saveApplicationDraft} className="grid gap-6">
              <input type="hidden" name="applicationId" value={workspace.id} />

              <div className="grid gap-2">
                <Label htmlFor="chatgptConversationUrl" className={fieldLabelClass}>
                  Lien de la conversation ChatGPT (optionnel)
                </Label>
                <Input
                  id="chatgptConversationUrl"
                  name="chatgptConversationUrl"
                  type="url"
                  placeholder="https://chatgpt.com/c/…"
                  defaultValue={workspace.chatgptConversationUrl ?? ""}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetedResume" className={fieldLabelClass}>
                  CV ciblé
                </Label>
                <Textarea
                  id="targetedResume"
                  name="targetedResume"
                  rows={10}
                  defaultValue={artifacts.targeted_resume.contentText ?? ""}
                  placeholder="Colle ici le CV adapté à cette offre…"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="coverLetter" className={fieldLabelClass}>
                  Lettre de motivation
                </Label>
                <Textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows={10}
                  defaultValue={artifacts.cover_letter.contentText ?? ""}
                  placeholder="Colle ici la lettre de motivation…"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recruiterMessage" className={fieldLabelClass}>
                  Message au recruteur
                </Label>
                <Textarea
                  id="recruiterMessage"
                  name="recruiterMessage"
                  rows={6}
                  defaultValue={artifacts.recruiter_message.contentText ?? ""}
                  placeholder="Colle ici le message à copier dans le formulaire de candidature…"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="outline">
                  Enregistrer le brouillon
                </Button>
                <Button type="submit" variant="primary" formAction={validateApplicationDraft}>
                  Valider la candidature
                </Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="grid h-fit gap-4">
          <Card className="grid gap-3 p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--faint)]">
              Offre
            </h2>
            <p className="text-sm font-medium text-foreground">{offer.title}</p>
            {offer.companyName ? (
              <p className="text-sm text-muted-foreground">{offer.companyName}</p>
            ) : null}
            <Button asChild variant="link" size="sm" className="justify-start px-0">
              <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                Voir l&apos;offre d&apos;origine
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="justify-start px-0">
              <a href="/mes-vie">← Retour à Mes V.I.E</a>
            </Button>
          </Card>
        </aside>
      </div>
    </main>
  );
}
