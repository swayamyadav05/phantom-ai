"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { useProjectActions } from "@/hooks/use-project-actions";

interface ProjectDialogsProps {
  dialogs: ReturnType<typeof useProjectActions>;
}

export function ProjectDialogs({ dialogs }: ProjectDialogsProps) {
  const {
    dialog,
    name,
    roomIdPreview,
    isLoading,
    close,
    setName,
    handleSubmit,
  } = dialogs;

  return (
    <>
      <Dialog
        open={dialog.type === "create"}
        onOpenChange={(open) => {
          if (!open) close();
        }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && !isLoading) handleSubmit();
              }}
              autoFocus
              className="text-foreground"
            />
            <div className="flex items-center gap-1.5 text-xs text-copy-faint">
              <span>Room ID:</span>
              <span className="font-mono">{roomIdPreview || "—"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog.type === "rename"}
        onOpenChange={(open) => {
          if (!open) close();
        }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            {dialog.project && (
              <DialogDescription>
                Renaming &ldquo;{dialog.project.name}&rdquo;
              </DialogDescription>
            )}
          </DialogHeader>
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !isLoading) handleSubmit();
            }}
            className="text-foreground"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Renaming…" : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog.type === "delete"}
        onOpenChange={(open) => {
          if (!open) close();
        }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            {dialog.project && (
              <DialogDescription>
                This will permanently delete &ldquo;
                {dialog.project.name}&rdquo;. This cannot be undone.
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
