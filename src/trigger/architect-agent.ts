import { logger, metadata, task } from "@trigger.dev/sdk";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import {
  ARCHITECT_SYSTEM_PROMPT,
  architectPlanSchema,
} from "@/lib/ai/architect-plan";
import {
  applyDesignActions,
  broadcastPresence,
  describeCanvas,
  OPENAI_MODEL_ID,
  pushStatus,
} from "@/lib/ai/canvas-apply";
import {
  ensureLiveblocksRoom,
  getLiveblocksClient,
} from "@/lib/liveblocks";
import type { AiChatMessage } from "@/types/tasks";

export interface ArchitectAgentPayload {
  prompt: string;
  roomId: string;
  history?: AiChatMessage[];
}

function describeHistory(history: AiChatMessage[]): string {
  if (history.length === 0) {
    return "No prior conversation in this session.";
  }
  const turns = history
    .map((m) => `${m.role === "user" ? "User" : "Phantom AI"}: ${m.content}`)
    .join("\n");
  return `Recent conversation:\n${turns}`;
}

export const architectAgentTask = task({
  id: "architect-agent",
  maxDuration: 600,
  retry: { maxAttempts: 1 },
  run: async (payload: ArchitectAgentPayload, { ctx }) => {
    const { prompt, roomId, history = [] } = payload;
    const runId = ctx.run.id;

    logger.info("architect-agent: started", { runId, roomId });

    metadata.set("status", "started");
    metadata.set("message", "Phantom AI is reading your message...");
    metadata.set("activity", []);
    metadata.set("reply", null);
    metadata.set("summary", null);
    metadata.set("appliedActions", 0);

    const client = getLiveblocksClient();

    try {
      await ensureLiveblocksRoom(roomId);
    } catch (err) {
      logger.warn("architect-agent: ensure room failed", {
        err: (err as Error).message,
      });
    }

    await pushStatus(
      client,
      roomId,
      runId,
      "started",
      "Phantom AI is reading your message...",
    );

    try {
      await broadcastPresence(client, roomId, runId, null, true);
    } catch (err) {
      logger.warn("architect-agent: presence broadcast failed", {
        err: (err as Error).message,
      });
    }

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is required");
      }

      const openai = createOpenAI({ apiKey });

      const { nodes: existingNodes, edges: existingEdges } =
        await describeCanvas(client, roomId);

      const canvasContext =
        existingNodes.length === 0 && existingEdges.length === 0
          ? "The canvas is currently empty."
          : `Current canvas state (do not duplicate ids):\n${JSON.stringify(
              {
                nodes: existingNodes.map((n) => ({
                  id: n.id,
                  label: n.data?.label,
                  shape: n.data?.shape,
                  color: n.data?.color,
                  position: n.position,
                  size: { width: n.width, height: n.height },
                })),
                edges: existingEdges.map((e) => ({
                  id: e.id,
                  source: e.source,
                  target: e.target,
                  label: e.data?.label,
                })),
              },
              null,
              2,
            )}`;

      await pushStatus(client, roomId, runId, "processing", "Thinking...");

      const userPrompt = `${describeHistory(history)}\n\nLatest user message:\n${prompt}\n\n${canvasContext}`;

      const { output: plan } = await generateText({
        model: openai.chat(OPENAI_MODEL_ID),
        system: ARCHITECT_SYSTEM_PROMPT,
        prompt: userPrompt,
        output: Output.object({ schema: architectPlanSchema }),
        providerOptions: {
          openai: { strictJsonSchema: false },
        },
      });

      metadata.set("reply", plan.reply);
      metadata.set("summary", plan.reply);

      let applied = 0;
      if (plan.actions.length > 0) {
        await pushStatus(
          client,
          roomId,
          runId,
          "processing",
          `Applying ${plan.actions.length} canvas update${
            plan.actions.length === 1 ? "" : "s"
          }...`,
        );

        const result = await applyDesignActions({
          client,
          roomId,
          runId,
          actions: plan.actions,
          existingNodes,
          existingEdges,
        });
        applied = result.applied;
      }

      await pushStatus(
        client,
        roomId,
        runId,
        "completed",
        plan.reply || "Done.",
      );

      try {
        await broadcastPresence(client, roomId, runId, null, false);
      } catch {
        // non-fatal
      }

      logger.info("architect-agent: completed", {
        runId,
        roomId,
        applied,
        total: plan.actions.length,
      });

      return {
        runId,
        roomId,
        reply: plan.reply,
        appliedActions: applied,
        totalActions: plan.actions.length,
        status: "completed" as const,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      logger.error("architect-agent: failed", {
        runId,
        roomId,
        message,
      });

      try {
        await pushStatus(
          client,
          roomId,
          runId,
          "failed",
          `Phantom AI hit an error: ${message}`,
        );
      } catch {
        // ignore secondary failure
      }
      try {
        await broadcastPresence(client, roomId, runId, null, false);
      } catch {
        // ignore secondary failure
      }

      return {
        runId,
        roomId,
        status: "failed" as const,
        error: message,
      };
    }
  },
});
