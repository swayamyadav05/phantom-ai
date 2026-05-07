import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  NODE_COLORS,
} from "@/types/canvas";
import type {
  CanvasEdge,
  CanvasEdgeDirection,
  CanvasNode,
  CanvasNodeColor,
  CanvasNodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface NodeSpec {
  id: string;
  label: string;
  shape: CanvasNodeShape;
  color: CanvasNodeColor;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface EdgeSpec {
  id: string;
  source: string;
  target: string;
  label?: string;
  direction?: CanvasEdgeDirection;
  sourceHandle?: string;
  targetHandle?: string;
}

const SHAPE_DEFAULTS: Record<
  CanvasNodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 140, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 60 },
  cylinder: { width: 110, height: 120 },
  hexagon: { width: 130, height: 110 },
};

const COLOR_BLUE = NODE_COLORS[1].fill;
const COLOR_PURPLE = NODE_COLORS[2].fill;
const COLOR_ORANGE = NODE_COLORS[3].fill;
const COLOR_RED = NODE_COLORS[4].fill;
const COLOR_PINK = NODE_COLORS[5].fill;
const COLOR_GREEN = NODE_COLORS[6].fill;
const COLOR_TEAL = NODE_COLORS[7].fill;

function buildNode(spec: NodeSpec, templateId: string): CanvasNode {
  const defaults = SHAPE_DEFAULTS[spec.shape];
  return {
    id: `${templateId}-${spec.id}`,
    type: CANVAS_NODE_TYPE,
    position: { x: spec.x, y: spec.y },
    data: {
      label: spec.label,
      color: spec.color,
      shape: spec.shape,
    },
    width: spec.width ?? defaults.width,
    height: spec.height ?? defaults.height,
  };
}

function buildEdge(spec: EdgeSpec, templateId: string): CanvasEdge {
  const data: CanvasEdge["data"] = {};
  if (spec.label) data.label = spec.label;
  if (spec.direction) data.direction = spec.direction;
  return {
    id: `${templateId}-${spec.id}`,
    type: CANVAS_EDGE_TYPE,
    source: `${templateId}-${spec.source}`,
    target: `${templateId}-${spec.target}`,
    sourceHandle: spec.sourceHandle ?? "right",
    targetHandle: spec.targetHandle ?? "left",
    data,
  };
}

function buildTemplate(
  id: string,
  name: string,
  description: string,
  nodeSpecs: NodeSpec[],
  edgeSpecs: EdgeSpec[],
): CanvasTemplate {
  return {
    id,
    name,
    description,
    nodes: nodeSpecs.map((n) => buildNode(n, id)),
    edges: edgeSpecs.map((e) => buildEdge(e, id)),
  };
}

const MICROSERVICES_NODES: NodeSpec[] = [
  { id: "client", label: "Web Client", shape: "rectangle", color: COLOR_BLUE, x: 0, y: 240 },
  { id: "mobile", label: "Mobile App", shape: "rectangle", color: COLOR_BLUE, x: 0, y: 60 },
  { id: "gateway", label: "API Gateway", shape: "diamond", color: COLOR_PURPLE, x: 260, y: 130 },
  { id: "auth", label: "Auth Service", shape: "rectangle", color: COLOR_GREEN, x: 500, y: -40 },
  { id: "users", label: "User Service", shape: "rectangle", color: COLOR_GREEN, x: 500, y: 130 },
  { id: "orders", label: "Order Service", shape: "rectangle", color: COLOR_GREEN, x: 500, y: 300 },
  { id: "payments", label: "Payment Service", shape: "rectangle", color: COLOR_GREEN, x: 500, y: 470 },
  { id: "cache", label: "Redis Cache", shape: "cylinder", color: COLOR_ORANGE, x: 760, y: 30 },
  { id: "userdb", label: "Users DB", shape: "cylinder", color: COLOR_TEAL, x: 760, y: 200 },
  { id: "orderdb", label: "Orders DB", shape: "cylinder", color: COLOR_TEAL, x: 760, y: 380 },
  { id: "stripe", label: "Stripe API", shape: "hexagon", color: COLOR_PINK, x: 760, y: 560 },
];

const MICROSERVICES_EDGES: EdgeSpec[] = [
  { id: "e-mobile-gw", source: "mobile", target: "gateway", label: "REST" },
  { id: "e-client-gw", source: "client", target: "gateway", label: "REST" },
  { id: "e-gw-auth", source: "gateway", target: "auth" },
  { id: "e-gw-users", source: "gateway", target: "users" },
  { id: "e-gw-orders", source: "gateway", target: "orders" },
  { id: "e-gw-payments", source: "gateway", target: "payments" },
  { id: "e-auth-cache", source: "auth", target: "cache", label: "sessions", direction: "both" },
  { id: "e-users-userdb", source: "users", target: "userdb", label: "read/write", direction: "both" },
  { id: "e-orders-orderdb", source: "orders", target: "orderdb", label: "read/write", direction: "both" },
  { id: "e-payments-stripe", source: "payments", target: "stripe" },
];

