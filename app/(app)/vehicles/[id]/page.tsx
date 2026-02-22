"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Car, 
  Edit, 
  Plus, 
  RefreshCw, 
  Settings, 
  History,
  CheckCircle,
  AlertCircle,
  Package,
  Calendar,
  Hash,
  Circle,
  Printer,
  FileText,
  ChevronRight,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";
import TruckWheelDiagram from "@/components/truck-wheel-diagram/TruckWheelDiagram";
import TireServiceModal from "@/components/tire-service-modal";
import TireHistoryModal from "@/components/tire-history-modal";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface VehiclePosition {
  id: number;
  vehicle_id: number;
  position_code: string;
  position_name: string;
  axle_number: number;
  is_trailer: number;
  created_at: string;
}

interface TireInstallation {
  id: number;
  tire_id: number;
  vehicle_id: number;
  position_id: number;
  install_date: string;
  removal_date: string | null;
  install_odometer: number;
  removal_odometer: number | null;
  reason_for_change: string;
  created_by: string;
  created_at: string;
  serial_number: string;
  size: string;
  brand: string;
  type: string;
  position_code: string;
  position_name: string;
  vehicle_number: string;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  wheel_config: "4x2" | "6x4" | "8x4" | "6x2" | "4x4";
  current_odometer: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  created_at: string;
  positions: VehiclePosition[];
  current_tires: TireInstallation[];
  history: TireInstallation[];
}

// Utility function to map position_code to wheelId
const positionCodeToWheelId = (positionCode: string): string => {
  const positionMap: Record<string, string> = {
    "FL": "A1-L",
    "FR": "A1-R",
    "RL1": "A2-L-Inner",
    "RL2": "A2-L-Outer",
    "RR1": "A2-R-Inner",
    "RR2": "A2-R-Outer",
    "RL": "A2-L",
    "RR": "A2-R",
    "R1L": "A2-L",
    "R1R": "A2-R",
    "R2L": "A3-L",
    "R2R": "A3-R",
    "R3L": "A4-L",
    "R3R": "A4-R",
  };
  
  return positionMap[positionCode] || positionCode;
};

// Reverse mapping: wheelId to position_code
const wheelIdToPositionCode = (wheelId: string): string => {
  const reverseMap: Record<string, string> = {
    "A1-L": "FL",
    "A1-R": "FR",
    "A2-L-Inner": "RL1",
    "A2-L-Outer": "RL2",
    "A2-R-Inner": "RR1",
    "A2-R-Outer": "RR2",
    "A2-L": "R1L",
    "A2-R": "R1R",
    "A3-L": "R2L",
    "A3-R": "R2R",
    "A4-L": "R3L",
    "A4-R": "R3R",
  };
  
  return reverseMap[wheelId] || wheelId;
};

// Get tire type icon
const getTireTypeIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case "NEW":
      return <Circle className="h-2 w-2 text-green-500 fill-green-500" />;
    case "RETREAD":
      return <Circle className="h-2 w-2 text-yellow-500 fill-yellow-500" />;
    case "USED":
      return <Circle className="h-2 w-2 text-blue-500 fill-blue-500" />;
    default:
      return <Circle className="h-2 w-2 text-gray-500 fill-gray-500" />;
  }
};

