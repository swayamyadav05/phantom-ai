"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/context/project-actions";

export default function EditorPage() {
  const { openCreate } = useProjectActions();

  return (
    <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-copy-primary">
            Create a project or open an existing one
          </h2>
          <p className="text-sm text-copy-muted">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-5 w-5" />
          New Project
        </Button>
      </div>
    </div>
  );
}
