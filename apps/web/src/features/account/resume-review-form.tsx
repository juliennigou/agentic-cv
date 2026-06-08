"use client";

import type {
  Resume,
  ResumeEducation,
  ResumeExperience,
  ResumeExtracurricular,
  ResumeLanguage,
  ResumeProject
} from "@agentic-cv/shared";
import { useActionState, useState } from "react";

import { Eyebrow } from "@/components/eyebrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { saveResumeProfile, type SaveResumeState } from "./cv-actions";

type ResumeReviewFormProps = {
  resume: Resume;
};

// Champ étiqueté : <label> englobant pour l'association implicite (mono/muted).
function Field({
  label,
  full = false,
  children
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("grid gap-2", full && "sm:col-span-2")}>
      <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function listToTextareaValue(items: string[]) {
  return items.join("\n");
}

function textareaValueToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const emptyExperience: ResumeExperience = { title: "" };
const emptyEducation: ResumeEducation = { school: "" };
const emptyProject: ResumeProject = { name: "" };
const emptyExtracurricular: ResumeExtracurricular = { title: "" };
const emptyLanguage: ResumeLanguage = { language: "" };

export function ResumeReviewForm({ resume: initialResume }: ResumeReviewFormProps) {
  const [resume, setResume] = useState<Resume>(initialResume);
  const [state, formAction, pending] = useActionState<SaveResumeState, FormData>(
    saveResumeProfile,
    {
      status: "idle",
      message: null
    }
  );

  function updateList<K extends keyof Resume>(
    key: K,
    index: number,
    patch: Partial<Resume[K] extends Array<infer T> ? T : never>
  ) {
    setResume((prev) => {
      const list = [...(prev[key] as unknown[])];
      list[index] = { ...(list[index] as object), ...patch };
      return { ...prev, [key]: list } as Resume;
    });
  }

  function addItem<K extends keyof Resume>(key: K, empty: unknown) {
    setResume((prev) => ({ ...prev, [key]: [...(prev[key] as unknown[]), empty] }) as Resume);
  }

  function removeItem<K extends keyof Resume>(key: K, index: number) {
    setResume(
      (prev) =>
        ({ ...prev, [key]: (prev[key] as unknown[]).filter((_, i) => i !== index) }) as Resume
    );
  }

  return (
    <form className="grid gap-5" action={formAction}>
      <input type="hidden" name="resume" value={JSON.stringify(resume)} />

      <Field label="Résumé / accroche">
        <Textarea
          value={resume.summary ?? ""}
          onChange={(event) => setResume((prev) => ({ ...prev, summary: event.target.value }))}
        />
      </Field>

      <fieldset className="m-0 grid gap-4 border-0 p-0 sm:grid-cols-2">
        <Field label="Prénom">
          <Input
            value={resume.contact?.firstName ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, firstName: event.target.value }
              }))
            }
          />
        </Field>
        <Field label="Nom">
          <Input
            value={resume.contact?.lastName ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, lastName: event.target.value }
              }))
            }
          />
        </Field>
        <Field label="Téléphone">
          <Input
            value={resume.contact?.phone ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, phone: event.target.value }
              }))
            }
          />
        </Field>
        <Field label="Localisation">
          <Input
            value={resume.contact?.location ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, location: event.target.value }
              }))
            }
          />
        </Field>
      </fieldset>

      <Separator />

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow>Expériences</Eyebrow>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addItem("experiences", { ...emptyExperience })}
          >
            + Ajouter
          </Button>
        </div>
        {resume.experiences.map((item, index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            <Field label="Poste">
              <Input
                value={item.title}
                onChange={(event) => updateList("experiences", index, { title: event.target.value })}
              />
            </Field>
            <Field label="Entreprise">
              <Input
                value={item.company ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { company: event.target.value })
                }
              />
            </Field>
            <Field label="Début">
              <Input
                value={item.startDate ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { startDate: event.target.value })
                }
              />
            </Field>
            <Field label="Fin">
              <Input
                value={item.endDate ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { endDate: event.target.value })
                }
              />
            </Field>
            <Field label="Description" full>
              <Textarea
                value={item.description ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { description: event.target.value })
                }
              />
            </Field>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="justify-self-start"
              onClick={() => removeItem("experiences", index)}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow>Formation</Eyebrow>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addItem("education", { ...emptyEducation })}
          >
            + Ajouter
          </Button>
        </div>
        {resume.education.map((item, index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            <Field label="École / établissement">
              <Input
                value={item.school}
                onChange={(event) => updateList("education", index, { school: event.target.value })}
              />
            </Field>
            <Field label="Diplôme">
              <Input
                value={item.degree ?? ""}
                onChange={(event) => updateList("education", index, { degree: event.target.value })}
              />
            </Field>
            <Field label="Début">
              <Input
                value={item.startDate ?? ""}
                onChange={(event) =>
                  updateList("education", index, { startDate: event.target.value })
                }
              />
            </Field>
            <Field label="Fin">
              <Input
                value={item.endDate ?? ""}
                onChange={(event) =>
                  updateList("education", index, { endDate: event.target.value })
                }
              />
            </Field>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="justify-self-start"
              onClick={() => removeItem("education", index)}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow>Projets</Eyebrow>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addItem("projects", { ...emptyProject })}
          >
            + Ajouter
          </Button>
        </div>
        {resume.projects.map((item, index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom">
              <Input
                value={item.name}
                onChange={(event) => updateList("projects", index, { name: event.target.value })}
              />
            </Field>
            <Field label="Lien">
              <Input
                value={item.link ?? ""}
                onChange={(event) => updateList("projects", index, { link: event.target.value })}
              />
            </Field>
            <Field label="Description" full>
              <Textarea
                value={item.description ?? ""}
                onChange={(event) =>
                  updateList("projects", index, { description: event.target.value })
                }
              />
            </Field>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="justify-self-start"
              onClick={() => removeItem("projects", index)}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow>Extra-scolaire</Eyebrow>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addItem("extracurriculars", { ...emptyExtracurricular })}
          >
            + Ajouter
          </Button>
        </div>
        {resume.extracurriculars.map((item, index) => (
          <div key={index} className="grid gap-4">
            <Field label="Titre">
              <Input
                value={item.title}
                onChange={(event) =>
                  updateList("extracurriculars", index, { title: event.target.value })
                }
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={item.description ?? ""}
                onChange={(event) =>
                  updateList("extracurriculars", index, { description: event.target.value })
                }
              />
            </Field>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="justify-self-start"
              onClick={() => removeItem("extracurriculars", index)}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow>Langues</Eyebrow>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addItem("languages", { ...emptyLanguage })}
          >
            + Ajouter
          </Button>
        </div>
        {resume.languages.map((item, index) => (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            <Field label="Langue">
              <Input
                value={item.language}
                onChange={(event) => updateList("languages", index, { language: event.target.value })}
              />
            </Field>
            <Field label="Niveau">
              <Input
                value={item.level ?? ""}
                onChange={(event) => updateList("languages", index, { level: event.target.value })}
              />
            </Field>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="justify-self-start"
              onClick={() => removeItem("languages", index)}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </section>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Compétences (une par ligne)">
          <Textarea
            value={listToTextareaValue(resume.skills)}
            onChange={(event) =>
              setResume((prev) => ({ ...prev, skills: textareaValueToList(event.target.value) }))
            }
          />
        </Field>
        <Field label="Logiciels / outils (un par ligne)">
          <Textarea
            value={listToTextareaValue(resume.tools)}
            onChange={(event) =>
              setResume((prev) => ({ ...prev, tools: textareaValueToList(event.target.value) }))
            }
          />
        </Field>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-[var(--danger)]"
              : "text-sm text-[var(--success)]"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="justify-self-start" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer le profil"}
      </Button>
    </form>
  );
}
