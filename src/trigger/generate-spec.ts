import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  generateSpecInputSchema,
  type SpecCanvasEdge,
  type SpecCanvasNode,
} from "@/lib/ai/spec-schema";
import type { AiChatMessage } from "@/types/tasks";

const OPENAI_MODEL_ID = "gpt-5.4-pro";

const SPEC_GENERATION_SYSTEM_PROMPT = `You are Phantom AI, a senior software architect and technical writer specialised in distributed systems.

Given the current canvas graph (nodes representing services, clients, queues, data stores, etc. and directed edges representing the connections between them) and the team's conversation history, produce a rigorous, senior-level technical specification in Markdown.

Structure the document with these sections:
# <Concise system title>
## Overview
A concise summary of the system's purpose, key architectural decisions, and overall topology.
## Components
One subsection per discrete software component or service. For each, describe its role, responsibilities, interfaces, and any notable constraints. Describe architectural behaviour only — do not reference canvas aesthetics.
## Data Flow & Interactions
Trace how data moves through the system step by step. Each step must respect edge directionality: \`from\` is the sender/caller, \`to\` is the receiver/callee. Do not invert or reinterpret edge direction.
## Design Notes
Capture design decisions, trade-offs, constraints, open questions, and any operational strategies (scaling policies, sharding, caching, load-balancing, circuit-breaking, etc.) surfaced by the canvas or conversation.

Rules:
- Base the content strictly on the provided canvas graph and conversation; do not invent components that are not present.
- If a node represents an operational strategy or pattern (e.g. horizontal scaling, sharding, caching, load balancing, circuit breaking) rather than a discrete deployed service, describe it under **Design Notes**, not **Components**.
- Edge direction is authoritative: \`from\` is the sender/caller, \`to\` is the receiver/callee. Do not invert or reinterpret edge direction.
- Do not mention canvas rendering properties (shape, colour, position, size) anywhere in the specification.
- If the canvas is empty, say so and produce a minimal spec describing only what the conversation establishes.
- If the conversation is empty, omit content that would depend on it rather than inventing it.
- Output valid Markdown only — no commentary outside the document, no code fences wrapping the whole document.
- Write with the precision and depth expected of a senior distributed-systems architect reviewing a production design.`;

function describeNodes(nodes: SpecCanvasNode[]): string {
  if (nodes.length === 0) return "The canvas has no nodes.";
  return JSON.stringify(
    nodes.map((n) => ({
      id: n.id,
      label: n.data?.label,
    })),
    null,
    2,
  );
}

function describeEdges(edges: SpecCanvasEdge[]): string {
  if (edges.length === 0) return "The canvas has no edges.";
  return JSON.stringify(
    edges.map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      label: e.data?.label,
    })),
    null,
    2,
  );
}

function describeChatHistory(chatHistory: AiChatMessage[]): string {
  if (chatHistory.length === 0)
    return "No conversation history provided.";
  return chatHistory
    .map((m) => `${m.sender} (${m.role}): ${m.content}`)
    .join("\n");
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  maxDuration: 300,
  schema: generateSpecInputSchema,
  run: async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    logger.info("generate-spec: started", {
      projectId,
      roomId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    });

    metadata.set("status", "started");
    metadata.set("message", "Phantom AI is reviewing the canvas...");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }
    const openai = createOpenAI({ apiKey });

    metadata.set("status", "processing");
    metadata.set("message", "Drafting the technical spec...");

    const prompt = `Canvas nodes:\n${describeNodes(
      nodes,
    )}\n\nCanvas edges:\n${describeEdges(
      edges,
    )}\n\nConversation history:\n${describeChatHistory(chatHistory)}`;

    const { text } = await generateText({
      model: openai.chat(OPENAI_MODEL_ID),
      system: SPEC_GENERATION_SYSTEM_PROMPT,
      prompt,
    });

    metadata.set("message", "Saving spec...");

    const specRecord = await prisma.projectSpec.create({
      data: { projectId, filePath: "" },
    });

    const blob = await put(
      `specs/${projectId}/${specRecord.id}.md`,
      text,
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "text/markdown",
      },
    );

    await prisma.projectSpec.update({
      where: { id: specRecord.id },
      data: { filePath: blob.url },
    });

    metadata.set("status", "completed");
    metadata.set("message", "Spec generated.");
    metadata.set("specId", specRecord.id);

    logger.info("generate-spec: completed", {
      projectId,
      roomId,
      specId: specRecord.id,
    });

    return text;
  },
});
