"use client";

import { createContext, useContext } from "react";
import type {
  CanvasEdgeDirection,
  CanvasNodeColor,
} from "@/types/canvas";

interface CanvasActions {
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeColor: (nodeId: string, fill: CanvasNodeColor) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  updateEdgeDirection: (
    edgeId: string,
    direction: CanvasEdgeDirection,
  ) => void;
}

const CanvasActionsContext = createContext<CanvasActions | null>(null);

export function CanvasActionsProvider({
  value,
  children,
}: {
  value: CanvasActions;
  children: React.ReactNode;
}) {
  return (
    <CanvasActionsContext.Provider value={value}>
      {children}
    </CanvasActionsContext.Provider>
  );
}

export function useCanvasActions(): CanvasActions {
  const ctx = useContext(CanvasActionsContext);
  if (!ctx) throw new Error("useCanvasActions must be inside CanvasActionsProvider");
  return ctx;
}
