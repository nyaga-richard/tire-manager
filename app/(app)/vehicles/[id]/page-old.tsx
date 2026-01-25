"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Truck,
  User,
  Calendar,
  FileText,
  RefreshCw,
  Wrench,
  MapPin,
  Tag,
  Fuel,
  Gauge,
  Edit,
  Plus,
  View,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface TireHistory {
  id: number;
  vehicle_id: number;
  wheel_position: string; // e.g., "A1-L", "A2-L-Outer"
  tire_id: number;
  tire_serial_number: string;
  action: "MOUNTED" | "DEMOUNTED" | "ROTATED" | "RETREADED";
  odometer_reading: number;
  date: string;
  notes: string;
  performed_by: string;
}

interface Vehicle {
  id: number;
  registration_number: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  type: "TRUCK" | "TRAILER" | "BUS" | "VAN" | "OTHER";
  fuel_type: "DIESEL" | "PETROL" | "ELECTRIC" | "HYBRID";
  current_odometer: number;
  driver_id: number | null;
  driver_name: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "RETIRED";
  purchase_date: string;
  created_at: string;
  tire_history?: TireHistory[]; // Made optional with ?
}

interface WheelStatus {
  wheelId: string;
  tireSerialNumber?: string;
  brand?: string;
  size?: string;
  treadDepth?: number;
  status?: "GOOD" | "WEARING" | "REPLACE_SOON" | "REPLACE_NOW";
  lastServiceDate?: string;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [wheelStatuses, setWheelStatuses] = useState<Record<string, WheelStatus>>({});
  const [selectedWheel, setSelectedWheel] = useState<string | null>(null);

