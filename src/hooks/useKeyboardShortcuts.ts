"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

interface KeyboardShortcutsOptions {
  flow: ReactFlowInstance | null;
  undo: () => void;
  redo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({ flow, undo, redo }: KeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      const meta = e.metaKey || e.ctrlKey;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        flow?.zoomIn({ duration: 200 });
        return;
      }

      if (e.key === "-") {
        e.preventDefault();
        flow?.zoomOut({ duration: 200 });
        return;
      }

      if (meta && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
        return;
      }

      if (meta && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }

      if (meta && e.key === "y") {
        e.preventDefault();
        redo();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flow, undo, redo]);
}
