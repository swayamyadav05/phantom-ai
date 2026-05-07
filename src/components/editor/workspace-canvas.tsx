"use client";

import { Component, type ReactNode } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { Loader2 } from "lucide-react";
import { BaseCanvas } from "@/components/editor/base-canvas";

interface WorkspaceCanvasProps {
  roomId: string;
}

interface LiveblocksConnectionBoundaryProps {
  children: ReactNode;
}

interface LiveblocksConnectionBoundaryState {
  hasError: boolean;
}

class LiveblocksConnectionBoundary extends Component<
  LiveblocksConnectionBoundaryProps,
  LiveblocksConnectionBoundaryState
> {
  state: LiveblocksConnectionBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LiveblocksConnectionBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <CanvasError description="Refresh the workspace to reconnect to the shared room." />
      );
    }

    return this.props.children;
  }
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-base">
      <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
      <p className="text-sm text-copy-muted">Loading your canvas...</p>
    </div>
  );
}

function CanvasError({ description }: { description: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base">
      <div className="rounded-lg border border-surface-border bg-elevated px-5 py-4 text-center shadow-lg">
        <p className="text-sm font-medium text-copy-primary">
          Canvas connection failed
        </p>
        <p className="mt-1 text-xs text-copy-muted">{description}</p>
      </div>
    </div>
  );
}

export function WorkspaceCanvas({ roomId }: WorkspaceCanvasProps) {
  return (
    <div className="h-[calc(100vh-3rem)] w-full bg-base">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <LiveblocksConnectionBoundary key={roomId}>
          <RoomProvider
            id={roomId}
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <ClientSideSuspense
              fallback={<CanvasLoading />}
            >
              <BaseCanvas />
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksConnectionBoundary>
      </LiveblocksProvider>
    </div>
  );
}
