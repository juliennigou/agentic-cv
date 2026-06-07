import type { Prisma } from "@prisma/client";

import type { Resume } from "@agentic-cv/shared";

import { prisma } from "../client";

export type UserProfileInput = {
  userId: string;
};

export type UserProfileUpdateInput = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  location?: string | null;
  targetRoles?: string[];
  targetCountries?: string[];
  skills?: string[];
  languages?: string[];
};

/** Champs écrits lors de la complétion du profil depuis un CV parsé. */
export type SaveResumeInput = {
  resume: Resume;
  skills: string[];
  languages: string[];
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  location?: string | null;
};

export type UserProfileDetail = Awaited<ReturnType<typeof getOrCreateUserProfile>>;

const userProfileSelect = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  phone: true,
  location: true,
  targetRoles: true,
  targetCountries: true,
  skills: true,
  languages: true,
  resumeData: true,
  createdAt: true,
  updatedAt: true
} as const;

export async function getOrCreateUserProfile(input: UserProfileInput) {
  return prisma.userProfile.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId
    },
    update: {},
    select: userProfileSelect
  });
}

export async function updateUserProfile(userId: string, input: UserProfileUpdateInput) {
  return prisma.userProfile.update({
    where: { userId },
    data: input,
    select: userProfileSelect
  });
}

/**
 * Écrit le CV structuré sur le profil et synchronise les champs plats
 * (skills/languages, contact) dérivés du CV. Le cast est nécessaire car Prisma
 * type `Json` via `InputJsonValue` ; la forme est garantie par `resumeSchema`.
 */
export async function saveUserResume(userId: string, input: SaveResumeInput) {
  return prisma.userProfile.update({
    where: { userId },
    data: {
      resumeData: input.resume as unknown as Prisma.InputJsonValue,
      skills: input.skills,
      languages: input.languages,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      location: input.location
    },
    select: userProfileSelect
  });
}
