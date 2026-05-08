import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  findProjectByRoomId,
  getClerkIdentity,
  userCanAccessProject,
} from "@/lib/project-access";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
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

  const raw = await request.text();
  try {
    JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  try {
    const blob = await put(`canvas/${project.id}.json`, raw, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });

    await prisma.project.update({
      where: { id: project.id },
      data: { canvasJsonPath: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json(
      { error: "Failed to save canvas" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
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

  const record = await prisma.project.findUnique({
    where: { id: project.id },
    select: { canvasJsonPath: true },
  });

  if (!record?.canvasJsonPath) {
    return NextResponse.json(null);
  }

  const res = await fetch(record.canvasJsonPath, {
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch canvas" },
      { status: 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
