"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Car } from "lucide-react";
import Link from "next/link";

export default function CreateVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    wheel_config: "6x4",
    current_odometer: 0,
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
      const response = await fetch("http://localhost:5000/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/vehicles");
        router.refresh();
      } else {
        console.error("Failed to create vehicle");
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const wheelConfigs = ["4x2", "6x4", "8x4", "6x2", "4x4"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
          <p className="text-muted-foreground">
            Add a new vehicle to your fleet
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Enter the details of the new vehicle
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
                <Label htmlFor="year">Year *</Label>
                <Select
                  value={formData.year.toString()}
                  onValueChange={(value: string) => handleSelectChange("year", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="current_odometer">Current Odometer (km)</Label>
                <Input
                  id="current_odometer"
                  name="current_odometer"
                  type="number"
                  value={formData.current_odometer}
                  onChange={handleChange}
                  placeholder="e.g., 125000"
                  min="0"
                />
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Vehicle
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}