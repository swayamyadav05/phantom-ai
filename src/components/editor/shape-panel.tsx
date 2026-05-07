"use client";

import { useCallback } from "react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  Square,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CanvasNodeShape } from "@/types/canvas";

export const CANVAS_SHAPE_DRAG_TYPE = "application/canvas-shape";

export interface ShapeDragPayload {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}

interface ShapeItem {
  shape: CanvasNodeShape;
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
}

const SHAPES: ShapeItem[] = [
  { shape: "rectangle", label: "Rectangle", icon: Square, width: 160, height: 80 },
  { shape: "diamond", label: "Diamond", icon: Diamond, width: 120, height: 120 },
  { shape: "circle", label: "Circle", icon: Circle, width: 80, height: 80 },
  { shape: "pill", label: "Pill", icon: Pill, width: 160, height: 60 },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder, width: 100, height: 120 },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon, width: 100, height: 100 },
];

export function ShapePanel() {
  const onDragStart = useCallback(
    (e: React.DragEvent, payload: ShapeDragPayload) => {
      e.dataTransfer.setData(CANVAS_SHAPE_DRAG_TYPE, JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  return (
    <div className="flex items-center gap-1 rounded-full border border-surface-border bg-elevated px-3 py-2 shadow-lg">
      {SHAPES.map(({ shape, label, icon: Icon, width, height }) => (
        <button
          key={shape}
          draggable
          onDragStart={(e) => onDragStart(e, { shape, width, height })}
          title={label}
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-copy-muted transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
