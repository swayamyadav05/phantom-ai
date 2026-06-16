import { z } from "zod";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const sizeSchema = z.object({
  width: z.number().min(80).max(360),
  height: z.number().min(40).max(220),
});

export const designActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("addNode"),
    id: z.string().min(1),
    label: z.string(),
    shape: z.string().min(1),
    color: z.string().min(1),
    position: positionSchema,
    size: sizeSchema,
  }),
  z.object({
    type: z.literal("moveNode"),
    id: z.string().min(1),
    position: positionSchema,
  }),
  z.object({
    type: z.literal("resizeNode"),
    id: z.string().min(1),
    size: sizeSchema,
  }),
  z.object({
    type: z.literal("updateNodeData"),
    id: z.string().min(1),
    label: z.string().optional(),
    color: z.string().min(1).optional(),
  }),
  z.object({
    type: z.literal("deleteNode"),
    id: z.string().min(1),
  }),
  z.object({
    type: z.literal("addEdge"),
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    label: z.string().optional(),
  }),
  z.object({
    type: z.literal("deleteEdge"),
    id: z.string().min(1),
  }),
]);

export const designPlanSchema = z.object({
  summary: z
    .string()
    .describe("One short sentence describing the design produced."),
  actions: z
    .array(designActionSchema)
    .min(1)
    .describe(
      "Ordered list of canvas mutations. Add nodes before edges that reference them.",
    ),
});

export type DesignAction = z.infer<typeof designActionSchema>;
export type DesignPlan = z.infer<typeof designPlanSchema>;

const COLOR_PALETTE_DESCRIPTION = NODE_COLORS.map(
  (c) => `${c.fill} (text ${c.text})`,
).join(", ");

const SHAPE_LIST = NODE_SHAPES.join(", ");

/**
 * Canvas vocabulary shared by every AI agent that can mutate the canvas
 * (full design generation and the conversational architect). Keeping this
 * in one place keeps the palette, action shapes, layout grid, and edge
 * labeling rules consistent across agents.
 */
export const CANVAS_DESIGN_RULES = `Allowed shapes: ${SHAPE_LIST}.
Allowed fill colors (hex): ${COLOR_PALETTE_DESCRIPTION}. Pick colors purposefully — group related services using the same fill, and reserve one accent color for the user-facing entry point. Use ONLY hex values from this list — never invent new colors.

addNode action — use this EXACT shape (field names case-sensitive):
{
  "type": "addNode",
  "id": "node-kebab-case-name",
  "label": "Service Name",
  "shape": "rectangle",
  "color": "${NODE_COLORS[0].fill}",
  "position": { "x": 0, "y": 0 },
  "size": { "width": 160, "height": 80 }
}
- Use "color" (NOT "fill"). Use nested "position" with x/y (NOT flat x/y). Use nested "size" with width/height (NOT flat width/height).
- Do not add extra fields like "textColor", "background", "fontSize" — they will be ignored.

addEdge action:
{
  "type": "addEdge",
  "id": "edge-source-target",
  "source": "node-source",
  "target": "node-target",
  "label": "publishes"
}
- ALWAYS include a "label": a short verb or noun phrase describing the relationship or data that flows along the edge (e.g. "sends requests", "reads/writes", "publishes events", "authenticates"). Never leave an edge unlabeled or use a generic placeholder like "connects".

Other action types: moveNode { id, position }, resizeNode { id, size }, updateNodeData { id, label?, color? }, deleteNode { id }, deleteEdge { id }.

Layout rules:
- Place nodes on a left-to-right flow. The leftmost layer is the entry point (clients, gateway). The rightmost layer is data stores or sinks.
- Use a grid with at least 220px horizontal gap between any two nodes (measured edge-to-edge) and at least 130px vertical gap between any two nodes in the same column. Each node in a column must have a DISTINCT y value differing by at least (node height + 130).
- Default node size is width 160, height 80. Use width 180 height 90 for databases and queues. Keep widths between 120 and 240.
- Position values are absolute pixel coordinates. Anchor the diagram around (0, 0) — leftmost x can be negative, but keep the whole graph within +/- 1200.
- CRITICAL — no overlapping: before assigning any position, verify it does not overlap any other node (from the current canvas context OR earlier in this plan). Two nodes overlap when their bounding boxes intersect. If a conflict exists, shift the new node right by (conflicting node width + 220) or down by (conflicting node height + 130).
- When adding nodes to a non-empty canvas: inspect the existing node positions supplied in context. Find the rightmost existing x value; place new nodes at x ≥ (rightmost x + node width + 220). Do NOT default to (0, 0) or any coordinate already occupied.
- Avoid more than 8 nodes unless the prompt clearly requires it.

Edge rules:
- Always connect nodes with edges that follow the data or request flow.
- Each edge id must be globally unique. Use the form "edge-<source>-<target>" to keep them deterministic.
- Every edge MUST carry a short, meaningful "label" describing the interaction or data flow ("publishes", "reads", "syncs", "sends requests"). Do not emit unlabeled edges.

Shape conventions:
- rectangle: stateless services, application servers
- pill: API gateways, load balancers, edge functions
- circle: clients, end users, browsers, mobile apps
- cylinder: databases, object stores
- hexagon: queues, event buses, streams
- diamond: decision points, routers, policy gates`;

export const DESIGN_AGENT_SYSTEM_PROMPT = `You are Phantom AI, the design agent for a collaborative system architecture canvas.

You produce a structured plan of canvas mutations that turn the user's prompt into a clean architecture diagram. Other collaborators see your output appear live on a shared canvas.

${CANVAS_DESIGN_RULES}

Output format (CRITICAL — copy these field names exactly):
The full plan is one JSON object:
{
  "summary": "One sentence describing the design.",
  "actions": [ /* one or more action objects, see below */ ]
}

Action rules:
- Use the addNode action to create a node. Use a stable id like "node-<kebab-case-name>".
- Use addEdge actions only after the referenced nodes exist (either already on canvas or earlier in this plan).
- Only emit moveNode, resizeNode, updateNodeData, deleteNode, addEdge, or deleteEdge for ids that already exist on the current canvas (provided in context) or that you added earlier in this plan.
- If the canvas already has content, prefer extending or refining it rather than wiping it out.

Always return a non-empty actions array. Keep summary to a single sentence.`;
