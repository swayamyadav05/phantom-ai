import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface ClerkIdentity {
  userId: string;
  primaryEmail: string | null;
}

export async function getClerkIdentity(): Promise<ClerkIdentity | null> {
  const user = await currentUser();
  if (!user) return null;
  const primary =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
    user.emailAddresses[0];
  return {
    userId: user.id,
    primaryEmail: primary?.emailAddress ?? null,
  };
}

export interface AccessibleProject {
  id: string;
  name: string;
  slug: string | null;
  ownerId: string;
}

export async function findProjectByRoomId(
  roomId: string,
): Promise<AccessibleProject | null> {
  return prisma.project.findFirst({
    where: { OR: [{ slug: roomId }, { id: roomId }] },
    select: { id: true, name: true, slug: true, ownerId: true },
  });
}

export async function userCanAccessProject(
  identity: ClerkIdentity,
  project: AccessibleProject,
): Promise<boolean> {
  if (project.ownerId === identity.userId) return true;
  if (!identity.primaryEmail) return false;
  const collaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId: project.id,
        email: identity.primaryEmail,
      },
    },
    select: { id: true },
  });
  return collaborator !== null;
}
