"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useFeedMessages } from "@liveblocks/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActiveRunSubscriber } from "@/components/editor/active-run-subscriber";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import {
  AI_ARCHITECT_FEED_ID,
  isAiChatMessage,
  type AiChatMessage,
} from "@/types/tasks";
import type { generateSpec } from "@/trigger/generate-spec";

const SPEC_CHAT_HISTORY_LIMIT = 30;

interface SpecSummary {
  id: string;
  createdAt: string;
  filename: string;
}

interface ActiveSpecRun {
  runId: string;
  publicToken: string;
}

function formatSpecDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function downloadSpec(projectId: string, spec: SpecSummary) {
  const link = document.createElement("a");
  link.href = `/api/projects/${projectId}/specs/${spec.id}/download`;
  link.download = spec.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1
      className="mb-2 mt-4 text-lg font-semibold text-copy-primary first:mt-0"
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="mb-2 mt-4 font-semibold text-copy-primary first:mt-0"
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3
      className="mb-1.5 mt-3 text-sm font-semibold text-copy-primary"
      {...props}
    />
  ),
  p: ({ ...props }) => (
    <p
      className="mb-2 text-sm leading-relaxed text-copy-secondary"
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <ul
      className="mb-2 ml-4 list-disc space-y-1 text-sm text-copy-secondary"
      {...props}
    />
  ),
  ol: ({ ...props }) => (
    <ol
      className="mb-2 ml-4 list-decimal space-y-1 text-sm text-copy-secondary"
      {...props}
    />
  ),
  li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
  strong: ({ ...props }) => (
    <strong className="font-semibold text-copy-primary" {...props} />
  ),
  code: ({ ...props }) => (
    <code
      className="rounded bg-subtle px-1 py-0.5 font-mono text-xs text-ai-text"
      {...props}
    />
  ),
  pre: ({ ...props }) => (
    <pre
      className="mb-2 overflow-x-auto rounded-md bg-subtle p-3 font-mono text-xs text-copy-secondary"
      {...props}
    />
  ),
  a: ({ ...props }) => (
    <a
      className="text-brand underline underline-offset-2"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  blockquote: ({ ...props }) => (
    <blockquote
      className="mb-2 border-l-2 border-surface-border pl-3 text-sm italic text-copy-muted"
      {...props}
    />
  ),
  hr: () => <hr className="my-3 border-surface-border" />,
};

interface SpecPreviewModalProps {
  projectId: string;
  spec: SpecSummary;
  onClose: () => void;
  initialContent?: string;
  onContentLoaded?: (specId: string, content: string) => void;
}

