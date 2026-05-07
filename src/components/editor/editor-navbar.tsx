"use client";

import Image from "next/image";
import {
  PanelLeftOpen,
  PanelLeftClose,
  Share2,
  Sparkles,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  workspace?: {
    projectName: string;
    isAiSidebarOpen: boolean;
    onAiSidebarToggle: () => void;
    onShare: () => void;
  };
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  workspace,
}: EditorNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center bg-surface border-b border-surface-border">
      {/* Left */}
      <div className="flex items-center px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label={
            isSidebarOpen ? "Close sidebar" : "Open sidebar"
          }>
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5 text-copy-muted" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 text-copy-muted" />
          )}
        </Button>
      </div>

      {/* Center */}
      {workspace ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <span className="truncate text-sm font-medium text-copy-primary">
            {workspace.projectName}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 top-1 flex items-center justify-center pointer-events-none">
          <Image
            src="/name-logo.svg"
            alt="Phantom AI"
            width={120}
            height={120}
            className="pointer-events-auto"
          />
        </div>
      )}

      {/* Right */}
      <div className="ml-auto flex items-center gap-1 px-3">
        {workspace && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={workspace.onShare}
              aria-label="Share project">
              <Share2 className="h-4 w-4 text-copy-muted" />
              <span className="text-copy-secondary">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={workspace.onAiSidebarToggle}
              aria-pressed={workspace.isAiSidebarOpen}
              aria-label={
                workspace.isAiSidebarOpen
                  ? "Close AI sidebar"
                  : "Open AI sidebar"
              }>
              <Sparkles
                className={`h-5 w-5 ${
                  workspace.isAiSidebarOpen
                    ? "text-ai-text"
                    : "text-copy-muted"
                }`}
              />
            </Button>
          </>
        )}
        <UserButton />
      </div>
    </header>
  );
}
