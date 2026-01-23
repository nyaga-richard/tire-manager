"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Search, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  pattern: string;
  type: "NEW" | "RETREADED";
  status: string;
  current_location: string;
  tread_depth_new: number;
  current_tread_depth: number;
  supplier_name: string;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
  model: string;
  year: number;
  current_odometer: number;
}

interface TirePosition {
  id: number;
  position_code: string;
  position_name: string;
  axle_number?: number;
}


interface AvailableTire extends Tire {
  is_selected?: boolean;
}

export default function InstallTirePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [positions, setPositions] = useState<TirePosition[]>([]);
  const [availableTires, setAvailableTires] = useState<AvailableTire[]>([]);
  const [selectedTire, setSelectedTire] = useState<AvailableTire | null>(null);
  const [showTireDialog, setShowTireDialog] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: "",
    position_id: "",
    install_date: new Date(),
    install_odometer: 0,
    user_id: "1", // In real app, get from auth context
    reason: "Regular installation",
    search_query: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

    const fetchVehicles = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/vehicles");
        if (!response.ok) throw new Error("Failed to fetch vehicles");

        const data = await response.json();
        console.log("Vehicles API response:", data);

        // If API returns { vehicles: [...] } use data.vehicles
        setVehicles(Array.isArray(data) ? data : data.vehicles || []);
    } catch (err) {
        console.error(err);
        toast.error("Failed to load vehicles");
    }
    };


    const fetchPositionsByVehicle = async (vehicleId: string) => {
    if (!vehicleId) {
        setPositions([]);
        return;
    }

    try {
        const response = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}`
        );

        if (!response.ok) throw new Error("Failed to fetch positions");

        const data = await response.json();
        setPositions(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Error fetching wheel positions:", error);
        toast.error("Failed to load wheel positions");
        setPositions([]);
    }
    };


  const searchAvailableTires = async () => {
    if (!formData.search_query.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/tires/search?serial=${formData.search_query}&status=IN_STORE&type=NEW,RETREADED`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableTires(data);
        if (data.length === 0) {
          toast.info("No available tires found");
        }
      } else {
        toast.error("Failed to search tires");
      }
    } catch (error) {
      console.error("Error searching tires:", error);
      toast.error("Failed to search tires");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTire = (tire: AvailableTire) => {
    setSelectedTire(tire);
    setShowTireDialog(true);
  };

  const handleConfirmTire = () => {
    setShowTireDialog(false);
    // Update the selected tire to show as selected
    setAvailableTires(prev => 
      prev.map(t => ({
        ...t,
        is_selected: t.id === selectedTire?.id
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTire) {
      toast.error("Please select a tire");
      return;
    }

    if (!formData.vehicle_id || !formData.position_id) {
      toast.error("Please select vehicle and position");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/tires/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tire_id: selectedTire.id,
          vehicle_id: parseInt(formData.vehicle_id),
          position_id: parseInt(formData.position_id),
          install_date: formData.install_date.toISOString().split("T")[0],
          install_odometer: formData.install_odometer,
          user_id: formData.user_id,
          reason: formData.reason,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Tire installed successfully", {
          description: `Tire ${selectedTire.serial_number} installed on vehicle`,
        });
        router.push("/purchases");
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to install tire");
      }
    } catch (error) {
      console.error("Error installing tire:", error);
      toast.error("Failed to install tire");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_STORE":
        return "bg-green-100 text-green-800";
      case "ON_VEHICLE":
        return "bg-blue-100 text-blue-800";
      case "AT_RETREAD_SUPPLIER":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Install Tire on Vehicle</h1>
          <p className="text-muted-foreground">
            Install available tires from inventory onto vehicles
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Installation Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Installation Details</CardTitle>
              <CardDescription>Vehicle and installation information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_id">Vehicle *</Label>
                <Select
                value={formData.vehicle_id}
                onValueChange={(value) => {
                    setFormData({
                    ...formData,
                    vehicle_id: value,
                    position_id: "", // reset position
                    });
                    setPositions([]);               // clear old positions
                    fetchPositionsByVehicle(value); // load new ones
                }}
                required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.vehicle_number} - {vehicle.model} ({vehicle.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_id">Tire Position *</Label>
                <Select
                  value={formData.position_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, position_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id.toString()}>
                        {position.position_code} - {position.position_name}
                    </SelectItem>
                    ))}


                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="install_date">Installation Date *</Label>
                <DatePicker
                  date={formData.install_date}
                  onSelect={(date) => date && setFormData({ ...formData, install_date: date })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="install_odometer">Odometer Reading (km) *</Label>
                <Input
                  id="install_odometer"
                  type="number"
                  min="0"
                  value={formData.install_odometer}
                  onChange={(e) =>
                    setFormData({ ...formData, install_odometer: parseInt(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Installation</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Regular rotation, Tire replacement, New installation"
                />
              </div>

              {selectedTire && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Selected Tire</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serial:</span>
                      <span className="font-medium">{selectedTire.serial_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{selectedTire.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span>{selectedTire.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{selectedTire.type.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tire Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Select Tire</CardTitle>
              <CardDescription>
                Search and select an available tire from inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search by serial number, size, or brand..."
                    value={formData.search_query}
                    onChange={(e) =>
                      setFormData({ ...formData, search_query: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        searchAvailableTires();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={searchAvailableTires}
                  disabled={searching}
                >
                  {searching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {availableTires.length > 0 && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {availableTires.map((tire) => (
                    <div
                      key={tire.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                        tire.is_selected
                          ? "border-primary bg-primary/5"
                          : "hover:shadow-sm"
                      }`}
                      onClick={() => handleSelectTire(tire)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{tire.serial_number}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                tire.status
                              )}`}
                            >
                              {tire.status.replace("_", " ")}
                            </span>
                            {tire.is_selected && (
                              <span className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Size:</span>
                              <p className="font-medium">{tire.size}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Brand:</span>
                              <p className="font-medium">{tire.brand}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <p className="font-medium capitalize">{tire.type.toLowerCase()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tread Depth:</span>
                              <p className="font-medium">
                                {tire.current_tread_depth || tire.tread_depth_new}mm
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Pattern:</span>
                              <span className="ml-2">{tire.pattern || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Supplier:</span>
                              <span className="ml-2">{tire.supplier_name || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant={tire.is_selected ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTire(tire);
                          }}
                        >
                          {tire.is_selected ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableTires.length === 0 && formData.search_query && (
                <div className="text-center py-8 border rounded-lg">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No tires found</h3>
                  <p className="text-muted-foreground">
                    Try searching with different terms or check if tires are in stock
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline" type="button" asChild>
                <Link href="/purchases">Cancel</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !selectedTire || !formData.vehicle_id || !formData.position_id}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Installing...
                  </>
                ) : (
                  "Install Tire"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>

      {/* Tire Selection Confirmation Dialog */}
      <AlertDialog open={showTireDialog} onOpenChange={setShowTireDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Tire Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to install this tire?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedTire && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serial Number:</span>
                  <span className="font-medium">{selectedTire.serial_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{selectedTire.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span>{selectedTire.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{selectedTire.type.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Location:</span>
                  <span>{selectedTire.current_location}</span>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTire}>
              Confirm Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}