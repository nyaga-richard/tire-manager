"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";

/* =======================
   Types
======================= */

type WheelSide = "left" | "right";
type WheelPosition = "single" | "inner" | "outer";

interface WheelProps {
  id: string;
  x: number;
  y: number;
  side: WheelSide;
  position: WheelPosition;
  axleNumber: number;
  isSelected?: boolean;
  onClick: (id: string) => void;
  showLabels: boolean;
  selectable: boolean;
}

interface AxleRowProps {
  axleNumber: number;
  y: number;
  diagramWidth: number;
  wheelSelections: Record<string, boolean>;
  wheelStatuses: Record<string, string>;
  onWheelClick: (wheelId: string) => void;
  showLabels: boolean;
  selectable: boolean;
}

interface TruckWheelDiagramProps {
  axles?: number;
  wheelStatuses?: Record<string, string>;
  onWheelSelect?: (data: {
    wheelId: string;
    axle: number;
    side: WheelSide;
    position: WheelPosition;
  }) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  showLabels?: boolean;
}

/* =======================
   Wheel Component
======================= */

const Wheel = memo(
  ({
    id,
    x,
    y,
    side,
    position,
    axleNumber,
    isSelected = false,
    onClick,
    showLabels,
    selectable,
  }: WheelProps) => {
    const wheelWidth = 24;
    const wheelHeight = 40;

    const handleClick = () => {
      if (selectable) onClick(id);
    };

    const label =
      position === "single"
        ? side.toUpperCase()
        : `${side === "left" ? "L" : "R"}${
            position === "inner" ? "I" : "O"
          }`;

    return (
      <g
        onClick={handleClick}
        style={{ cursor: selectable ? "pointer" : "default" }}
      >
        <rect
          x={x - wheelWidth / 2}
          y={y - wheelHeight / 2}
          width={wheelWidth}
          height={wheelHeight}
          rx={4}
          fill={isSelected ? "rgba(0, 100, 255, 0.2)" : "white"}
          stroke={isSelected ? "#0066ff" : "#333"}
          strokeWidth={isSelected ? 2 : 1}
        />
        {showLabels && (
          <text
            x={x}
            y={y + wheelHeight / 2 + 12}
            textAnchor="middle"
            fill="#666"
            fontSize={10}
          >
            {label}
          </text>
        )}
      </g>
    );
  }
);

Wheel.displayName = "Wheel";

/* =======================
   Axle Row
======================= */

const AxleRow = memo(
  ({
    axleNumber,
    y,
    diagramWidth,
    wheelSelections,
    wheelStatuses,
    onWheelClick,
    showLabels,
    selectable,
  }: AxleRowProps) => {
    const centerX = diagramWidth / 2;
    const offset = 80;

    const wheels =
      axleNumber === 1
        ? [
            {
              id: `A${axleNumber}-L`,
              x: centerX - offset,
              side: "left" as WheelSide,
              position: "single" as WheelPosition,
            },
            {
              id: `A${axleNumber}-R`,
              x: centerX + offset,
              side: "right" as WheelSide,
              position: "single" as WheelPosition,
            },
          ]
        : [
            {
              id: `A${axleNumber}-L-Outer`,
              x: centerX - offset,
              side: "left" as WheelSide,
              position: "outer" as WheelPosition,
            },
            {
              id: `A${axleNumber}-L-Inner`,
              x: centerX - offset / 2,
              side: "left" as WheelSide,
              position: "inner" as WheelPosition,
            },
            {
              id: `A${axleNumber}-R-Inner`,
              x: centerX + offset / 2,
              side: "right" as WheelSide,
              position: "inner" as WheelPosition,
            },
            {
              id: `A${axleNumber}-R-Outer`,
              x: centerX + offset,
              side: "right" as WheelSide,
              position: "outer" as WheelPosition,
            },
          ];

    return (
      <g>
        <line
          x1={centerX - offset * 1.3}
          x2={centerX + offset * 1.3}
          y1={y}
          y2={y}
          stroke="#333"
          strokeWidth={2}
        />
        <text
          x={centerX}
          y={y - 25}
          textAnchor="middle"
          fontSize={12}
          fontWeight="bold"
        >
          Axle {axleNumber}
        </text>

        {wheels.map((wheel) => (
          <Wheel
            key={wheel.id}
            {...wheel}
            y={y}
            axleNumber={axleNumber}
            isSelected={wheelSelections[wheel.id]}
            onClick={onWheelClick}
            showLabels={showLabels}
            selectable={selectable}
          />
        ))}
      </g>
    );
  }
);

AxleRow.displayName = "AxleRow";

/* =======================
   Helpers
======================= */

const CenterLine = ({ width, height }: { width: number; height: number }) => (
  <line
    x1={width / 2}
    y1={0}
    x2={width / 2}
    y2={height}
    stroke="#ccc"
    strokeDasharray="5,5"
  />
);

const FrontRearLabels = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => (
  <>
    <text x={width / 2} y={20} textAnchor="middle" fontWeight="bold">
      FRONT
    </text>
    <text
      x={width / 2}
      y={height - 10}
      textAnchor="middle"
      fontWeight="bold"
    >
      REAR
    </text>
  </>
);

/* =======================
   Main Component
======================= */

export default function TruckWheelDiagram({
  axles = 3,
  wheelStatuses = {},
  onWheelSelect = () => {},
  selectable = true,
  multiSelect = false,
  showLabels = true,
}: TruckWheelDiagramProps) {
  const [selectedWheels, setSelectedWheels] = useState<
    Record<string, boolean>
  >({});

  const diagramWidth = 400;
  const diagramHeight = 600;
  const axleSpacing = diagramHeight / (axles + 1);

  const handleWheelClick = useCallback(
    (wheelId: string) => {
      setSelectedWheels((prev) => {
        const next = multiSelect
          ? { ...prev, [wheelId]: !prev[wheelId] }
          : { [wheelId]: true };

        const match = wheelId.match(/A(\d+)-([LR])(?:-(Inner|Outer))?/);
        if (match) {
          const axle = Number(match[1]);
          const side: WheelSide = match[2] === "L" ? "left" : "right";
          const position: WheelPosition = match[3]
            ? (match[3].toLowerCase() as WheelPosition)
            : "single";

          onWheelSelect({ wheelId, axle, side, position });
        }

        return next;
      });
    },
    [multiSelect, onWheelSelect]
  );

  const axleRows = useMemo(
    () =>
      Array.from({ length: axles }, (_, i) => (
        <AxleRow
          key={i}
          axleNumber={i + 1}
          y={axleSpacing * (i + 1)}
          diagramWidth={diagramWidth}
          wheelSelections={selectedWheels}
          wheelStatuses={wheelStatuses}
          onWheelClick={handleWheelClick}
          showLabels={showLabels}
          selectable={selectable}
        />
      )),
    [
      axles,
      axleSpacing,
      selectedWheels,
      wheelStatuses,
      handleWheelClick,
      showLabels,
      selectable,
    ]
  );

  return (
    <div className="truck-wheel-diagram-container">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${diagramWidth} ${diagramHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <CenterLine width={diagramWidth} height={diagramHeight} />
        <FrontRearLabels width={diagramWidth} height={diagramHeight} />
        {axleRows}
      </svg>
    </div>
  );
}
