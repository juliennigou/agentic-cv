export type BusinessFranceSearchPayload = {
  limit: number;
  skip: number;
  activitySectorId: number[];
  missionsTypesIds: number[];
  missionsDurations: number[];
  geographicZones: number[];
  countriesIds: number[];
  studiesLevelId: number[];
  companiesSizes: number[];
  specializationsIds: number[];
  entreprisesIds: number[];
  missionStartDate: string | null;
  query: string | null;
};

export type BusinessFranceSearchResponse = {
  result?: BusinessFranceApiOfferSummary[];
  count?: number;
};

export type BusinessFranceApiOfferSummary = {
  id?: number;
};

export type BusinessFranceApiOfferDetail = {
  id?: number;
  reference?: string;
  organizationName?: string;
  missionTitle?: string;
  missionDuration?: number;
  missionType?: string;
  missionTypeEn?: string;
  organizationPresentation?: string;
  cityName?: string;
  cityNameEn?: string;
  missionDescription?: string;
  creationDate?: string;
  missionStartDate?: string;
  missionEndDate?: string;
  startBroadcastDate?: string;
  endBroadcastDate?: string;
  missionProfile?: string;
  countryId?: string;
  countryName?: string;
  countryNameEn?: string;
  indemnite?: number;
  teleworkingAvailable?: boolean;
  rawSearchItem?: BusinessFranceApiOfferSummary;
};
