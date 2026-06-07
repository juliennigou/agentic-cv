import type { UserDocumentType } from "@prisma/client";

import { prisma } from "../client";

export type CreateUserDocumentInput = {
  userId: string;
  type: UserDocumentType;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string | null;
};

const userDocumentSelect = {
  id: true,
  userId: true,
  type: true,
  fileName: true,
  storagePath: true,
  mimeType: true,
  sizeBytes: true,
  checksum: true,
  createdAt: true
} as const;

export type UserDocumentDetail = Awaited<ReturnType<typeof createUserDocument>>;

export async function createUserDocument(input: CreateUserDocumentInput) {
  return prisma.userDocument.create({
    data: {
      userId: input.userId,
      type: input.type,
      fileName: input.fileName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      checksum: input.checksum ?? null
    },
    select: userDocumentSelect
  });
}

export async function listUserDocuments(userId: string) {
  return prisma.userDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: userDocumentSelect
  });
}

/** Dernier CV de base déposé par l'utilisateur, ou null. */
export async function getLatestBaseResume(userId: string) {
  return prisma.userDocument.findFirst({
    where: { userId, type: "base_resume" },
    orderBy: { createdAt: "desc" },
    select: userDocumentSelect
  });
}
