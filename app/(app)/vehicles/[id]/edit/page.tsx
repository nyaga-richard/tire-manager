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
  RefreshCw,
  Info
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-4 w-36 sm:w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-20 sm:h-24 w-full" />
          </CardContent>
          <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-between w-full gap-3">
              <Skeleton className="h-9 sm:h-10 w-20 sm:w-24" />
              <Skeleton className="h-9 sm:h-10 w-28 sm:w-32" />
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
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Edit Vehicle</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">Edit vehicle details</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="ml-2 text-sm">
            You don't have permission to edit vehicles. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/vehicles">Return to Vehicles</Link>
        </Button>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Edit Vehicle</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">Edit vehicle details</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="ml-2 text-sm">
            {error}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/vehicles">Cancel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="vehicle.edit" action="edit">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
              Edit Vehicle
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              {formData.vehicle_number}
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Vehicle Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Edit the details of the vehicle. Fields marked with <span className="text-red-500">*</span> are required.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Vehicle Number */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="vehicle_number" className="text-xs sm:text-sm font-medium">
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
                    className="uppercase h-9 sm:h-10 text-sm"
                    maxLength={20}
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    License plate or registration number
                  </p>
                </div>

                {/* Make */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="make" className="text-xs sm:text-sm font-medium">
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
                    className="uppercase h-9 sm:h-10 text-sm"
                  />
                </div>

                {/* Model */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="model" className="text-xs sm:text-sm font-medium">
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
                    className="uppercase h-9 sm:h-10 text-sm"
                  />
                </div>

                {/* Year */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="year" className="text-xs sm:text-sm font-medium">Year</Label>
                  <Select
                    value={formData.year?.toString()}
                    onValueChange={(value) => handleSelectChange("year", value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-sm">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Wheel Configuration */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="wheel_config" className="text-xs sm:text-sm font-medium">
                    Wheel Configuration <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.wheel_config}
                    onValueChange={(value) => handleSelectChange("wheel_config", value)}
                    disabled={loading}
                    required
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Select configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {wheelConfigs.map((config) => (
                        <SelectItem key={config} value={config} className="text-sm">
                          {config}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Determines the number of wheels and axles
                  </p>
                </div>

                {/* Current Odometer */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="current_odometer" className="text-xs sm:text-sm font-medium">Current Odometer (km)</Label>
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
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="status" className="text-xs sm:text-sm font-medium">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "ACTIVE" | "INACTIVE" | "MAINTENANCE") => 
                      handleSelectChange("status", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE" className="text-sm">Active</SelectItem>
                      <SelectItem value="INACTIVE" className="text-sm">Inactive</SelectItem>
                      <SelectItem value="MAINTENANCE" className="text-sm">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Help text - Mobile optimized */}
              <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium">Vehicle Information Tips</p>
                    <div className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
                      <p>• Vehicle numbers must be unique across your fleet</p>
                      <p>• Wheel configuration affects tire compatibility</p>
                      <p>• Status changes affect vehicle availability immediately</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Updated Info */}
              <div className="text-[10px] sm:text-xs text-muted-foreground border-t pt-4">
                <span className="block sm:inline">
                  Last edited by: {user?.full_name || user?.username || "Unknown"}
                </span>
                <span className="hidden sm:inline mx-2">•</span>
                <span className="block sm:inline">
                  Vehicle ID: {vehicleId}
                </span>
              </div>

              {/* Required fields note for mobile */}
              <div className="text-[10px] sm:text-xs text-muted-foreground text-right">
                <span className="text-red-500">*</span> Required fields
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-0 border-t px-4 sm:px-6 py-3 sm:py-4">
              <Button
                variant="outline"
                type="button"
                asChild
                disabled={loading}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
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
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 shrink-0"></div>
                    <span className="truncate">Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Save Changes</span>
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