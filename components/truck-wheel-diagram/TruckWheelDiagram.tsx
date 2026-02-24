import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import AxleRow, { Position } from "./AxleRow";
import { useTheme } from "@/contexts/ThemeContext";

/* =======================
   Helpers
======================= */
const CenterLine = ({ width, height, isDark }: { width: number; height: number; isDark: boolean }) => (
  <line
    x1={width / 2}
    y1={0}
    x2={width / 2}
    y2={height}
    stroke={isDark ? "#4b5563" : "#ccc"} // gray-600 : gray-300
    strokeDasharray="5,5"
  />
);

const FrontRearLabels = ({ width, height, isDark }: { width: number; height: number; isDark: boolean }) => (
  <>
    <text 
      x={width / 2} 
      y={15} 
      textAnchor="middle" 
      fontWeight="bold" 
      fontSize="10"
      fill={isDark ? "#9ca3af" : "#333"} // gray-400 : gray-800
    >
      FRONT
    </text>
    <text 
      x={width / 2} 
      y={height - 5} 
      textAnchor="middle" 
      fontWeight="bold" 
      fontSize="10"
      fill={isDark ? "#9ca3af" : "#333"}
    >
      REAR
    </text>
  </>
);

/* =======================
   Popup Component - Theme-aware
======================= */
interface PopupProps {
  wheelId: string;
  tireData: {
    serialNumber: string;
    size?: string;
    brand?: string;
    type?: string;
    installDate?: string;
    status?: string;
  } | null;
  onClose: () => void;
  position: {
    x: number;
    y: number;
    containerRect: DOMRect;
  };
}

