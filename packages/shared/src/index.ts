export const APP_NAME = "Agentic CV";

export type Nullable<T> = T | null;

export { REGIONS, listRegions, isRegionKey, regionCountryCodes, type RegionKey } from "./regions";

export {
  resumeSchema,
  createEmptyResume,
  type Resume,
  type ResumeContact,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeProject,
  type ResumeExtracurricular,
  type ResumeLanguage
} from "./types/resume";
