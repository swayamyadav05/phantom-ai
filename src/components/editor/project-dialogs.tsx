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
import type { useProjectDialogs } from "@/hooks/use-project-dialogs";

interface ProjectDialogsProps {
  dialogs: ReturnType<typeof useProjectDialogs>;
}

export function ProjectDialogs({ dialogs }: ProjectDialogsProps) {
  const {
    dialog,
    name,
    slug,
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
              autoFocus
              className="text-foreground"
            />
            <div className="flex items-center gap-1.5 text-xs text-copy-faint">
              <span>Slug:</span>
              <span className="font-mono">{slug || "—"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || !slug || isLoading}>
              Create
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
              if (
                e.key === "Enter" &&
                name.trim() &&
                slug &&
                !isLoading
              )
                handleSubmit();
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
              disabled={!name.trim() || !slug || isLoading}>
              Rename
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
