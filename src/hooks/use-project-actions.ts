"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Project } from "@/types/project";

type DialogType = "create" | "rename" | "delete" | null;

interface DialogState {
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

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export function useProjectActions() {
  const router = useRouter();
  const params = useParams();
  const [dialog, setDialog] = useState<DialogState>({
    type: null,
    project: null,
  });
  const [name, setNameState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suffix, setSuffix] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const slug = toSlug(name);
  const roomIdPreview = slug ? `${slug}-${suffix}` : "";

  const openCreate = useCallback(() => {
    setSuffix(shortSuffix());
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

  const handleSubmit = useCallback(async () => {
    if (dialog.type === "create") {
      if (!name.trim()) return;
      setIsLoading(true);
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        });
        if (!res.ok) throw new Error("Failed to create project");
        const project = (await res.json()) as {
          id: string;
          slug: string | null;
        };
        close();
        router.push(`/editor/${project.slug ?? project.id}`);
      } catch {
        setIsLoading(false);
        setError("Something went wrong. Please try again.");
      }
    } else if (dialog.type === "rename" && dialog.project) {
      if (!name.trim()) return;
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${dialog.project.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
          },
        );
        if (!res.ok) throw new Error("Failed to rename project");
        close();
        router.refresh();
      } catch {
        setIsLoading(false);
        setError("Something went wrong. Please try again.");
      }
    } else if (dialog.type === "delete" && dialog.project) {
      setIsLoading(true);
      const targetId = dialog.project.id;
      try {
        const res = await fetch(`/api/projects/${targetId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete project");
        const rawSlug = params?.slug;
        const activeSlug = Array.isArray(rawSlug)
          ? rawSlug[0]
          : (rawSlug ?? null);
        close();
        if (activeSlug && activeSlug === dialog.project.slug) {
          router.push("/editor");
        } else {
          router.refresh();
        }
      } catch {
        setIsLoading(false);
        setError("Something went wrong. Please try again.");
      }
    }
  }, [dialog, name, close, router, params]);

  return {
    dialog,
    name,
    slug,
    roomIdPreview,
    isLoading,
    error,
    openCreate,
    openRename,
    openDelete,
    close,
    setName,
    handleSubmit,
  };
}