  const vehicleId = params.id;

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch vehicle details");
      }
      const data = await response.json();
      setVehicle(data);
      // Generate wheel statuses from tire history
      generateWheelStatuses(data.tire_history);
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      toast.error("Failed to load vehicle details");
    } finally {
      setLoading(false);
    }
  };

  const generateWheelStatuses = (history: TireHistory[] | undefined) => {
    const statuses: Record<string, WheelStatus> = {};
    
    // Check if history exists and is an array
    if (!history || !Array.isArray(history)) {
      setWheelStatuses(statuses);
      return;
    }
    
    // Group by wheel position to get current status
    history.forEach((record) => {
      if (record.action === "MOUNTED") {
        statuses[record.wheel_position] = {
          wheelId: record.wheel_position,
          tireSerialNumber: record.tire_serial_number,
          lastServiceDate: record.date,
          status: getTireStatus(record.odometer_reading)
        };
      }
    });
    
    setWheelStatuses(statuses);
  };

  const getTireStatus = (odometer: number): WheelStatus['status'] => {
    // Simplified logic - in real app, this would consider more factors
    const random = Math.random();
    if (random < 0.6) return "GOOD";
    if (random < 0.8) return "WEARING";
    if (random < 0.95) return "REPLACE_SOON";
    return "REPLACE_NOW";
  };

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case "TRUCK":
        return "Truck";
      case "TRAILER":
        return "Trailer";
      case "BUS":
        return "Bus";
      case "VAN":
        return "Van";
      case "OTHER":
        return "Other";
      default:
        return type;
    }
  };

  const getVehicleTypeColor = (type: string) => {
    switch (type) {
      case "TRUCK":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "TRAILER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "BUS":
        return "bg-green-100 text-green-800 border-green-200";
      case "VAN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "OTHER":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "MAINTENANCE":
        return "In Maintenance";
      case "INACTIVE":
        return "Inactive";
      case "RETIRED":
        return "Retired";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "RETIRED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTireStatusColor = (status?: string) => {
    switch (status) {
      case "GOOD":
        return "bg-green-100 text-green-800 border-green-200";
      case "WEARING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REPLACE_SOON":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "REPLACE_NOW":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "MOUNTED":
        return "Mounted";
      case "DEMOUNTED":
        return "Demounted";
      case "ROTATED":
        return "Rotated";
      case "RETREADED":
        return "Retreaded";
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "MOUNTED":
        return "bg-green-100 text-green-800 border-green-200";
      case "DEMOUNTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "ROTATED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETREADED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const handleWheelSelect = (data: {
    wheelId: string;
    axle: number;
    side: "left" | "right";
    position: "single" | "inner" | "outer";
  }) => {
    setSelectedWheel(data.wheelId);
    // Scroll to tire history section
    const historySection = document.getElementById("tire-history");
    if (historySection) {
      historySection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filteredHistory = selectedWheel 
    ? vehicle?.tire_history?.filter(record => record.wheel_position === selectedWheel)
    : vehicle?.tire_history;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium">Vehicle not found</h3>
          <p className="text-muted-foreground mt-1">
            The vehicle you're looking for doesn't exist
          </p>
          <Button className="mt-4" asChild>
            <Link href="/vehicles">Back to Vehicles</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {vehicle.registration_number} - {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-muted-foreground">
              Vehicle details and tire management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/vehicles/${vehicle.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Vehicle
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/vehicles/${vehicle.id}/tire-service`}>
              <Plus className="mr-2 h-4 w-4" />
              Tire Service
            </Link>
          </Button>
          <Button variant="outline" onClick={fetchVehicleDetails}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Vehicle details and specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Vehicle Type: </span>
              </div>
              <Badge
                variant="outline"
                className={getVehicleTypeColor(vehicle.type)}
              >
                {getVehicleTypeLabel(vehicle.type)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">VIN: </span>
                {vehicle.vin}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Year: </span>
                {vehicle.year}
              </span>
            </div>
            

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Status:</span>
                <Badge
                  variant="outline"
                  className={getStatusColor(vehicle.status)}
                >
                  {getStatusLabel(vehicle.status)}
                </Badge>
              </div>
              
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Purchase Date:</span>
                  <span>{formatDate(vehicle.purchase_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added On:</span>
                  <span>{formatDate(vehicle.created_at)}</span>
                </div>
              </div>
            </div>
            
            {/* Selected Wheel Info */}
            {selectedWheel && wheelStatuses[selectedWheel] && (
              <div className="pt-4 border-t">
                <CardTitle className="text-sm mb-2">Selected Wheel: {selectedWheel}</CardTitle>
                <div className="space-y-2 text-sm">
                  {wheelStatuses[selectedWheel].tireSerialNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tire Serial:</span>
                      <span className="font-medium">{wheelStatuses[selectedWheel].tireSerialNumber}</span>
                    </div>
                  )}
                  {wheelStatuses[selectedWheel].status && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant="outline"
                        className={getTireStatusColor(wheelStatuses[selectedWheel].status)}
                      >
                        {wheelStatuses[selectedWheel].status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  )}
                  {wheelStatuses[selectedWheel].lastServiceDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Service:</span>
                      <span>{formatDate(wheelStatuses[selectedWheel].lastServiceDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wheel Diagram Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tire Positions</CardTitle>
            <CardDescription>
              Click on any wheel to view its history
              {selectedWheel && (
                <span className="ml-2 text-primary">
                  • Selected: {selectedWheel}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <TruckWheelDiagram
                axles={3}
                wheelStatuses={wheelStatuses}
                onWheelSelect={handleWheelSelect}
                selectable={true}
                multiSelect={false}
                showLabels={true}
              />
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-xs">Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span className="text-xs">Wearing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                <span className="text-xs">Replace Soon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-xs">Replace Now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tire History Card */}
      <Card id="tire-history">
        <CardHeader>
          <CardTitle>Tire History</CardTitle>
          <CardDescription>
            {selectedWheel 
              ? `History for ${selectedWheel}`
              : "Complete tire history for this vehicle"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!vehicle.tire_history || vehicle.tire_history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium">No tire history yet</h4>
              <p className="text-sm text-muted-foreground">
                Start by performing a tire service
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Wheel Position</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Tire Serial</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">
                          {formatDateTime(record.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{record.wheel_position}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getActionColor(record.action)}
                        >
                          {getActionLabel(record.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.tire_serial_number}
                      </TableCell>
                      <TableCell>
                        {formatNumber(record.odometer_reading)} km
                      </TableCell>
                      <TableCell>
                        {record.performed_by}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={record.notes}>
                          {record.notes || "N/A"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =======================
   Truck Wheel Diagram Component
======================= */

interface TruckWheelDiagramProps {
  axles?: number;
  wheelStatuses: Record<string, { status?: string }>;
  onWheelSelect?: (data: {
    wheelId: string;
    axle: number;
    side: "left" | "right";
    position: "single" | "inner" | "outer";
  }) => void;
  selectable?: boolean;
  multiSelect?: boolean;
  showLabels?: boolean;
}

function TruckWheelDiagram({
  axles = 3,
  wheelStatuses = {},
  onWheelSelect = () => {},
  selectable = true,
  multiSelect = false,
  showLabels = true,
}: TruckWheelDiagramProps) {
  const [selectedWheels, setSelectedWheels] = useState<Record<string, boolean>>({});

  const diagramWidth = 400;
  const diagramHeight = 600;
  const axleSpacing = diagramHeight / (axles + 1);

  const getWheelFillColor = (wheelId: string) => {
    const status = wheelStatuses[wheelId]?.status;
    switch (status) {
      case "GOOD":
        return "rgba(34, 197, 94, 0.2)";
      case "WEARING":
        return "rgba(234, 179, 8, 0.2)";
      case "REPLACE_SOON":
        return "rgba(249, 115, 22, 0.2)";
      case "REPLACE_NOW":
        return "rgba(239, 68, 68, 0.2)";
      default:
        return selectedWheels[wheelId] ? "rgba(0, 100, 255, 0.2)" : "white";
    }
  };

  const getWheelStrokeColor = (wheelId: string) => {
    const status = wheelStatuses[wheelId]?.status;
    switch (status) {
      case "GOOD":
        return "#22c55e";
      case "WEARING":
        return "#eab308";
      case "REPLACE_SOON":
        return "#f97316";
      case "REPLACE_NOW":
        return "#ef4444";
      default:
        return selectedWheels[wheelId] ? "#0066ff" : "#333";
    }
  };

  const handleWheelClick = (wheelId: string) => {
    if (!selectable) return;
    
    setSelectedWheels((prev) => {
      const next = multiSelect
        ? { ...prev, [wheelId]: !prev[wheelId] }
        : { [wheelId]: true };

      const match = wheelId.match(/A(\d+)-([LR])(?:-(Inner|Outer))?/);
      if (match) {
        const axle = Number(match[1]);
        const side: "left" | "right" = match[2] === "L" ? "left" : "right";
        const position: "single" | "inner" | "outer" = match[3]
          ? (match[3].toLowerCase() as "single" | "inner" | "outer")
          : "single";

        onWheelSelect({ wheelId, axle, side, position });
      }

      return next;
    });
  };

  return (
    <div className="truck-wheel-diagram-container">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${diagramWidth} ${diagramHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Center line */}
        <line
          x1={diagramWidth / 2}
          y1={0}
          x2={diagramWidth / 2}
          y2={diagramHeight}
          stroke="#ccc"
          strokeDasharray="5,5"
        />

        {/* Front/Rear labels */}
        <text x={diagramWidth / 2} y={20} textAnchor="middle" fontWeight="bold">
          FRONT
        </text>
        <text
          x={diagramWidth / 2}
          y={diagramHeight - 10}
          textAnchor="middle"
          fontWeight="bold"
        >
          REAR
        </text>

        {/* Axle rows */}
        {Array.from({ length: axles }, (_, i) => {
          const axleNumber = i + 1;
          const y = axleSpacing * (i + 1);
          const centerX = diagramWidth / 2;
          const offset = 80;

          const wheels =
            axleNumber === 1
              ? [
                  {
                    id: `A${axleNumber}-L`,
                    x: centerX - offset,
                    side: "left" as const,
                    position: "single" as const,
                  },
                  {
                    id: `A${axleNumber}-R`,
                    x: centerX + offset,
                    side: "right" as const,
                    position: "single" as const,
                  },
                ]
              : [
                  {
                    id: `A${axleNumber}-L-Outer`,
                    x: centerX - offset,
                    side: "left" as const,
                    position: "outer" as const,
                  },
                  {
                    id: `A${axleNumber}-L-Inner`,
                    x: centerX - offset / 2,
                    side: "left" as const,
                    position: "inner" as const,
                  },
                  {
                    id: `A${axleNumber}-R-Inner`,
                    x: centerX + offset / 2,
                    side: "right" as const,
                    position: "inner" as const,
                  },
                  {
                    id: `A${axleNumber}-R-Outer`,
                    x: centerX + offset,
                    side: "right" as const,
                    position: "outer" as const,
                  },
                ];

          return (
            <g key={axleNumber}>
              {/* Axle line */}
              <line
                x1={centerX - offset * 1.3}
                x2={centerX + offset * 1.3}
                y1={y}
                y2={y}
                stroke="#333"
                strokeWidth={2}
              />

              {/* Axle label */}
              <text
                x={centerX}
                y={y - 25}
                textAnchor="middle"
                fontSize={12}
                fontWeight="bold"
              >
                Axle {axleNumber}
              </text>

              {/* Wheels */}
              {wheels.map((wheel) => (
                <g
                  key={wheel.id}
                  onClick={() => handleWheelClick(wheel.id)}
                  style={{ cursor: selectable ? "pointer" : "default" }}
                >
                  <rect
                    x={wheel.x - 12}
                    y={y - 20}
                    width={24}
                    height={40}
                    rx={4}
                    fill={getWheelFillColor(wheel.id)}
                    stroke={getWheelStrokeColor(wheel.id)}
                    strokeWidth={selectedWheels[wheel.id] ? 2 : 1}
                  />
                  {showLabels && (
                    <text
                      x={wheel.x}
                      y={y + 32}
                      textAnchor="middle"
                      fill="#666"
                      fontSize={10}
                    >
                      {wheel.position === "single"
                        ? wheel.side.toUpperCase()
                        : `${wheel.side === "left" ? "L" : "R"}${
                            wheel.position === "inner" ? "I" : "O"
                          }`}
                    </text>
                  )}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}