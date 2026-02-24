import React from "react";
import Wheel from "./Wheel";
import { useTheme } from "@/contexts/ThemeContext";

export interface Position {
  position_code: string;
  position_name: string;
  axle_number: number;
}

interface WheelConfig {
  id: string;
  x: number;
  side: "left" | "right";
  position: "single" | "inner" | "outer";
  position_code: string;
}

interface AxleRowProps {
  axleNumber: number;
  y: number;
  diagramWidth: number;
  wheelSelections: Record<string, boolean>;
  wheelStatuses: Record<string, string>;
  positions: Position[];
  onWheelClick: (wheelId: string, x: number, y: number) => void;
  showLabels: boolean;
  selectable: boolean;
  showAxleNumbers: boolean;
}

const AxleRow: React.FC<AxleRowProps> = ({
  axleNumber,
  y,
  diagramWidth,
  wheelSelections,
  wheelStatuses,
  positions,
  onWheelClick,
  showLabels,
  selectable,
  showAxleNumbers,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const centerX = diagramWidth / 2;
  const offset = 60;

  // Theme-aware colors
  const colors = {
    axleLine: isDark ? "#6b7280" : "#333", // gray-500 : gray-800
    axleNumber: isDark ? "#9ca3af" : "#333", // gray-400 : gray-800
  };

  const getWheelsForAxle = (): WheelConfig[] => {
    const leftPositions = positions.filter(p => 
      p.position_name.toLowerCase().includes("left")
    );
    const rightPositions = positions.filter(p => 
      p.position_name.toLowerCase().includes("right")
    );

    const wheels: WheelConfig[] = [];

    // Left side wheels
    if (leftPositions.length === 1) {
      wheels.push({
        id: `A${axleNumber}-L`,
        x: centerX - offset,
        side: "left",
        position: "single",
        position_code: leftPositions[0].position_code
      });
    } else if (leftPositions.length === 2) {
      const innerPos = leftPositions.find(p => p.position_name.toLowerCase().includes("inner"));
      const outerPos = leftPositions.find(p => p.position_name.toLowerCase().includes("outer"));
      
      if (outerPos) {
        wheels.push({
          id: `A${axleNumber}-L-Outer`,
          x: centerX - offset,
          side: "left",
          position: "outer",
          position_code: outerPos.position_code
        });
      }
      if (innerPos) {
        wheels.push({
          id: `A${axleNumber}-L-Inner`,
          x: centerX - offset / 2,
          side: "left",
          position: "inner",
          position_code: innerPos.position_code
        });
      }
    }

    // Right side wheels
    if (rightPositions.length === 1) {
      wheels.push({
        id: `A${axleNumber}-R`,
        x: centerX + offset,
        side: "right",
        position: "single",
        position_code: rightPositions[0].position_code
      });
    } else if (rightPositions.length === 2) {
      const innerPos = rightPositions.find(p => p.position_name.toLowerCase().includes("inner"));
      const outerPos = rightPositions.find(p => p.position_name.toLowerCase().includes("outer"));
      
      if (innerPos) {
        wheels.push({
          id: `A${axleNumber}-R-Inner`,
          x: centerX + offset / 2,
          side: "right",
          position: "inner",
          position_code: innerPos.position_code
        });
      }
      if (outerPos) {
        wheels.push({
          id: `A${axleNumber}-R-Outer`,
          x: centerX + offset,
          side: "right",
          position: "outer",
          position_code: outerPos.position_code
        });
      }
    }

    return wheels;
  };

  const wheels = getWheelsForAxle();
  const axleLineLength = offset * 1.3;

  return (
    <g>
      {/* Axle line */}
      <line
        x1={centerX - axleLineLength}
        x2={centerX + axleLineLength}
        y1={y}
        y2={y}
        stroke={colors.axleLine}
        strokeWidth="1.5"
      />
      
      {/* Axle number label */}
      {showAxleNumbers && (
        <text 
          x={centerX} 
          y={y - 18}
          textAnchor="middle" 
          fontSize="10"
          fontWeight="bold"
          fill={colors.axleNumber}
        >
          Axle {axleNumber}
        </text>
      )}

      {/* Render wheels */}
      {wheels.map(wheel => (
        <Wheel
          key={wheel.id}
          id={wheel.id}
          x={wheel.x}
          y={y}
          side={wheel.side}
          position={wheel.position}
          axleNumber={axleNumber}
          isSelected={wheelSelections[wheel.id]}
          status={wheelStatuses[wheel.position_code]}
          onClick={(id) => onWheelClick(id, wheel.x, y)}
          showLabels={showLabels}
          selectable={selectable}
        />
      ))}
    </g>
  );
};

export default AxleRow;