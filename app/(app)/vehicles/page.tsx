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
  XCircle
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

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  wheel_config: "4x2" | "6x4" | "8x4" | "6x2" | "4x4";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "RETIRED";
  created_at: string;
  active_tires_count: number;
  retired_at?: string;
  retirement_reason?: string;
  retired_by?: string;
}

interface ApiResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  totalPages: number;
}

interface RetirementData {
  reason: string;
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
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [retirementData, setRetirementData] = useState<RetirementData>({
    reason: "",
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
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: viewMode === "active" ? "active" : "retired"
      });
      
      // Add search term if provided
      if (search.trim()) {
        params.append("search", search.trim());
      }
      
      // Add wheel config filter if not "All"
      if (selectedConfig !== "All") {
        params.append("wheel_config", selectedConfig);
      }
      
      const response = await fetch(`http://localhost:5000/api/vehicles?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setVehicles(data.vehicles || []);
      setTotalPages(data.totalPages || 1);
      setTotalVehicles(data.total || 0);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
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
    setRetirementData({ reason: "", notes: "" });
    setRetirementDialogOpen(true);
  };

  const handleCloseRetirementDialog = () => {
    setRetirementDialogOpen(false);
    setSelectedVehicle(null);
    setRetirementData({ reason: "", notes: "" });
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
          notes: retirementData.notes,
          retired_by: "current_user" // Replace with actual user from auth context
        }),
      });
      
      if (response.ok) {
        // Refresh the list
        fetchVehicles();
        handleCloseRetirementDialog();
      } else {
        throw new Error("Failed to retire vehicle");
      }
    } catch (error) {
      console.error("Error retiring vehicle:", error);
      alert("Failed to retire vehicle. Please try again.");
    } finally {
      setRetirementLoading(false);
    }
  };

  const handleRestoreVehicle = async (vehicleId: number) => {
    if (!confirm("Are you sure you want to restore this vehicle to active status?")) return;
    
    try {
      setRestoreLoading(true);
      
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restored_by: "current_user" // Replace with actual user from auth context
        }),
      });
      
      if (response.ok) {
        // Refresh the list
        fetchVehicles();
      } else {
        throw new Error("Failed to restore vehicle");
      }
    } catch (error) {
      console.error("Error restoring vehicle:", error);
      alert("Failed to restore vehicle. Please try again.");
    } finally {
      setRestoreLoading(false);
    }
  };

  // Get filtered vehicle count for display
  const getFilterDescription = () => {
    if (selectedConfig === "All" && !search) {
      return `${viewMode === "active" ? "Active" : "Retired"} vehicles (${totalVehicles} total)`;
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
              This will move it to the retired vehicles list.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason*
              </Label>
              <select
                id="reason"
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={retirementData.reason}
                onChange={(e) => setRetirementData({...retirementData, reason: e.target.value})}
                required
              >
                <option value="">Select a reason</option>
                {retirementReasons.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
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
            
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Important Note</span>
              </div>
              <p className="mt-1 text-sm text-yellow-700">
                Retired vehicles will be moved to the retired list and will no longer appear 
                in the active fleet. You can restore them later if needed.
              </p>
            </div>
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
              disabled={!retirementData.reason.trim() || retirementLoading}
            >
              {retirementLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
              onClick={() => setViewMode("active")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Active ({viewMode === "active" ? totalVehicles : "-"})
            </Button>
            <Button
              variant={viewMode === "retired" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => setViewMode("retired")}
            >
              <Archive className="mr-2 h-4 w-4" />
              Retired ({viewMode === "retired" ? totalVehicles : "-"})
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
                              {vehicle.retired_at ? formatDateTime(vehicle.retired_at) : "N/A"}
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
                                    onClick={() => handleRestoreVehicle(vehicle.id)}
                                    disabled={restoreLoading}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    {restoreLoading ? "Restoring..." : "Restore to Active"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to permanently delete this retired vehicle?")) {
                                        // Implement permanent delete if needed
                                        console.log("Permanently delete vehicle", vehicle.id);
                                      }
                                    }}
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