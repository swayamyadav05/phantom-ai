import { logger, metadata } from "@trigger.dev/sdk";
import type { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas";
import type { DesignAction } from "@/lib/ai/design-plan";

/**
 * Shared canvas-read + canvas-apply logic for every AI agent that can
 * mutate the canvas (full design generation and the conversational
 * architect). Keeping this in one place ensures both agents stay in sync
 * on shape/color validation, layout cursor behavior, and status broadcasts.
 */

export const OPENAI_MODEL_ID = "gpt-5.4-pro";

export const VALID_SHAPES = new Set<CanvasNodeShape>(NODE_SHAPES);
export const VALID_COLORS = new Set<CanvasNodeColor>(
  NODE_COLORS.map((c) => c.fill),
);

export type AiAgentStatus =
  | "started"
  | "processing"
  | "completed"
  | "failed";

export function broadcastStatus(
  client: Liveblocks,
  roomId: string,
  runId: string,
  status: AiAgentStatus,
  message: string,
) {
  return client.broadcastEvent(roomId, {
    kind: "ai-status",
    runId,
    status,
    message,
    at: Date.now(),
  });
}

export function broadcastPresence(
  client: Liveblocks,
  roomId: string,
  runId: string,
  cursor: { x: number; y: number } | null,
  thinking: boolean,
) {
  return client.broadcastEvent(roomId, {
    kind: "ai-presence",
    runId,
    cursor,
    thinking,
  });
}

export async function pushStatus(
  client: Liveblocks,
  roomId: string,
  runId: string,
  status: AiAgentStatus,
  message: string,
) {
  metadata.set("status", status);
  metadata.set("message", message);
  metadata.append("activity", { status, message, at: Date.now() });
  try {
    await broadcastStatus(client, roomId, runId, status, message);
  } catch (err) {
    logger.warn("canvas-apply: broadcast status failed", {
      err: (err as Error).message,
    });
  }
}

export async function describeCanvas(
  client: Liveblocks,
  roomId: string,
): Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }> {
  try {
    type FlowJson = {
      flow?: {
        nodes?: Record<string, CanvasNode>;
        edges?: Record<string, CanvasEdge>;
      };
    };
    const doc = (await client.getStorageDocument(
      roomId,
      "json",
    )) as FlowJson;
    const flow = doc?.flow;
    return {
      nodes: flow?.nodes ? Object.values(flow.nodes) : [],
      edges: flow?.edges ? Object.values(flow.edges) : [],
    };
  } catch (err) {
    logger.warn("canvas-apply: read storage failed", {
      err: (err as Error).message,
    });
    return { nodes: [], edges: [] };
  }
}

export function buildNodeFromAction(
  action: Extract<DesignAction, { type: "addNode" }>,
): CanvasNode {
  const shape: CanvasNodeShape = VALID_SHAPES.has(
    action.shape as CanvasNodeShape,
  )
    ? (action.shape as CanvasNodeShape)
    : "rectangle";
  const color: CanvasNodeColor = VALID_COLORS.has(
    action.color as CanvasNodeColor,
  )
    ? (action.color as CanvasNodeColor)
    : NODE_COLORS[0].fill;
  return {
    id: action.id,
    type: CANVAS_NODE_TYPE,
    position: { x: action.position.x, y: action.position.y },
    data: {
      label: action.label,
      shape,
      color,
    },
    width: action.size.width,
    height: action.size.height,
  };
}

export function buildEdgeFromAction(
  action: Extract<DesignAction, { type: "addEdge" }>,
): CanvasEdge {
  return {
    id: action.id,
    type: CANVAS_EDGE_TYPE,
    source: action.source,
    target: action.target,
    data: action.label ? { label: action.label } : {},
  };
}

export function nodeCenter(node: CanvasNode): {
  x: number;
  y: number;
} {
  const w = node.width ?? 160;
  const h = node.height ?? 80;
  return {
    x: node.position.x + w / 2,
    y: node.position.y + h / 2,
  };
}

// Minimum pixel gap between any two node bounding boxes.
const NODE_PADDING = 24;

interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function nodeBBox(
  pos: { x: number; y: number },
  w: number,
  h: number,
): BBox {
  return { x1: pos.x, y1: pos.y, x2: pos.x + w, y2: pos.y + h };
}

function bboxOverlaps(a: BBox, b: BBox): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

/**
 * Nudges `candidate` right until the node bounding box (with padding) no
 * longer overlaps any node in `occupied`. Falls back to placing below all
 * occupied nodes if still unresolved after 30 iterations.
 */
export function resolvePosition(
  candidate: { x: number; y: number },
  w: number,
  h: number,
  occupied: CanvasNode[],
): { x: number; y: number } {
  if (occupied.length === 0) return candidate;
  let pos = { ...candidate };

  for (let iter = 0; iter < 30; iter++) {
    const padded = nodeBBox(
      { x: pos.x - NODE_PADDING, y: pos.y - NODE_PADDING },
      w + NODE_PADDING * 2,
      h + NODE_PADDING * 2,
    );
    let conflict: CanvasNode | undefined;
    for (const occ of occupied) {
      const ow = occ.width ?? 160;
      const oh = occ.height ?? 80;
      if (bboxOverlaps(padded, nodeBBox(occ.position, ow, oh))) {
        conflict = occ;
        break;
      }
    }
    if (!conflict) return pos;
    // Nudge right past the conflicting node
    pos = {
      x: conflict.position.x + (conflict.width ?? 160) + NODE_PADDING,
      y: pos.y,
    };
  }

  // Fallback: drop below all occupied nodes
  const maxBottom = Math.max(
    0,
    ...occupied.map((n) => n.position.y + (n.height ?? 80)),
  );
  return { x: candidate.x, y: maxBottom + NODE_PADDING };
}

