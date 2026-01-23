"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Car } from "lucide-react";
import Link from "next/link";

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  wheel_config: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}


export default function CreateVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    make: "",
    model: "",
    wheel_config: "6x4",
    status: "ACTIVE",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "year" || name === "current_odometer" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Vehicle updated successfully");
        router.push("/vehicles");
        router.refresh();
      } else {
        toast.error("Failed to update vehicle");
        console.error("Failed to update vehicle");
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast.error("Error updating vehicle");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const params = useParams();
  console.log("PARAMS:", params);
  const vehicleId = params.id ;
  console.log("VEHICLE ID:", vehicleId);


  const wheelConfigs = ["4x2", "6x4", "8x4", "6x2", "4x4"];

    useEffect(() => {
    if (!vehicleId) return;

    const fetchVehicle = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/vehicles/${vehicleId}`
        );

        if (!response.ok) throw new Error("Failed to fetch vehicle");

        const data: Vehicle = await response.json();

        setFormData({
          vehicle_number: data.vehicle_number,
          make: data.make,
          model: data.model,
          wheel_config: data.wheel_config,
          status: data.status,
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load vehicle details");
      }
    };

    fetchVehicle();
  }, [vehicleId]);


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle Details</h1>
          <p className="text-muted-foreground">
            Edit vehicles details to your fleet
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Edit details of the vehicles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                <Input
                  id="vehicle_number"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  placeholder="e.g., KCZ 025J"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  placeholder="e.g., ISUZU"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., FRR"
                  required
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="wheel_config">Wheel Configuration *</Label>
                <Select
                  value={formData.wheel_config}
                  onValueChange={(value: string) => handleSelectChange("wheel_config", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {wheelConfigs.map((config) => (
                      <SelectItem key={config} value={config}>
                        {config}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/vehicles">Cancel</Link>
            </Button>
            <Button
              variant="outline"
            >
              Edit Vehicle
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}