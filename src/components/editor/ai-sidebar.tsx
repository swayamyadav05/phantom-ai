"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { architectAgentTask } from "@/trigger/architect-agent";
import { SpecsTab } from "@/components/editor/specs-tab";
import { ActiveRunSubscriber } from "@/components/editor/active-run-subscriber";
import {
  AI_ARCHITECT_FEED_ID,
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  isAiChatMessage,
  isAiStatusFeedPayload,
  isAiTaskActive,
  type AiChatMessage,
  type AiStatusFeedPayload,
} from "@/types/tasks";

const AI_SENDER_NAME = "Phantom AI";

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const HISTORY_LIMIT = 10;

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
}

interface ActiveRun {
  runId: string;
  publicToken: string;
}

interface ChatEntry {
  id: string;
  data: AiChatMessage;
  createdAt: number;
}

interface SharedAiStatus {
  payload: AiStatusFeedPayload;
  createdAt: number;
}

function useLatestSharedAiStatus(): SharedAiStatus | null {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);

  return useMemo(() => {
    if (!messages || messages.length === 0) return null;

    let best: SharedAiStatus | null = null;
    for (const m of messages) {
      if (!isAiStatusFeedPayload(m.data)) continue;
      if (!best || m.createdAt > best.createdAt) {
        best = { payload: m.data, createdAt: m.createdAt };
      }
    }
    return best;
  }, [messages]);
}

