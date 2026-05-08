"use client";

import { createContext, useContext, useState } from "react";

interface StarterTemplatesContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const StarterTemplatesContext =
  createContext<StarterTemplatesContextValue | null>(null);

export function StarterTemplatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);
  return (
    <StarterTemplatesContext.Provider value={{ isOpen, setOpen }}>
      {children}
    </StarterTemplatesContext.Provider>
  );
}

export function useStarterTemplates(): StarterTemplatesContextValue {
  const ctx = useContext(StarterTemplatesContext);
  if (!ctx) {
    throw new Error(
      "useStarterTemplates must be inside StarterTemplatesProvider",
    );
  }
  return ctx;
}
