"use client";

interface WheelPosition {
  id: number;
  position_code: string;
  position_name: string;
  axle_number: number;
  is_trailer: number;
}

interface TireAssignment {
  position_code: string;
  serial_number: string;
  size: string;
  brand: string;
}

interface Props {
  positions: WheelPosition[];
  tires: TireAssignment[];
}

/**
 * Top-down truck SVG
 * Front at top, rear at bottom
 */
export default function VehicleWheelDiagram({ positions, tires }: Props) {
  const tireMap = new Map(
    tires.map((t) => [t.position_code, t])
  );

  /**
   * SVG layout map
   * You can fine-tune x/y visually without touching logic
   */
  const layout: Record<
    string,
    { x: number; y: number }
  > = {
    FL: { x: 60, y: 60 },
    FR: { x: 140, y: 60 },

    RL1: { x: 55, y: 140 },
    RL2: { x: 75, y: 140 },

    RR1: { x: 125, y: 140 },
    RR2: { x: 145, y: 140 },
  };

  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 200 260"
        width="100%"
        className="max-w-xs"
      >
        {/* Truck body */}
        <rect
          x="80"
          y="20"
          width="40"
          height="200"
          rx="8"
          fill="#e5e7eb"
          stroke="#9ca3af"
          strokeWidth="2"
        />

        {/* Cabin */}
        <rect
          x="70"
          y="20"
          width="60"
          height="40"
          rx="6"
          fill="#d1d5db"
        />

        {/* Wheels */}
        {positions.map((pos) => {
          const point = layout[pos.position_code];
          if (!point) return null;

          const tire = tireMap.get(pos.position_code);
          const hasTire = Boolean(tire);

          return (
            <g key={pos.id}>
              {/* Wheel */}
              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill={hasTire ? "#22c55e" : "#f87171"}
                stroke="#1f2937"
                strokeWidth="2"
              />

              {/* Position label */}
              <text
                x={point.x}
                y={point.y + 25}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
                fontWeight="600"
              >
                {pos.position_code}
              </text>

              {/* Tooltip (browser native) */}
              <title>
                {pos.position_name}
                {hasTire
                  ? `\n${tire?.brand} ${tire?.size}\n${tire?.serial_number}`
                  : "\nNo tire installed"}
              </title>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20,220)">
          <circle cx="0" cy="0" r="6" fill="#22c55e" />
          <text x="12" y="4" fontSize="10">Installed</text>

          <circle cx="90" cy="0" r="6" fill="#f87171" />
          <text x="102" y="4" fontSize="10">Missing</text>
        </g>
      </svg>
    </div>
  );
}