function formatChatTimestamp(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getChatInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

interface ChatMessageListProps {
  entries: ChatEntry[];
  selfName: string;
  emptyState: React.ReactNode;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

function ChatMessageList({
  entries,
  selfName,
  emptyState,
  scrollRef,
}: ChatMessageListProps) {
  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-3"
    >
      {entries.length === 0 ? (
        emptyState
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const isSelf =
              entry.data.role === "user" && entry.data.sender === selfName;
            const isAssistant = entry.data.role === "assistant";
            const avatar = getChatInitials(entry.data.sender);
            return (
              <div
                key={entry.id}
                className={`flex gap-2 ${isSelf ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase ${
                    isAssistant
                      ? "bg-elevated text-ai-text"
                      : "bg-subtle text-ai-text"
                  }`}
                >
                  {isAssistant ? (
                    <Sparkles className="h-3 w-3" />
                  ) : (
                    avatar
                  )}
                </div>
                <div
                  className={`flex max-w-[85%] flex-col gap-1 ${
                    isSelf ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-copy-faint">
                    <span className="font-medium text-copy-muted">
                      {entry.data.sender}
                    </span>
                    <span>·</span>
                    <time
                      dateTime={new Date(
                        entry.data.timestamp,
                      ).toISOString()}
                    >
                      {formatChatTimestamp(entry.data.timestamp)}
                    </time>
                  </div>
                  <div
                    className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      isSelf
                        ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                        : "border border-surface-border bg-elevated text-ai-text"
                    }`}
                  >
                    {entry.data.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActiveStatusStrip({ status }: { status: AiStatusFeedPayload }) {
  return (
    <div className="shrink-0 border-t border-surface-border bg-base/60 px-3 py-2">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2 py-0.5 font-medium uppercase tracking-wide text-ai-text">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>
            {status.status === "started" ? "Starting" : "Working"}
          </span>
        </span>
        {status.text && (
          <span className="truncate text-copy-muted">{status.text}</span>
        )}
      </div>
    </div>
  );
}

function isAlreadyExistsError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return /already exists|exists already/i.test(msg);
}

/**
 * Creates every Liveblocks feed the AI sidebar reads/writes exactly once
 * per session, mounted at the sidebar root so the AI Architect tab, the
 * human Chat tab, and the shared status strip never race each other's
 * `createFeed` calls (the source of the "Feed mutation timeout" bug).
 */
function useEnsureAiFeeds() {
  const createFeed = useCreateFeed();

  useEffect(() => {
    const ensure = async (feedId: string) => {
      try {
        await createFeed(feedId);
      } catch (err) {
        if (!isAlreadyExistsError(err)) {
          console.warn(`ai-sidebar: createFeed(${feedId}) failed`, err);
        }
      }
    };
    void ensure(AI_CHAT_FEED_ID);
    void ensure(AI_ARCHITECT_FEED_ID);
    void ensure(AI_STATUS_FEED_ID);
  }, [createFeed]);
}

export function AiSidebar({
  isOpen,
  onClose,
  projectId,
  roomId,
}: AiSidebarProps) {
  useEnsureAiFeeds();

  return (
    <aside
      className={`fixed top-12 right-0 z-40 flex h-[calc(100vh-3rem)] w-80 flex-col border-l border-surface-border bg-base/95 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Bot className="h-4 w-4 text-ai-text" />
          <div>
            <p className="text-sm font-semibold text-copy-primary">
              AI Workspace
            </p>
            <p className="text-[11px] leading-tight text-copy-muted">
              Collaborate with Phantom AI
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="h-7 w-7 text-copy-muted hover:text-copy-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="architect"
        className="flex flex-1 flex-col overflow-hidden gap-0 min-h-0"
      >
        <div className="shrink-0 px-4 pt-3 pb-2">
          <TabsList className="w-full bg-subtle rounded-md h-8">
            <TabsTrigger
              value="architect"
              className="flex-1 text-xs text-copy-muted data-active:bg-elevated data-active:text-ai-text"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex-1 text-xs text-copy-muted data-active:bg-elevated data-active:text-ai-text"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 text-xs text-copy-muted data-active:bg-elevated data-active:text-ai-text"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect tab — chat with Phantom AI */}
        <TabsContent
          value="architect"
          className="flex flex-1 flex-col overflow-hidden min-h-0 mt-0"
        >
          <AiArchitectTab projectId={projectId} roomId={roomId} />
        </TabsContent>

        {/* Chat tab — collaborative room chat backed by ai-chat feed */}
        <TabsContent
          value="chat"
          className="flex flex-1 flex-col overflow-hidden min-h-0 mt-0"
        >
          <RoomChatTab />
        </TabsContent>

        {/* Specs tab */}
        <TabsContent
          value="specs"
          className="flex flex-1 flex-col overflow-hidden min-h-0 mt-0 px-4 py-3"
        >
          <SpecsTab projectId={projectId} roomId={roomId} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

interface AiArchitectTabProps {
  projectId: string;
  roomId: string;
}

function AiArchitectTab({ projectId, roomId }: AiArchitectTabProps) {
  const self = useSelf();
  const senderName =
    self?.info?.displayName?.trim() || self?.id || "Anonymous";

  const { messages: rawMessages } = useFeedMessages(AI_ARCHITECT_FEED_ID);
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const sharedStatus = useLatestSharedAiStatus();
  const sharedActive = sharedStatus
    ? isAiTaskActive(sharedStatus.payload)
    : false;

  const [input, setInput] = useState("");
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<ChatEntry[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBusy = isSubmitting || activeRun !== null || sharedActive;

  const entries = useMemo<ChatEntry[]>(() => {
    const map = new Map<string, ChatEntry>();
    if (rawMessages) {
      for (const m of rawMessages) {
        if (!isAiChatMessage(m.data)) continue;
        map.set(m.id, { id: m.id, data: m.data, createdAt: m.createdAt });
      }
    }
    for (const p of pendingMessages) {
      // Server message with same id wins; otherwise keep optimistic entry.
      if (!map.has(p.id)) map.set(p.id, p);
    }
    const list = Array.from(map.values());
    list.sort((a, b) => a.createdAt - b.createdAt);
    return list;
  }, [rawMessages, pendingMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const ensureArchitectFeed = useCallback(async () => {
    try {
      await createFeed(AI_ARCHITECT_FEED_ID);
    } catch (err) {
      if (!isAlreadyExistsError(err)) {
        console.warn("ai-sidebar: createFeed(ai-architect) failed", err);
      }
    }
  }, [createFeed]);

  const ensureStatusFeed = useCallback(async () => {
    try {
      await createFeed(AI_STATUS_FEED_ID);
    } catch (err) {
      if (!isAlreadyExistsError(err)) {
        console.warn(
          "ai-sidebar: createFeed(ai-status-feed) failed",
          err,
        );
      }
    }
  }, [createFeed]);

  const publishArchitectMessage = useCallback(
    async (msg: AiChatMessage, id?: string): Promise<boolean> => {
      const options = { id, createdAt: msg.timestamp };
      try {
        await createFeedMessage(AI_ARCHITECT_FEED_ID, msg, options);
        return true;
      } catch (firstErr) {
        console.warn(
          "ai-sidebar: createFeedMessage(ai-architect) failed, retrying",
          firstErr,
        );
        await ensureArchitectFeed();
        try {
          await createFeedMessage(AI_ARCHITECT_FEED_ID, msg, options);
          return true;
        } catch (retryErr) {
          console.warn(
            "ai-sidebar: createFeedMessage(ai-architect) retry failed",
            retryErr,
          );
          return false;
        }
      }
    },
    [createFeedMessage, ensureArchitectFeed],
  );

  const publishStatus = useCallback(
    async (payload: AiStatusFeedPayload) => {
      try {
        await createFeedMessage(AI_STATUS_FEED_ID, payload);
      } catch (firstErr) {
        console.warn(
          "ai-sidebar: createFeedMessage(ai-status-feed) failed, retrying",
          firstErr,
        );
        await ensureStatusFeed();
        try {
          await createFeedMessage(AI_STATUS_FEED_ID, payload);
        } catch (retryErr) {
          console.warn(
            "ai-sidebar: createFeedMessage(ai-status-feed) retry failed",
            retryErr,
          );
        }
      }
    },
    [createFeedMessage, ensureStatusFeed],
  );

  const resetTextareaHeight = useCallback(() => {
    if (textareaRef.current) textareaRef.current.style.height = "72px";
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isBusy) return;

    setIsSubmitting(true);
    setChatError(null);

    const now = Date.now();
    const optimisticId = `local-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const userMessage: AiChatMessage = {
      sender: senderName,
      role: "user",
      content: text,
      timestamp: now,
    };

    // Render the user's bubble immediately so they don't see an empty list
    // while we round-trip the feed write. Stale entries (already present in
    // rawMessages) are dropped here so pendingMessages doesn't grow forever.
    setPendingMessages((prev) => [
      ...prev.filter((p) => !rawMessages?.some((m) => m.id === p.id)),
      { id: optimisticId, data: userMessage, createdAt: now },
    ]);
    setInput("");
    resetTextareaHeight();

    const history: AiChatMessage[] = entries
      .slice(-HISTORY_LIMIT)
      .map((e) => e.data);

    const chatWriteOk = await publishArchitectMessage(userMessage, optimisticId);
    if (!chatWriteOk) {
      setChatError(
        "Couldn't send your message — Phantom AI will still try to respond.",
      );
    }

    void publishStatus({
      kind: "architect",
      status: "started",
      text,
    });

    try {
      const res = await fetch("/api/ai/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId, history }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(
          detail || `Failed to start request (status ${res.status}).`,
        );
      }
      const data = (await res.json()) as {
        runId: string;
        publicToken: string;
      };
      if (!data.runId || !data.publicToken) {
        throw new Error("Server did not return a runId and publicToken.");
      }

      setActiveRun({ runId: data.runId, publicToken: data.publicToken });
      void publishStatus({
        kind: "architect",
        status: "processing",
        runId: data.runId,
        text: "Phantom AI is thinking...",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setChatError(message);
      await publishArchitectMessage({
        sender: AI_SENDER_NAME,
        role: "assistant",
        content: message,
        timestamp: Date.now(),
      });
      void publishStatus({
        kind: "architect",
        status: "failed",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    input,
    isBusy,
    senderName,
    projectId,
    roomId,
    entries,
    rawMessages,
    resetTextareaHeight,
    publishArchitectMessage,
    publishStatus,
  ]);

  const handleProcessing = useCallback(
    (runId: string, message: string) => {
      void publishStatus({
        kind: "architect",
        status: "processing",
        runId,
        text: message,
      });
    },
    [publishStatus],
  );

  const handleCompleted = useCallback(
    (runId: string, summary: string) => {
      const now = Date.now();
      const replyId = `architect-reply-${runId}`;
      const replyMessage: AiChatMessage = {
        sender: AI_SENDER_NAME,
        role: "assistant",
        content: summary,
        timestamp: now,
      };

      // Render the reply immediately — don't wait on the feed round-trip,
      // which would otherwise leave the conversation silent if the write
      // is slow or the feed read doesn't reconcile before activeRun clears.
      setPendingMessages((prev) => [
        ...prev,
        { id: replyId, data: replyMessage, createdAt: now },
      ]);

      void publishStatus({
        kind: "architect",
        status: "completed",
        runId,
        text: summary,
      });

      void publishArchitectMessage(replyMessage, replyId).then((ok) => {
        if (!ok) {
          setChatError(
            "Phantom AI replied, but the message couldn't be saved to the shared chat.",
          );
        }
      });

      setActiveRun((cur) => (cur && cur.runId === runId ? null : cur));
    },
    [publishArchitectMessage, publishStatus],
  );

  const handleFailed = useCallback(
    (runId: string, message: string) => {
      const now = Date.now();
      const replyId = `architect-failed-${runId}`;
      const replyMessage: AiChatMessage = {
        sender: AI_SENDER_NAME,
        role: "assistant",
        content: message,
        timestamp: now,
      };

      setPendingMessages((prev) => [
        ...prev,
        { id: replyId, data: replyMessage, createdAt: now },
      ]);

      void publishStatus({
        kind: "architect",
        status: "failed",
        runId,
        text: message,
      });

      void publishArchitectMessage(replyMessage, replyId).then((ok) => {
        if (!ok) {
          setChatError(
            "Phantom AI's error message couldn't be saved to the shared chat.",
          );
        }
      });

      setActiveRun((cur) => (cur && cur.runId === runId ? null : cur));
    },
    [publishArchitectMessage, publishStatus],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "72px";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    },
    [],
  );

  const handleChip = useCallback(
    (chip: string) => {
      setInput(chip);
      resetTextareaHeight();
      textareaRef.current?.focus();
    },
    [resetTextareaHeight],
  );

  const showStatusStrip =
    sharedStatus !== null && isAiTaskActive(sharedStatus.payload);

  const emptyState = (
    <div className="flex flex-col items-center gap-4 pt-6 text-center">
      <Bot className="h-8 w-8 text-copy-faint" />
      <p className="text-sm leading-relaxed text-copy-muted">
        Describe a system to design it, ask Phantom AI to tweak the canvas,
        or just discuss the design.
      </p>
      <div className="mt-1 flex w-full flex-col gap-2">
        {STARTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            className="rounded-full bg-subtle px-4 py-2 text-left text-xs text-ai-text transition-colors hover:bg-surface-border-subtle"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {activeRun && (
        <ActiveRunSubscriber<typeof architectAgentTask>
          runId={activeRun.runId}
          publicToken={activeRun.publicToken}
          onProcessing={handleProcessing}
          onCompleted={handleCompleted}
          onFailed={handleFailed}
        />
      )}

      <ChatMessageList
        entries={entries}
        selfName={senderName}
        emptyState={emptyState}
        scrollRef={scrollRef}
      />

      {showStatusStrip && sharedStatus && (
        <ActiveStatusStrip status={sharedStatus.payload} />
      )}

      <div className="shrink-0 border-t border-surface-border p-3">
        {chatError && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-state-error">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate">{chatError}</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isBusy
                ? "Phantom AI is working..."
                : "Ask Phantom AI..."
            }
            disabled={isBusy}
            className="flex-1 resize-none border-surface-border bg-subtle text-sm text-copy-primary placeholder:text-copy-faint focus-visible:ring-brand/50 disabled:opacity-60"
            style={{
              minHeight: "72px",
              maxHeight: "160px",
              height: "72px",
            }}
          />
          <Button
            size="icon"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isBusy}
            aria-busy={isBusy}
            className="h-9 w-9 shrink-0 bg-brand text-white hover:bg-brand/90 disabled:opacity-40"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

function RoomChatTab() {
  const self = useSelf();
  const senderName =
    self?.info?.displayName?.trim() || self?.id || "Anonymous";

  const { messages: rawMessages } = useFeedMessages(AI_CHAT_FEED_ID);
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ChatEntry[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = useMemo<ChatEntry[]>(() => {
    const map = new Map<string, ChatEntry>();
    if (rawMessages) {
      for (const m of rawMessages) {
        if (!isAiChatMessage(m.data)) continue;
        map.set(m.id, { id: m.id, data: m.data, createdAt: m.createdAt });
      }
    }
    for (const p of pending) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    const list = Array.from(map.values());
    list.sort((a, b) => a.createdAt - b.createdAt);
    return list;
  }, [rawMessages, pending]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const ensureChatFeed = useCallback(async () => {
    try {
      await createFeed(AI_CHAT_FEED_ID);
    } catch (err) {
      if (!isAlreadyExistsError(err)) {
        console.warn("ai-sidebar: createFeed(ai-chat) failed", err);
      }
    }
  }, [createFeed]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;

    const now = Date.now();
    const optimisticId = `local-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const payload: AiChatMessage = {
      sender: senderName,
      role: "user",
      content,
      timestamp: now,
    };

    setSending(true);
    setError(null);
    setPending((prev) => [
      ...prev.filter((p) => !rawMessages?.some((m) => m.id === p.id)),
      { id: optimisticId, data: payload, createdAt: now },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "72px";

    const feedOptions = { id: optimisticId, createdAt: now };
    try {
      await createFeedMessage(AI_CHAT_FEED_ID, payload, feedOptions);
    } catch (firstErr) {
      console.warn(
        "ai-sidebar: createFeedMessage(ai-chat) failed in chat tab, retrying",
        firstErr,
      );
      try {
        await ensureChatFeed();
        await createFeedMessage(AI_CHAT_FEED_ID, payload, feedOptions);
      } catch (retryErr) {
        console.warn(
          "ai-sidebar: createFeedMessage(ai-chat) retry failed in chat tab",
          retryErr,
        );
        const message =
          retryErr instanceof Error
            ? retryErr.message
            : "Could not send message.";
        setError(message);
        // Drop the optimistic entry so the user can retry without dupes.
        setPending((prev) => prev.filter((p) => p.id !== optimisticId));
      }
    } finally {
      setSending(false);
    }
  }, [input, sending, senderName, rawMessages, createFeedMessage, ensureChatFeed]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "72px";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    },
    [],
  );

  const emptyState = (
    <div className="flex flex-col items-center gap-3 pt-6 text-center">
      <MessageSquare className="h-8 w-8 text-copy-faint" />
      <p className="text-sm leading-relaxed text-copy-muted">
        No messages yet. Start a conversation with everyone in this room.
      </p>
    </div>
  );

  return (
    <>
      <ChatMessageList
        entries={entries}
        selfName={senderName}
        emptyState={emptyState}
        scrollRef={scrollRef}
      />

      <div className="shrink-0 border-t border-surface-border p-3">
        {error && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-state-error">
            <AlertCircle className="h-3 w-3" />
            <span className="truncate">{error}</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              sending ? "Sending..." : "Message the room..."
            }
            disabled={sending}
            className="flex-1 resize-none border-surface-border bg-subtle text-sm text-copy-primary placeholder:text-copy-faint focus-visible:ring-brand/50 disabled:opacity-60"
            style={{
              minHeight: "72px",
              maxHeight: "160px",
              height: "72px",
            }}
          />
          <Button
            size="icon"
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            aria-busy={sending}
            className="h-9 w-9 shrink-0 bg-brand text-white hover:bg-brand/90 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
