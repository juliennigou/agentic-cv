import { getLatestBaseResume, getOrCreateUserProfile } from "@agentic-cv/db";
import { createEmptyResume, resumeSchema, type Resume } from "@agentic-cv/shared";
import { redirect } from "next/navigation";

import { CvUpload } from "@/features/account/cv-upload";
import { getCurrentUser } from "@/features/auth/current-user";
import { createUserDocumentSignedUrl } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Valide le CV stocké (Json) pour le passer typé au composant client. */
function parseStoredResume(value: unknown): Resume | null {
  if (value === null || value === undefined) {
    return null;
  }
  const result = resumeSchema.safeParse(value);
  return result.success ? result.data : null;
}

export default async function CvTabPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const profile = await getOrCreateUserProfile({ userId: user.id });
  const storedResume = parseStoredResume(profile.resumeData);

  const latestFile = await getLatestBaseResume(user.id);
  const storedFile = latestFile
    ? {
        fileName: latestFile.fileName,
        url: await createUserDocumentSignedUrl(latestFile.storagePath)
      }
    : null;

  return (
    <section className="account-section">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">Mon CV</span>
          <h2>CV &amp; parcours</h2>
        </div>
      </div>

      <p className="muted-text">
        Dépose ton CV (PDF) : on en extrait automatiquement formation, expériences, projets, langues
        et compétences. Vérifie puis enregistre — tu peux aussi tout saisir à la main.
      </p>

      <CvUpload
        initialResume={storedResume ?? createEmptyResume()}
        hasStoredResume={storedResume !== null}
        storedFile={storedFile}
      />
    </section>
  );
}
