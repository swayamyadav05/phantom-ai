"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasNodeShape } from "@/types/canvas";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

const PREVIEW_WIDTH = 180;
const PREVIEW_HEIGHT = 110;
const PREVIEW_PADDING = 8;

interface NodeBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  shape: CanvasNodeShape;
}

function getStrokeForFill(fill: string): string {
  return NODE_COLORS.find((c) => c.fill === fill)?.text ?? "#94a3b8";
}

function buildPreview(template: CanvasTemplate) {
  if (template.nodes.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of template.nodes) {
    const w = node.width ?? 80;
    const h = node.height ?? 60;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const innerW = PREVIEW_WIDTH - PREVIEW_PADDING * 2;
  const innerH = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;
  const boundsW = Math.max(maxX - minX, 1);
  const boundsH = Math.max(maxY - minY, 1);
  const scale = Math.min(innerW / boundsW, innerH / boundsH);
  const offsetX =
    PREVIEW_PADDING + (innerW - boundsW * scale) / 2 - minX * scale;
  const offsetY =
    PREVIEW_PADDING + (innerH - boundsH * scale) / 2 - minY * scale;

  const tx = (x: number) => x * scale + offsetX;
  const ty = (y: number) => y * scale + offsetY;

  const boxes: NodeBox[] = template.nodes.map((node: CanvasNode) => {
    const w = (node.width ?? 80) * scale;
    const h = (node.height ?? 60) * scale;
    return {
      id: node.id,
      x: tx(node.position.x),
      y: ty(node.position.y),
      w,
      h,
      fill: node.data.color,
      stroke: getStrokeForFill(node.data.color),
      shape: node.data.shape,
    };
  });

  const centers = new Map<string, { x: number; y: number }>();
  for (const b of boxes) {
    centers.set(b.id, { x: b.x + b.w / 2, y: b.y + b.h / 2 });
  }

  const lines = template.edges
    .map((edge) => {
      const s = centers.get(edge.source);
      const t = centers.get(edge.target);
      if (!s || !t) return null;
      return { id: edge.id, x1: s.x, y1: s.y, x2: t.x, y2: t.y };
    })
    .filter(
      (
        l,
      ): l is {
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
      } => l !== null,
    );

  return { boxes, lines };
}

function PreviewShape({ box }: { box: NodeBox }) {
  const sw = 1;
  const { x, y, w, h, fill, stroke, shape } = box;

  if (shape === "diamond") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    return (
      <polygon
        points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }

  if (shape === "hexagon") {
    const x1 = x + w * 0.25;
    const x2 = x + w * 0.75;
    const cy = y + h / 2;
    return (
      <polygon
        points={`${x1},${y} ${x2},${y} ${x + w},${cy} ${x2},${y + h} ${x1},${y + h} ${x},${cy}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }

  if (shape === "cylinder") {
    const ry = Math.max(h * 0.15, 2);
    return (
      <g>
        <rect
          x={x}
          y={y + ry}
          width={w}
          height={Math.max(h - ry * 2, 0)}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
        <ellipse
          cx={x + w / 2}
          cy={y + h - ry}
          rx={w / 2}
          ry={ry}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
        <ellipse
          cx={x + w / 2}
          cy={y + ry}
          rx={w / 2}
          ry={ry}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      </g>
    );
  }

  if (shape === "circle") {
    return (
      <ellipse
        cx={x + w / 2}
        cy={y + h / 2}
        rx={w / 2}
        ry={h / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
      />
    );
  }

  const rx = shape === "pill" ? h / 2 : 3;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      ry={rx}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
    />
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const preview = useMemo(() => buildPreview(template), [template]);

  return (
    <div
      className="rounded-lg border border-surface-border bg-base"
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}>
      {preview && (
        <svg
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
          style={{ display: "block" }}>
          {preview.lines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#475569"
              strokeWidth={1}
            />
          ))}
          {preview.boxes.map((box) => (
            <PreviewShape key={box.id} box={box} />
          ))}
        </svg>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate;
  onImport: (template: CanvasTemplate) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-surface-border bg-elevated p-3">
      <div className="flex justify-center">
        <TemplatePreview template={template} />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-copy-primary">
          {template.name}
        </h3>
        <p className="text-xs text-copy-muted leading-relaxed">
          {template.description}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => onImport(template)}>
        Import template
      </Button>
    </div>
  );
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleImport = (template: CanvasTemplate) => {
    onImport(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-4xl">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Replace the current canvas with a pre-built diagram to
            start from.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={handleImport}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
