"use client";

import { useCallback } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
} from "@liveblocks/react";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";
import {
  CANVAS_NODE_TYPE,
  CANVAS_EDGE_TYPE,
  NODE_COLORS,
} from "@/types/canvas";
import type {
  CanvasEdge,
  CanvasEdgeDirection,
  CanvasNode,
  CanvasNodeShape,
} from "@/types/canvas";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import {
  CANVAS_SHAPE_DRAG_TYPE,
  ShapePanel,
  type ShapeDragPayload,
} from "@/components/editor/shape-panel";
import { CanvasActionsProvider } from "@/components/editor/canvas-actions-context";
import { ControlBar } from "@/components/editor/control-bar";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { useStarterTemplates } from "@/components/editor/starter-templates-context";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const nodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeRenderer };
const edgeTypes = { [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer };
const defaultEdgeOptions = { type: CANVAS_EDGE_TYPE };

const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];

let nodeCounter = 0;

function BaseCanvasContent() {
  const flow = useReactFlow();
  const { screenToFlowPosition } = flow;
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { isOpen: isTemplatesOpen, setOpen: setTemplatesOpen } =
    useStarterTemplates();

  useKeyboardShortcuts({ flow, undo, redo });
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: INITIAL_NODES },
    edges: { initial: INITIAL_EDGES },
  });

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: { ...node, data: { ...node.data, label } },
        },
      ]);
    },
    [nodes, onNodesChange],
  );

  const updateNodeColor = useCallback(
    (nodeId: string, fill: (typeof NODE_COLORS)[number]["fill"]) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: { ...node, data: { ...node.data, color: fill } },
        },
      ]);
    },
    [nodes, onNodesChange],
  );

  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;
      onEdgesChange([
        {
          type: "replace",
          id: edgeId,
          item: { ...edge, data: { ...edge.data, label } },
        },
      ]);
    },
    [edges, onEdgesChange],
  );

  const updateEdgeDirection = useCallback(
    (edgeId: string, direction: CanvasEdgeDirection) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;
      onEdgesChange([
        {
          type: "replace",
          id: edgeId,
          item: { ...edge, data: { ...edge.data, direction } },
        },
      ]);
    },
    [edges, onEdgesChange],
  );

  const importTemplate = useCallback(
    (template: CanvasTemplate) => {
      const edgeChanges = [
        ...edges.map((e) => ({ type: "remove" as const, id: e.id })),
        ...template.edges.map((e) => ({
          type: "add" as const,
          item: e,
        })),
      ];
      const nodeChanges = [
        ...nodes.map((n) => ({ type: "remove" as const, id: n.id })),
        ...template.nodes.map((n) => ({
          type: "add" as const,
          item: n,
        })),
      ];
      if (nodeChanges.length > 0) onNodesChange(nodeChanges);
      if (edgeChanges.length > 0) onEdgesChange(edgeChanges);

      requestAnimationFrame(() => {
        flow.fitView({ duration: 400, padding: 0.2 });
      });
    },
    [nodes, edges, onNodesChange, onEdgesChange, flow],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(CANVAS_SHAPE_DRAG_TYPE);
      if (!raw) return;
      const { shape, width, height } = JSON.parse(
        raw,
      ) as ShapeDragPayload;
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const id = `${shape}-${Date.now()}-${++nodeCounter}`;
      const newNode: CanvasNode = {
        id,
        type: CANVAS_NODE_TYPE,
        position: {
          x: position.x - width / 2,
          y: position.y - height / 2,
        },
        data: {
          label: "",
          color: NODE_COLORS[0].fill,
          shape: shape as CanvasNodeShape,
        },
        width,
        height,
      };
      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange],
  );

  return (
    <CanvasActionsProvider
      value={{
        updateNodeLabel,
        updateNodeColor,
        updateEdgeLabel,
        updateEdgeDirection,
      }}>
      {/* Arrow markers referenced by canvas-edge.tsx */}
      <svg
        style={{ width: 0, height: 0, position: "absolute" }}
        aria-hidden>
        <defs>
          <marker
            id="canvas-edge-arrow-rest"
            viewBox="-10 -10 20 20"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
            refX="0"
            refY="0">
            <polygon points="-7,-4 0,0 -7,4" fill="#475569" />
          </marker>
          <marker
            id="canvas-edge-arrow-active"
            viewBox="-10 -10 20 20"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
            refX="0"
            refY="0">
            <polygon points="-7,-4 0,0 -7,4" fill="#94a3b8" />
          </marker>
          <marker
            id="canvas-edge-arrow-start-rest"
            viewBox="-10 -10 20 20"
            markerWidth="12"
            markerHeight="12"
            orient="auto-start-reverse"
            refX="0"
            refY="0">
            <polygon points="-7,-4 0,0 -7,4" fill="#475569" />
          </marker>
          <marker
            id="canvas-edge-arrow-start-active"
            viewBox="-10 -10 20 20"
            markerWidth="12"
            markerHeight="12"
            orient="auto-start-reverse"
            refX="0"
            refY="0">
            <polygon points="-7,-4 0,0 -7,4" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-base">
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="var(--border-subtle)"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor="#324054"
          nodeStrokeWidth={0}
          maskColor="rgba(6, 8, 12, 0.85)"
          className="border border-surface-border"
          style={{
            borderRadius: "var(--radius)",
            backgroundColor: "#06080C",
          }}
        />
        <Panel position="bottom-left" className="mb-4 ml-4">
          <ControlBar
            flow={flow}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        </Panel>
        <Panel position="bottom-center" className="mb-4">
          <ShapePanel />
        </Panel>
      </ReactFlow>
      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setTemplatesOpen}
        onImport={importTemplate}
      />
    </CanvasActionsProvider>
  );
}

export function BaseCanvas() {
  return (
    <ReactFlowProvider>
      <BaseCanvasContent />
    </ReactFlowProvider>
  );
}
