"use client";

import { createContext, useContext } from "react";
import type { Project } from "@/types/project";

interface ProjectActionsContextValue {
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
}

export const ProjectActionsContext = createContext<ProjectActionsContextValue | null>(null);

export function useProjectActions(): ProjectActionsContextValue {
  const ctx = useContext(ProjectActionsContext);
  if (!ctx) throw new Error("useProjectActions must be inside ProjectActionsContext.Provider");
  return ctx;
}