function SpecPreviewModal({
  projectId,
  spec,
  onClose,
  initialContent,
  onContentLoaded,
}: SpecPreviewModalProps) {
  const [content, setContent] = useState<string | null>(initialContent ?? null);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialContent) return;

    let cancelled = false;

    fetch(`/api/projects/${projectId}/specs/${spec.id}/download`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to load spec (status ${res.status}).`,
          );
        }
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          onContentLoaded?.(spec.id, text);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load spec.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [spec.id, projectId, initialContent, onContentLoaded]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}>
      <DialogContent className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-3 overflow-hidden bg-elevated text-copy-primary sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6 text-copy-primary">
            {spec.filename}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-surface-border bg-base/40 px-4 py-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-copy-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading spec...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-sm text-state-error">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && content && (
            <ReactMarkdown components={markdownComponents}>
              {content}
            </ReactMarkdown>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => downloadSpec(projectId, spec)}
            className="bg-brand text-white hover:bg-brand/90">
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SpecsTabProps {
  projectId: string;
  roomId: string;
}

export function SpecsTab({ projectId, roomId }: SpecsTabProps) {
  const [specs, setSpecs] = useState<SpecSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] =
    useState<SpecSummary | null>(null);
  const [selectedSpecContent, setSelectedSpecContent] =
    useState<string | undefined>(undefined);
  const specContentCache = useRef<Map<string, string>>(new Map());

  const openSpec = useCallback((spec: SpecSummary) => {
    setSelectedSpec(spec);
    setSelectedSpecContent(specContentCache.current.get(spec.id));
  }, []);

  const closeSpec = useCallback(() => {
    setSelectedSpec(null);
    setSelectedSpecContent(undefined);
  }, []);

  const [activeSpecRun, setActiveSpecRun] =
    useState<ActiveSpecRun | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genStatusText, setGenStatusText] = useState<string | null>(null);

  const { nodes, edges } = useLiveblocksFlow<CanvasNode, CanvasEdge>();
  const { messages: chatMessages } = useFeedMessages(AI_ARCHITECT_FEED_ID);

  const fetchSpecs = useCallback(() => {
    fetch(`/api/projects/${projectId}/specs`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to load specs (status ${res.status}).`,
          );
        }
        return res.json() as Promise<{ specs: SpecSummary[] }>;
      })
      .then((data) => {
        setSpecs(data.specs);
        setError(null);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load specs.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    void fetchSpecs();
  }, [fetchSpecs]);

  const handleDownload = useCallback(
    (spec: SpecSummary) => downloadSpec(projectId, spec),
    [projectId],
  );

  const handleGenerateSpec = useCallback(async () => {
    if (isGenerating || activeSpecRun) return;

    setIsGenerating(true);
    setGenError(null);
    setGenStatusText("Starting spec generation...");

    const chatHistory: AiChatMessage[] = (chatMessages ?? [])
      .map((m) => m.data)
      .filter(isAiChatMessage)
      .slice(-SPEC_CHAT_HISTORY_LIMIT);

    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          chatHistory,
          nodes: nodes ?? [],
          edges: edges ?? [],
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          detail ||
            `Failed to start spec generation (status ${res.status}).`,
        );
      }
      const data = (await res.json()) as { runId: string };
      if (!data.runId) {
        throw new Error("Server did not return a runId.");
      }

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: data.runId }),
      });
      if (!tokenRes.ok) {
        const detail = await tokenRes.text().catch(() => "");
        throw new Error(
          detail ||
            `Failed to authorize spec tracking (status ${tokenRes.status}).`,
        );
      }
      const tokenData = (await tokenRes.json()) as { token: string };
      if (!tokenData.token) {
        throw new Error("Server did not return a token.");
      }

      setActiveSpecRun({ runId: data.runId, publicToken: tokenData.token });
      setGenStatusText("Phantom AI is generating your spec...");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setGenError(message);
      setGenStatusText(null);
      setIsGenerating(false);
    }
  }, [isGenerating, activeSpecRun, chatMessages, roomId, nodes, edges]);

  const handleSpecProcessing = useCallback(
    (_runId: string, message: string) => {
      setGenStatusText(message);
    },
    [],
  );

  const handleSpecCompleted = useCallback(
    (runId: string) => {
      setActiveSpecRun((cur) => (cur && cur.runId === runId ? null : cur));
      setIsGenerating(false);
      setGenStatusText(null);
      void fetchSpecs();
    },
    [fetchSpecs],
  );

  const handleSpecFailed = useCallback(
    (runId: string, message: string) => {
      setActiveSpecRun((cur) => (cur && cur.runId === runId ? null : cur));
      setIsGenerating(false);
      setGenStatusText(null);
      setGenError(message);
    },
    [],
  );

  return (
    <>
      {activeSpecRun && (
        <ActiveRunSubscriber<typeof generateSpec>
          runId={activeSpecRun.runId}
          publicToken={activeSpecRun.publicToken}
          onProcessing={handleSpecProcessing}
          onCompleted={handleSpecCompleted}
          onFailed={handleSpecFailed}
        />
      )}

      <Button
        onClick={() => void handleGenerateSpec()}
        disabled={isGenerating}
        className="mb-2 w-full shrink-0 bg-brand text-white hover:bg-brand/90">
        {isGenerating ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-1.5 h-4 w-4" />
        )}
        {isGenerating ? "Generating..." : "Generate Spec"}
      </Button>

      {isGenerating && genStatusText && (
        <div className="mb-4 flex items-center gap-2 text-sm text-copy-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{genStatusText}</span>
        </div>
      )}

      {!isGenerating && genError && (
        <div className="mb-4 flex items-center gap-1.5 text-sm text-state-error">
          <AlertCircle className="h-4 w-4" />
          <span>{genError}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-copy-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading specs...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-1.5 text-sm text-state-error">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && specs.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <FileText className="h-8 w-8 text-copy-faint" />
          <p className="text-sm text-copy-muted">
            No specs yet. Generate one from your canvas.
          </p>
        </div>
      )}

      {!loading && !error && specs.length > 0 && (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 pb-1">
            {specs.map((spec) => (
              <div
                key={spec.id}
                role="button"
                tabIndex={0}
                onClick={() => openSpec(spec)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openSpec(spec);
                  }
                }}
                className="flex items-center gap-3 rounded-lg border border-surface-border bg-elevated p-3 text-left transition-colors hover:border-surface-border-subtle hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                <FileText className="h-5 w-5 shrink-0 text-ai-text" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-copy-primary">
                    {spec.filename}
                  </p>
                  <p className="text-xs text-copy-muted">
                    {formatSpecDate(spec.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Download ${spec.filename}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(spec);
                  }}
                  className="h-8 w-8 shrink-0 text-copy-muted hover:text-copy-primary">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {selectedSpec && (
        <SpecPreviewModal
          key={selectedSpec.id}
          projectId={projectId}
          spec={selectedSpec}
          onClose={closeSpec}
          initialContent={selectedSpecContent}
          onContentLoaded={(specId, content) => {
            specContentCache.current.set(specId, content);
          }}
        />
      )}
    </>
  );
}