// Time the AI cursor lingers at a target before its mutation lands, so
// remote clients perceive the cursor traveling to the spot rather than
// teleporting after the shape/edge appears.
export const CURSOR_LEAD_MS = 220;

export function actionTargetCursor(
  action: DesignAction,
  trackedNodes: Map<string, CanvasNode>,
): { x: number; y: number } | null {
  switch (action.type) {
    case "addNode":
      return {
        x: action.position.x + action.size.width / 2,
        y: action.position.y + action.size.height / 2,
      };
    case "moveNode": {
      const tracked = trackedNodes.get(action.id);
      const w = tracked?.width ?? 160;
      const h = tracked?.height ?? 80;
      return {
        x: action.position.x + w / 2,
        y: action.position.y + h / 2,
      };
    }
    case "resizeNode": {
      const tracked = trackedNodes.get(action.id);
      if (!tracked) return null;
      return {
        x: tracked.position.x + action.size.width / 2,
        y: tracked.position.y + action.size.height / 2,
      };
    }
    case "updateNodeData":
    case "deleteNode": {
      const tracked = trackedNodes.get(action.id);
      return tracked ? nodeCenter(tracked) : null;
    }
    case "addEdge": {
      const src = trackedNodes.get(action.source);
      const tgt = trackedNodes.get(action.target);
      if (!src || !tgt) return null;
      const a = nodeCenter(src);
      const b = nodeCenter(tgt);
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    case "deleteEdge":
      return null;
  }
}

export interface ApplyActionsParams {
  client: Liveblocks;
  roomId: string;
  runId: string;
  actions: DesignAction[];
  existingNodes: CanvasNode[];
  existingEdges?: CanvasEdge[];
}

export interface ApplyActionsResult {
  applied: number;
  trackedNodes: Map<string, CanvasNode>;
}

/**
 * Applies a plan's actions to the canvas one at a time, leading each
 * mutation with an AI cursor presence broadcast so remote clients see the
 * cursor travel to the target before the shape/edge appears. A single bad
 * action is logged and skipped rather than aborting the whole run.
 */
export async function applyDesignActions({
  client,
  roomId,
  runId,
  actions,
  existingNodes,
}: ApplyActionsParams): Promise<ApplyActionsResult> {
  let applied = 0;
  const trackedNodes = new Map<string, CanvasNode>();
  for (const node of existingNodes) trackedNodes.set(node.id, node);

  for (const action of actions) {
    try {
      const target = actionTargetCursor(action, trackedNodes);
      if (target) {
        try {
          await broadcastPresence(
            client,
            roomId,
            runId,
            target,
            true,
          );
          await new Promise((r) => setTimeout(r, CURSOR_LEAD_MS));
        } catch {
          // non-fatal — proceed with the mutation even if presence broadcast fails
        }
      }

      await mutateFlow<CanvasNode, CanvasEdge>(
        { client, roomId },
        (flow) => {
          switch (action.type) {
            case "addNode": {
              const rawNode = buildNodeFromAction(action);
              const resolvedPos = resolvePosition(
                rawNode.position,
                rawNode.width ?? 160,
                rawNode.height ?? 80,
                Array.from(trackedNodes.values()),
              );
              const node: CanvasNode = {
                ...rawNode,
                position: resolvedPos,
              };
              flow.addNode(node);
              trackedNodes.set(node.id, node);
              break;
            }
            case "moveNode": {
              const tracked = trackedNodes.get(action.id);
              const w = tracked?.width ?? 160;
              const h = tracked?.height ?? 80;
              const others = Array.from(trackedNodes.values()).filter(
                (n) => n.id !== action.id,
              );
              const resolvedPos = resolvePosition(
                action.position,
                w,
                h,
                others,
              );
              flow.updateNode(action.id, (n) => ({
                ...n,
                position: resolvedPos,
              }));
              if (tracked) {
                trackedNodes.set(action.id, {
                  ...tracked,
                  position: resolvedPos,
                });
              }
              break;
            }
            case "resizeNode": {
              flow.updateNode(action.id, (n) => ({
                ...n,
                width: action.size.width,
                height: action.size.height,
              }));
              const tracked = trackedNodes.get(action.id);
              if (tracked) {
                trackedNodes.set(action.id, {
                  ...tracked,
                  width: action.size.width,
                  height: action.size.height,
                });
              }
              break;
            }
            case "updateNodeData": {
              flow.updateNodeData(action.id, (data) => {
                const next = { ...data };
                if (action.label !== undefined)
                  next.label = action.label;
                if (
                  action.color !== undefined &&
                  VALID_COLORS.has(action.color as CanvasNodeColor)
                ) {
                  next.color = action.color as CanvasNodeColor;
                }
                return next;
              });
              break;
            }
            case "deleteNode": {
              flow.removeNode(action.id);
              trackedNodes.delete(action.id);
              break;
            }
            case "addEdge": {
              flow.addEdge(buildEdgeFromAction(action));
              break;
            }
            case "deleteEdge": {
              flow.removeEdge(action.id);
              break;
            }
          }
        },
      );
      applied += 1;
      metadata.set("appliedActions", applied);
    } catch (err) {
      logger.warn("canvas-apply: action failed", {
        action,
        err: (err as Error).message,
      });
    }
  }

  return { applied, trackedNodes };
}
