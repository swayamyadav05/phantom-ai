"use client";

import { useState, useRef, useCallback } from "react";
import { Bot, X, FileText, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetHeight = useCallback(() => {
    if (textareaRef.current)
      textareaRef.current.style.height = "72px";
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), role: "user", content: text },
    ]);
    setInput("");
    resetHeight();
  }, [input, resetHeight]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
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
      resetHeight();
      textareaRef.current?.focus();
    },
    [resetHeight],
  );

  return (
    <aside
      className={`fixed top-12 right-0 z-40 flex h-[calc(100vh-3rem)] w-80 flex-col border-l border-surface-border bg-base/95 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
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
          className="h-7 w-7 text-copy-muted hover:text-copy-primary">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="architect"
        className="flex flex-1 flex-col overflow-hidden gap-0 min-h-0">
        <div className="shrink-0 px-4 pt-3 pb-2">
          <TabsList className="w-full bg-subtle rounded-md h-8">
            <TabsTrigger
              value="architect"
              className="flex-1 text-xs text-copy-muted data-active:bg-elevated data-active:text-ai-text">
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 text-xs text-copy-muted data-active:bg-elevated data-active:text-ai-text">
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect tab */}
        <TabsContent
          value="architect"
          className="flex flex-1 flex-col overflow-hidden min-h-0 mt-0">
          {/* Chat scroll area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-4 pt-6 text-center">
                <Bot className="h-8 w-8 text-copy-faint" />
                <p className="text-sm leading-relaxed text-copy-muted">
                  Describe your system and Phantom AI will design it
                  for you.
                </p>
                <div className="mt-1 flex w-full flex-col gap-2">
                  {STARTER_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChip(chip)}
                      className="rounded-full bg-subtle px-4 py-2 text-left text-xs text-ai-text transition-colors hover:bg-surface-border-subtle">
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-lg border-2 border-brand/50 bg-accent-dim px-3 py-2 text-sm text-copy-primary">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg border border-surface-border bg-elevated px-3 py-2 text-sm text-ai-text">
                        {msg.content}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-surface-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Phantom AI..."
                className="flex-1 resize-none border-surface-border bg-subtle text-sm text-copy-primary placeholder:text-copy-faint focus-visible:ring-brand/50"
                style={{
                  minHeight: "72px",
                  maxHeight: "160px",
                  height: "72px",
                }}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-9 w-9 shrink-0 bg-brand text-white hover:bg-brand/90 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent
          value="specs"
          className="flex flex-1 flex-col overflow-hidden min-h-0 mt-0 px-4 py-3">
          <Button className="mb-4 w-full shrink-0 bg-brand text-white hover:bg-brand/90">
            Generate Spec
          </Button>

          <div className="rounded-lg border border-surface-border bg-elevated p-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-ai-text" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-copy-primary">
                  System Architecture Spec
                </p>
                <p className="mt-1 line-clamp-3 text-xs text-copy-muted">
                  Microservices design with API gateway, event bus,
                  and distributed data stores. Covers service
                  boundaries, communication patterns, and deployment
                  topology.
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="cursor-not-allowed text-copy-faint opacity-50">
                <Download className="mr-1.5 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
