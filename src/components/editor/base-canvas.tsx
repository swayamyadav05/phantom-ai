"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useMyPresence,
  useOthers,
  shallow,
} from "@liveblocks/react";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
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
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
import { PresenceAvatars } from "@/components/editor/presence-avatars";

function CursorSvg({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="20"
      viewBox="0 0 18 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden
    >
      <path
        d="M2 1.5L15.5 9.5L9.5 11.5L6.5 18.5L2 1.5Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollaboratorCursors() {
  const others = useOthers(
    (all) =>
      all
        .filter((o) => o.presence.cursor !== null)
        .map((o) => ({
          connectionId: o.connectionId,
          cursor: o.presence.cursor as { x: number; y: number },
          name: o.info?.displayName ?? "Collaborator",
          color: o.info?.cursorColor ?? "#6366f1",
        })),
    shallow,
  );

  const panX = useStore((s) => s.transform[0]);
  const panY = useStore((s) => s.transform[1]);
  const zoom = useStore((s) => s.transform[2]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {others.map(({ connectionId, cursor, name, color }) => {
        const x = cursor.x * zoom + panX;
        const y = cursor.y * zoom + panY;
        return (
          <div
            key={connectionId}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate3d(${x}px, ${y}px, 0)`,
              transition: "transform 80ms linear",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <CursorSvg color={color} />
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 14,
                backgroundColor: color,
                color: "#fff",
                padding: "1px 6px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: "nowrap",
                lineHeight: "18px",
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const nodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeRenderer };
const edgeTypes = { [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer };
const defaultEdgeOptions = { type: CANVAS_EDGE_TYPE };

const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];

let nodeCounter = 0;

interface BaseCanvasProps {
  projectId: string;
}

function BaseCanvasContent({ projectId }: BaseCanvasProps) {
  const flow = useReactFlow();
  const { screenToFlowPosition } = flow;
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { isOpen: isTemplatesOpen, setOpen: setTemplatesOpen } =
    useStarterTemplates();

  const [, updateMyPresence] = useMyPresence();

  useKeyboardShortcuts({ flow, undo, redo });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      updateMyPresence({ cursor: pos });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

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

  const [loadComplete, setLoadComplete] = useState(false);
  const loadAttemptedRef = useRef(false);
  const initialHasContentRef = useRef(nodes.length > 0 || edges.length > 0);

  useEffect(() => {
    if (loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;

    let cancelled = false;
    void (async () => {
      if (initialHasContentRef.current) {
        if (!cancelled) setLoadComplete(true);
        return;
      }
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`);
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as
          | { nodes?: CanvasNode[]; edges?: CanvasEdge[] }
          | null;
        if (cancelled || !data) return;
        const savedNodes = data.nodes ?? [];
        const savedEdges = data.edges ?? [];
        if (savedNodes.length > 0) {
          onNodesChange(
            savedNodes.map((n) => ({ type: "add" as const, item: n })),
          );
        }
        if (savedEdges.length > 0) {
          onEdgesChange(
            savedEdges.map((e) => ({ type: "add" as const, item: e })),
          );
        }
      } catch {
        // Load failures fall through to an empty canvas — autosave will persist later edits.
      } finally {
        if (!cancelled) setLoadComplete(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, onNodesChange, onEdgesChange]);

  useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: loadComplete,
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-base">
        <CollaboratorCursors />
        <Panel position="top-right" className="mr-4 mt-4">
          <PresenceAvatars />
        </Panel>
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

export function BaseCanvas({ projectId }: BaseCanvasProps) {
  return (
    <ReactFlowProvider>
      <BaseCanvasContent projectId={projectId} />
    </ReactFlowProvider>
  );
}
