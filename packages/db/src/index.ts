export { prisma } from "./client";
export { PrismaJobOfferRepository } from "./repositories/job-offer-repository";
export {
  listOffersNeedingEmbedding,
  setOfferEmbedding,
  type OfferNeedingEmbedding
} from "./repositories/job-offer-embedding-repository";
export {
  listOffersNeedingStructuring,
  setOfferStructured,
  type OfferNeedingStructuring
} from "./repositories/job-offer-structuring-repository";
export {
  searchJobOffers,
  debugSearchJobOffers,
  listActiveOfferCountries,
  type SearchJobOffersParams,
  type JobOfferSearchResult,
  type JobOfferSearchDebugResult,
  type OfferCountry
} from "./repositories/job-offer-search-repository";
export {
  getJobOfferById,
  listActiveJobOffers,
  type JobOfferDetail,
  type JobOfferListItem
} from "./repositories/job-offer-read";
export {
  getOrCreateUserProfile,
  updateUserProfile,
  saveUserResume,
  type UserProfileDetail,
  type UserProfileInput,
  type UserProfileUpdateInput,
  type SaveResumeInput
} from "./repositories/user-profile-repository";
export {
  listProfilesNeedingEmbedding,
  setProfileEmbedding,
  type ProfileNeedingEmbedding
} from "./repositories/user-profile-embedding-repository";
export {
  upsertJobOfferMatches,
  listRecentMatchesForUser,
  type RecentMatch,
  type ListRecentMatchesOptions
} from "./repositories/job-offer-match-repository";
export {
  createUserDocument,
  listUserDocuments,
  getLatestBaseResume,
  type CreateUserDocumentInput,
  type UserDocumentDetail
} from "./repositories/user-document-repository";
export {
  getUserOfferState,
  listUserFavoriteJobOffers,
  listUserOfferStates,
  removeSavedJobForUser,
  saveJobForUser,
  setUserJobApplicationStatus,
  type TrackedJobOffer,
  type UserJobOfferState
} from "./repositories/user-job-offer-repository";
export {
  acquireScrapeLock,
  completeScrapeRun,
  createScrapeRun,
  releaseScrapeLock
} from "./repositories/scrape-run-repository";
export {
  APPLICATION_ARTIFACT_KINDS,
  createOrGetApplicationWorkspace,
  getApplicationWorkspace,
  saveApplicationDraft,
  validateApplicationWorkspace,
  type ApplicationWorkspace,
  type ApplicationWorkspaceArtifact,
  type SaveApplicationDraftInput,
  type ValidateApplicationWorkspaceInput
} from "./repositories/application-workspace-repository";
