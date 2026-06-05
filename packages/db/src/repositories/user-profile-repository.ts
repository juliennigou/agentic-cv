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
