import { NextRequest, NextResponse } from "next/server";
import {
  ensureLiveblocksRoom,
  getCursorColorForUser,
  getLiveblocksClient,
} from "@/lib/liveblocks";
import {
  findProjectByRoomId,
  getClerkIdentity,
  userCanAccessProject,
} from "@/lib/project-access";

export const runtime = "nodejs";

interface LiveblocksAuthRequestBody {
  room?: unknown;
  projectId?: unknown;
}

function getRequestedProjectId(body: LiveblocksAuthRequestBody): string {
  if (typeof body.room === "string") return body.room;
  if (typeof body.projectId === "string") return body.projectId;
  return "";
}

export async function POST(request: NextRequest) {
  const identity = await getClerkIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as LiveblocksAuthRequestBody;
  const requestedProjectId = getRequestedProjectId(body).trim();
  if (!requestedProjectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  const project = await findProjectByRoomId(requestedProjectId);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (project.id !== requestedProjectId) {
    return NextResponse.json(
      { error: "Liveblocks room must use the project ID" },
      { status: 400 },
    );
  }

  const allowed = await userCanAccessProject(identity, project);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureLiveblocksRoom(project.id);

  const session = getLiveblocksClient().prepareSession(identity.userId, {
    userInfo: {
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      cursorColor: getCursorColorForUser(identity.userId),
    },
  });

  session.allow(project.id, session.FULL_ACCESS);

  const { body: responseBody, status } = await session.authorize();

  return new NextResponse(responseBody, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
