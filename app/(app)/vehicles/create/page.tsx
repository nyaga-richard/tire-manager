"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Car, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CreateVehiclePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasPermission, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    wheel_config: "6x4",
    status: "ACTIVE",
    current_odometer: 0,
  });

  // Redirect if not authenticated or no permission
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("vehicle.create")) {
        router.push("/vehicles");
        toast.error("You don't have permission to create vehicles");
      }
    }
  }, [isLoading, isAuthenticated, hasPermission, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "year" || name === "current_odometer" 
        ? value === "" ? "" : parseInt(value) || 0 
        : value,
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

    // Validate required fields
    if (!formData.vehicle_number.trim() || !formData.make.trim() || !formData.model.trim()) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/vehicles`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          year: formData.year || null,
          current_odometer: formData.current_odometer || 0,
          created_by: user?.id,
        }),
      });

      if (response.ok) {
        toast.success("Vehicle created successfully", {
          description: `${formData.vehicle_number} has been added to your fleet`,
        });
        router.push("/vehicles");
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create vehicle");
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
      toast.error("Failed to create vehicle", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const wheelConfigs = ["4x2", "6x4", "8x4", "6x2", "4x4"];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show permission denied
  if (!hasPermission("vehicle.create")) {
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

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create vehicles. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/vehicles">Return to Vehicles</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="vehicle.create" action="create">
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
                Enter the details of the new vehicle. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Number */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle_number">
                    Vehicle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vehicle_number"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    placeholder="e.g., KCZ 025J"
                    required
                    disabled={loading}
                    className="uppercase"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the license plate or registration number
                  </p>
                </div>

                {/* Make */}
                <div className="space-y-2">
                  <Label htmlFor="make">
                    Make <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="e.g., ISUZU"
                    required
                    disabled={loading}
                    className="uppercase"
                  />
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model">
                    Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g., FRR"
                    required
                    disabled={loading}
                    className="uppercase"
                  />
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={formData.year?.toString()}
                    onValueChange={(value) => handleSelectChange("year", value)}
                    disabled={loading}
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

                {/* Wheel Configuration */}
                <div className="space-y-2">
                  <Label htmlFor="wheel_config">
                    Wheel Configuration <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.wheel_config}
                    onValueChange={(value) => handleSelectChange("wheel_config", value)}
                    disabled={loading}
                    required
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
                  <p className="text-xs text-muted-foreground">
                    Determines the number of wheels and axles
                  </p>
                </div>

                {/* Current Odometer */}
                <div className="space-y-2">
                  <Label htmlFor="current_odometer">Current Odometer (km)</Label>
                  <Input
                    id="current_odometer"
                    name="current_odometer"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.current_odometer}
                    onChange={handleChange}
                    placeholder="e.g., 5000"
                    disabled={loading}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                    disabled={loading}
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
                  <p className="text-xs text-muted-foreground">
                    Default is Active for new vehicles
                  </p>
                </div>
              </div>

              {/* Help text */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vehicle Registration Tips</p>
                    <p className="text-sm text-muted-foreground">
                      • Vehicle numbers should be unique across your fleet<br />
                      • Wheel configuration determines tire compatibility<br />
                      • You can add tires to vehicles after creation
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button 
                variant="outline" 
                type="button" 
                asChild
                disabled={loading}
              >
                <Link href="/vehicles">Cancel</Link>
              </Button>
              <Button 
                type="submit"
                disabled={loading || !formData.vehicle_number.trim() || !formData.make.trim() || !formData.model.trim()}
              >
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
    </PermissionGuard>
  );
}