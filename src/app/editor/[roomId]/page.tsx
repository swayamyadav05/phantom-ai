import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceCanvas } from "@/components/editor/workspace-canvas";
import {
  findProjectByRoomId,
  getClerkIdentity,
  userCanAccessProject,
} from "@/lib/project-access";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function ProjectWorkspacePage({ params }: Props) {
  const { roomId } = await params;

  const identity = await getClerkIdentity();
  if (!identity) redirect("/sign-in");

  const project = await findProjectByRoomId(roomId);
  if (!project) return <AccessDenied />;

  const allowed = await userCanAccessProject(identity, project);
  if (!allowed) return <AccessDenied />;

  return <WorkspaceCanvas roomId={project.id} />;
}
