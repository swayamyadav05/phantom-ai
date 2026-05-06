"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { ProjectActionsContext } from "@/context/project-actions";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/types/project";

interface EditorShellProps {
  children: React.ReactNode;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

function findCurrentProject(
  projects: Project[],
  roomId: string | null,
): Project | null {
  if (!roomId) return null;
  return (
    projects.find((p) => p.slug === roomId || p.id === roomId) ?? null
  );
}

export function EditorShell({
  children,
  ownedProjects,
  sharedProjects,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const actions = useProjectActions();
  const params = useParams();

  const roomId = useMemo(() => {
    const raw = params?.roomId;
    if (Array.isArray(raw)) return raw[0] ?? null;
    return (raw as string | undefined) ?? null;
  }, [params]);

  const currentProject = useMemo(
    () =>
      findCurrentProject(
        [...ownedProjects, ...sharedProjects],
        roomId,
      ),
    [ownedProjects, sharedProjects, roomId],
  );

  const workspace = currentProject
    ? {
        projectName: currentProject.name,
        isAiSidebarOpen,
        onAiSidebarToggle: () => setIsAiSidebarOpen((prev) => !prev),
        onShare: () => setIsShareOpen(true),
      }
    : undefined;

  return (
    <ProjectActionsContext.Provider
      value={{
        openCreate: actions.openCreate,
        openRename: actions.openRename,
        openDelete: actions.openDelete,
      }}
    >
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
        workspace={workspace}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCreateProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        currentProjectId={currentProject?.id ?? null}
      />
      <ProjectDialogs dialogs={actions} />
      <main className="pt-12">{children}</main>
      {currentProject && (
        <>
          <AiSidebar
            isOpen={isAiSidebarOpen}
            onClose={() => setIsAiSidebarOpen(false)}
          />
          <ShareDialog
            open={isShareOpen}
            onOpenChange={setIsShareOpen}
            projectId={currentProject.id}
            projectSlug={currentProject.slug}
          />
        </>
      )}
    </ProjectActionsContext.Provider>
  );
}
