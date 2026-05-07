import { Liveblocks as LiveblocksNodeClient } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#38BDF8",
  "#C084FC",
  "#FB923C",
  "#F87171",
  "#F472B6",
  "#4ADE80",
  "#2DD4BF",
  "#FF6B4A",
] as const;

const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: LiveblocksNodeClient;
};

function createLiveblocksClient(): LiveblocksNodeClient {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is required");
  }

  return new LiveblocksNodeClient({ secret });
}

export function getLiveblocksClient(): LiveblocksNodeClient {
  if (!globalForLiveblocks.liveblocks) {
    globalForLiveblocks.liveblocks = createLiveblocksClient();
  }

  return globalForLiveblocks.liveblocks;
}

export function getCursorColorForUser(userId: string): string {
  let hash = 0;

  for (const character of userId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

export async function ensureLiveblocksRoom(roomId: string) {
  return getLiveblocksClient().getOrCreateRoom(roomId, {
    defaultAccesses: [],
    metadata: { projectId: roomId },
  });
}
