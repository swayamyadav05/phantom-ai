"use client";

import { Component, type ReactNode, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import {
  StarterTemplatesProvider,
  useStarterTemplates,
} from "@/components/editor/starter-templates-context";
import {
  CanvasSaveProvider,
  useCanvasSave,
} from "@/components/editor/canvas-save-context";
import { ProjectActionsContext } from "@/context/project-actions";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/types/project";

interface EditorShellProps {
  children: React.ReactNode;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

interface LiveblocksConnectionBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface LiveblocksConnectionBoundaryState {
  hasError: boolean;
}

class LiveblocksConnectionBoundary extends Component<
  LiveblocksConnectionBoundaryProps,
  LiveblocksConnectionBoundaryState
> {
  state: LiveblocksConnectionBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LiveblocksConnectionBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function ConnectionErrorFallback() {
  return (
    <div className="flex h-[calc(100vh-3rem)] w-full items-center justify-center bg-base">
      <div className="rounded-lg border border-surface-border bg-elevated px-5 py-4 text-center shadow-lg">
        <p className="text-sm font-medium text-copy-primary">
          Canvas connection failed
        </p>
        <p className="mt-1 text-xs text-copy-muted">
          Refresh the workspace to reconnect to the shared room.
        </p>
      </div>
    </div>
  );
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

export function EditorShell(props: EditorShellProps) {
  return (
    <StarterTemplatesProvider>
      <CanvasSaveProvider>
        <EditorShellInner {...props} />
      </CanvasSaveProvider>
    </StarterTemplatesProvider>
  );
}

function EditorShellInner({
  children,
  ownedProjects,
  sharedProjects,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Open the AI Workspace by default so it's visible as soon as a workspace
  // loads (incl. a freshly created project) without an extra click.
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { setOpen: setStarterTemplatesOpen } = useStarterTemplates();
  const { status: saveStatus, manualSave } = useCanvasSave();
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
        onOpenStarterTemplates: () => setStarterTemplatesOpen(true),
        saveStatus,
        onSave: () => {
          void manualSave();
        },
      }
    : undefined;

  const shellChrome = (
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
            projectId={currentProject.id}
            roomId={currentProject.id}
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

  if (!currentProject) return shellChrome;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <LiveblocksConnectionBoundary
        key={currentProject.id}
        fallback={<ConnectionErrorFallback />}
      >
        <RoomProvider
          id={currentProject.id}
          initialPresence={{ cursor: null, thinking: false }}
        >
          {shellChrome}
        </RoomProvider>
      </LiveblocksConnectionBoundary>
    </LiveblocksProvider>
  );
}
