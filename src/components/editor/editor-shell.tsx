"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectActionsContext } from "@/context/project-actions";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

interface EditorShellProps {
  children: React.ReactNode;
}

export function EditorShell({ children }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  return (
    <ProjectActionsContext.Provider
      value={{
        openCreate: dialogs.openCreate,
        openRename: dialogs.openRename,
        openDelete: dialogs.openDelete,
      }}
    >
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCreateProject={dialogs.openCreate}
        onRenameProject={dialogs.openRename}
        onDeleteProject={dialogs.openDelete}
      />
      <ProjectDialogs dialogs={dialogs} />
      <main className="pt-12">{children}</main>
    </ProjectActionsContext.Provider>
  );
}
