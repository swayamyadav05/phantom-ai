"use client";

import { useEffect, useRef } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { AnyTask } from "@trigger.dev/core/v3";

export interface AgentRunMetadata {
  status?: "started" | "processing" | "completed" | "failed";
  message?: string;
  summary?: string | null;
  reply?: string | null;
  appliedActions?: number;
  specId?: string;
}

export interface ActiveRunSubscriberProps {
  runId: string;
  publicToken: string;
  onProcessing: (runId: string, message: string) => void;
  onCompleted: (runId: string, summary: string) => void;
  onFailed: (runId: string, message: string) => void;
}

export function ActiveRunSubscriber<TTask extends AnyTask>({
  runId,
  publicToken,
  onProcessing,
  onCompleted,
  onFailed,
}: ActiveRunSubscriberProps) {
  const { run, error } = useRealtimeRun<TTask>(runId, {
    accessToken: publicToken,
  });

  const finishedRef = useRef(false);

  useEffect(() => {
    if (finishedRef.current) return;
    if (error) {
      finishedRef.current = true;
      onFailed(runId, `Phantom AI hit an error: ${error.message}`);
      return;
    }
    if (!run) return;

    const md = (run.metadata ?? {}) as AgentRunMetadata;
    const apiStatus = run.status;

    if (apiStatus === "COMPLETED" || md.status === "completed") {
      finishedRef.current = true;
      const summary = md.summary || md.reply || md.message || "Done.";
      onCompleted(runId, summary);
      return;
    }

    if (
      apiStatus === "FAILED" ||
      apiStatus === "CANCELED" ||
      apiStatus === "CRASHED" ||
      apiStatus === "TIMED_OUT" ||
      apiStatus === "SYSTEM_FAILURE" ||
      md.status === "failed"
    ) {
      finishedRef.current = true;
      const message = md.message || "Phantom AI hit an error.";
      onFailed(runId, message);
      return;
    }

    const message = md.message ?? "Phantom AI is working...";
    onProcessing(runId, message);
  }, [run, error, runId, onProcessing, onCompleted, onFailed]);

  return null;
}
