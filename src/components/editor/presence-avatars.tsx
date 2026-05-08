"use client";

import { useState } from "react";
import { useOthers, shallow } from "@liveblocks/react/suspense";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

interface CollaboratorInfo {
  connectionId: number;
  name: string;
  avatarUrl: string;
  color: string;
}

const MAX_VISIBLE = 5;
const AVATAR_SIZE = 24;
const OVERLAP = 6;

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function CollaboratorAvatar({
  name,
  avatarUrl,
  color,
}: CollaboratorInfo) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          cursor: "default",
          boxShadow: "0 0 0 2px var(--bg-surface)",
        }}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}>
            {getInitials(name)}
          </div>
        )}
      </div>
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(13, 18, 26, 0.95)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            padding: "3px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10,
          }}>
          {name}
        </div>
      )}
    </div>
  );
}

function OverflowChip({ count }: { count: number }) {
  return (
    <div
      title={`${count} more collaborator${count > 1 ? "s" : ""}`}
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 600,
        color: "var(--text-secondary)",
        backgroundColor: "var(--bg-elevated)",
        boxShadow:
          "0 0 0 2px var(--bg-surface), inset 0 0 0 1px var(--border-default)",
      }}>
      +{count}
    </div>
  );
}

export function PresenceAvatars() {
  const others = useOthers(
    (all) =>
      all.map((o) => ({
        connectionId: o.connectionId,
        name: o.info?.displayName ?? "Collaborator",
        avatarUrl: o.info?.avatarUrl ?? "",
        color: o.info?.cursorColor ?? "var(--accent-primary)",
      })),
    shallow,
  );

  const visible = others.slice(0, MAX_VISIBLE);
  const overflow = others.length - MAX_VISIBLE;
  const hasCollaborators = others.length > 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 5px",
        backgroundColor: "rgba(13, 18, 26, 0.75)",
        backdropFilter: "blur(8px)",
        borderRadius: 999,
        border: "1px solid var(--border-default)",
      }}>
      {hasCollaborators && (
        <>
          <div style={{ display: "flex", alignItems: "center" }}>
            {visible.map((other, i) => (
              <div
                key={other.connectionId}
                style={{
                  marginLeft: i === 0 ? 0 : -OVERLAP,
                  zIndex: MAX_VISIBLE - i,
                  position: "relative",
                }}>
                <CollaboratorAvatar {...other} />
              </div>
            ))}
            {overflow > 0 && (
              <div
                style={{
                  marginLeft: -OVERLAP,
                  zIndex: 0,
                  position: "relative",
                }}>
                <OverflowChip count={overflow} />
              </div>
            )}
          </div>
          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: "var(--border-default)",
              flexShrink: 0,
            }}
          />
        </>
      )}
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: {
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
            },
          },
        }}
      />
    </div>
  );
}
