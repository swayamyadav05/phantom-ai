"use client";

import { FolderOpen, Plus, Pencil, Trash2, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import type { Project } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: () => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <FolderOpen className="h-8 w-8 text-copy-faint" />
      <p className="text-sm text-copy-muted">{label}</p>
    </div>
  );
}

interface ProjectItemProps {
  project: Project;
  onRename: () => void;
  onDelete: () => void;
}

function ProjectItem({ project, onRename, onDelete }: ProjectItemProps) {
  return (
    <div
      className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-subtle"
      tabIndex={0}>
      <FolderOpen className="h-4 w-4 shrink-0 text-copy-faint" />
      <span className="flex-1 truncate text-sm text-copy-secondary">
        {project.name}
      </span>
      {project.isOwned && (
        <div className="hidden items-center gap-0.5 group-hover:flex group-focus-within:flex">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            aria-label={`Rename ${project.name}`}>
            <Pencil className="h-3.5 w-3.5 text-copy-muted" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${project.name}`}>
            <Trash2 className="h-3.5 w-3.5 text-copy-muted" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  ownedProjects,
  sharedProjects,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-72 flex-col bg-surface border-r border-surface-border transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <span className="text-sm font-semibold text-copy-primary">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close sidebar">
            <PanelLeftClose className="h-5 w-5 text-copy-muted" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-3">
          <Tabs
            defaultValue="my-projects"
            className="flex min-h-0 flex-1 flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects" className="flex-1">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="flex-1">
                Shared
              </TabsTrigger>
            </TabsList>
            <TabsContent value="my-projects" className="overflow-y-auto">
              {ownedProjects.length > 0 ? (
                <div className="flex flex-col gap-0.5 pt-1">
                  {ownedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState label="No projects yet" />
              )}
            </TabsContent>
            <TabsContent value="shared" className="overflow-y-auto">
              {sharedProjects.length > 0 ? (
                <div className="flex flex-col gap-0.5 pt-1">
                  {sharedProjects.map((project) => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      onRename={() => onRenameProject(project)}
                      onDelete={() => onDeleteProject(project)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState label="No shared projects" />
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-surface-border p-3">
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={onCreateProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
