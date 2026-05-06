import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Project } from "@/types/project";

export async function getEditorProjects(): Promise<{ owned: Project[]; shared: Project[] }> {
  const user = await currentUser();
  if (!user) return { owned: [], shared: [] };

  const emails = user.emailAddresses.map((e) => e.emailAddress);

  const [ownedRaw, collaborations] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true },
    }),
    emails.length > 0
      ? prisma.projectCollaborator.findMany({
          where: { email: { in: emails } },
          include: { project: { select: { id: true, name: true, slug: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const owned: Project[] = ownedRaw.map((p) => ({ ...p, isOwned: true }));
  const shared: Project[] = collaborations.map((c) => ({ ...c.project, isOwned: false }));

  return { owned, shared };
}
