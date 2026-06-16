import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  findProjectByRoomId,
  getClerkIdentity,
  userCanAccessProject,
} from "@/lib/project-access";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string; specId: string }> },
) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;
  const project = await findProjectByRoomId(projectId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await userCanAccessProject(identity, project);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { id: true, projectId: true, filePath: true },
  });

  if (!spec || spec.projectId !== project.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!spec.filePath) {
    return NextResponse.json(
      { error: "Spec is still being generated" },
      { status: 404 },
    );
  }

  try {
    const blobResult = await get(spec.filePath, { access: "private" });
    if (!blobResult) {
      return NextResponse.json({ error: "Spec file not found" }, { status: 404 });
    }

    const markdown = await new Response(blobResult.stream).text();

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="spec-${spec.id}.md"`,
      },
    });
  } catch (err) {
    console.error("Failed to fetch spec from blob:", err);
    return NextResponse.json(
      { error: "Failed to fetch spec" },
      { status: 502 },
    );
  }
}
