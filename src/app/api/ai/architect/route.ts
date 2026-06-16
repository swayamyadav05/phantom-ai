import { NextRequest, NextResponse } from "next/server";
import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";
import { prisma } from "@/lib/prisma";
import {
  findProjectByRoomId,
  getClerkIdentity,
  userCanAccessProject,
} from "@/lib/project-access";
import type { architectAgentTask } from "@/trigger/architect-agent";
import { isAiChatMessage, type AiChatMessage } from "@/types/tasks";

export const runtime = "nodejs";

const HISTORY_LIMIT = 10;

interface ArchitectRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
  history?: unknown;
}

export async function POST(request: NextRequest) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request
    .json()
    .catch(() => ({}))) as ArchitectRequestBody;
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

  const history: AiChatMessage[] = Array.isArray(body.history)
    ? body.history.filter(isAiChatMessage).slice(-HISTORY_LIMIT)
    : [];

  const handle = await tasks.trigger<typeof architectAgentTask>(
    "architect-agent",
    { prompt, roomId, history },
  );

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
