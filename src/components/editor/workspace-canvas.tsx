"use client";

import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { Loader2 } from "lucide-react";
import { BaseCanvas } from "@/components/editor/base-canvas";

interface WorkspaceCanvasProps {
  roomId: string;
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-base">
      <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
      <p className="text-sm text-copy-muted">Loading your canvas...</p>
    </div>
  );
}

export function WorkspaceCanvas({ roomId }: WorkspaceCanvasProps) {
  return (
    <div className="h-[calc(100vh-3rem)] w-full bg-base">
      <ClientSideSuspense fallback={<CanvasLoading />}>
        <BaseCanvas projectId={roomId} />
      </ClientSideSuspense>
    </div>
  );
}
