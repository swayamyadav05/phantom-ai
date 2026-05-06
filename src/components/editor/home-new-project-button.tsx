"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/context/project-actions";

export function HomeNewProjectButton() {
  const { openCreate } = useProjectActions();
  return (
    <Button onClick={openCreate} className="gap-2">
      <Plus className="h-5 w-5" />
      New Project
    </Button>
  );
}
