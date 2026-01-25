"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Car, 
  Edit, 
  Plus, 
  RefreshCw, 
  Settings, 
  History 
} from "lucide-react";
import TruckWheelDiagram from "@/components/truck-wheel-diagram/TruckWheelDiagram";

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  wheel_config: "4x2" | "6x4" | "8x4" | "6x2" | "4x4";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}

interface TireHistory {
  id: number;
  vehicle_id: number;
  position_code: string;
  serial_number: string;
  size: string;
  install_date: string;
  removed_date?: string;
  notes?: string;
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const vehicleId = params.id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [tireHistory, setTireHistory] = useState<TireHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
      fetchTireHistory();
    }
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}`
      );
      if (!res.ok) throw new Error("Vehicle not found");
      const data = await res.json();
      setVehicle(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTireHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}/tire-history`
      );
      if (res.ok) {
        const data = await res.json();
        setTireHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching tire history:", error);
      setTireHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const wheelConfigPositions = {
    "4x2": [
      { position_code: "F1", position_name: "Front Left", axle_number: 1 },
      { position_code: "F2", position_name: "Front Right", axle_number: 1 },
      { position_code: "R1", position_name: "Rear Left", axle_number: 2 },
      { position_code: "R2", position_name: "Rear Right", axle_number: 2 },
    ],
    "6x4": [
      { position_code: "F1", position_name: "Front Left", axle_number: 1 },
      { position_code: "F2", position_name: "Front Right", axle_number: 1 },
      { position_code: "R1", position_name: "Rear Left Inner", axle_number: 2 },
      { position_code: "R2", position_name: "Rear Left Outer", axle_number: 2 },
      { position_code: "R3", position_name: "Rear Right Inner", axle_number: 2 },
      { position_code: "R4", position_name: "Rear Right Outer", axle_number: 2 },
    ],
    "8x4": [
      { position_code: "F1", position_name: "Front Left", axle_number: 1 },
      { position_code: "F2", position_name: "Front Right", axle_number: 1 },
      { position_code: "R1", position_name: "Rear Left Inner", axle_number: 2 },
      { position_code: "R2", position_name: "Rear Left Outer", axle_number: 2 },
      { position_code: "R3", position_name: "Rear Right Inner", axle_number: 2 },
      { position_code: "R4", position_name: "Rear Right Outer", axle_number: 2 },
      { position_code: "R5", position_name: "Rear Left Inner", axle_number: 3 },
      { position_code: "R6", position_name: "Rear Left Outer", axle_number: 3 },
      { position_code: "R7", position_name: "Rear Right Inner", axle_number: 3 },
      { position_code: "R8", position_name: "Rear Right Outer", axle_number: 3 },
    ],
    "6x2": [
      { position_code: "F1", position_name: "Front Left", axle_number: 1 },
      { position_code: "F2", position_name: "Front Right", axle_number: 1 },
      { position_code: "R1", position_name: "Rear Left", axle_number: 2 },
      { position_code: "R2", position_name: "Rear Right", axle_number: 2 },
      { position_code: "R3", position_name: "Rear Center Left", axle_number: 3 },
      { position_code: "R4", position_name: "Rear Center Right", axle_number: 3 },
    ],
    "4x4": [
      { position_code: "F1", position_name: "Front Left", axle_number: 1 },
      { position_code: "F2", position_name: "Front Right", axle_number: 1 },
      { position_code: "R1", position_name: "Rear Left", axle_number: 2 },
      { position_code: "R2", position_name: "Rear Right", axle_number: 2 },
    ],
  } satisfies Record<string, Array<{ position_code: string; position_name: string; axle_number: number }>>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleWheelSelect = (data: { wheelId: string; axle: number; side: string; position: string; }) => {
    console.log("Wheel selected:", data);
    // Navigate to tire details or service page for the selected wheel
    // Example: router.push(`/vehicles/${vehicleId}/wheels/${data.wheelId}`);
  };

  const handleRefreshAll = () => {
    fetchVehicle();
    fetchTireHistory();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            Loading vehicle details...
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Vehicle not found</p>
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
              {vehicle.vehicle_number} - Details
            </h1>
            <p className="text-muted-foreground">
              Vehicle overview and configuration information
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
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Vehicle Info and History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Vehicle Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>
                Basic vehicle identification details
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {vehicle.make} {vehicle.model}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Wheel Config: </span>
                  {vehicle.wheel_config}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant="outline"
                  className={getStatusColor(vehicle.status)}
                >
                  {vehicle.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tire History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tire Installation History</CardTitle>
              <CardDescription>
                Recent tire changes for this vehicle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading history...
                    </p>
                  </div>
                </div>
              ) : tireHistory.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No tire history available</p>
                  <p className="text-sm mt-1">
                    Tire service records will appear here
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-4"
                  >
                    <Link href={`/vehicles/${vehicle.id}/tire-service`}>
                      <Plus className="mr-2 h-3 w-3" />
                      Add Tire Service
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Tire Serial</TableHead>
                        <TableHead>Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tireHistory.slice(0, 5).map((history) => (
                        <TableRow key={history.id}>
                          <TableCell className="py-3">
                            <div className="text-sm">
                              {formatDate(history.install_date)}
                            </div>
                            {history.removed_date && (
                              <div className="text-xs text-muted-foreground">
                                Removed: {formatDate(history.removed_date)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {history.position_code}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {history.serial_number}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{history.size}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {tireHistory.length > 5 && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-sm"
                        asChild
                      >
                        <Link href={`/vehicles/${vehicle.id}/history`}>
                          View all {tireHistory.length} records
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Wheel Diagram */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Wheel Configuration</CardTitle>
            <CardDescription className="text-sm">
              {vehicle.wheel_config} layout - Click on a wheel to view details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <TruckWheelDiagram
              positions={wheelConfigPositions[vehicle.wheel_config]}
              onWheelSelect={(data) => {
                handleWheelSelect(data);
                console.log("Wheel selected:", data);
              }}
              selectable={true}
              multiSelect={false}
              showLabels={true}
              showAxleNumbers={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}