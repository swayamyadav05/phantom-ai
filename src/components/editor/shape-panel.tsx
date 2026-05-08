"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

const SW = 1.5;
const PAD = 1;
const GHOST_FILL = "#1A202C";
const GHOST_STROKE = "var(--accent-primary)";

function PreviewShape({ shape, width, height }: { shape: CanvasNodeShape; width: number; height: number }) {
  if (shape === "diamond") {
    const cx = width / 2;
    const cy = height / 2;
    const pts = `${cx},${PAD} ${width - PAD},${cy} ${cx},${height - PAD} ${PAD},${cy}`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <polygon points={pts} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={SW} />
      </svg>
    );
  }

  if (shape === "hexagon") {
    const x1 = width * 0.25 + PAD;
    const x2 = width * 0.75 - PAD;
    const cy = height / 2;
    const pts = `${x1},${PAD} ${x2},${PAD} ${width - PAD},${cy} ${x2},${height - PAD} ${x1},${height - PAD} ${PAD},${cy}`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <polygon points={pts} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={SW} />
      </svg>
    );
  }

  if (shape === "cylinder") {
    const capRy = Math.max(Math.round(height * 0.18), 8);
    const rx = width / 2 - PAD;
    const cx = width / 2;
    const top = capRy;
    const bottom = height - capRy;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <rect x={PAD} y={top} width={width - PAD * 2} height={bottom - top} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={SW} />
        <ellipse cx={cx} cy={bottom} rx={rx} ry={capRy} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={SW} />
        <ellipse cx={cx} cy={top} rx={rx} ry={capRy} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={SW} />
      </svg>
    );
  }

  const borderRadius =
    shape === "pill" || shape === "circle" ? "9999px" : "6px";

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: GHOST_FILL,
        border: `${SW}px solid ${GHOST_STROKE}`,
        borderRadius,
        boxSizing: "border-box",
      }}
    />
  );
}

interface DragState {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}

export function ShapePanel() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const onOver = (e: DragEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    const onEnd = () => { setIsDragging(false); setDragging(null); };

    document.addEventListener("dragover", onOver);
    document.addEventListener("dragend", onEnd);
    document.addEventListener("drop", onEnd);

    return () => {
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("dragend", onEnd);
      document.removeEventListener("drop", onEnd);
    };
  }, [isDragging]);

  const onDragStart = useCallback(
    (e: React.DragEvent, payload: ShapeDragPayload) => {
      e.dataTransfer.setData(CANVAS_SHAPE_DRAG_TYPE, JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "copy";

      const blank = document.createElement("canvas");
      blank.width = 1;
      blank.height = 1;
      e.dataTransfer.setDragImage(blank, 0, 0);

      setMousePos({ x: e.clientX, y: e.clientY });
      setDragging({ shape: payload.shape, width: payload.width, height: payload.height });
      setIsDragging(true);
    },
    []
  );

  return (
    <>
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

      {isDragging && dragging &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: mousePos.x - dragging.width / 2,
              top: mousePos.y - dragging.height / 2,
              width: dragging.width,
              height: dragging.height,
              opacity: 0.65,
              pointerEvents: "none",
              zIndex: 9999,
            }}
          >
            <PreviewShape shape={dragging.shape} width={dragging.width} height={dragging.height} />
          </div>,
          document.body
        )
      }
    </>
  );
}
