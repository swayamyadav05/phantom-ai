import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  dirs: ["./src/trigger"],
  runtime: "node",
  logLevel: "info",
  maxDuration: 3600,

  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },

  build: {
    extensions: [
      // Prisma 7 with prisma-client provider + driver adapter (PrismaPg)
      prismaExtension({ mode: "modern" }),
    ],
  },
});
