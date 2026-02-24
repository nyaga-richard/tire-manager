import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const wheelWidth = 20;
  const wheelHeight = 32;

  const handleClick = () => {
    if (selectable) onClick(id);
  };

  const label =
    position === "single"
      ? side.toUpperCase()
      : `${side === "left" ? "L" : "R"}${position === "inner" ? "I" : "O"}`;

  // Theme-aware colors
  const colors = {
    wheelFill: isSelected 
      ? (isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(0, 100, 255, 0.2)") // blue with opacity
      : (isDark ? "#1f2937" : "white"), // gray-800 : white
    wheelStroke: isSelected 
      ? (isDark ? "#3b82f6" : "#0066ff") // blue-500 : blue-600
      : (isDark ? "#6b7280" : "#333"), // gray-500 : gray-800
    labelFill: isDark ? "#9ca3af" : "#666", // gray-400 : gray-600
  };

  return (
    <g onClick={handleClick} style={{ cursor: selectable ? "pointer" : "default" }}>
      <rect
        x={x - wheelWidth / 2}
        y={y - wheelHeight / 2}
        width={wheelWidth}
        height={wheelHeight}
        rx={3}
        fill={colors.wheelFill}
        stroke={colors.wheelStroke}
        strokeWidth={isSelected ? 1.5 : 0.8}
      />
      {showLabels && (
        <text
          x={x}
          y={y + wheelHeight / 2 + 10}
          textAnchor="middle"
          fill={colors.labelFill}
          fontSize="9"
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default Wheel;