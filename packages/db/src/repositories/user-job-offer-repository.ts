import type { ApplicationStatus } from "@prisma/client";

import { prisma } from "../client";
import { getOrCreateUserProfile } from "./user-profile-repository";

const trackedOfferSelect = {
  id: true,
  title: true,
  sourceUrl: true,
  companyName: true,
  country: true,
  city: true,
  contractType: true,
  durationMonths: true,
  description: true,
  publishedAt: true
} as const;

export type UserJobOfferState = {
  jobOfferId: string;
  favorite: boolean;
  favoriteCreatedAt: Date | null;
  applicationStatus: ApplicationStatus | null;
};

export type TrackedJobOffer = {
  favoriteCreatedAt: Date;
  applicationStatus: ApplicationStatus | null;
  offer: {
    id: string;
    title: string;
    sourceUrl: string;
    companyName: string | null;
    country: string | null;
    city: string | null;
    contractType: string | null;
    durationMonths: number | null;
    description: string;
    publishedAt: Date | null;
  };
};

export async function listUserOfferStates(
  userId: string,
  jobOfferIds: string[]
): Promise<UserJobOfferState[]> {
  if (jobOfferIds.length === 0) {
    return [];
  }

  const uniqueOfferIds = Array.from(new Set(jobOfferIds));
  const [savedJobs, applications] = await Promise.all([
    prisma.savedJob.findMany({
      where: {
        userId,
        jobOfferId: { in: uniqueOfferIds }
      },
      select: {
        jobOfferId: true,
        createdAt: true
      }
    }),
    prisma.application.findMany({
      where: {
        userId,
        jobOfferId: { in: uniqueOfferIds }
      },
      select: {
        jobOfferId: true,
        status: true
      }
    })
  ]);

  const savedByOfferId = new Map(savedJobs.map((savedJob) => [savedJob.jobOfferId, savedJob]));
  const applicationByOfferId = new Map(
    applications.map((application) => [application.jobOfferId, application])
  );

  return uniqueOfferIds.map((jobOfferId) => {
    const savedJob = savedByOfferId.get(jobOfferId);
    const application = applicationByOfferId.get(jobOfferId);

    return {
      jobOfferId,
      favorite: Boolean(savedJob),
      favoriteCreatedAt: savedJob?.createdAt ?? null,
      applicationStatus: application?.status ?? null
    };
  });
}

export async function getUserOfferState(
  userId: string,
  jobOfferId: string
): Promise<UserJobOfferState> {
  const [state] = await listUserOfferStates(userId, [jobOfferId]);

  return (
    state ?? {
      jobOfferId,
      favorite: false,
      favoriteCreatedAt: null,
      applicationStatus: null
    }
  );
}

export async function listUserFavoriteJobOffers(userId: string): Promise<TrackedJobOffer[]> {
  const savedJobs = await prisma.savedJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      jobOfferId: true,
      createdAt: true,
      jobOffer: {
        select: trackedOfferSelect
      }
    }
  });

  const applications = await prisma.application.findMany({
    where: {
      userId,
      jobOfferId: { in: savedJobs.map((savedJob) => savedJob.jobOfferId) }
    },
    select: {
      jobOfferId: true,
      status: true
    }
  });

  const applicationByOfferId = new Map(
    applications.map((application) => [application.jobOfferId, application])
  );

  return savedJobs.map((savedJob) => ({
    favoriteCreatedAt: savedJob.createdAt,
    applicationStatus: applicationByOfferId.get(savedJob.jobOfferId)?.status ?? null,
    offer: savedJob.jobOffer
  }));
}

export async function saveJobForUser(userId: string, jobOfferId: string): Promise<void> {
  await getOrCreateUserProfile({ userId });

  await prisma.$transaction([
    prisma.savedJob.upsert({
      where: {
        userId_jobOfferId: {
          userId,
          jobOfferId
        }
      },
      update: {},
      create: {
        userId,
        jobOfferId
      }
    }),
    prisma.application.upsert({
      where: {
        userId_jobOfferId: {
          userId,
          jobOfferId
        }
      },
      update: {},
      create: {
        userId,
        jobOfferId,
        status: "unread"
      }
    })
  ]);
}

export async function removeSavedJobForUser(userId: string, jobOfferId: string): Promise<void> {
  await prisma.savedJob.deleteMany({
    where: {
      userId,
      jobOfferId
    }
  });
}

export async function setUserJobApplicationStatus(input: {
  userId: string;
  jobOfferId: string;
  status: ApplicationStatus;
}): Promise<void> {
  await getOrCreateUserProfile({ userId: input.userId });

  await prisma.application.upsert({
    where: {
      userId_jobOfferId: {
        userId: input.userId,
        jobOfferId: input.jobOfferId
      }
    },
    update: {
      status: input.status,
      appliedAt: input.status === "applied" ? new Date() : undefined
    },
    create: {
      userId: input.userId,
      jobOfferId: input.jobOfferId,
      status: input.status,
      appliedAt: input.status === "applied" ? new Date() : undefined
    }
  });
}
