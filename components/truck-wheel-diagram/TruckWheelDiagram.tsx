import React, { useState, useCallback, useMemo } from "react";
import AxleRow, { Position } from "./AxleRow";

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

const FrontRearLabels = ({ width, height }: { width: number; height: number }) => (
  <>
    <text x={width / 2} y={15} textAnchor="middle" fontWeight="bold" fontSize="10">
      FRONT
    </text>
    <text x={width / 2} y={height - 5} textAnchor="middle" fontWeight="bold" fontSize="10">
      REAR
    </text>
  </>
);

/* =======================
   Main Component
======================= */
interface TruckWheelDiagramProps {
  positions: Position[];
  wheelStatuses?: Record<string, string>;
  onWheelSelect?: (data: {
    wheelId: string;
    axle: number;
    side: string;
    position: string;
  }) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  showLabels?: boolean;
  showAxleNumbers?: boolean;
}

const TruckWheelDiagram: React.FC<TruckWheelDiagramProps> = ({
  positions,
  wheelStatuses = {},
  onWheelSelect = () => {},
  selectable = true,
  multiSelect = false,
  showLabels = true,
  showAxleNumbers = true,
}) => {
  const [selectedWheels, setSelectedWheels] = useState<Record<string, boolean>>({});

  // Reduced diagram dimensions to fit without scrolling
  const diagramWidth = 320; // Reduced from 400
  const diagramHeight = 350; // Reduced from 600

  // Determine number of axles
  const axles = Math.max(...positions.map((p) => p.axle_number));
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
          const side = match[2] === "L" ? "left" : "right";
          const position = match[3] ? match[3].toLowerCase() : "single";

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
          key={i + 1}
          axleNumber={i + 1}
          y={axleSpacing * (i + 1)}
          diagramWidth={diagramWidth}
          wheelSelections={selectedWheels}
          wheelStatuses={wheelStatuses}
          positions={positions.filter(p => p.axle_number === i + 1)}
          onWheelClick={handleWheelClick}
          showLabels={showLabels}
          selectable={selectable}
          showAxleNumbers={showAxleNumbers}
        />
      )),
    [axles, axleSpacing, diagramWidth, selectedWheels, wheelStatuses, positions, handleWheelClick, showLabels, selectable, showAxleNumbers]
  );

  return (
    <div className="truck-wheel-diagram-container" style={{ width: "100%", height: "400px" }}>
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
};

export default TruckWheelDiagram;