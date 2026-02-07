"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
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
  FileText
} from "lucide-react";
import TruckWheelDiagram from "@/components/truck-wheel-diagram/TruckWheelDiagram";
import TireServiceModal from "@/components/tire-service-modal";
import TireHistoryModal from "@/components/tire-history-modal";

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
      return "bg-green-100 text-green-800 border-green-200";
    case "RETREAD":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "USED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function VehicleDetailsPage() {
  const params = useParams();
  const vehicleId = params.id;
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWheel, setSelectedWheel] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedPositionForService, setSelectedPositionForService] = useState<string | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}`
      );
      if (!res.ok) throw new Error("Vehicle not found");
      const data = await res.json();
      setVehicle(data);
      
      if (data.positions && Array.isArray(data.positions)) {
        setVehiclePositions(data.positions);
      } else {
        console.warn("No positions array found in vehicle data, fetching separately...");
        await fetchVehiclePositions();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclePositions = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/vehicles/${vehicleId}/positions`
      );
      if (res.ok) {
        const positionsData = await res.json();
        setVehiclePositions(positionsData);
      } else {
        setVehiclePositions(generateDefaultPositions(vehicle?.wheel_config || "6x4"));
      }
    } catch (error) {
      console.error("Error fetching vehicle positions:", error);
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
        return "bg-green-100 text-green-800 border-green-200";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
  };

  const handleServiceClick = (positionCode?: string) => {
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
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Vehicle Tire Report</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
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
            <span class="info-label">Status:</span>
            <span class="status-badge status-${vehicle.status.toLowerCase()}">${vehicle.status}</span>
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
                  <td><span class="status-badge tire-type-${tire.type.toLowerCase()}">${tire.type}</span></td>
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
      
      // Add a small delay before printing to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Alternative print function using printRef
  const handlePrintWithRef = () => {
    if (!printRef.current || !vehicle) return;
    
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #1a237e; margin-bottom: 5px;">Vehicle Tire Report</h1>
          <p style="color: #666;">${vehicle.vehicle_number} - Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            Loading vehicle details...
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Vehicle not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {vehicle.vehicle_number} - Details
            </h1>
            <p className="text-muted-foreground">
              Vehicle overview and configuration information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/vehicles/${vehicle.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Vehicle
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleServiceClick()}
            className="h-8 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Service
          </Button>
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Hidden print content */}
      <div ref={printRef} className="hidden">
        {/* This content is only for printing */}
        <div className="print-content">
          <div className="vehicle-print-info">
            <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Vehicle Number:</span> {vehicle.vehicle_number}</div>
              <div><span className="font-medium">Make & Model:</span> {vehicle.make} {vehicle.model} ({vehicle.year})</div>
              <div><span className="font-medium">Status:</span> {vehicle.status}</div>
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
                  <th className="text-left py-2">Install Date</th>
                  <th className="text-left py-2">Age (Days)</th>
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
                    <td className="py-2">{formatDate(tire.install_date)}</td>
                    <td className="py-2">{getTireAge(tire.install_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Content Grid - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* LEFT COLUMN: Vehicle Info and History (3/7) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>
                Basic vehicle identification details
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {vehicle.make} {vehicle.model}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Wheel Config: </span>
                  {vehicle.wheel_config}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Added: </span>
                  {formatDate(vehicle.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant="outline"
                  className={getStatusColor(vehicle.status)}
                >
                  {vehicle.status}
                </Badge>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Current Tires:</span>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                      {vehicle.current_tires.filter(t => t.type === "NEW").length} New
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                      {vehicle.current_tires.filter(t => t.type === "RETREAD").length} Retread
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                      {vehicle.current_tires.filter(t => t.type === "USED").length} Used
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tire History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tire Installation History</CardTitle>
              <CardDescription>
                Recent tire changes for this vehicle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vehicle.history.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No tire history available</p>
                  <p className="text-sm mt-1">
                    Tire service records will appear here
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceClick()}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Tire Service
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Tire Serial</TableHead>
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
                            <div className="font-mono text-xs">
                              {history.serial_number}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {vehicle.history.length > 5 && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setIsHistoryModalOpen(true)}
                      >
                        View all {vehicle.history.length} records
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE COLUMN: Wheel Diagram (3/7) */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Wheel Configuration</CardTitle>
                  <CardDescription className="text-sm">
                    {vehicle.wheel_config} layout
                    {selectedWheel && (
                      <span className="ml-2 text-primary font-medium">
                        • Selected: {selectedWheel}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {vehicle.current_tires.length}/{vehiclePositions.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 h-[calc(100%-80px)]">
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
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
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
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
                    </div>
                    {vehicle.current_tires.length < vehiclePositions.length && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        {vehiclePositions.length - vehicle.current_tires.length} empty
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Current Tires Table (2/7) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Tires</CardTitle>
                  <CardDescription className="text-sm">
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
            <CardContent className="pt-0 h-[calc(100%-80px)]">
              {vehicle.current_tires.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No tires installed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Install tires to get started
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceClick()}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Install Tires
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-1">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
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
                            const ageColor = tireAge > 365 ? "text-red-500" : 
                                           tireAge > 180 ? "text-yellow-500" : 
                                           "text-green-500";
                            const isSelected = selectedWheel === tire.position_code;
                            
                            return (
                              <TableRow 
                                key={tire.id} 
                                className={`h-10 ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'} cursor-pointer`}
                                onClick={() => setSelectedWheel(tire.position_code)}
                              >
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-2">
                                    {getTireTypeIcon(tire.type)}
                                    <div className="flex items-center gap-1">
                                      <Badge 
                                        variant="outline" 
                                        className={`font-mono text-xs px-1.5 py-0 ${isSelected ? 'border-primary bg-primary/10' : ''}`}
                                      >
                                        {tire.position_code}
                                      </Badge>
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
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="font-mono text-xs truncate" title={tire.serial_number}>
                                    {tire.serial_number}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-1.5 py-0 ${getTireTypeColor(tire.type)}`}
                                  >
                                    {tire.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className={`text-xs font-medium ${ageColor}`}>
                                    {tireAge}d
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="font-mono text-xs truncate" title={tire.install_odometer.toString()}>
                                    {tire.install_odometer}
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceClick()}
                            className="h-8 text-xs"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Service
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 text-xs"
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
  );
}