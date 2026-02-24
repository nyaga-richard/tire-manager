"use client";

import { useEffect, useState } from "react";

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

export default function VehicleWheelDiagram({ positions, tires }: Props) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const tireMap = new Map(
    tires.map((t) => [t.position_code, t])
  );

  const layout: Record<string, { x: number; y: number }> = {
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
        {/* Define CSS classes for the SVG elements */}
        <style>
          {`
            .truck-body {
              fill: var(--truck-body, #e5e7eb);
              stroke: var(--truck-body-stroke, #9ca3af);
            }
            .truck-cabin {
              fill: var(--truck-cabin, #d1d5db);
            }
            .wheel-stroke {
              stroke: var(--wheel-stroke, #1f2937);
            }
            .text-primary {
              fill: var(--text-primary, #374151);
            }
            .installed-tire {
              fill: #22c55e;
            }
            .missing-tire {
              fill: var(--missing-tire, #f87171);
            }
            
            .dark {
              --truck-body: #374151;
              --truck-body-stroke: #6B7280;
              --truck-cabin: #4B5563;
              --wheel-stroke: #F3F4F6;
              --text-primary: #F9FAFB;
              --missing-tire: #ef4444;
            }
          `}
        </style>

        {/* Truck body */}
        <rect
          x="80"
          y="20"
          width="40"
          height="200"
          rx="8"
          className="truck-body"
          strokeWidth="2"
        />

        {/* Cabin */}
        <rect
          x="70"
          y="20"
          width="60"
          height="40"
          rx="6"
          className="truck-cabin"
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
                className={hasTire ? "installed-tire" : "missing-tire wheel-stroke"}
                strokeWidth="2"
              />

              {/* Position label */}
              <text
                x={point.x}
                y={point.y + 25}
                textAnchor="middle"
                fontSize="10"
                className="text-primary"
                fontWeight="600"
              >
                {pos.position_code}
              </text>

              {/* Tooltip */}
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
          <circle cx="0" cy="0" r="6" className="installed-tire" />
          <text x="12" y="4" fontSize="10" className="text-primary">
            Installed
          </text>

          <circle cx="90" cy="0" r="6" className="missing-tire wheel-stroke" />
          <text x="102" y="4" fontSize="10" className="text-primary">
            Missing
          </text>
        </g>
      </svg>
    </div>
  );
}