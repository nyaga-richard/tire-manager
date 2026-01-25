import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
   Popup Component - Now renders as a separate div, not inside SVG
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
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (!popupRef.current || !position.containerRect) return;
    
    const popupWidth = 240;
    const popupHeight = 160;
    
    // Convert SVG coordinates to screen coordinates
    const svgX = position.x;
    const svgY = position.y;
    
    // Calculate position relative to the container
    const containerX = position.containerRect.left;
    const containerY = position.containerRect.top;
    
    // Calculate screen position
    let screenX = containerX + svgX + 60; // Offset from wheel
    let screenY = containerY + svgY - popupHeight / 2;
    
    // Adjust if popup would go off screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check right edge
    if (screenX + popupWidth > viewportWidth - 20) {
      screenX = containerX + svgX - popupWidth - 60; // Show on left side
    }
    
    // Check left edge
    if (screenX < 20) {
      screenX = 20;
    }
    
    // Check top edge
    if (screenY < 20) {
      screenY = 20;
    }
    
    // Check bottom edge
    if (screenY + popupHeight > viewportHeight - 20) {
      screenY = viewportHeight - popupHeight - 20;
    }
    
    setPopupPosition({ top: screenY, left: screenX });
    
  }, [position]);
  
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
        <div className="w-6 h-0.5 bg-blue-500"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-8 border-t-transparent border-b-transparent border-l-blue-500"></div>
      </div>
      
      {/* Popup content */}
      <div className="bg-white rounded-lg border-2 border-blue-500 shadow-xl w-60">
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center bg-blue-50 rounded-t-lg">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Wheel: {wheelId}</h3>
            {tireData?.type && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tireData.type === "NEW" ? "bg-green-100 text-green-800" :
                tireData.type === "RETREAD" ? "bg-yellow-100 text-yellow-800" :
                "bg-blue-100 text-blue-800"
              }`}>
                {tireData.type}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {tireData ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Serial Number</p>
                <p className="font-mono text-sm font-semibold text-gray-900">
                  {tireData.serialNumber}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {tireData.size && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Size</p>
                    <p className="text-sm font-medium text-gray-900">{tireData.size}</p>
                  </div>
                )}
                {tireData.brand && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Brand</p>
                    <p className="text-sm font-medium text-gray-900">{tireData.brand}</p>
                  </div>
                )}
              </div>
              
              {tireData.installDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Install Date</p>
                  <p className="text-sm text-gray-700">
                    {new Date(tireData.installDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {tireData.status && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tireData.status === "good" ? "bg-green-100 text-green-800" :
                    tireData.status === "worn" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                    {tireData.status.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No tire installed</p>
              <p className="text-gray-400 text-xs mt-1">This wheel position is empty</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg">
          <button 
            onClick={onClose}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
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
  const [selectedWheels, setSelectedWheels] = useState<Record<string, boolean>>({});
  const [activePopup, setActivePopup] = useState<SelectedWheel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Reduced diagram dimensions to fit without scrolling
  const diagramWidth = 320;
  const diagramHeight = 350;

  // Determine number of axles
  const axles = Math.max(...positions.map((p) => p.axle_number));
  const axleSpacing = diagramHeight / (axles + 1);

  // Close popup when clicking outside
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
      // Toggle selection
      setSelectedWheels((prev) => {
        const next = multiSelect
          ? { ...prev, [wheelId]: !prev[wheelId] }
          : { [wheelId]: true };
        return next;
      });

      // Parse wheel information
      const match = wheelId.match(/A(\d+)-([LR])(?:-(Inner|Outer))?/);
      if (match) {
        const axle = Number(match[1]);
        const side = match[2] === "L" ? "left" : "right";
        const position = match[3] ? match[3].toLowerCase() : "single";

        onWheelSelect({ wheelId, axle, side, position, x, y });
      }

      // Get container position for popup placement
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      // Show popup if not already showing for this wheel
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
          
          <CenterLine width={diagramWidth} height={diagramHeight} />
          <FrontRearLabels width={diagramWidth} height={diagramHeight} />
          {axleRows}
        </svg>
      </div>
      
      {/* Popup rendered outside SVG, above all components */}
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