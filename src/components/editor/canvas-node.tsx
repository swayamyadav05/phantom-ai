"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode } from "@/types/canvas";

function getTextColor(fill: string): string {
  const match = NODE_COLORS.find((c) => c.fill === fill);
  return match?.text ?? "#E2E8F0";
}

export function CanvasNodeRenderer({ data }: NodeProps<CanvasNode>) {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div
        className="flex h-full w-full items-center justify-center rounded-md border border-surface-border text-sm"
        style={{
          backgroundColor: data.color,
          color: getTextColor(data.color),
        }}
      >
        <span className="select-none px-2 text-center">{data.label}</span>
      </div>
    </>
  );
}
