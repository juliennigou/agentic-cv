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

import { saveResumeProfile, type SaveResumeState } from "./cv-actions";

type ResumeReviewFormProps = {
  resume: Resume;
};

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
    <form className="form-panel" action={formAction}>
      <input type="hidden" name="resume" value={JSON.stringify(resume)} />

      <label className="form-field">
        <span>Résumé / accroche</span>
        <textarea
          className="field textarea-field"
          value={resume.summary ?? ""}
          onChange={(event) => setResume((prev) => ({ ...prev, summary: event.target.value }))}
        />
      </label>

      <fieldset className="form-grid two-columns" style={{ border: "none", padding: 0, margin: 0 }}>
        <label className="form-field">
          <span>Prénom</span>
          <input
            className="field"
            value={resume.contact?.firstName ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, firstName: event.target.value }
              }))
            }
          />
        </label>
        <label className="form-field">
          <span>Nom</span>
          <input
            className="field"
            value={resume.contact?.lastName ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, lastName: event.target.value }
              }))
            }
          />
        </label>
        <label className="form-field">
          <span>Téléphone</span>
          <input
            className="field"
            value={resume.contact?.phone ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, phone: event.target.value }
              }))
            }
          />
        </label>
        <label className="form-field">
          <span>Localisation</span>
          <input
            className="field"
            value={resume.contact?.location ?? ""}
            onChange={(event) =>
              setResume((prev) => ({
                ...prev,
                contact: { ...prev.contact, location: event.target.value }
              }))
            }
          />
        </label>
      </fieldset>

      <div className="divider" />

      <section className="form-field">
        <div className="section-title-row">
          <span className="eyebrow">Expériences</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addItem("experiences", { ...emptyExperience })}
          >
            + Ajouter
          </button>
        </div>
        {resume.experiences.map((item, index) => (
          <div key={index} className="form-grid two-columns">
            <label className="form-field">
              <span>Poste</span>
              <input
                className="field"
                value={item.title}
                onChange={(event) =>
                  updateList("experiences", index, { title: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Entreprise</span>
              <input
                className="field"
                value={item.company ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { company: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Début</span>
              <input
                className="field"
                value={item.startDate ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { startDate: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Fin</span>
              <input
                className="field"
                value={item.endDate ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { endDate: event.target.value })
                }
              />
            </label>
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Description</span>
              <textarea
                className="field textarea-field"
                value={item.description ?? ""}
                onChange={(event) =>
                  updateList("experiences", index, { description: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => removeItem("experiences", index)}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <div className="divider" />

      <section className="form-field">
        <div className="section-title-row">
          <span className="eyebrow">Formation</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addItem("education", { ...emptyEducation })}
          >
            + Ajouter
          </button>
        </div>
        {resume.education.map((item, index) => (
          <div key={index} className="form-grid two-columns">
            <label className="form-field">
              <span>École / établissement</span>
              <input
                className="field"
                value={item.school}
                onChange={(event) => updateList("education", index, { school: event.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Diplôme</span>
              <input
                className="field"
                value={item.degree ?? ""}
                onChange={(event) => updateList("education", index, { degree: event.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Début</span>
              <input
                className="field"
                value={item.startDate ?? ""}
                onChange={(event) =>
                  updateList("education", index, { startDate: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Fin</span>
              <input
                className="field"
                value={item.endDate ?? ""}
                onChange={(event) =>
                  updateList("education", index, { endDate: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => removeItem("education", index)}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <div className="divider" />

      <section className="form-field">
        <div className="section-title-row">
          <span className="eyebrow">Projets</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addItem("projects", { ...emptyProject })}
          >
            + Ajouter
          </button>
        </div>
        {resume.projects.map((item, index) => (
          <div key={index} className="form-grid two-columns">
            <label className="form-field">
              <span>Nom</span>
              <input
                className="field"
                value={item.name}
                onChange={(event) => updateList("projects", index, { name: event.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Lien</span>
              <input
                className="field"
                value={item.link ?? ""}
                onChange={(event) => updateList("projects", index, { link: event.target.value })}
              />
            </label>
            <label className="form-field" style={{ gridColumn: "1 / -1" }}>
              <span>Description</span>
              <textarea
                className="field textarea-field"
                value={item.description ?? ""}
                onChange={(event) =>
                  updateList("projects", index, { description: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => removeItem("projects", index)}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <div className="divider" />

      <section className="form-field">
        <div className="section-title-row">
          <span className="eyebrow">Extra-scolaire</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addItem("extracurriculars", { ...emptyExtracurricular })}
          >
            + Ajouter
          </button>
        </div>
        {resume.extracurriculars.map((item, index) => (
          <div key={index} className="form-grid">
            <label className="form-field">
              <span>Titre</span>
              <input
                className="field"
                value={item.title}
                onChange={(event) =>
                  updateList("extracurriculars", index, { title: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Description</span>
              <textarea
                className="field textarea-field"
                value={item.description ?? ""}
                onChange={(event) =>
                  updateList("extracurriculars", index, { description: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => removeItem("extracurriculars", index)}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <div className="divider" />

      <section className="form-field">
        <div className="section-title-row">
          <span className="eyebrow">Langues</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addItem("languages", { ...emptyLanguage })}
          >
            + Ajouter
          </button>
        </div>
        {resume.languages.map((item, index) => (
          <div key={index} className="form-grid two-columns">
            <label className="form-field">
              <span>Langue</span>
              <input
                className="field"
                value={item.language}
                onChange={(event) =>
                  updateList("languages", index, { language: event.target.value })
                }
              />
            </label>
            <label className="form-field">
              <span>Niveau</span>
              <input
                className="field"
                value={item.level ?? ""}
                onChange={(event) => updateList("languages", index, { level: event.target.value })}
              />
            </label>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => removeItem("languages", index)}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <div className="divider" />

      <div className="form-grid two-columns">
        <label className="form-field">
          <span>Compétences (une par ligne)</span>
          <textarea
            className="field textarea-field"
            value={listToTextareaValue(resume.skills)}
            onChange={(event) =>
              setResume((prev) => ({ ...prev, skills: textareaValueToList(event.target.value) }))
            }
          />
        </label>
        <label className="form-field">
          <span>Logiciels / outils (un par ligne)</span>
          <textarea
            className="field textarea-field"
            value={listToTextareaValue(resume.tools)}
            onChange={(event) =>
              setResume((prev) => ({ ...prev, tools: textareaValueToList(event.target.value) }))
            }
          />
        </label>
      </div>

      {state.message ? (
        <p className={state.status === "error" ? "form-error" : "form-success"}>{state.message}</p>
      ) : null}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer le profil"}
      </button>
    </form>
  );
}
