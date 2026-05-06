import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; email: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).toLowerCase();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  });
  if (!collaborator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.projectCollaborator.delete({
    where: { projectId_email: { projectId, email } },
  });

  return new NextResponse(null, { status: 204 });
}
