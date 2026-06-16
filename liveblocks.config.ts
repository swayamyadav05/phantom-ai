import type { LiveblocksFlow } from "@liveblocks/react-flow";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { FeedMessagePayload } from "@/types/tasks";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {
      flow?: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    UserMeta: {
      id: string;
      info: {
        displayName: string;
        avatarUrl: string;
        cursorColor: string;
      };
    };

    RoomEvent:
      | {
          kind: "ai-status";
          runId: string;
          status: "started" | "processing" | "completed" | "failed";
          message: string;
          at: number;
        }
      | {
          kind: "ai-presence";
          runId: string;
          cursor: { x: number; y: number } | null;
          thinking: boolean;
        };
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
    FeedMessageData: FeedMessagePayload;
  }
}

export {};
