"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { 
  ArrowLeft, 
  Save, 
  Car, 
  AlertCircle,
  RefreshCw 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  year?: number;
  wheel_config: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  current_odometer?: number;
}

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id;
  
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vehicle_number: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    wheel_config: "6x4",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "MAINTENANCE",
    current_odometer: 0,
  });

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("vehicle.edit")) {
        router.push("/vehicles");
        toast.error("You don't have permission to edit vehicles");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  // Fetch vehicle data
  useEffect(() => {
    if (!vehicleId || !isAuthenticated || !hasPermission("vehicle.edit")) return;

    const fetchVehicle = async () => {
      try {
        setFetchLoading(true);
        setError(null);
        
        const response = await authFetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Vehicle not found");
          }
          throw new Error("Failed to fetch vehicle details");
        }

        const data: Vehicle = await response.json();

        setFormData({
          vehicle_number: data.vehicle_number || "",
          make: data.make || "",
          model: data.model || "",
          year: data.year || new Date().getFullYear(),
          wheel_config: data.wheel_config || "6x4",
          status: data.status || "ACTIVE",
          current_odometer: data.current_odometer || 0,
        });
      } catch (error) {
        console.error("Error fetching vehicle:", error);
        setError(error instanceof Error ? error.message : "Failed to load vehicle details");
        toast.error("Failed to load vehicle details", {
          description: error instanceof Error ? error.message : "Please try again",
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId, isAuthenticated, hasPermission, authFetch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" || name === "current_odometer"
          ? value === ""
            ? ""
            : parseInt(value) || 0
          : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.vehicle_number.trim() || !formData.make.trim() || !formData.model.trim()) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...formData,
          year: formData.year || null,
          current_odometer: formData.current_odometer || 0,
          updated_by: user?.id,
        }),
      });

      if (response.ok) {
        toast.success("Vehicle updated successfully", {
          description: `${formData.vehicle_number} has been updated`,
        });
        router.push("/vehicles");
        router.refresh();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update vehicle");
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
      setError(error instanceof Error ? error.message : "Failed to update vehicle");
      toast.error("Failed to update vehicle", {
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
  if (authLoading || fetchLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex justify-between w-full">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Show permission denied
  if (!hasPermission("vehicle.edit")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
            <p className="text-muted-foreground">Edit vehicle details</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to edit vehicles. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/vehicles">Return to Vehicles</Link>
        </Button>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
            <p className="text-muted-foreground">Edit vehicle details</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/vehicles">Cancel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="vehicle.edit" action="edit">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit Vehicle: {formData.vehicle_number}
            </h1>
            <p className="text-muted-foreground">
              Update vehicle information for your fleet
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>
                Edit the details of the vehicle. Fields marked with * are required.
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
                    License plate or registration number
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "ACTIVE" | "INACTIVE" | "MAINTENANCE") => 
                      handleSelectChange("status", value)
                    }
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
                </div>
              </div>

              {/* Help text */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vehicle Information Tips</p>
                    <p className="text-sm text-muted-foreground">
                      • Vehicle numbers should be unique across your fleet<br />
                      • Wheel configuration affects tire compatibility and positions<br />
                      • Status changes will affect vehicle availability immediately
                    </p>
                  </div>
                </div>
              </div>

              {/* Last Updated Info */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                Last edited by: {user?.full_name || user?.username || "Unknown"} • 
                Vehicle ID: {vehicleId}
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
                disabled={
                  loading || 
                  !formData.vehicle_number.trim() || 
                  !formData.make.trim() || 
                  !formData.model.trim()
                }
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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