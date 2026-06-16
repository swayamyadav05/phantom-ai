import { NextRequest, NextResponse } from "next/server";
import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import {
  findProjectByRoomId,
  getClerkIdentity,
  userCanAccessProject,
} from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

export const runtime = "nodejs";

interface DesignRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

export async function POST(request: NextRequest) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as DesignRequestBody;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const roomId = typeof body.roomId === "string" ? body.roomId.trim() : "";
  const projectId =
    typeof body.projectId === "string" ? body.projectId.trim() : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 },
    );
  }
  if (!roomId) {
    return NextResponse.json(
      { error: "roomId is required" },
      { status: 400 },
    );
  }
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  const project = await findProjectByRoomId(projectId);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await userCanAccessProject(identity, project);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt,
    roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: "1h",
  });

  return NextResponse.json(
    { runId: handle.id, publicToken },
    { status: 201 },
  );
}
