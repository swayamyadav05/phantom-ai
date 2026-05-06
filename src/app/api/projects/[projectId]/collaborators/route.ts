import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CollaboratorData {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

async function enrichCollaborators(emails: string[]): Promise<CollaboratorData[]> {
  if (emails.length === 0) return [];
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ emailAddress: emails });

  const byEmail = new Map<string, { name: string | null; avatarUrl: string | null }>();
  for (const user of users) {
    const primary = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    );
    if (primary) {
      byEmail.set(primary.emailAddress, {
        name: user.fullName ?? null,
        avatarUrl: user.imageUrl ?? null,
      });
    }
  }

  return emails.map((email) => ({
    email,
    name: byEmail.get(email)?.name ?? null,
    avatarUrl: byEmail.get(email)?.avatarUrl ?? null,
  }));
}

async function resolveProjectAccess(
  projectId: string,
  userId: string,
): Promise<{ project: { id: string; ownerId: string } | null; isOwner: boolean }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });
  if (!project) return { project: null, isOwner: false };
  return { project, isOwner: project.ownerId === userId };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { project, isOwner } = await resolveProjectAccess(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isOwner) {
    const { userId: clerkUserId } = await auth();
    const user = await (await clerkClient()).users.getUser(clerkUserId!);
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? null;
    const isCollaborator =
      primaryEmail !== null &&
      (await prisma.projectCollaborator.findUnique({
        where: { projectId_email: { projectId, email: primaryEmail } },
        select: { id: true },
      })) !== null;
    if (!isCollaborator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });

  const collaborators = await enrichCollaborators(rows.map((r) => r.email));

  return NextResponse.json({ collaborators, isOwner });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const { project, isOwner } = await resolveProjectAccess(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a collaborator" }, { status: 409 });
  }

  const collaborator = await prisma.projectCollaborator.create({
    data: { projectId, email },
  });

  const [enriched] = await enrichCollaborators([email]);
  return NextResponse.json({ ...collaborator, ...enriched }, { status: 201 });
}
