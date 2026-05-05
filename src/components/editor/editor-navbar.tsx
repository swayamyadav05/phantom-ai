"use client";

import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function EditorNavbar({ isSidebarOpen, onSidebarToggle }: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center bg-surface border-b border-surface-border">
      <div className="flex items-center px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5 text-copy-muted" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 text-copy-muted" />
          )}
        </Button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center px-3" />
    </header>
  );
}
