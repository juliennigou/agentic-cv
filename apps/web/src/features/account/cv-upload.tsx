"use client";

import type { Resume } from "@agentic-cv/shared";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { uploadResume, type UploadResumeState } from "./cv-actions";
import { ResumeReviewForm } from "./resume-review-form";

type CvUploadProps = {
  /** CV courant (stocké ou vide) servant à initialiser le formulaire de relecture. */
  initialResume: Resume;
  hasStoredResume: boolean;
  /** Dernier PDF déposé, avec URL signée temporaire pour le consulter. */
  storedFile: { fileName: string; url: string | null } | null;
};

const initialUploadState: UploadResumeState = {
  status: "idle",
  message: null,
  resume: null
};

export function CvUpload({ initialResume, hasStoredResume, storedFile }: CvUploadProps) {
  const [state, formAction, pending] = useActionState(uploadResume, initialUploadState);
  const [reviewResume, setReviewResume] = useState<Resume>(initialResume);
  const [fileName, setFileName] = useState<string | null>(null);
  // Force le remount du formulaire de relecture à chaque nouveau parsing
  // (son état interne est initialisé depuis les props).
  const [reviewKey, setReviewKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.resume) {
      setReviewResume(state.resume);
      setReviewKey((key) => key + 1);
      setFileName(null);
      formRef.current?.reset();
    }
  }, [state.resume]);

  const messageClass =
    state.status === "error"
      ? "text-sm text-[var(--danger)]"
      : state.status === "idle"
        ? "text-sm text-muted-foreground"
        : "text-sm text-[var(--success)]";

  return (
    <div className="grid gap-5">
      <Card className="p-5">
        <form ref={formRef} action={formAction} className="grid gap-4">
          <div className="grid gap-1">
            <span className="font-mono text-sm font-medium tracking-[0.02em] text-foreground">
              {hasStoredResume ? "Remplacer le CV" : "Importer un CV"}
            </span>
            <span className="font-mono text-xs tracking-[0.02em] text-[var(--faint)]">
              PDF, 5 Mo max · pré-remplit le parcours ci-dessous
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
              <span>Choisir un fichier</span>
              <input
                className="sr-only"
                type="file"
                name="file"
                accept="application/pdf"
                required
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
              />
            </label>
            <span
              className="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground"
              title={fileName ?? undefined}
            >
              {fileName ?? "Aucun fichier sélectionné"}
            </span>
            <Button type="submit" disabled={pending || !fileName}>
              {pending ? "Analyse..." : "Analyser"}
            </Button>
          </div>

          {storedFile?.url ? (
            <a
              className="font-mono text-sm text-[var(--accent)] underline-offset-4 hover:underline"
              href={storedFile.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir le CV déposé ({storedFile.fileName})
            </a>
          ) : null}
        </form>
      </Card>

      {state.message ? <p className={messageClass}>{state.message}</p> : null}

      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.08em] text-[var(--faint)]">
        <span>Parcours</span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <ResumeReviewForm key={reviewKey} resume={reviewResume} />
    </div>
  );
}
