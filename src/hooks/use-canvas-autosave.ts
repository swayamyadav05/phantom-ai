"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasSave } from "@/components/editor/canvas-save-context";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
  debounceMs?: number;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = 1500,
}: UseCanvasAutosaveOptions) {
  const { setStatus, registerSave } = useCanvasSave();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef<AbortController | null>(null);
  const latestRef = useRef<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>({
    nodes,
    edges,
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    latestRef.current = { nodes, edges };
  }, [nodes, edges]);

  const performSave = useCallback(async () => {
    if (!projectId) return;
    if (inflightRef.current) inflightRef.current.abort();
    const controller = new AbortController();
    inflightRef.current = controller;
    setStatus("saving");
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: latestRef.current.nodes,
          edges: latestRef.current.edges,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      setStatus("saved", Date.now());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("error");
    } finally {
      if (inflightRef.current === controller) {
        inflightRef.current = null;
      }
    }
  }, [projectId, setStatus]);

  useEffect(() => {
    registerSave(performSave);
    return () => registerSave(null);
  }, [performSave, registerSave]);

  useEffect(() => {
    if (!enabled) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void performSave();
    }, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [nodes, edges, enabled, debounceMs, performSave]);
}
