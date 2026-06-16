import type { Json } from "@liveblocks/client";
import { z } from "zod";

export const AI_STATUS_FEED_ID = "ai-status-feed";
export const AI_CHAT_FEED_ID = "ai-chat";
export const AI_ARCHITECT_FEED_ID = "ai-architect";

export type AiTaskKind = "design" | "spec" | "architect";

export type AiTaskStatus =
  | "started"
  | "processing"
  | "completed"
  | "failed";

export interface AiStatusFeedPayload {
  kind: AiTaskKind;
  status: AiTaskStatus;
  runId?: string;
  text?: string;
  [key: string]: Json | undefined;
}

const VALID_KINDS: ReadonlySet<AiTaskKind> = new Set([
  "design",
  "spec",
  "architect",
]);
const VALID_STATUSES: ReadonlySet<AiTaskStatus> = new Set([
  "started",
  "processing",
  "completed",
  "failed",
]);

export function isAiStatusFeedPayload(
  value: unknown,
): value is AiStatusFeedPayload {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  if (
    typeof m.kind !== "string" ||
    !VALID_KINDS.has(m.kind as AiTaskKind)
  ) {
    return false;
  }
  if (
    typeof m.status !== "string" ||
    !VALID_STATUSES.has(m.status as AiTaskStatus)
  ) {
    return false;
  }
  if (m.runId !== undefined && typeof m.runId !== "string") return false;
  if (m.text !== undefined && typeof m.text !== "string") return false;
  return true;
}

export function isAiTaskActive(payload: AiStatusFeedPayload): boolean {
  return payload.status === "started" || payload.status === "processing";
}

export const aiChatRoleSchema = z.enum(["user", "assistant"]);
export type AiChatRole = z.infer<typeof aiChatRoleSchema>;

export const aiChatMessageSchema = z.object({
  sender: z.string().min(1).max(120),
  role: aiChatRoleSchema,
  content: z.string().min(1).max(4000),
  timestamp: z.number().int().nonnegative(),
});

export interface AiChatMessage extends Record<string, Json | undefined> {
  sender: string;
  role: AiChatRole;
  content: string;
  timestamp: number;
}

export function isAiChatMessage(value: unknown): value is AiChatMessage {
  return aiChatMessageSchema.safeParse(value).success;
}

export type FeedMessagePayload = AiStatusFeedPayload | AiChatMessage;
