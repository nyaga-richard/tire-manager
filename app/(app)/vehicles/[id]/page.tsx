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
import { ArrowLeft, Car, Settings } from "lucide-react";
import TruckWheelDiagram from "@/components/truck-wheel-diagram/TruckWheelDiagram";

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  wheel_config: "4x2" | "6x4" | "8x4" | "6x2" | "4x4";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const vehicleId = params.id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vehicleId) fetchVehicle();
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Info Card (LEFT) */}
        <Card className="lg:col-span-1">
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

        {/* RIGHT CARD - Wheel Diagram */}
        <Card className="lg:col-span-2">
  <CardHeader className="pb-3"> {/* Reduced padding */}
    <CardTitle className="text-lg">Wheel Configuration</CardTitle> {/* Smaller title */}
    <CardDescription className="text-sm">
      {vehicle.wheel_config} layout
    </CardDescription>
  </CardHeader>
  <CardContent className="pt-0"> {/* Remove top padding */}
    <TruckWheelDiagram
      positions={wheelConfigPositions[vehicle.wheel_config]}
      onWheelSelect={(data) => {
        console.log("Wheel selected:", data);
        // Add your wheel selection logic here
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