const CICD_NODES: NodeSpec[] = [
  { id: "git", label: "GitHub", shape: "rectangle", color: COLOR_BLUE, x: 0, y: 200 },
  { id: "trigger", label: "Webhook", shape: "circle", color: COLOR_PURPLE, x: 220, y: 220 },
  { id: "build", label: "Build & Lint", shape: "hexagon", color: COLOR_ORANGE, x: 380, y: 200 },
  { id: "test", label: "Test Suite", shape: "diamond", color: COLOR_PURPLE, x: 580, y: 200 },
  { id: "artifact", label: "Container Registry", shape: "cylinder", color: COLOR_TEAL, x: 800, y: 200 },
  { id: "staging", label: "Staging Deploy", shape: "rectangle", color: COLOR_GREEN, x: 1020, y: 80 },
  { id: "smoke", label: "Smoke Tests", shape: "diamond", color: COLOR_PURPLE, x: 1240, y: 100 },
  { id: "prod", label: "Production Deploy", shape: "rectangle", color: COLOR_GREEN, x: 1460, y: 200 },
  { id: "alerts", label: "Slack Alerts", shape: "pill", color: COLOR_PINK, x: 580, y: 400 },
  { id: "rollback", label: "Auto Rollback", shape: "pill", color: COLOR_RED, x: 1240, y: 380 },
];

const CICD_EDGES: EdgeSpec[] = [
  { id: "e-git-trigger", source: "git", target: "trigger", label: "push" },
  { id: "e-trigger-build", source: "trigger", target: "build" },
  { id: "e-build-test", source: "build", target: "test" },
  { id: "e-test-artifact", source: "test", target: "artifact", label: "pass" },
  { id: "e-test-alerts", source: "test", target: "alerts", label: "fail" },
  { id: "e-artifact-staging", source: "artifact", target: "staging" },
  { id: "e-staging-smoke", source: "staging", target: "smoke" },
  { id: "e-smoke-prod", source: "smoke", target: "prod", label: "pass" },
  { id: "e-smoke-rollback", source: "smoke", target: "rollback", label: "fail" },
  { id: "e-prod-alerts", source: "prod", target: "alerts", label: "deploy" },
];

const EVENT_NODES: NodeSpec[] = [
  { id: "api", label: "Order API", shape: "rectangle", color: COLOR_BLUE, x: 0, y: 80 },
  { id: "site", label: "Storefront", shape: "rectangle", color: COLOR_BLUE, x: 0, y: 320 },
  { id: "broker", label: "Kafka", shape: "cylinder", color: COLOR_ORANGE, x: 260, y: 180, width: 130, height: 200 },
  { id: "orders", label: "Order Worker", shape: "rectangle", color: COLOR_GREEN, x: 500, y: 0 },
  { id: "email", label: "Email Worker", shape: "rectangle", color: COLOR_GREEN, x: 500, y: 180 },
  { id: "billing", label: "Billing Worker", shape: "rectangle", color: COLOR_GREEN, x: 500, y: 360 },
  { id: "analytics", label: "Analytics Worker", shape: "rectangle", color: COLOR_GREEN, x: 500, y: 540 },
  { id: "orderdb", label: "Orders DB", shape: "cylinder", color: COLOR_TEAL, x: 760, y: 0 },
  { id: "sendgrid", label: "SendGrid", shape: "hexagon", color: COLOR_PINK, x: 760, y: 180 },
  { id: "stripe", label: "Stripe", shape: "hexagon", color: COLOR_PINK, x: 760, y: 360 },
  { id: "warehouse", label: "Data Warehouse", shape: "cylinder", color: COLOR_TEAL, x: 760, y: 540 },
  { id: "dlq", label: "Dead Letter Queue", shape: "cylinder", color: COLOR_RED, x: 260, y: 540 },
];

const EVENT_EDGES: EdgeSpec[] = [
  { id: "e-api-broker", source: "api", target: "broker", label: "order.created" },
  { id: "e-site-broker", source: "site", target: "broker", label: "user.event" },
  { id: "e-broker-orders", source: "broker", target: "orders" },
  { id: "e-broker-email", source: "broker", target: "email" },
  { id: "e-broker-billing", source: "broker", target: "billing" },
  { id: "e-broker-analytics", source: "broker", target: "analytics" },
  { id: "e-orders-db", source: "orders", target: "orderdb" },
  { id: "e-email-sendgrid", source: "email", target: "sendgrid" },
  { id: "e-billing-stripe", source: "billing", target: "stripe" },
  { id: "e-analytics-warehouse", source: "analytics", target: "warehouse" },
  { id: "e-broker-dlq", source: "broker", target: "dlq", label: "retries", direction: "both", sourceHandle: "bottom", targetHandle: "top" },
];

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  buildTemplate(
    "microservices",
    "Microservices Architecture",
    "API gateway fronting independent services backed by per-domain databases, a cache, and an external payment provider.",
    MICROSERVICES_NODES,
    MICROSERVICES_EDGES,
  ),
  buildTemplate(
    "cicd",
    "CI/CD Pipeline",
    "Source push triggers build, test, container publish, staging deploy with smoke tests, and a guarded production rollout with rollback.",
    CICD_NODES,
    CICD_EDGES,
  ),
  buildTemplate(
    "event-driven",
    "Event-Driven System",
    "Producers emit domain events to a message broker; independent workers fan out to data stores and external services, with a dead-letter queue for retries.",
    EVENT_NODES,
    EVENT_EDGES,
  ),
];
