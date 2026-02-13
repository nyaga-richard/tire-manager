// app/vehicles/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw,
  Printer,
  Download
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

const WHEEL_CONFIGS = ["All", "4x2", "6x4", "8x4", "6x2", "4x4"] as const;
type WheelConfig = typeof WHEEL_CONFIGS[number];
type ViewMode = "active" | "retired";

export default function VehiclesPage() {
  const { user, hasPermission, authFetch, isLoading: authLoading } = useAuth();
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
  const retirementReasons = [
    "End of Service Life",
    "Accident Damage",
    "Mechanical Failure",
    "Fleet Reduction",
    "Sold/Transferred",
    "Other"
  ];
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading) {
      fetchVehicles();
    }
  }, [currentPage, search, selectedConfig, viewMode, authLoading]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (search.trim()) {
        params.append("search", search.trim());
      }
      
      if (selectedConfig !== "All") {
        params.append("wheel_config", selectedConfig);
      }
      
      const apiUrl = viewMode === "active"
        ? `${API_BASE_URL}/api/vehicles?${params.toString()}`
        : `${API_BASE_URL}/api/vehicles/retired/list?${params.toString()}`;
      
      const response = await authFetch(apiUrl);
      const data: ApiResponse = await response.json();
      
      let filteredVehicles = data.vehicles || [];
      if (viewMode === "active") {
        filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status !== "RETIRED");
      }
      
      setVehicles(filteredVehicles);
      setTotalPages(data.totalPages || 1);
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

  const handleRetireVehicle = async () => {
    if (!selectedVehicle || !retirementData.reason.trim() || !user) return;
    
    try {
      setRetirementLoading(true);
      
      const response = await authFetch(`${API_BASE_URL}/api/vehicles/${selectedVehicle.id}/retire`, {
        method: "POST",
        body: JSON.stringify({
          reason: retirementData.reason,
          retirement_date: retirementData.retirement_date,
          retired_by: user.id,
          notes: retirementData.notes
        }),
      });
      
      if (response.ok) {
        toast.success("Vehicle retired successfully");
        fetchVehicles();
        handleCloseRetirementDialog();
      }
    } catch (error) {
      console.error("Error retiring vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to retire vehicle");
    } finally {
      setRetirementLoading(false);
    }
  };

  const handleRestoreVehicle = async () => {
    if (!selectedVehicle || !user) return;
    
    try {
      setRestoreLoading(true);
      
      const response = await authFetch(`${API_BASE_URL}/api/vehicles/${selectedVehicle.id}/reactivate`, {
        method: "POST",
        body: JSON.stringify({
          reactivated_by: user.id,
          reason: "Vehicle reactivated"
        }),
      });
      
      if (response.ok) {
        toast.success("Vehicle reactivated successfully");
        fetchVehicles();
        handleCloseReactivationDialog();
      }
    } catch (error) {
      console.error("Error restoring vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to restore vehicle");
    } finally {
      setRestoreLoading(false);
    }
  };

  const handlePermanentDelete = async (vehicleId: number) => {
    if (!hasPermission('vehicle.delete')) {
      toast.error("You don't have permission to delete vehicles");
      return;
    }
    
    if (!confirm("Are you sure you want to permanently delete this retired vehicle? This action cannot be undone.")) return;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`, {
        method: "DELETE",
        body: JSON.stringify({ deleted_by: user?.id }),
      });
      
      if (response.ok) {
        toast.success("Vehicle deleted permanently");
        fetchVehicles();
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete vehicle");
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
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
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-500 hover:bg-green-600",
      INACTIVE: "bg-gray-500 hover:bg-gray-600",
      MAINTENANCE: "bg-yellow-500 hover:bg-yellow-600",
      RETIRED: "bg-red-500 hover:bg-red-600"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500 hover:bg-gray-600";
  };

  const getConfigColor = (config: string) => {
    const colors = {
      "4x2": "bg-blue-100 text-blue-800 border-blue-200",
      "6x4": "bg-green-100 text-green-800 border-green-200",
      "8x4": "bg-purple-100 text-purple-800 border-purple-200",
      "6x2": "bg-amber-100 text-amber-800 border-amber-200",
      "4x4": "bg-red-100 text-red-800 border-red-200"
    };
    return colors[config as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getFilterDescription = () => {
    if (selectedConfig === "All" && !search) {
      return `${viewMode === "active" ? "Active" : "Retired"} vehicles (${vehicles.length} of ${totalVehicles})`;
    }
    
    let description = "";
    if (selectedConfig !== "All") description += `${selectedConfig} vehicles`;
    if (search) {
      if (description) description += " matching ";
      description += `"${search}"`;
    }
    description += ` (${vehicles.length} of ${totalVehicles})`;
    return description;
  };


    // Handle print functionality
    const handlePrint = () => {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${viewMode === "active" ? "Active" : "Retired"} Vehicles Report</title>
          <style>
            @media print {
              @page {
                margin: 0.5in;
                size: landscape;
              }
              body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .print-header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .print-header h1 {
                margin: 0 0 5px 0;
                color: #1a237e;
              }
              .print-header .subtitle {
                color: #666;
                margin: 0;
              }
              .summary-stats {
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 4px;
              }
              .stat-item {
                text-align: center;
              }
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #1a237e;
              }
              .stat-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .filter-info {
                background: #f1f8ff;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 20px;
                font-size: 12px;
              }
              .vehicles-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                font-size: 11px;
              }
              .vehicles-table th {
                background-color: #2c3e50;
                color: white;
                padding: 8px;
                text-align: left;
                border: 1px solid #34495e;
                font-weight: bold;
              }
              .vehicles-table td {
                padding: 6px 8px;
                border: 1px solid #ddd;
              }
              .vehicles-table tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .status-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
              }
              .status-active {
                background-color: #d4edda;
                color: #155724;
              }
              .status-inactive {
                background-color: #f8f9fa;
                color: #6c757d;
              }
              .status-maintenance {
                background-color: #fff3cd;
                color: #856404;
              }
              .status-retired {
                background-color: #f8d7da;
                color: #721c24;
              }
              .config-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
              }
              .config-4x2 {
                background-color: #cce5ff;
                color: #004085;
              }
              .config-6x4 {
                background-color: #d4edda;
                color: #155724;
              }
              .config-8x4 {
                background-color: #e2d9f3;
                color: #4a3c6d;
              }
              .config-6x2 {
                background-color: #fff3cd;
                color: #856404;
              }
              .config-4x4 {
                background-color: #f8d7da;
                color: #721c24;
              }
              .print-footer {
                margin-top: 40px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                text-align: center;
                color: #666;
                font-size: 11px;
              }
              .print-summary {
                margin: 15px 0;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
                font-size: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${viewMode === "active" ? "Active Vehicles" : "Retired Vehicles"} Report</h1>
            <p class="subtitle">Fleet Management System</p>
            <p class="subtitle">Generated on ${format(new Date(), 'MMMM dd, yyyy')} at ${format(new Date(), 'hh:mm a')}</p>
          </div>
          
          <div class="filter-info">
            <strong>Report Criteria:</strong> 
            ${viewMode === "active" ? "Active Vehicles" : "Retired Vehicles"}
            ${selectedConfig !== "All" ? ` • Wheel Config: ${selectedConfig}` : ''}
            ${search ? ` • Search: "${search}"` : ''}
            ${currentPage > 1 ? ` • Page ${currentPage} of ${totalPages}` : ''}
          </div>
          
          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-value">${totalVehicles}</div>
              <div class="stat-label">Total ${viewMode === "active" ? "Active" : "Retired"}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${vehicles.length}</div>
              <div class="stat-label">${selectedConfig !== "All" || search ? "Filtered" : "Displayed"}</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${vehicles.filter(v => v.status === "ACTIVE").length}</div>
              <div class="stat-label">Active Status</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${vehicles.filter(v => v.status === "MAINTENANCE").length}</div>
              <div class="stat-label">In Maintenance</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${vehicles.reduce((sum, v) => sum + (v.active_tires_count || 0), 0)}</div>
              <div class="stat-label">Total Tires</div>
            </div>
          </div>
          
          <div class="print-summary">
            Showing ${vehicles.length} of ${totalVehicles} ${viewMode === "active" ? "active" : "retired"} vehicles
            • Generated by: ${user?.full_name || user?.username || 'System Admin'} • Report ID: VEH-${viewMode.toUpperCase()}-${Date.now().toString().slice(-6)}
          </div>
          
          <table class="vehicles-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle Number</th>
                <th>Make & Model</th>
                <th>Wheel Config</th>
                <th>Status</th>
                <th>Tires</th>
                ${viewMode === "retired" ? '<th>Retired Date</th><th>Reason</th>' : ''}
                <th>Added Date</th>
              </tr>
            </thead>
            <tbody>
              ${vehicles.map(vehicle => {
                const statusClass = vehicle.status.toLowerCase();
                const configClass = vehicle.wheel_config.toLowerCase();
                return `
                  <tr>
                    <td>${vehicle.id}</td>
                    <td><strong>${vehicle.vehicle_number}</strong></td>
                    <td>${vehicle.make} ${vehicle.model}</td>
                    <td>
                      <span class="config-badge config-${configClass}">
                        ${vehicle.wheel_config}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge status-${statusClass}">
                        ${vehicle.status}
                      </span>
                    </td>
                    <td>${vehicle.active_tires_count || 0}</td>
                    ${viewMode === "retired" ? `
                      <td>${vehicle.retired_date ? formatDate(vehicle.retired_date) : 'N/A'}</td>
                      <td>${vehicle.retirement_reason || 'N/A'}</td>
                    ` : ''}
                    <td>${formatDate(vehicle.created_at)}</td>
                  </tr>
                `;
              }).join('')}
              ${vehicles.length === 0 ? `
                <tr>
                  <td colspan="${viewMode === "retired" ? 9 : 7}" style="text-align: center; padding: 30px; color: #666;">
                    No ${viewMode === "active" ? "active" : "retired"} vehicles found
                    ${search || selectedConfig !== "All" ? 'matching the current filters' : ''}
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          <div class="print-footer">
            <p>Confidential Document - For Internal Use Only</p>
            <p>Fleet Management System | ${format(new Date(), 'yyyy')} © All Rights Reserved</p>
          </div>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Add a small delay before printing to ensure content is loaded
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    };

    // Handle export to CSV
    const handleExportCSV = () => {
      const headers = [
        "ID",
        "Vehicle Number",
        "Make",
        "Model",
        "Year",
        "Wheel Config",
        "Status",
        "Current Tires",
        "Current Odometer",
        "Added Date",
        ...(viewMode === "retired" ? ["Retired Date", "Retirement Reason"] : [])
      ];

      const csvData = vehicles.map((vehicle) => [
        vehicle.id,
        vehicle.vehicle_number,
        vehicle.make,
        vehicle.model,
        vehicle.year || "N/A",
        vehicle.wheel_config,
        vehicle.status,
        vehicle.active_tires_count || 0,
        vehicle.current_odometer ? `${vehicle.current_odometer.toLocaleString()} km` : "N/A",
        formatDate(vehicle.created_at),
        ...(viewMode === "retired" ? [
          vehicle.retired_date ? formatDate(vehicle.retired_date) : "N/A",
          vehicle.retirement_reason || "N/A"
        ] : [])
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${viewMode}-vehicles-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }; 
    
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dialogs */}
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
              <Label htmlFor="retirement_date" className="text-right">Retirement Date*</Label>
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
              <Label htmlFor="reason" className="text-right">Reason*</Label>
              <Select
                value={retirementData.reason}
                onValueChange={(value) => setRetirementData({...retirementData, reason: value})}
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
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the retirement..."
                className="col-span-3"
                value={retirementData.notes}
                onChange={(e) => setRetirementData({...retirementData, notes: e.target.value})}
                rows={3}
              />
            </div>
            
            {(selectedVehicle?.active_tires_count ?? 0) > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Important Note</span>
                </div>
                <p className="mt-1 text-sm text-yellow-700">
                  This vehicle has{" "}
                  <span className="font-semibold">
                    {selectedVehicle?.active_tires_count ?? 0} tires
                  </span>{" "}
                  currently installed.
                  All tires will be automatically removed and returned to the store when you retire this vehicle.
                </p>
              </div>
            )}

          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRetirementDialog} disabled={retirementLoading}>
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
            <Button variant="outline" onClick={handleCloseReactivationDialog} disabled={restoreLoading}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleRestoreVehicle} disabled={restoreLoading}>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">{getFilterDescription()}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-input overflow-hidden">
            <Button
              variant={viewMode === "active" ? "default" : "ghost"}
              className="rounded-none border-r border-input"
              onClick={() => { setViewMode("active"); setCurrentPage(1); }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Active ({viewMode === "active" ? vehicles.length : "-"})
            </Button>
            <Button
              variant={viewMode === "retired" ? "default" : "ghost"}
              className="rounded-none"
              onClick={() => { setViewMode("retired"); setCurrentPage(1); }}
            >
              <Archive className="mr-2 h-4 w-4" />
              Retired ({viewMode === "retired" ? vehicles.length : "-"})
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={vehicles.length === 0 || loading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={vehicles.length === 0 || loading}
              className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
          
          <PermissionGuard permissionCode="vehicle.create" action="create">
            <Button asChild>
              <Link href="/vehicles/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Vehicle
              </Link>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{viewMode === "active" ? "Active Vehicles" : "Retired Vehicles"}</CardTitle>
              <CardDescription>
                {viewMode === "active" 
                  ? "View and manage all active vehicles in your fleet"
                  : "View retired vehicles from your fleet"
                }
              </CardDescription>
            </div>
            <div className="flex gap-4">
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
                        <Badge variant="outline" className={`ml-2 ${getConfigColor(config)}`}>
                          {config}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
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

          {(selectedConfig !== "All" || search) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedConfig !== "All" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Config: {selectedConfig}
                  <button onClick={() => setSelectedConfig("All")} className="ml-1 text-muted-foreground hover:text-foreground">
                    ×
                  </button>
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{search}"
                  <button onClick={() => setSearch("")} className="ml-1 text-muted-foreground hover:text-foreground">
                    ×
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setSelectedConfig("All"); setSearch(""); }} className="h-6 text-xs">
                Clear all filters
              </Button>
            </div>
          )}

          {vehicles.length > 0 && (
            <div className="mb-4 grid grid-cols-5 gap-2">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-700">{vehicles.length}</div>
                <div className="text-xs text-blue-600">Displayed</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-700">{vehicles.filter(v => v.status === "ACTIVE").length}</div>
                <div className="text-xs text-green-600">Active</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="text-lg font-bold text-yellow-700">{vehicles.filter(v => v.status === "MAINTENANCE").length}</div>
                <div className="text-xs text-yellow-600">Maintenance</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-gray-700">{vehicles.filter(v => v.status === "INACTIVE").length}</div>
                <div className="text-xs text-gray-600">Inactive</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-700">{vehicles.reduce((sum, v) => sum + (v.active_tires_count || 0), 0)}</div>
                <div className="text-xs text-purple-600">Total Tires</div>
              </div>
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
                <Button variant="outline" className="mt-4" onClick={() => { setSelectedConfig("All"); setSearch(""); }}>
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
                            <Link href={`/vehicles/${vehicle.id}`} className="hover:text-primary hover:underline">
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
                          <Badge variant="outline" className={getConfigColor(vehicle.wheel_config)}>
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
                            <TableCell>{vehicle.retired_date ? formatDateTime(vehicle.retired_date) : "N/A"}</TableCell>
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
                                  <PermissionGuard permissionCode="vehicle.edit" action="edit" fallback={null}>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/vehicles/${vehicle.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Vehicle
                                      </Link>
                                    </DropdownMenuItem>
                                  </PermissionGuard>
                                  
                                  {(hasPermission('vehicle.edit') || hasPermission('vehicle.delete')) && (
                                    <DropdownMenuSeparator />
                                  )}
                                  
                                  {(hasPermission('vehicle.edit') || hasPermission('vehicle.delete')) && (
                                    <DropdownMenuItem 
                                      className="text-amber-600"
                                      onClick={() => handleOpenRetirementDialog(vehicle)}
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Retire Vehicle
                                    </DropdownMenuItem>
                                  )}
                                </>
                              ) : (
                                <>
                                  <PermissionGuard permissionCode="vehicle.edit" action="edit" fallback={null}>
                                    <DropdownMenuItem 
                                      className="text-green-600"
                                      onClick={() => handleOpenReactivationDialog(vehicle)}
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Restore to Active
                                    </DropdownMenuItem>
                                  </PermissionGuard>
                                  
                                  <PermissionGuard permissionCode="vehicle.delete" action="delete" fallback={null}>
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-red-600"
                                        onClick={() => handlePermanentDelete(vehicle.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Permanently
                                      </DropdownMenuItem>
                                    </>
                                  </PermissionGuard>
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
                          onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => { e.preventDefault(); setCurrentPage(pageNum); }}
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
                          onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
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