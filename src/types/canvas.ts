import type { Edge, Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode" as const;
export const CANVAS_EDGE_TYPE = "canvasEdge" as const;

export const NODE_COLORS = [
  { fill: "#1A202C", text: "#E2E8F0" },
  { fill: "#0F2942", text: "#38BDF8" },
  { fill: "#281A38", text: "#C084FC" },
  { fill: "#3B1D16", text: "#FB923C" },
  { fill: "#3F1519", text: "#F87171" },
  { fill: "#3A142A", text: "#F472B6" },
  { fill: "#0C2E21", text: "#4ADE80" },
  { fill: "#0B2A30", text: "#2DD4BF" },
] as const;

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type CanvasNodeType = typeof CANVAS_NODE_TYPE;
export type CanvasEdgeType = typeof CANVAS_EDGE_TYPE;
export type CanvasNodeColor = (typeof NODE_COLORS)[number]["fill"];
export type CanvasNodeShape = (typeof NODE_SHAPES)[number];

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: CanvasNodeColor;
  shape: CanvasNodeShape;
}

export type CanvasEdgeData = Record<string, never>;

export type CanvasNode = Node<CanvasNodeData, CanvasNodeType>;
export type CanvasEdge = Edge<CanvasEdgeData, CanvasEdgeType>;
