"use client";

import { useEffect, useRef, useState } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode } from "@/types/canvas";
import { useCanvasActions } from "@/components/editor/canvas-actions-context";

function getTextColor(fill: string): string {
  const match = NODE_COLORS.find((c) => c.fill === fill);
  return match?.text ?? "#E2E8F0";
}

const SW = 1.5;
const PAD = 1;
const MIN_W = 60;
const MIN_H = 40;

const RESIZE_HANDLE_STYLE: React.CSSProperties = {
  width: 8,
  height: 8,
  background: "#1C2532",
  border: "1px solid #324054",
  borderRadius: 2,
};

const RESIZE_LINE_STYLE: React.CSSProperties = {
  borderColor: "#253040",
  borderWidth: 1,
};

interface SvgShapeProps {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  label: string;
  textColor: string;
  hideLabel?: boolean;
}

const SVG_TEXT_STYLE: React.CSSProperties = { userSelect: "none" };
const FONT = "var(--font-inter, sans-serif)";

function DiamondShape({
  width,
  height,
  fill,
  stroke,
  label,
  textColor,
  hideLabel,
}: SvgShapeProps) {
  const cx = width / 2;
  const cy = height / 2;
  const pts = `${cx},${PAD} ${width - PAD},${cy} ${cx},${height - PAD} ${PAD},${cy}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}>
      <polygon
        points={pts}
        fill={fill}
        stroke={stroke}
        strokeWidth={SW}
      />
      {!hideLabel && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={12}
          fontFamily={FONT}
          style={SVG_TEXT_STYLE}
          opacity={label ? 1 : 0.4}>
          {label || "Label"}
        </text>
      )}
    </svg>
  );
}

function HexagonShape({
  width,
  height,
  fill,
  stroke,
  label,
  textColor,
  hideLabel,
}: SvgShapeProps) {
  const x1 = width * 0.25 + PAD;
  const x2 = width * 0.75 - PAD;
  const cy = height / 2;
  const pts = `${x1},${PAD} ${x2},${PAD} ${width - PAD},${cy} ${x2},${height - PAD} ${x1},${height - PAD} ${PAD},${cy}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}>
      <polygon
        points={pts}
        fill={fill}
        stroke={stroke}
        strokeWidth={SW}
      />
      {!hideLabel && (
        <text
          x={width / 2}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={12}
          fontFamily={FONT}
          style={SVG_TEXT_STYLE}
          opacity={label ? 1 : 0.4}>
          {label || "Label"}
        </text>
      )}
    </svg>
  );
}

function CylinderShape({
  width,
  height,
  fill,
  stroke,
  label,
  textColor,
  hideLabel,
}: SvgShapeProps) {
  const capRy = Math.max(Math.round(height * 0.18), 8);
  const rx = width / 2 - PAD;
  const cx = width / 2;
  const top = capRy;
  const bottom = height - capRy;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}>
      <rect
        x={PAD}
        y={top}
        width={width - PAD * 2}
        height={bottom - top}
        fill={fill}
        stroke={stroke}
        strokeWidth={SW}
      />
      <ellipse
        cx={cx}
        cy={bottom}
        rx={rx}
        ry={capRy}
        fill={fill}
        stroke={stroke}
        strokeWidth={SW}
      />
      <ellipse
        cx={cx}
        cy={top}
        rx={rx}
        ry={capRy}
        fill={fill}
        stroke={stroke}
        strokeWidth={SW}
      />
      {!hideLabel && (
        <text
          x={cx}
          y={(top + bottom) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={12}
          fontFamily={FONT}
          style={SVG_TEXT_STYLE}
          opacity={label ? 1 : 0.4}>
          {label || "Label"}
        </text>
      )}
    </svg>
  );
}

function SwatchButton({
  fill,
  textColor,
  isActive,
  onClick,
}: {
  fill: string;
  textColor: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        backgroundColor: fill,
        border: isActive ? `2px solid ${textColor}` : "2px solid rgba(255,255,255,0.12)",
        boxSizing: "border-box",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        boxShadow: hovered ? `0 0 5px 2px ${textColor}55` : "none",
        transition: "box-shadow 0.12s ease",
      }}
    />
  );
}

