import React from "react";

export interface WheelProps {
  id: string;
  x: number;
  y: number;
  side: "left" | "right";
  position: "single" | "inner" | "outer";
  axleNumber: number;
  isSelected?: boolean;
  status?: string;
  onClick: (wheelId: string) => void;
  showLabels: boolean;
  selectable: boolean;
}

const Wheel: React.FC<WheelProps> = ({
  id,
  x,
  y,
  side,
  position,
  isSelected,
  onClick,
  showLabels,
  selectable,
}) => {
  const wheelWidth = 20; // Reduced from 24
  const wheelHeight = 32; // Reduced from 40

  const handleClick = () => {
    if (selectable) onClick(id);
  };

  const label =
    position === "single"
      ? side.toUpperCase()
      : `${side === "left" ? "L" : "R"}${position === "inner" ? "I" : "O"}`;

  return (
    <g onClick={handleClick} style={{ cursor: selectable ? "pointer" : "default" }}>
      <rect
        x={x - wheelWidth / 2}
        y={y - wheelHeight / 2}
        width={wheelWidth}
        height={wheelHeight}
        rx={3} // Slightly smaller radius
        fill={isSelected ? "rgba(0, 100, 255, 0.2)" : "white"}
        stroke={isSelected ? "#0066ff" : "#333"}
        strokeWidth={isSelected ? 1.5 : 0.8} // Thinner strokes
      />
      {showLabels && (
        <text
          x={x}
          y={y + wheelHeight / 2 + 10} // Reduced label spacing
          textAnchor="middle"
          fill="#666"
          fontSize="9" // Smaller font
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default Wheel;