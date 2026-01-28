"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Search, 
  Car, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Archive,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  year?: number;
  wheel_config: "4x2" | "6x4" | "8x4" | "6x2" | "4x4";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "RETIRED";
  created_at: string;
  active_tires_count: number;
  retired_date?: string;
  retirement_reason?: string;
  retired_by?: number;
  current_odometer?: number;
}

interface ApiResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  totalPages: number;
}

interface RetirementData {
  reason: string;
  retirement_date?: string;
  notes?: string;
}

// Available wheel configurations
const WHEEL_CONFIGS = ["All", "4x2", "6x4", "8x4", "6x2", "4x4"] as const;
type WheelConfig = typeof WHEEL_CONFIGS[number];

// View mode - Active or Retired
type ViewMode = "active" | "retired";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<WheelConfig>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [retirementDialogOpen, setRetirementDialogOpen] = useState(false);
  const [reactivationDialogOpen, setReactivationDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [retirementData, setRetirementData] = useState<RetirementData>({
    reason: "",
    retirement_date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [retirementLoading, setRetirementLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [retirementReasons] = useState([
    "End of Service Life",
    "Accident Damage",
    "Mechanical Failure",
    "Fleet Reduction",
    "Sold/Transferred",
    "Other"
  ]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchVehicles();
  }, [currentPage, search, selectedConfig, viewMode]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on view mode
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      // Add search term if provided
      if (search.trim()) {
        params.append("search", search.trim());
      }
      
      // Determine which API endpoint to use based on view mode
      let apiUrl;
      if (viewMode === "active") {
        apiUrl = `http://localhost:5000/api/vehicles?${params.toString()}`;
      } else {
        apiUrl = `http://localhost:5000/api/vehicles/retired/list?${params.toString()}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      // Filter out retired vehicles on the frontend if we're in active mode
      let filteredVehicles = data.vehicles || [];
      if (viewMode === "active") {
        filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status !== "RETIRED");
      }
      
      setVehicles(filteredVehicles);
      setTotalPages(data.totalPages || 1);
      // Adjust total count for active view to exclude retired vehicles
      const activeTotal = viewMode === "active" 
        ? data.vehicles?.filter(v => v.status !== "RETIRED").length || 0
        : data.total || 0;
      setTotalVehicles(activeTotal);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to fetch vehicles");
      setVehicles([]);
      setTotalPages(1);
      setTotalVehicles(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleConfigFilter = (config: WheelConfig) => {
    setSelectedConfig(config);
    setCurrentPage(1);
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

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500 hover:bg-green-600";
      case "INACTIVE":
        return "bg-gray-500 hover:bg-gray-600";
      case "MAINTENANCE":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "RETIRED":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getConfigColor = (config: string) => {
    switch (config) {
      case "4x2":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "6x4":
        return "bg-green-100 text-green-800 border-green-200";
      case "8x4":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "6x2":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "4x4":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleOpenRetirementDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setRetirementData({ 
      reason: "", 
      retirement_date: new Date().toISOString().split('T')[0],
      notes: "" 
    });
    setRetirementDialogOpen(true);
  };

  const handleOpenReactivationDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setReactivationDialogOpen(true);
  };

  const handleCloseRetirementDialog = () => {
    setRetirementDialogOpen(false);
    setSelectedVehicle(null);
    setRetirementData({ reason: "", retirement_date: "", notes: "" });
  };

  const handleCloseReactivationDialog = () => {
    setReactivationDialogOpen(false);
    setSelectedVehicle(null);
  };

  const handleRetireVehicle = async () => {
    if (!selectedVehicle || !retirementData.reason.trim()) return;
    
    try {
      setRetirementLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/vehicles/${selectedVehicle.id}/retire`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: retirementData.reason,
          retirement_date: retirementData.retirement_date,
          retired_by: 1, // Replace with actual user ID from auth context
          notes: retirementData.notes
        }),
      });
      
      if (response.ok) {
        toast.success("Vehicle retired successfully");
        // Refresh the list
        fetchVehicles();
        handleCloseRetirementDialog();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to retire vehicle");
      }
    } catch (error) {
      console.error("Error retiring vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to retire vehicle");
    } finally {
      setRetirementLoading(false);
    }
  };

  const handleRestoreVehicle = async () => {
    if (!selectedVehicle) return;
    
    try {
      setRestoreLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/vehicles/${selectedVehicle.id}/reactivate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reactivated_by: 1, // Replace with actual user ID from auth context
          reason: "Vehicle reactivated"
        }),
      });
      
      if (response.ok) {
        toast.success("Vehicle reactivated successfully");
        // Refresh the list
        fetchVehicles();
        handleCloseReactivationDialog();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to restore vehicle");
      }
    } catch (error) {
      console.error("Error restoring vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to restore vehicle");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handlePermanentDelete = async (vehicleId: number) => {
    if (!confirm("Are you sure you want to permanently delete this retired vehicle? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast.success("Vehicle deleted permanently");
        // Refresh the list
        fetchVehicles();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete vehicle");
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete vehicle");
    }
  };

  // Get filtered vehicle count for display
  const getFilterDescription = () => {
    if (selectedConfig === "All" && !search) {
      return `${viewMode === "active" ? "Active" : "Retired"} vehicles (${vehicles.length} of ${totalVehicles})`;
    }
    
    let description = "";
    if (selectedConfig !== "All") {
      description += `${selectedConfig} vehicles`;
    }
    if (search) {
      if (description) description += " matching ";
      description += `"${search}"`;
    }
    description += ` (${vehicles.length} of ${totalVehicles})`;
    
    return description;
  };

  return (
    <div className="space-y-6">
      {/* Retirement Dialog */}
      <Dialog open={retirementDialogOpen} onOpenChange={setRetirementDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Retire Vehicle
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to retire {selectedVehicle?.vehicle_number}? 
              This will remove all tires from the vehicle and move it to the retired list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="retirement_date" className="text-right">
                Retirement Date*
              </Label>
              <Input
                id="retirement_date"
                type="date"
                className="col-span-3"
                value={retirementData.retirement_date}
                onChange={(e) => setRetirementData({...retirementData, retirement_date: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason*
              </Label>
              <Select
                value={retirementData.reason}
                onValueChange={(value) => setRetirementData({...retirementData, reason: value})}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {retirementReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the retirement..."
                className="col-span-3"
                value={retirementData.notes}
                onChange={(e) => setRetirementData({...retirementData, notes: e.target.value})}
                rows={3}
              />
            </div>
            
            {selectedVehicle && selectedVehicle.active_tires_count > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Important Note</span>
                </div>
                <p className="mt-1 text-sm text-yellow-700">
                  This vehicle has <span className="font-semibold">{selectedVehicle.active_tires_count} tires</span> currently installed. 
                  All tires will be automatically removed and returned to the store when you retire this vehicle.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseRetirementDialog}
              disabled={retirementLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRetireVehicle}
              disabled={!retirementData.reason.trim() || !retirementData.retirement_date || retirementLoading}
            >
              {retirementLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retiring...
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Retire Vehicle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivation Dialog */}
      <Dialog open={reactivationDialogOpen} onOpenChange={setReactivationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-500" />
              Reactivate Vehicle
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to restore {selectedVehicle?.vehicle_number} to active status?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Vehicle will be restored</span>
              </div>
              <p className="mt-1 text-sm text-green-700">
                This vehicle will be moved back to the active fleet. You can then install tires and use it normally.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseReactivationDialog}
              disabled={restoreLoading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleRestoreVehicle}
              disabled={restoreLoading}
            >
              {restoreLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore Vehicle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            {getFilterDescription()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-input overflow-hidden">
            <Button
              variant={viewMode === "active" ? "default" : "ghost"}
              className="rounded-none border-r border-input"
              onClick={() => {
                setViewMode("active");
                setCurrentPage(1);
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Active ({viewMode === "active" ? vehicles.length : "-"})
            </Button>
            <Button
              variant={viewMode === "retired" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => {
                setViewMode("retired");
                setCurrentPage(1);
              }}
            >
              <Archive className="mr-2 h-4 w-4" />
              Retired ({viewMode === "retired" ? vehicles.length : "-"})
            </Button>
          </div>
          <Button asChild>
            <Link href="/vehicles/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {viewMode === "active" ? "Active Vehicles" : "Retired Vehicles"}
              </CardTitle>
              <CardDescription>
                {viewMode === "active" 
                  ? "View and manage all active vehicles in your fleet"
                  : "View retired vehicles from your fleet"
                }
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      {selectedConfig === "All" ? "Filter by Config" : selectedConfig}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {WHEEL_CONFIGS.map((config) => (
                      <DropdownMenuItem
                        key={config}
                        onClick={() => handleConfigFilter(config)}
                        className={selectedConfig === config ? "bg-accent" : ""}
                      >
                        {config}
                        {config !== "All" && (
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${getConfigColor(config).replace("border-", "border-")}`}
                          >
                            {config}
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={viewMode === "active" ? "Search active vehicles..." : "Search retired vehicles..."}
                  className="pl-8"
                  value={search}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* View Mode Info Banner */}
          {viewMode === "retired" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Archive className="h-4 w-4" />
                <span className="font-medium">Retired Vehicles</span>
              </div>
              <p className="mt-1 text-sm text-amber-700">
                These vehicles are no longer active in your fleet. You can view their details or restore them to active status.
              </p>
            </div>
          )}

          {/* Active Filters Display */}
          {(selectedConfig !== "All" || search) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedConfig !== "All" && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1"
                >
                  Config: {selectedConfig}
                  <button
                    onClick={() => setSelectedConfig("All")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {search && (
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1"
                >
                  Search: "{search}"
                  <button
                    onClick={() => setSearch("")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedConfig("All");
                  setSearch("");
                }}
                className="h-6 text-xs"
              >
                Clear all filters
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  {viewMode === "active" ? "Loading active vehicles..." : "Loading retired vehicles..."}
                </p>
              </div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {viewMode === "active" ? "No active vehicles found" : "No retired vehicles found"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {search || selectedConfig !== "All" 
                  ? "Try changing your search or filter criteria" 
                  : viewMode === "active" 
                    ? "Get started by adding a new vehicle"
                    : "No vehicles have been retired yet"
                }
              </p>
              {(search || selectedConfig !== "All") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSelectedConfig("All");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Make & Model</TableHead>
                      <TableHead>Wheel Config</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tires</TableHead>
                      {viewMode === "retired" && (
                        <>
                          <TableHead>Retired On</TableHead>
                          <TableHead>Reason</TableHead>
                        </>
                      )}
                      <TableHead>Added On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <Link 
                              href={`/vehicles/${vehicle.id}`}
                              className="hover:text-primary hover:underline"
                            >
                              {vehicle.vehicle_number}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{vehicle.make}</div>
                            <div className="text-sm text-muted-foreground">{vehicle.model}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getConfigColor(vehicle.wheel_config)}
                          >
                            {vehicle.wheel_config}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(vehicle.status)}>
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {vehicle.active_tires_count} tires
                          </Badge>
                        </TableCell>
                        {viewMode === "retired" && (
                          <>
                            <TableCell>
                              {vehicle.retired_date ? formatDateTime(vehicle.retired_date) : "N/A"}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="truncate" title={vehicle.retirement_reason || "N/A"}>
                                {vehicle.retirement_reason || "N/A"}
                              </div>
                            </TableCell>
                          </>
                        )}
                        <TableCell>{formatDate(vehicle.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/vehicles/${vehicle.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              
                              {viewMode === "active" ? (
                                <>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/vehicles/${vehicle.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Vehicle
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-amber-600"
                                    onClick={() => handleOpenRetirementDialog(vehicle)}
                                  >
                                    <Archive className="mr-2 h-4 w-4" />
                                    Retire Vehicle
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={() => handleOpenReactivationDialog(vehicle)}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore to Active
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handlePermanentDelete(vehicle.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Permanently
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(pageNum);
                              }}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Page {currentPage} of {totalPages} • {vehicles.length} vehicles shown
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}