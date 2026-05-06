"use client";

import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      className={`fixed top-12 right-0 z-40 flex h-[calc(100vh-3rem)] w-80 flex-col border-l border-surface-border bg-surface transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <span className="text-sm font-semibold text-copy-primary">
          AI Assistant
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="h-5 w-5 text-copy-muted" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Sparkles className="h-8 w-8 text-copy-faint" />
        <p className="text-sm text-copy-muted">
          AI chat coming soon
        </p>
      </div>
    </aside>
  );
}
