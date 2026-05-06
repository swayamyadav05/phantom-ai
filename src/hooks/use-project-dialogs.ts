"use client";

import { useState, useCallback } from "react";
import type { Project } from "@/types/project";

type DialogType = "create" | "rename" | "delete" | null;

export interface ProjectDialogState {
  type: DialogType;
  project: Project | null;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<ProjectDialogState>({ type: null, project: null });
  const [name, setNameState] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = toSlug(name);

  const openCreate = useCallback(() => {
    setNameState("");
    setDialog({ type: "create", project: null });
  }, []);

  const openRename = useCallback((project: Project) => {
    setNameState(project.name);
    setDialog({ type: "rename", project });
  }, []);

  const openDelete = useCallback((project: Project) => {
    setDialog({ type: "delete", project });
  }, []);

  const close = useCallback(() => {
    setDialog({ type: null, project: null });
    setNameState("");
    setIsLoading(false);
  }, []);

  const setName = useCallback((value: string) => {
    setNameState(value);
  }, []);

  const handleSubmit = useCallback(() => {
    close();
  }, [close]);

  return { dialog, name, slug, isLoading, openCreate, openRename, openDelete, close, setName, handleSubmit };
}
