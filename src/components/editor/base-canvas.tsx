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
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";
import { CANVAS_NODE_TYPE, NODE_COLORS } from "@/types/canvas";
import type { CanvasEdge, CanvasNode, CanvasNodeShape } from "@/types/canvas";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import {
  CANVAS_SHAPE_DRAG_TYPE,
  ShapePanel,
  type ShapeDragPayload,
} from "@/components/editor/shape-panel";

const nodeTypes = { [CANVAS_NODE_TYPE]: CanvasNodeRenderer };

const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];

let nodeCounter = 0;

function BaseCanvasContent() {
  const { screenToFlowPosition } = useReactFlow();
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

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(CANVAS_SHAPE_DRAG_TYPE);
      if (!raw) return;
      const { shape, width, height } = JSON.parse(raw) as ShapeDragPayload;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `${shape}-${Date.now()}-${++nodeCounter}`;
      const newNode: CanvasNode = {
        id,
        type: CANVAS_NODE_TYPE,
        position: { x: position.x - width / 2, y: position.y - height / 2 },
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
    [screenToFlowPosition, onNodesChange]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onDragOver={onDragOver}
      onDrop={onDrop}
      connectionMode={ConnectionMode.Loose}
      fitView
      className="bg-base"
    >
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
      <Panel position="bottom-center" className="mb-4">
        <ShapePanel />
      </Panel>
    </ReactFlow>
  );
}

export function BaseCanvas() {
  return (
    <ReactFlowProvider>
      <BaseCanvasContent />
    </ReactFlowProvider>
  );
}
