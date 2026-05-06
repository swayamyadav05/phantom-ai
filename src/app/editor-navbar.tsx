"use client";

import Image from "next/image";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
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

      {/* Center — absolutely positioned so it's centered on the full navbar width */}
      <div className="absolute inset-0 top-1 flex items-center justify-center pointer-events-none">
        <Image
          src="/name-logo.svg"
          alt="Phantom AI"
          width={120}
          height={120}
          className="pointer-events-auto"
        />
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center px-3">
        <UserButton />
      </div>
    </header>
  );
}
