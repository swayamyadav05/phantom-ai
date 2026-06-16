"use client";

import { useEffect, useRef, useState } from "react";
import { useEventListener } from "@liveblocks/react";
import { useStore } from "@xyflow/react";
import { Sparkles } from "lucide-react";

const AI_COLOR = "#A78BFA";
const STATUS_VISIBLE_MS = 6000;

interface AiState {
  runId: string | null;
  thinking: boolean;
  cursor: { x: number; y: number } | null;
  status: {
    runId: string;
    state: "started" | "processing" | "completed" | "failed";
    message: string;
    at: number;
  } | null;
}

const INITIAL_STATE: AiState = {
  runId: null,
  thinking: false,
  cursor: null,
  status: null,
};

function AiCursor({
  cursor,
  thinking,
}: {
  cursor: { x: number; y: number };
  thinking: boolean;
}) {
  const panX = useStore((s) => s.transform[0]);
  const panY = useStore((s) => s.transform[1]);
  const zoom = useStore((s) => s.transform[2]);

  const x = cursor.x * zoom + panX;
  const y = cursor.y * zoom + panY;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transition: "transform 220ms ease-out",
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-hidden>
      <svg
        width="20"
        height="22"
        viewBox="0 0 18 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}>
        <path
          d="M2 1.5L15.5 9.5L9.5 11.5L6.5 18.5L2 1.5Z"
          fill={AI_COLOR}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 18,
          top: 14,
          backgroundColor: AI_COLOR,
          color: "#0B0F19",
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: "nowrap",
          lineHeight: "18px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          boxShadow: "0 4px 12px rgba(167, 139, 250, 0.35)",
        }}>
        <Sparkles
          width={11}
          height={11}
          style={
            thinking
              ? { animation: "ai-spin 1.6s linear infinite" }
              : undefined
          }
        />
        <span>Phantom AI</span>
      </div>
      <style>{`@keyframes ai-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function AiPresenceOverlay() {
  const [state, setState] = useState<AiState>(INITIAL_STATE);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEventListener(({ event }) => {
    if (!event || typeof event !== "object" || !("kind" in event)) return;

    if (event.kind === "ai-presence") {
      setState((prev) => ({
        ...prev,
        runId: event.runId,
        cursor: event.cursor,
        thinking: event.thinking,
      }));
      return;
    }

    if (event.kind === "ai-status") {
      setState((prev) => ({
        ...prev,
        runId: event.runId,
        status: {
          runId: event.runId,
          state: event.status,
          message: event.message,
          at: event.at,
        },
        thinking:
          event.status === "completed" || event.status === "failed"
            ? false
            : prev.thinking,
        cursor:
          event.status === "completed" || event.status === "failed"
            ? null
            : prev.cursor,
      }));
    }
  });

  useEffect(() => {
    if (!state.status) return;
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    if (
      state.status.state === "completed" ||
      state.status.state === "failed"
    ) {
      statusTimeoutRef.current = setTimeout(() => {
        setState((prev) =>
          prev.status && prev.status.at === state.status?.at
            ? { ...prev, status: null }
            : prev,
        );
      }, STATUS_VISIBLE_MS);
    }
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, [state.status]);

  return (
    <>
      {state.cursor && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9998,
            pointerEvents: "none",
            overflow: "hidden",
          }}>
          <AiCursor cursor={state.cursor} thinking={state.thinking} />
        </div>
      )}
      {state.status && <AiStatusBanner status={state.status} />}
    </>
  );
}

function AiStatusBanner({
  status,
}: {
  status: NonNullable<AiState["status"]>;
}) {
  const isFailed = status.state === "failed";
  const isCompleted = status.state === "completed";

  let badgeBg = "rgba(167, 139, 250, 0.2)";
  let badgeText = "#C4B5FD";
  let borderColor = "rgba(167, 139, 250, 0.45)";
  if (isFailed) {
    badgeBg = "rgba(248, 113, 113, 0.18)";
    badgeText = "#FCA5A5";
    borderColor = "rgba(248, 113, 113, 0.5)";
  } else if (isCompleted) {
    badgeBg = "rgba(74, 222, 128, 0.18)";
    badgeText = "#86EFAC";
    borderColor = "rgba(74, 222, 128, 0.5)";
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(13, 18, 26, 0.85)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${borderColor}`,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
        maxWidth: "min(80vw, 560px)",
      }}
      role="status">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          borderRadius: 999,
          backgroundColor: badgeBg,
          color: badgeText,
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}>
        <Sparkles width={11} height={11} />
        Phantom AI
      </span>
      <span
        style={{
          color: "var(--text-primary)",
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
        {status.message}
      </span>
    </div>
  );
}