const Popup: React.FC<PopupProps> = ({ wheelId, tireData, onClose, position }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (!popupRef.current || !position.containerRect) return;
    
    const popupWidth = 240;
    const popupHeight = 160;
    
    const svgX = position.x;
    const svgY = position.y;
    
    const containerX = position.containerRect.left;
    const containerY = position.containerRect.top;
    
    let screenX = containerX + svgX + 60;
    let screenY = containerY + svgY - popupHeight / 2;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (screenX + popupWidth > viewportWidth - 20) {
      screenX = containerX + svgX - popupWidth - 60;
    }
    
    if (screenX < 20) {
      screenX = 20;
    }
    
    if (screenY < 20) {
      screenY = 20;
    }
    
    if (screenY + popupHeight > viewportHeight - 20) {
      screenY = viewportHeight - popupHeight - 20;
    }
    
    setPopupPosition({ top: screenY, left: screenX });
    
  }, [position]);

  // Theme-aware colors for popup
  const popupClasses = {
    container: isDark ? "bg-gray-900 border-gray-700" : "bg-white border-blue-500",
    header: isDark ? "bg-gray-800 border-gray-700" : "bg-blue-50",
    title: isDark ? "text-gray-100" : "text-gray-900",
    label: isDark ? "text-gray-400" : "text-gray-500",
    value: isDark ? "text-gray-200" : "text-gray-900",
    footer: isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50",
    closeButton: isDark ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    emptyIcon: isDark ? "text-gray-600" : "text-gray-400",
    emptyText: isDark ? "text-gray-400" : "text-gray-500",
    emptySubtext: isDark ? "text-gray-500" : "text-gray-400",
  };

  const getTypeBadgeClass = (type?: string) => {
    if (!type) return "";
    const typeUpper = type.toUpperCase();
    if (isDark) {
      switch (typeUpper) {
        case "NEW": return "bg-green-900 text-green-100";
        case "RETREAD": return "bg-yellow-900 text-yellow-100";
        default: return "bg-blue-900 text-blue-100";
      }
    } else {
      switch (typeUpper) {
        case "NEW": return "bg-green-100 text-green-800";
        case "RETREAD": return "bg-yellow-100 text-yellow-800";
        default: return "bg-blue-100 text-blue-800";
      }
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return "";
    if (isDark) {
      switch (status) {
        case "good": return "bg-green-900 text-green-100";
        case "worn": return "bg-yellow-900 text-yellow-100";
        case "bad": return "bg-red-900 text-red-100";
        default: return "bg-gray-800 text-gray-300";
      }
    } else {
      switch (status) {
        case "good": return "bg-green-100 text-green-800";
        case "worn": return "bg-yellow-100 text-yellow-800";
        case "bad": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
      }
    }
  };
  
  return (
    <div
      ref={popupRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95"
      style={{
        top: `${popupPosition.top}px`,
        left: `${popupPosition.left}px`,
      }}
    >
      {/* Arrow indicator */}
      <div className="absolute -left-6 top-1/2 transform -translate-y-1/2">
        <div className={`w-6 h-0.5 ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}></div>
        <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-8 border-t-transparent border-b-transparent ${isDark ? 'border-l-blue-600' : 'border-l-blue-500'}`}></div>
      </div>
      
      {/* Popup content */}
      <div className={`rounded-lg border-2 shadow-xl w-60 ${popupClasses.container}`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b flex justify-between items-center rounded-t-lg ${popupClasses.header}`}>
          <div>
            <h3 className={`font-bold text-sm ${popupClasses.title}`}>Wheel: {wheelId}</h3>
            {tireData?.type && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadgeClass(tireData.type)}`}>
                {tireData.type}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full ${popupClasses.closeButton}`}
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {tireData ? (
            <div className="space-y-3">
              <div>
                <p className={`text-xs ${popupClasses.label} mb-1`}>Serial Number</p>
                <p className={`font-mono text-sm font-semibold ${popupClasses.value}`}>
                  {tireData.serialNumber}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {tireData.size && (
                  <div>
                    <p className={`text-xs ${popupClasses.label} mb-1`}>Size</p>
                    <p className={`text-sm font-medium ${popupClasses.value}`}>{tireData.size}</p>
                  </div>
                )}
                {tireData.brand && (
                  <div>
                    <p className={`text-xs ${popupClasses.label} mb-1`}>Brand</p>
                    <p className={`text-sm font-medium ${popupClasses.value}`}>{tireData.brand}</p>
                  </div>
                )}
              </div>
              
              {tireData.installDate && (
                <div>
                  <p className={`text-xs ${popupClasses.label} mb-1`}>Install Date</p>
                  <p className={`text-sm ${popupClasses.value}`}>
                    {new Date(tireData.installDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {tireData.status && (
                <div>
                  <p className={`text-xs ${popupClasses.label} mb-1`}>Status</p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(tireData.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                    {tireData.status.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className={popupClasses.emptyIcon + " mb-2"}>
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className={popupClasses.emptyText + " text-sm"}>No tire installed</p>
              <p className={popupClasses.emptySubtext + " text-xs mt-1"}>This wheel position is empty</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`px-4 py-3 border-t rounded-b-lg ${popupClasses.footer}`}>
          <button 
            onClick={onClose}
            className={`w-full text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* =======================
   Main Component
======================= */
interface TruckWheelDiagramProps {
  positions: Position[];
  wheelStatuses?: Record<string, string>;
  tireData?: Record<string, {
    serialNumber: string;
    size?: string;
    brand?: string;
    type?: string;
    installDate?: string;
    status?: string;
  }>;
  onWheelSelect?: (data: {
    wheelId: string;
    axle: number;
    side: string;
    position: string;
    x: number;
    y: number;
  }) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  showLabels?: boolean;
  showAxleNumbers?: boolean;
}

interface SelectedWheel {
  wheelId: string;
  x: number;
  y: number;
  containerRect: DOMRect;
}

const TruckWheelDiagram: React.FC<TruckWheelDiagramProps> = ({
  positions,
  wheelStatuses = {},
  tireData = {},
  onWheelSelect = () => {},
  selectable = true,
  multiSelect = false,
  showLabels = true,
  showAxleNumbers = true,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const [selectedWheels, setSelectedWheels] = useState<Record<string, boolean>>({});
  const [activePopup, setActivePopup] = useState<SelectedWheel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const diagramWidth = 320;
  const diagramHeight = 350;

  const axles = Math.max(...positions.map((p) => p.axle_number));
  const axleSpacing = diagramHeight / (axles + 1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePopup && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActivePopup(null);
      }
    };

    if (activePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopup]);

  const handleWheelClick = useCallback(
    (wheelId: string, x: number, y: number) => {
      setSelectedWheels((prev) => {
        const next = multiSelect
          ? { ...prev, [wheelId]: !prev[wheelId] }
          : { [wheelId]: true };
        return next;
      });

      const match = wheelId.match(/A(\d+)-([LR])(?:-(Inner|Outer))?/);
      if (match) {
        const axle = Number(match[1]);
        const side = match[2] === "L" ? "left" : "right";
        const position = match[3] ? match[3].toLowerCase() : "single";

        onWheelSelect({ wheelId, axle, side, position, x, y });
      }

      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (activePopup?.wheelId === wheelId) {
        setActivePopup(null);
      } else if (containerRect) {
        setActivePopup({ wheelId, x, y, containerRect });
      }
    },
    [multiSelect, onWheelSelect, activePopup]
  );

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

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
    <>
      <div 
        ref={containerRef}
        className="truck-wheel-diagram-container relative h-full w-full" 
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${diagramWidth} ${diagramHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="relative"
        >
          <style>
            {`
              @keyframes dash {
                to {
                  stroke-dashoffset: 0;
                }
              }
              .animate-dash {
                animation: dash 0.5s linear forwards;
              }
            `}
          </style>
          
          <CenterLine width={diagramWidth} height={diagramHeight} isDark={isDark} />
          <FrontRearLabels width={diagramWidth} height={diagramHeight} isDark={isDark} />
          {axleRows}
        </svg>
      </div>
      
      {activePopup && (
        <Popup
          wheelId={activePopup.wheelId}
          tireData={tireData[activePopup.wheelId] || null}
          onClose={closePopup}
          position={{
            x: activePopup.x,
            y: activePopup.y,
            containerRect: activePopup.containerRect
          }}
        />
      )}
    </>
  );
};

export default TruckWheelDiagram;