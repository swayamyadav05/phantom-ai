"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import type { ReactFlowInstance } from "@xyflow/react";

interface ControlBarProps {
  flow: ReactFlowInstance | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

interface BarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function BarButton({ onClick, disabled, title, children }: BarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function ControlBar({ flow, canUndo, canRedo, onUndo, onRedo }: ControlBarProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-surface-border bg-surface px-2 py-1 shadow-lg">
      <BarButton
        title="Zoom out (–)"
        onClick={() => flow?.zoomOut({ duration: 200 })}
      >
        <ZoomOut className="h-4 w-4" />
      </BarButton>

      <BarButton
        title="Fit view"
        onClick={() => flow?.fitView({ duration: 300 })}
      >
        <Maximize2 className="h-4 w-4" />
      </BarButton>

      <BarButton
        title="Zoom in (+)"
        onClick={() => flow?.zoomIn({ duration: 200 })}
      >
        <ZoomIn className="h-4 w-4" />
      </BarButton>

      <div className="mx-1.5 h-4 w-px bg-surface-border" />

      <BarButton
        title="Undo (Ctrl/Cmd+Z)"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 className="h-4 w-4" />
      </BarButton>

      <BarButton
        title="Redo (Ctrl/Cmd+Shift+Z)"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 className="h-4 w-4" />
      </BarButton>
    </div>
  );
}
