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
import { PlusCircle, Search, Car, Edit, Trash2, Eye, Filter } from "lucide-react";
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

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  wheel_config: "4x2" | "6x4" | "8x4" | "6x2" | "4x4";
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  created_at: string;
  active_tires_count: number;
}

interface ApiResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  totalPages: number;
}

// Available wheel configurations
const WHEEL_CONFIGS = ["All", "4x2", "6x4", "8x4", "6x2", "4x4"] as const;
type WheelConfig = typeof WHEEL_CONFIGS[number];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<WheelConfig>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchVehicles();
  }, [currentPage, search, selectedConfig]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
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
      
      // Display error to user (optional)
      // You could add a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleConfigFilter = (config: WheelConfig) => {
    setSelectedConfig(config);
    setCurrentPage(1); // Reset to first page when filter changes
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500 hover:bg-green-600";
      case "INACTIVE":
        return "bg-gray-500 hover:bg-gray-600";
      case "MAINTENANCE":
        return "bg-yellow-500 hover:bg-yellow-600";
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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        fetchVehicles(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  // Get filtered vehicle count for display
  const getFilterDescription = () => {
    if (selectedConfig === "All" && !search) {
      return `All vehicles (${totalVehicles} total)`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            {getFilterDescription()}
          </p>
        </div>
        <Button asChild>
          <Link href="/vehicles/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Vehicle
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehicle List</CardTitle>
              <CardDescription>
                View and manage all vehicles in your fleet
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
                  placeholder="Search vehicles..."
                  className="pl-8"
                  value={search}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                <p className="mt-2 text-muted-foreground">Loading vehicles...</p>
              </div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No vehicles found</h3>
              <p className="text-muted-foreground mt-1">
                {search || selectedConfig !== "All" 
                  ? "Try changing your search or filter criteria" 
                  : "Get started by adding a new vehicle"
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
                              <DropdownMenuItem asChild>
                                <Link href={`/vehicles/${vehicle.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Vehicle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(vehicle.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Retire Vehicle
                              </DropdownMenuItem>
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