import { z } from "zod";
import { aiChatMessageSchema } from "@/types/tasks";

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const specCanvasNodeSchema = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    position: positionSchema,
    width: z.number().optional(),
    height: z.number().optional(),
    data: z
      .object({
        label: z.string().optional(),
        shape: z.string().optional(),
        color: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const specCanvasEdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z
      .object({
        label: z.string().optional(),
        direction: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const generateSpecInputSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(aiChatMessageSchema).default([]),
  nodes: z.array(specCanvasNodeSchema).default([]),
  edges: z.array(specCanvasEdgeSchema).default([]),
});

export type GenerateSpecInput = z.infer<typeof generateSpecInputSchema>;
export type SpecCanvasNode = z.infer<typeof specCanvasNodeSchema>;
export type SpecCanvasEdge = z.infer<typeof specCanvasEdgeSchema>;