function ColorToolbar({
  nodeId,
  activeFill,
}: {
  nodeId: string;
  activeFill: string;
}) {
  const { updateNodeColor } = useCanvasActions();
  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div
      style={{
        position: "absolute",
        top: -8,
        left: "50%",
        transform: "translate(-50%, -100%)",
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        background: "#151C26",
        border: "1px solid #253040",
        borderRadius: 9999,
        zIndex: 20,
        pointerEvents: "all",
        whiteSpace: "nowrap",
      }}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      onClick={stopPropagation}
    >
      {NODE_COLORS.map(({ fill, text }) => (
        <SwatchButton
          key={fill}
          fill={fill}
          textColor={text}
          isActive={fill === activeFill}
          onClick={() => updateNodeColor(nodeId, fill)}
        />
      ))}
    </div>
  );
}

function LabelEditor({
  initialValue,
  textColor,
  fill,
  borderRadius,
  svgShape,
  onCommit,
  onAbort,
}: {
  initialValue: string;
  textColor: string;
  fill: string;
  borderRadius: string;
  svgShape?: boolean;
  onCommit: (value: string) => void;
  onAbort: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, []);

  const stopEvents = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: svgShape ? undefined : borderRadius,
        background: svgShape ? "transparent" : fill,
        zIndex: 10,
      }}
      onMouseDown={stopEvents}
      onPointerDown={stopEvents}>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        placeholder="Label"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onCommit(value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") {
            e.preventDefault();
            onAbort();
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onCommit(value);
          }
        }}
        onMouseDown={stopEvents}
        onPointerDown={stopEvents}
        style={{
          position: "absolute",
          top: "50%",
          left: 8,
          right: 8,
          transform: "translateY(-50%)",
          background: svgShape ? fill : "transparent",
          color: textColor,
          border: "none",
          outline: "none",
          borderRadius: svgShape ? "4px" : undefined,
          resize: "none",
          textAlign: "center",
          fontSize: 12,
          fontFamily: FONT,
          lineHeight: "1.4",
          padding: svgShape ? "4px 0" : 0,
          overflow: "hidden",
          cursor: "text",
        }}
      />
    </div>
  );
}

export function CanvasNodeRenderer({
  id,
  data,
  selected,
  width = 160,
  height = 80,
}: NodeProps<CanvasNode>) {
  const { updateNodeLabel } = useCanvasActions();
  const [editing, setEditing] = useState(false);

  const textColor = getTextColor(data.color);
  const strokeColor = selected
    ? "var(--accent-primary)"
    : "var(--border-default)";
  const borderRadius =
    data.shape === "pill" || data.shape === "circle"
      ? "9999px"
      : "6px";

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const commitEdit = (value: string) => {
    setEditing(false);
    updateNodeLabel(id, value);
  };

  const abortEdit = () => {
    setEditing(false);
  };

  const handles = (
    <>
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
    </>
  );

  const resizer = (
    <NodeResizer
      isVisible={selected}
      minWidth={MIN_W}
      minHeight={MIN_H}
      handleStyle={RESIZE_HANDLE_STYLE}
      lineStyle={RESIZE_LINE_STYLE}
    />
  );

  const isSvgShape =
    data.shape === "diamond" ||
    data.shape === "hexagon" ||
    data.shape === "cylinder";

  const editorOverlay = editing ? (
    <LabelEditor
      initialValue={data.label}
      textColor={textColor}
      fill={data.color}
      borderRadius={borderRadius}
      svgShape={isSvgShape}
      onCommit={commitEdit}
      onAbort={abortEdit}
    />
  ) : null;

  const svgProps: SvgShapeProps = {
    width,
    height,
    fill: data.color,
    stroke: strokeColor,
    label: data.label,
    textColor,
    hideLabel: editing,
  };

  const colorToolbar =
    selected && !editing ? (
      <ColorToolbar nodeId={id} activeFill={data.color} />
    ) : null;

  if (isSvgShape) {
    const ShapeComponent =
      data.shape === "diamond"
        ? DiamondShape
        : data.shape === "hexagon"
          ? HexagonShape
          : CylinderShape;

    return (
      <>
        {resizer}
        {handles}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
          onDoubleClick={handleDoubleClick}>
          {colorToolbar}
          <ShapeComponent {...svgProps} />
          {editorOverlay}
        </div>
      </>
    );
  }

  return (
    <>
      {resizer}
      {handles}
      <div
        className="flex h-full w-full items-center justify-center text-sm"
        style={{
          position: "relative",
          backgroundColor: data.color,
          color: textColor,
          border: `${SW}px solid ${strokeColor}`,
          borderRadius,
          boxSizing: "border-box",
        }}
        onDoubleClick={handleDoubleClick}>
        {colorToolbar}
        {!editing && (
          <span
            className="select-none px-2 text-center"
            style={{ opacity: data.label ? 1 : 0.4 }}>
            {data.label || "Label"}
          </span>
        )}
        {editorOverlay}
      </div>
    </>
  );
}