// Get tire type badge color
const getTireTypeColor = (type: string) => {
  switch (type?.toUpperCase()) {
    case "NEW":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
    case "RETREAD":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
    case "USED":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

// Skeleton Components
const InfoCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const TireRowSkeleton = () => (
  <div className="flex items-center justify-between p-3 border-b">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
    <div className="space-y-2 text-right">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
);

export default function VehicleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id;
  
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWheel, setSelectedWheel] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedPositionForService, setSelectedPositionForService] = useState<string | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Mobile collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    vehicleInfo: true,
    tireHistory: true,
    tireList: true,
  });

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (vehicleId && isAuthenticated) {
      fetchVehicle();
    }
  }, [vehicleId, isAuthenticated]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Vehicle not found");
        }
        throw new Error("Failed to fetch vehicle details");
      }
      
      const data = await response.json();
      setVehicle(data);
      
      if (data.positions && Array.isArray(data.positions) && data.positions.length > 0) {
        setVehiclePositions(data.positions);
      } else {
        console.warn("No positions array found in vehicle data, fetching separately...");
        await fetchVehiclePositions();
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      setError(error instanceof Error ? error.message : "Failed to load vehicle details");
      toast.error("Failed to load vehicle details", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclePositions = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/positions`);
      
      if (response.ok) {
        const positionsData = await response.json();
        setVehiclePositions(positionsData);
      } else {
        // Generate default positions based on wheel config
        setVehiclePositions(generateDefaultPositions(vehicle?.wheel_config || "6x4"));
      }
    } catch (error) {
      console.error("Error fetching vehicle positions:", error);
      // Generate default positions as fallback
      setVehiclePositions(generateDefaultPositions(vehicle?.wheel_config || "6x4"));
    }
  };

  const generateDefaultPositions = (wheelConfig: string): VehiclePosition[] => {
    const positions: VehiclePosition[] = [];
    let idCounter = 1;
    
    switch (wheelConfig) {
      case "4x2":
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FL",
          position_name: "Front Left",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FR",
          position_name: "Front Right",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "RL",
          position_name: "Rear Left",
          axle_number: 2,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "RR",
          position_name: "Rear Right",
          axle_number: 2,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        break;
        
      case "6x4":
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FL",
          position_name: "Front Left",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FR",
          position_name: "Front Right",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "R1L",
          position_name: "Rear 1 Left",
          axle_number: 2,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "R1R",
          position_name: "Rear 1 Right",
          axle_number: 2,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "R2L",
          position_name: "Rear 2 Left",
          axle_number: 3,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "R2R",
          position_name: "Rear 2 Right",
          axle_number: 3,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        break;
        
      case "8x4":
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FL",
          position_name: "Front Left",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FR",
          position_name: "Front Right",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        for (let axle = 2; axle <= 4; axle++) {
          positions.push({
            id: idCounter++,
            vehicle_id: Number(vehicleId),
            position_code: `R${axle-1}L`,
            position_name: `Rear ${axle-1} Left`,
            axle_number: axle,
            is_trailer: 0,
            created_at: new Date().toISOString()
          });
          positions.push({
            id: idCounter++,
            vehicle_id: Number(vehicleId),
            position_code: `R${axle-1}R`,
            position_name: `Rear ${axle-1} Right`,
            axle_number: axle,
            is_trailer: 0,
            created_at: new Date().toISOString()
          });
        }
        break;
        
      default:
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FL",
          position_name: "Front Left",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "FR",
          position_name: "Front Right",
          axle_number: 1,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "RL",
          position_name: "Rear Left",
          axle_number: 2,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
        positions.push({
          id: idCounter++,
          vehicle_id: Number(vehicleId),
          position_code: "RR",
          position_name: "Rear Right",
          axle_number: 2,
          is_trailer: 0,
          created_at: new Date().toISOString()
        });
    }
    
    return positions;
  };

  const tireDataForDiagram = useMemo(() => {
    if (!vehicle) return {};
    
    const data: Record<string, {
      serialNumber: string;
      size: string;
      brand?: string;
      type?: string;
      installDate?: string;
      status?: string;
    }> = {};
    
    vehicle.current_tires.forEach(tire => {
      const wheelId = positionCodeToWheelId(tire.position_code);
      data[wheelId] = {
        serialNumber: tire.serial_number,
        size: tire.size,
        brand: tire.brand,
        type: tire.type,
        installDate: tire.install_date,
        status: tire.type === "NEW" ? "good" : 
                tire.type === "RETREAD" ? "worn" : 
                tire.type === "USED" ? "worn" : "unknown"
      };
    });
    
    return data;
  }, [vehicle]);

  const positionsForDiagram = useMemo(() => {
    if (!vehiclePositions.length) return [];
    
    return vehiclePositions.map(pos => ({
      position_code: pos.position_code,
      position_name: pos.position_name,
      axle_number: pos.axle_number
    }));
  }, [vehiclePositions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
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

  const formatOdometer = (odometer: number) => {
    return odometer.toLocaleString() + " km";
  };

  const getTireAge = (installDate: string) => {
    const install = new Date(installDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - install.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleWheelSelect = (data: { wheelId: string; axle: number; side: string; position: string; x: number; y: number }) => {
    console.log("Wheel selected:", data);
    
    if (!vehicle) return;
    
    const positionCode = wheelIdToPositionCode(data.wheelId);
    setSelectedWheel(positionCode);
    
    const tire = vehicle.current_tires.find(t => t.position_code === positionCode);
    
    if (tire) {
      console.log("Tire details:", tire);
    } else {
      console.log("No tire installed at position:", positionCode);
    }
  };

  const handleRefreshAll = () => {
    fetchVehicle();
    setSelectedWheel(null);
    toast.success("Vehicle data refreshed");
  };

  const handleServiceClick = (positionCode?: string) => {
    if (!hasPermission("tire.assign")) {
      toast.error("You don't have permission to service tires");
      return;
    }
    setSelectedPositionForService(positionCode || null);
    setIsServiceModalOpen(true);
  };

  const filteredTires = useMemo(() => {
    if (!vehicle) return [];
    
    if (selectedWheel) {
      return vehicle.current_tires.filter(tire => tire.position_code === selectedWheel);
    }
    
    return vehicle.current_tires;
  }, [vehicle, selectedWheel]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Print functionality
  const handlePrint = () => {
    if (!vehicle) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vehicle Tire Report - ${vehicle.vehicle_number}</title>
        <style>
          @media print {
            @page {
              margin: 0.5in;
              size: letter portrait;
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
            .vehicle-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 25px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 4px;
            }
            .info-item {
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
              display: inline-block;
              min-width: 140px;
            }
            .tires-section {
              margin-top: 25px;
            }
            .tires-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .tires-table th {
              background-color: #2c3e50;
              color: white;
              padding: 10px;
              text-align: left;
              border: 1px solid #34495e;
            }
            .tires-table td {
              padding: 8px 10px;
              border: 1px solid #ddd;
            }
            .tires-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-active {
              background-color: #d4edda;
              color: #155724;
            }
            .status-maintenance {
              background-color: #fff3cd;
              color: #856404;
            }
            .status-inactive {
              background-color: #f8f9fa;
              color: #6c757d;
            }
            .tire-type-new {
              background-color: #d4edda;
              color: #155724;
            }
            .tire-type-retread {
              background-color: #fff3cd;
              color: #856404;
            }
            .tire-type-used {
              background-color: #cce5ff;
              color: #004085;
            }
            .print-footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .summary-stats {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              padding: 10px;
              background: #f1f8ff;
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
            }
            .generated-by {
              margin-top: 10px;
              font-size: 11px;
              color: #666;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Vehicle Tire Report</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p class="generated-by">Generated by: ${user?.full_name || user?.username || 'System'}</p>
        </div>
        
        <div class="vehicle-info">
          <div class="info-item">
            <span class="info-label">Vehicle Number:</span>
            <strong>${vehicle.vehicle_number}</strong>
          </div>
          <div class="info-item">
            <span class="info-label">Make & Model:</span>
            ${vehicle.make} ${vehicle.model} (${vehicle.year})
          </div>
          <div class="info-item">
            <span class="info-label">Wheel Config:</span>
            ${vehicle.wheel_config}
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span class="status-badge status-${vehicle.status.toLowerCase()}">${vehicle.status}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Current Odometer:</span>
            ${vehicle.current_odometer?.toLocaleString() || '0'} km
          </div>
        </div>
        
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-value">${vehicle.current_tires.length}</div>
            <div class="stat-label">Total Tires</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${vehicle.current_tires.filter(t => t.type === "NEW").length}</div>
            <div class="stat-label">New Tires</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${vehicle.current_tires.filter(t => t.type === "RETREAD").length}</div>
            <div class="stat-label">Retread Tires</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${vehicle.current_tires.filter(t => t.type === "USED").length}</div>
            <div class="stat-label">Used Tires</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${vehiclePositions.length}</div>
            <div class="stat-label">Total Positions</div>
          </div>
        </div>
        
        <div class="tires-section">
          <h2>Current Tires (${vehicle.current_tires.length})</h2>
          <table class="tires-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Serial Number</th>
                <th>Tire Type</th>
                <th>Size</th>
                <th>Brand</th>
                <th>Install Date</th>
                <th>Age (Days)</th>
                <th>Install Odometer</th>
              </tr>
            </thead>
            <tbody>
              ${vehicle.current_tires.map(tire => `
                <tr>
                  <td><strong>${tire.position_code}</strong><br><small>${tire.position_name}</small></td>
                  <td><code>${tire.serial_number}</code></td>
                  <td><span class="status-badge tire-type-${tire.type?.toLowerCase() || 'used'}">${tire.type || 'N/A'}</span></td>
                  <td>${tire.size}</td>
                  <td>${tire.brand || 'N/A'}</td>
                  <td>${formatDate(tire.install_date)}</td>
                  <td>${getTireAge(tire.install_date)}</td>
                  <td>${tire.install_odometer.toLocaleString()} km</td>
                </tr>
              `).join('')}
              ${vehicle.current_tires.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 30px; color: #666;">
                    No tires currently installed on this vehicle.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
        
        <div class="print-footer">
          <p>Report ID: VEH-${vehicle.id}-${Date.now().toString().slice(-6)}</p>
          <p>Fleet Management System | Confidential Document</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-4 w-36 sm:w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <InfoCardSkeleton />
            <InfoCardSkeleton />
          </div>
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <TireRowSkeleton key={i} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Show permission denied for viewing vehicles
  if (!hasPermission("vehicle.view")) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Vehicle Details</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">View vehicle information and tire assignments</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="ml-2 text-sm">
            You don't have permission to view vehicle details. Please contact your administrator.
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Vehicle Details</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">View vehicle information and tire assignments</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="ml-2 text-sm">
            {error}
          </AlertDescription>
        </Alert>

        <Button onClick={fetchVehicle} className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Vehicle Not Found</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">The vehicle you're looking for doesn't exist</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="ml-2 text-sm">
            Vehicle ID: {vehicleId} not found
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/vehicles">Return to Vehicles</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="vehicle.view" action="view">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/vehicles">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
                {vehicle.vehicle_number} - Details
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">
                Vehicle overview and configuration information
              </p>
            </div>
          </div>
          
          {/* Action Buttons - Horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            <PermissionGuard permissionCode="vehicle.edit" action="edit" fallback={null}>
              <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
                <Link href={`/vehicles/${vehicle.id}/edit`}>
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Vehicle</span>
                </Link>
              </Button>
            </PermissionGuard>
            
            <PermissionGuard permissionCode="tire.assign" action="create" fallback={null}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleServiceClick()}
                className="whitespace-nowrap"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Service</span>
              </Button>
            </PermissionGuard>
            
            <Button variant="outline" size="sm" onClick={handleRefreshAll} className="whitespace-nowrap">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="whitespace-nowrap bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800 dark:text-blue-300"
            >
              <Printer className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>

        {/* Hidden print content */}
        <div ref={printRef} className="hidden">
          <div className="print-content">
            <div className="vehicle-print-info">
              <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Vehicle Number:</span> {vehicle.vehicle_number}</div>
                <div><span className="font-medium">Make & Model:</span> {vehicle.make} {vehicle.model} ({vehicle.year})</div>
                <div><span className="font-medium">Status:</span> {vehicle.status}</div>
                <div><span className="font-medium">Wheel Config:</span> {vehicle.wheel_config}</div>
                <div><span className="font-medium">Current Odometer:</span> {formatOdometer(vehicle.current_odometer)}</div>
              </div>
            </div>
            
            <div className="tire-print-table mt-4">
              <h3 className="text-lg font-semibold mb-2">Current Tires</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Position</th>
                    <th className="text-left py-2">Serial Number</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Size</th>
                    <th className="text-left py-2">Brand</th>
                    <th className="text-left py-2">Install Date</th>
                    <th className="text-left py-2">Age (Days)</th>
                    <th className="text-left py-2">Install Odometer</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicle.current_tires.map(tire => (
                    <tr key={tire.id} className="border-b">
                      <td className="py-2">
                        <div className="font-medium">{tire.position_code}</div>
                        <div className="text-xs text-gray-500">{tire.position_name}</div>
                      </td>
                      <td className="py-2 font-mono">{tire.serial_number}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getTireTypeColor(tire.type)}`}>
                          {tire.type}
                        </span>
                      </td>
                      <td className="py-2">{tire.size}</td>
                      <td className="py-2">{tire.brand || 'N/A'}</td>
                      <td className="py-2">{formatDate(tire.install_date)}</td>
                      <td className="py-2">{getTireAge(tire.install_date)}</td>
                      <td className="py-2">{tire.install_odometer.toLocaleString()} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Content Grid - Stack on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 sm:gap-6">
          {/* LEFT COLUMN: Vehicle Info and History */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Vehicle Info Card - Collapsible on mobile */}
            <Collapsible
              open={expandedSections.vehicleInfo}
              onOpenChange={() => toggleSection('vehicleInfo')}
              className="border rounded-lg lg:border-0 lg:rounded-none"
            >
              <div className="flex items-center justify-between p-4 lg:hidden">
                <h2 className="text-sm font-semibold">Vehicle Information</h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {expandedSections.vehicleInfo ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="lg:block">
                <Card>
                  <CardHeader className="pb-3 lg:block hidden">
                    <CardTitle className="text-base sm:text-lg">Vehicle Information</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Basic vehicle identification details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm sm:text-base font-medium truncate">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm">
                        <span className="font-medium">Wheel Config: </span>
                        {vehicle.wheel_config}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm">
                        <span className="font-medium">Added: </span>
                        {formatDate(vehicle.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs sm:text-sm">
                        <span className="font-medium">Odometer: </span>
                        {formatOdometer(vehicle.current_odometer)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium">Status:</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getStatusColor(vehicle.status))}
                      >
                        {vehicle.status}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs sm:text-sm font-medium">Current Tires:</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
                            <div className="text-sm font-bold text-green-700 dark:text-green-300">
                              {vehicle.current_tires.filter(t => t.type === "NEW").length}
                            </div>
                            <div className="text-[10px] text-green-600 dark:text-green-400">New</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
                            <div className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
                              {vehicle.current_tires.filter(t => t.type === "RETREAD").length}
                            </div>
                            <div className="text-[10px] text-yellow-600 dark:text-yellow-400">Retread</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                            <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                              {vehicle.current_tires.filter(t => t.type === "USED").length}
                            </div>
                            <div className="text-[10px] text-blue-600 dark:text-blue-400">Used</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Tire History Card - Collapsible on mobile */}
            <Collapsible
              open={expandedSections.tireHistory}
              onOpenChange={() => toggleSection('tireHistory')}
              className="border rounded-lg lg:border-0 lg:rounded-none"
            >
              <div className="flex items-center justify-between p-4 lg:hidden">
                <h2 className="text-sm font-semibold">Tire History</h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {expandedSections.tireHistory ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="lg:block">
                <Card>
                  <CardHeader className="pb-3 lg:block hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg">Tire History</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Recent tire changes for this vehicle
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {vehicle.history.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <History className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tire history available</p>
                        <PermissionGuard permissionCode="tire.assign" action="create" fallback={null}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceClick()}
                            className="mt-4"
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Add Tire Service
                          </Button>
                        </PermissionGuard>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Mobile: Card view for history */}
                        <div className="sm:hidden space-y-2">
                          {vehicle.history.slice(0, 3).map((history) => (
                            <div key={history.id} className="bg-muted/30 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {history.position_code}
                                </Badge>
                                <Badge 
                                  variant={history.removal_date ? "outline" : "default"}
                                  className="text-xs"
                                >
                                  {history.removal_date ? "Removed" : "Installed"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-mono text-xs truncate max-w-[120px]">
                                  {history.serial_number}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(history.install_date)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop: Table view */}
                        <div className="hidden sm:block rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="h-8">Date</TableHead>
                                <TableHead className="h-8">Position</TableHead>
                                <TableHead className="h-8">Tire Serial</TableHead>
                                <TableHead className="h-8">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {vehicle.history.slice(0, 5).map((history) => (
                                <TableRow key={history.id}>
                                  <TableCell className="py-2">
                                    <div className="text-xs">
                                      {formatDate(history.install_date)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {history.position_code}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-mono text-xs truncate max-w-[100px]" title={history.serial_number}>
                                      {history.serial_number}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={history.removal_date ? "outline" : "default"}
                                      className="text-xs"
                                    >
                                      {history.removal_date ? "Removed" : "Installed"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {/* History Summary */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Showing {Math.min(3, vehicle.history.length)} of {vehicle.history.length} records
                            </div>
                          </div>
                          
                          {/* Summary Statistics */}
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div className="text-center p-1 bg-blue-50 dark:bg-blue-950 rounded">
                              <div className="font-medium text-blue-700 dark:text-blue-300">
                                {vehicle.history.filter(h => !h.removal_date).length}
                              </div>
                              <div className="text-blue-600 dark:text-blue-400">Active</div>
                            </div>
                            <div className="text-center p-1 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="font-medium text-gray-700 dark:text-gray-300">
                                {vehicle.history.filter(h => h.removal_date).length}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">Removed</div>
                            </div>
                            <div className="text-center p-1 bg-green-50 dark:bg-green-950 rounded">
                              <div className="font-medium text-green-700 dark:text-green-300">
                                {vehicle.history.length}
                              </div>
                              <div className="text-green-600 dark:text-green-400">Total</div>
                            </div>
                          </div>
                          
                          {/* Full History Button */}
                          <PermissionGuard permissionCode="tire.view" action="view" fallback={null}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsHistoryModalOpen(true)}
                              className="w-full h-8 text-xs mt-2"
                            >
                              <History className="mr-2 h-3 w-3" />
                              View Complete History
                            </Button>
                          </PermissionGuard>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* MIDDLE COLUMN: Wheel Diagram */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Wheel Configuration</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {vehicle.wheel_config} layout
                      {selectedWheel && (
                        <span className="ml-2 text-primary font-medium">
                          • Selected: {selectedWheel}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {vehicle.current_tires.length}/{vehiclePositions.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-full flex flex-col">
                  <div className="min-h-[300px] sm:min-h-[400px]">
                    <TruckWheelDiagram
                      positions={positionsForDiagram}
                      tireData={tireDataForDiagram}
                      onWheelSelect={handleWheelSelect}
                      selectable={true}
                      multiSelect={false}
                      showLabels={true}
                      showAxleNumbers={true}
                    />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Circle className="h-2 w-2 text-green-500 fill-green-500" />
                        <span>New: {vehicle.current_tires.filter(t => t.type === "NEW").length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Circle className="h-2 w-2 text-yellow-500 fill-yellow-500" />
                        <span>Retread: {vehicle.current_tires.filter(t => t.type === "RETREAD").length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Circle className="h-2 w-2 text-blue-500 fill-blue-500" />
                        <span>Used: {vehicle.current_tires.filter(t => t.type === "USED").length}</span>
                      </div>
                      {vehicle.current_tires.length < vehiclePositions.length && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                          {vehiclePositions.length - vehicle.current_tires.length} empty
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Current Tires Table */}
          <div className="lg:col-span-2">
            <Collapsible
              open={expandedSections.tireList}
              onOpenChange={() => toggleSection('tireList')}
              className="border rounded-lg lg:border-0 lg:rounded-none h-full"
            >
              <div className="flex items-center justify-between p-4 lg:hidden">
                <h2 className="text-sm font-semibold">Current Tires</h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {expandedSections.tireList ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="lg:block h-full">
                <Card className="h-full">
                  <CardHeader className="pb-3 lg:block hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base sm:text-lg">Current Tires</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {selectedWheel 
                            ? `Showing tire at ${selectedWheel}`
                            : `All installed tires (${vehicle.current_tires.length})`
                          }
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedWheel(null)}
                          disabled={!selectedWheel}
                          className="h-7 text-xs"
                        >
                          Show All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrint}
                          className="h-7 text-xs"
                          title="Print tire report"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 lg:pt-4">
                    {vehicle.current_tires.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Package className="h-8 w-8 sm:h-12 sm:w-12 mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">No tires installed</p>
                        <PermissionGuard permissionCode="tire.assign" action="create" fallback={null}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceClick()}
                            className="mt-4"
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Install Tires
                          </Button>
                        </PermissionGuard>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Mobile: Card view for tires */}
                        <div className="sm:hidden space-y-2 max-h-[400px] overflow-y-auto">
                          {filteredTires.map((tire) => {
                            const tireAge = getTireAge(tire.install_date);
                            const ageColor = tireAge > 365 ? "text-red-500 dark:text-red-400" : 
                                           tireAge > 180 ? "text-yellow-500 dark:text-yellow-400" : 
                                           "text-green-500 dark:text-green-400";
                            const isSelected = selectedWheel === tire.position_code;
                            
                            return (
                              <div 
                                key={tire.id} 
                                className={cn(
                                  "bg-muted/30 rounded p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                  isSelected && "bg-primary/5 dark:bg-primary/10 border border-primary/20"
                                )}
                                onClick={() => setSelectedWheel(tire.position_code)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {getTireTypeIcon(tire.type)}
                                    <Badge 
                                      variant="outline" 
                                      className={cn("font-mono text-xs", isSelected && "border-primary bg-primary/10")}
                                    >
                                      {tire.position_code}
                                    </Badge>
                                    <span className="text-xs">{tire.position_name}</span>
                                  </div>
                                  <PermissionGuard permissionCode="tire.assign" action="edit" fallback={null}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-primary/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleServiceClick(tire.position_code);
                                      }}
                                      title="Service this tire"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                    </Button>
                                  </PermissionGuard>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <div className="text-xs text-muted-foreground">Serial</div>
                                    <div className="font-mono text-xs truncate">{tire.serial_number}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Type</div>
                                    <Badge variant="outline" className={cn("text-xs", getTireTypeColor(tire.type))}>
                                      {tire.type}
                                    </Badge>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Age</div>
                                    <div className={cn("text-xs font-medium", ageColor)}>{tireAge}d</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Odometer</div>
                                    <div className="font-mono text-xs">{tire.install_odometer.toLocaleString()}</div>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span className="font-medium">Size:</span> {tire.size} • <span className="font-medium">Brand:</span> {tire.brand || 'N/A'}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop: Table view */}
                        <div className="hidden sm:block h-full">
                          <div className="h-[400px] overflow-y-auto">
                            <Table>
                              <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                  <TableHead className="h-8 py-1 text-xs">Pos</TableHead>
                                  <TableHead className="h-8 py-1 text-xs">Serial</TableHead>
                                  <TableHead className="h-8 py-1 text-xs">Type</TableHead>
                                  <TableHead className="h-8 py-1 text-xs">Age</TableHead>
                                  <TableHead className="h-8 py-1 text-xs">Mileage</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredTires.map((tire) => {
                                  const tireAge = getTireAge(tire.install_date);
                                  const ageColor = tireAge > 365 ? "text-red-500 dark:text-red-400" : 
                                                 tireAge > 180 ? "text-yellow-500 dark:text-yellow-400" : 
                                                 "text-green-500 dark:text-green-400";
                                  const isSelected = selectedWheel === tire.position_code;
                                  
                                  return (
                                    <TableRow 
                                      key={tire.id} 
                                      className={cn(
                                        "h-10 cursor-pointer",
                                        isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/50 dark:hover:bg-muted/20'
                                      )}
                                      onClick={() => setSelectedWheel(tire.position_code)}
                                    >
                                      <TableCell className="py-2">
                                        <div className="flex items-center gap-2">
                                          {getTireTypeIcon(tire.type)}
                                          <div className="flex items-center gap-1">
                                            <Badge 
                                              variant="outline" 
                                              className={cn("font-mono text-xs px-1.5 py-0", isSelected ? 'border-primary bg-primary/10' : '')}
                                            >
                                              {tire.position_code}
                                            </Badge>
                                            <PermissionGuard permissionCode="tire.assign" action="edit" fallback={null}>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 hover:bg-primary/10"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleServiceClick(tire.position_code);
                                                }}
                                                title="Service this tire"
                                              >
                                                <RefreshCw className="h-3 w-3" />
                                              </Button>
                                            </PermissionGuard>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <div className="font-mono text-xs truncate max-w-[80px]" title={tire.serial_number}>
                                          {tire.serial_number}
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <Badge 
                                          variant="outline" 
                                          className={cn("text-xs px-1.5 py-0", getTireTypeColor(tire.type))}
                                        >
                                          {tire.type}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <div className={cn("text-xs font-medium", ageColor)}>
                                          {tireAge}d
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <div className="font-mono text-xs truncate max-w-[60px]" title={tire.install_odometer.toString()}>
                                          {tire.install_odometer.toLocaleString()}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                        
                        {/* Footer Actions */}
                        {vehicle.current_tires.length > 0 && (
                          <div className="pt-4 border-t mt-2">
                            <div className="flex flex-col xs:flex-row items-center justify-between gap-2">
                              <div className="flex items-center gap-2 w-full xs:w-auto">
                                <PermissionGuard permissionCode="tire.assign" action="create" fallback={null}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleServiceClick()}
                                    className="flex-1 xs:flex-none h-8 text-xs"
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Service
                                  </Button>
                                </PermissionGuard>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handlePrint}
                                  className="flex-1 xs:flex-none h-8 text-xs"
                                >
                                  <Printer className="mr-1 h-3 w-3" />
                                  Print
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {filteredTires.length} shown
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {vehicle && (
          <>
            <TireServiceModal
              isOpen={isServiceModalOpen}
              onClose={() => {
                setIsServiceModalOpen(false);
                setSelectedPositionForService(null);
              }}
              vehicleId={vehicle.id}
              vehicleNumber={vehicle.vehicle_number}
              currentTires={vehicle.current_tires.map(tire => ({
                id: tire.id,
                tire_id: tire.tire_id,
                position_code: tire.position_code,
                position_name: tire.position_name,
                serial_number: tire.serial_number,
                size: tire.size,
                brand: tire.brand,
                type: tire.type,
                install_date: tire.install_date,
                install_odometer: tire.install_odometer
              }))}
              onSuccess={() => {
                fetchVehicle();
                setSelectedWheel(null);
              }}
            />
            
            <TireHistoryModal
              isOpen={isHistoryModalOpen}
              onClose={() => setIsHistoryModalOpen(false)}
              vehicleId={vehicle.id}
              vehicleNumber={vehicle.vehicle_number}
              historyData={vehicle.history}
            />
          </>
        )}
      </div>
    </PermissionGuard>
  );
}