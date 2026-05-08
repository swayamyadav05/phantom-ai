"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CollaboratorData {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectSlug: string | null;
}

function CollaboratorAvatar({
  name,
  email,
  avatarUrl,
}: Pick<CollaboratorData, "name" | "email" | "avatarUrl">) {
  const initials = (name ?? email).slice(0, 2).toUpperCase();
  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-subtle">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name ?? email}
          width={28}
          height={28}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-copy-muted">
          {initials}
        </span>
      )}
    </div>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  projectSlug,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<
    CollaboratorData[]
  >([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removingEmail, setRemovingEmail] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setInviteEmail("");
      setInviteError(null);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/collaborators`,
        );
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as {
          collaborators: CollaboratorData[];
          isOwner: boolean;
        };
        if (cancelled) return;
        setCollaborators(data.collaborators);
        setIsOwner(data.isOwner);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail.trim() }),
        },
      );
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setInviteError(err.error ?? "Failed to invite collaborator.");
        return;
      }
      const newCollab = (await res.json()) as CollaboratorData;
      setCollaborators((prev) => [...prev, newCollab]);
      setInviteEmail("");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(email: string) {
    setRemovingEmail(email);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setCollaborators((prev) =>
          prev.filter((c) => c.email !== email),
        );
      }
    } finally {
      setRemovingEmail(null);
    }
  }

  function handleCopyLink() {
    const link = `${window.location.origin}/editor/${projectSlug ?? projectId}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current)
        clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(
        () => setCopied(false),
        2000,
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-lg max-w-3xl">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
        </DialogHeader>

        {/* Copy link */}
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate rounded-md border border-surface-border bg-elevated px-3 py-1.5 text-xs text-copy-muted">
            {typeof window !== "undefined"
              ? `${window.location.origin}/editor/${projectSlug ?? projectId}`
              : `…/editor/${projectSlug ?? projectId}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-state-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Invite form — owner only */}
        {isOwner && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Input
                placeholder="Invite by email"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !inviting)
                    void handleInvite();
                }}
                className="flex-1 text-foreground"
                disabled={inviting}
              />
              <Button
                size="default"
                onClick={() => void handleInvite()}
                disabled={!inviteEmail.trim() || inviting}
                className="shrink-0 gap-1.5">
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Invite
              </Button>
            </div>
            {inviteError && (
              <p className="text-xs text-state-error">
                {inviteError}
              </p>
            )}
          </div>
        )}

        {/* Collaborator list */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-copy-muted">
            {collaborators.length === 0
              ? "No collaborators yet"
              : "Collaborators"}
          </p>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-copy-faint" />
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {collaborators.map((c) => (
                <li
                  key={c.email}
                  className="flex items-center gap-2.5 rounded-md px-1.5 py-1">
                  <CollaboratorAvatar
                    name={c.name}
                    email={c.email}
                    avatarUrl={c.avatarUrl}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    {c.name && (
                      <span className="truncate text-xs font-medium text-copy-primary">
                        {c.name}
                      </span>
                    )}
                    <span className="truncate text-xs text-copy-muted">
                      {c.email}
                    </span>
                  </div>
                  {isOwner && (
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => void handleRemove(c.email)}
                      disabled={removingEmail === c.email}
                      aria-label={`Remove ${c.email}`}>
                      {removingEmail === c.email ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-copy-faint" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-state-error" />
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
