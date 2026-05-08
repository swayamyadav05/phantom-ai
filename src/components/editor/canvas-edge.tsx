"use client";

import { useEffect, useRef, useState } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Minus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CanvasEdge, CanvasEdgeDirection } from "@/types/canvas";
import { useCanvasActions } from "@/components/editor/canvas-actions-context";

const STROKE_REST = "#475569";
const STROKE_ACTIVE = "#94a3b8";

const DIRECTION_OPTIONS: {
  value: CanvasEdgeDirection;
  icon: LucideIcon;
  label: string;
}[] = [
  { value: "forward", icon: ArrowRight, label: "Forward" },
  { value: "backward", icon: ArrowLeft, label: "Backward" },
  { value: "both", icon: ArrowLeftRight, label: "Bidirectional" },
  { value: "none", icon: Minus, label: "No arrows" },
];

function DirectionToolbar({
  edgeId,
  active,
}: {
  edgeId: string;
  active: CanvasEdgeDirection;
}) {
  const { updateEdgeDirection } = useCanvasActions();
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div
      className="nodrag nopan"
      onMouseDown={stop}
      onPointerDown={stop}
      onClick={stop}
      onDoubleClick={stop}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        background: "#151C26",
        border: "1px solid #253040",
        borderRadius: 9999,
        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
      }}>
      {DIRECTION_OPTIONS.map(({ value, icon: Icon, label }) => {
        const isActive = value === active;
        return (
          <button
            key={value}
            type="button"
            title={label}
            onClick={(e) => {
              e.stopPropagation();
              updateEdgeDirection(edgeId, value);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              padding: 0,
              border: "none",
              borderRadius: 9999,
              background: isActive ? "#253040" : "transparent",
              color: isActive ? "#f8fafc" : "#94a3b8",
              cursor: "pointer",
              transition: "background 0.12s ease, color 0.12s ease",
            }}>
            <Icon size={12} />
          </button>
        );
      })}
    </div>
  );
}

function LabelInput({
  initialValue,
  onCommit,
  onAbort,
}: {
  initialValue: string;
  onCommit: (v: string) => void;
  onAbort: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  const commitOnce = (v: string) => {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit(v);
  };

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <input
      ref={ref}
      value={value}
      placeholder="Label"
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => commitOnce(value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          onAbort();
        }
        if (e.key === "Enter") {
          e.preventDefault();
          commitOnce(value);
        }
      }}
      onMouseDown={stop}
      onPointerDown={stop}
      onClick={stop}
      style={{
        background: "#151C26",
        color: "#f8fafc",
        border: "1px solid #ff6b4a",
        borderRadius: 9999,
        padding: "2px 10px",
        fontSize: 11,
        fontFamily: "var(--font-inter, sans-serif)",
        outline: "none",
        minWidth: 64,
        width: `${Math.max(64, value.length * 7 + 24)}px`,
        textAlign: "center",
        cursor: "text",
        transition: "width 0.1s ease",
      }}
    />
  );
}

export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const { updateEdgeLabel } = useCanvasActions();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = selected || hovered;
  const stroke = isActive ? STROKE_ACTIVE : STROKE_REST;
  const direction: CanvasEdgeDirection = data?.direction ?? "forward";
  const endArrowId = isActive
    ? "canvas-edge-arrow-active"
    : "canvas-edge-arrow-rest";
  const startArrowId = isActive
    ? "canvas-edge-arrow-start-active"
    : "canvas-edge-arrow-start-rest";
  const showEndArrow =
    direction === "forward" || direction === "both";
  const showStartArrow =
    direction === "backward" || direction === "both";

  const commitLabel = (val: string) => {
    updateEdgeLabel(id, val);
    setEditing(false);
  };

  const stopAll = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      {/* Invisible wide hit area for hover and double-click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      />
      {/* Visible edge line */}
      <path
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        markerEnd={showEndArrow ? `url(#${endArrowId})` : undefined}
        markerStart={
          showStartArrow ? `url(#${startArrowId})` : undefined
        }
        style={{
          transition: "stroke 0.12s ease",
          pointerEvents: "none",
        }}
      />
      <EdgeLabelRenderer>
        {selected && !editing && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 28}px)`,
              pointerEvents: "all",
              zIndex: 11,
            }}
            className="nodrag nopan">
            <DirectionToolbar edgeId={id} active={direction} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
          className="nodrag nopan"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          onMouseDown={stopAll}>
          {editing ? (
            <LabelInput
              initialValue={data?.label ?? ""}
              onCommit={commitLabel}
              onAbort={() => setEditing(false)}
            />
          ) : data?.label ? (
            <span
              style={{
                background: "#151C26",
                color: "#94a3b8",
                border: "1px solid #253040",
                borderRadius: 9999,
                padding: "2px 8px",
                fontSize: 11,
                fontFamily: "var(--font-inter, sans-serif)",
                whiteSpace: "nowrap",
                userSelect: "none",
              }}>
              {data.label}
            </span>
          ) : isActive ? (
            <span
              style={{
                color: "#475569",
                fontSize: 11,
                fontFamily: "var(--font-inter, sans-serif)",
                userSelect: "none",
                pointerEvents: "none",
              }}>
              double-click to label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
