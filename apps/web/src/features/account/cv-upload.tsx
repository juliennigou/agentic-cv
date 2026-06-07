"use client";

import type { Resume } from "@agentic-cv/shared";
import { useActionState, useEffect, useRef, useState } from "react";

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
      ? "form-error"
      : state.status === "idle"
        ? "muted-text"
        : "form-success";

  return (
    <div className="form-panel">
      <form ref={formRef} action={formAction} className="cv-uploader">
        <div className="cv-uploader-text">
          <span className="cv-uploader-title">
            {hasStoredResume ? "Remplacer le CV" : "Importer un CV"}
          </span>
          <span className="cv-uploader-hint">
            PDF, 5 Mo max · pré-remplit le parcours ci-dessous
          </span>
        </div>

        <div className="cv-uploader-controls">
          <label className="btn btn-ghost cv-file-btn">
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
          <span className="cv-file-name" title={fileName ?? undefined}>
            {fileName ?? "Aucun fichier sélectionné"}
          </span>
          <button className="btn btn-primary" type="submit" disabled={pending || !fileName}>
            {pending ? "Analyse..." : "Analyser"}
          </button>
        </div>

        {storedFile?.url ? (
          <a
            className="cv-view-link"
            href={storedFile.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir le CV déposé ({storedFile.fileName})
          </a>
        ) : null}
      </form>

      {state.message ? <p className={messageClass}>{state.message}</p> : null}

      <div className="divider">Parcours</div>

      <ResumeReviewForm key={reviewKey} resume={reviewResume} />
    </div>
  );
}
