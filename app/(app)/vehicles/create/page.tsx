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
import { ArrowLeft, Save, Car, AlertCircle, Info } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-24 w-full" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show permission denied
  if (!hasPermission("vehicle.create")) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Add New Vehicle</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              Add a new vehicle to your fleet
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="ml-2 text-sm">
            You don't have permission to create vehicles. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/vehicles">Return to Vehicles</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="vehicle.create" action="create">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Add New Vehicle</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              Add a new vehicle to your fleet
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Vehicle Information</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Enter the details of the new vehicle. Fields marked with <span className="text-red-500">*</span> are required.
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
                    Determines tire count and axles
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
                  <Label htmlFor="status" className="text-xs sm:text-sm font-medium">Initial Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
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
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Default is Active for new vehicles
                  </p>
                </div>
              </div>

              {/* Help text - Mobile optimized */}
              <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium">Vehicle Registration Tips</p>
                    <div className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
                      <p>• Vehicle numbers must be unique across your fleet</p>
                      <p>• Wheel configuration determines tire compatibility</p>
                      <p>• You can add tires to vehicles after creation</p>
                    </div>
                  </div>
                </div>
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
                disabled={loading || !formData.vehicle_number.trim() || !formData.make.trim() || !formData.model.trim()}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 shrink-0"></div>
                    <span className="truncate">Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Create Vehicle</span>
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