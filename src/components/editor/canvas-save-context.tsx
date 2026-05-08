"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

interface CanvasSaveContextValue {
  status: CanvasSaveStatus;
  lastSavedAt: number | null;
  setStatus: (status: CanvasSaveStatus, lastSavedAt?: number | null) => void;
  registerSave: (fn: (() => Promise<void>) | null) => void;
  manualSave: () => Promise<void>;
}

const CanvasSaveContext = createContext<CanvasSaveContextValue | null>(null);

export function CanvasSaveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatusState] = useState<CanvasSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveFnRef = useRef<(() => Promise<void>) | null>(null);

  const setStatus = useCallback(
    (next: CanvasSaveStatus, savedAt?: number | null) => {
      setStatusState(next);
      if (savedAt !== undefined) setLastSavedAt(savedAt);
    },
    [],
  );

  const registerSave = useCallback(
    (fn: (() => Promise<void>) | null) => {
      saveFnRef.current = fn;
    },
    [],
  );

  const manualSave = useCallback(async () => {
    const fn = saveFnRef.current;
    if (fn) await fn();
  }, []);

  const value = useMemo<CanvasSaveContextValue>(
    () => ({
      status,
      lastSavedAt,
      setStatus,
      registerSave,
      manualSave,
    }),
    [status, lastSavedAt, setStatus, registerSave, manualSave],
  );

  return (
    <CanvasSaveContext.Provider value={value}>
      {children}
    </CanvasSaveContext.Provider>
  );
}

export function useCanvasSave(): CanvasSaveContextValue {
  const ctx = useContext(CanvasSaveContext);
  if (!ctx) {
    throw new Error(
      "useCanvasSave must be used within CanvasSaveProvider",
    );
  }
  return ctx;
}
