import React from "react";
import Wheel from "./Wheel";

export interface Position {
  position_code: string;
  position_name: string;
  axle_number: number;
}

interface AxleRowProps {
  axleNumber: number;
  y: number; // vertical position of this axle
  diagramWidth: number;
  wheelSelections: Record<string, boolean>;
  wheelStatuses: Record<string, string>;
  positions: Position[];
  onWheelClick: (wheelId: string) => void;
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
  const centerX = diagramWidth / 2;
  const offset = 60; // Reduced from 80 for tighter spacing

  // Create wheel configurations based on axle number
  const getWheelsForAxle = () => {
    const leftPositions = positions.filter(p => 
      p.position_name.toLowerCase().includes("left")
    );
    const rightPositions = positions.filter(p => 
      p.position_name.toLowerCase().includes("right")
    );

    const wheels = [];

    // Left side wheels
    if (leftPositions.length === 1) {
      // Single wheel on left (front axle)
      wheels.push({
        id: `A${axleNumber}-L`,
        x: centerX - offset,
        side: "left" as const,
        position: "single" as const,
        position_code: leftPositions[0].position_code
      });
    } else if (leftPositions.length === 2) {
      // Dual wheels on left (rear axles)
      const innerPos = leftPositions.find(p => p.position_name.toLowerCase().includes("inner"));
      const outerPos = leftPositions.find(p => p.position_name.toLowerCase().includes("outer"));
      
      if (outerPos) {
        wheels.push({
          id: `A${axleNumber}-L-Outer`,
          x: centerX - offset,
          side: "left" as const,
          position: "outer" as const,
          position_code: outerPos.position_code
        });
      }
      if (innerPos) {
        wheels.push({
          id: `A${axleNumber}-L-Inner`,
          x: centerX - offset / 2,
          side: "left" as const,
          position: "inner" as const,
          position_code: innerPos.position_code
        });
      }
    }

    // Right side wheels
    if (rightPositions.length === 1) {
      // Single wheel on right (front axle)
      wheels.push({
        id: `A${axleNumber}-R`,
        x: centerX + offset,
        side: "right" as const,
        position: "single" as const,
        position_code: rightPositions[0].position_code
      });
    } else if (rightPositions.length === 2) {
      // Dual wheels on right (rear axles)
      const innerPos = rightPositions.find(p => p.position_name.toLowerCase().includes("inner"));
      const outerPos = rightPositions.find(p => p.position_name.toLowerCase().includes("outer"));
      
      if (innerPos) {
        wheels.push({
          id: `A${axleNumber}-R-Inner`,
          x: centerX + offset / 2,
          side: "right" as const,
          position: "inner" as const,
          position_code: innerPos.position_code
        });
      }
      if (outerPos) {
        wheels.push({
          id: `A${axleNumber}-R-Outer`,
          x: centerX + offset,
          side: "right" as const,
          position: "outer" as const,
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
        stroke="#333"
        strokeWidth="1.5" // Slightly thinner line
      />
      
      {/* Axle number label */}
      {showAxleNumbers && (
        <text 
          x={centerX} 
          y={y - 18} // Reduced spacing from axle line
          textAnchor="middle" 
          fontSize="10" // Smaller font
          fontWeight="bold"
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
          onClick={onWheelClick}
          showLabels={showLabels}
          selectable={selectable}
        />
      ))}
    </g>
  );
};

export default AxleRow;