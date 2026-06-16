import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findProjectByRoomId,
  getClerkIdentity,
  userCanAccessProject,
} from "@/lib/project-access";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await findProjectByRoomId(projectId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await userCanAccessProject(identity, project);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const specs = await prisma.projectSpec.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      createdAt: spec.createdAt,
      filename: `spec-${spec.id}.md`,
    })),
  });
}
