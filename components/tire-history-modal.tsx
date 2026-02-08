"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Filter,
  Calendar,
  Package,
  Hash,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Printer,
  Calendar as CalendarIcon,
  FileText,
  BarChart,
  Clock,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subDays, subYears, startOfYear } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

interface TireInstallationHistory {
  id: number;
  tire_id: number;
  vehicle_id: number;
  position_id: number;
  position_code: string;
  position_name: string;
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
  type?: string;
  vehicle_number?: string;
}

interface TireHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  vehicleNumber: string;
  historyData: TireInstallationHistory[];
}

interface DateRangeState {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export default function TireHistoryModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleNumber,
  historyData,
}: TireHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: undefined,
    endDate: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const printRef = useRef<HTMLDivElement>(null);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Calculate service duration in days
  const getServiceDuration = (installDate: string, removalDate: string | null) => {
    if (!removalDate) return "Current";
    const install = new Date(installDate);
    const removal = new Date(removalDate);
    const diffTime = Math.abs(removal.getTime() - install.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  // Calculate service mileage
  const getServiceMileage = (installOdometer: number, removalOdometer: number | null) => {
    if (!removalOdometer) return "Current";
    const mileage = removalOdometer - installOdometer;
    return mileage.toLocaleString() + " km";
  };

  // Get tire type from brand/other data (since type is not always in the response)
  const getTireType = (record: TireInstallationHistory): string => {
    return record.type || "UNKNOWN";
  };

  // Check if a date falls within the selected range
  const isDateInRange = (dateString: string): boolean => {
    if (!dateRange.startDate || !dateRange.endDate) return true;
    
    const date = new Date(dateString);
    const startOfDay = new Date(dateRange.startDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateRange.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    return date >= startOfDay && date <= endOfDay;
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return historyData.filter((record) => {
      // Date range filter - check both install and removal dates
      const matchesDateRange = 
        (!dateRange.startDate || !dateRange.endDate) || // No date filter
        isDateInRange(record.install_date) || 
        (record.removal_date ? isDateInRange(record.removal_date) : false);

      if (!matchesDateRange) return false;

      // Search filter - Enhanced search functionality
      const searchLower = searchTerm.toLowerCase().trim();
      if (searchTerm) {
        const searchTerms = searchLower.split(/\s+/); // Split by spaces for multiple search terms
        
        // Check if ALL search terms match ANY field
        const matchesAllTerms = searchTerms.every(term => {
          return (
            record.serial_number.toLowerCase().includes(term) ||
            record.position_code.toLowerCase().includes(term) ||
            record.position_name.toLowerCase().includes(term) ||
            record.brand.toLowerCase().includes(term) ||
            record.reason_for_change.toLowerCase().includes(term) ||
            record.created_by.toLowerCase().includes(term) ||
            record.size.toLowerCase().includes(term) ||
            getTireType(record).toLowerCase().includes(term)
          );
        });
        
        if (!matchesAllTerms) return false;
      }

      // Position filter
      const matchesPosition =
        filterPosition === "all" || record.position_code === filterPosition;

      // Status filter
      const isCurrent = !record.removal_date;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "current" && isCurrent) ||
        (filterStatus === "removed" && !isCurrent);

      return matchesPosition && matchesStatus;
    });
  }, [historyData, searchTerm, filterPosition, filterStatus, dateRange]);

  // Sort data by install date (newest first)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      return new Date(b.install_date).getTime() - new Date(a.install_date).getTime();
    });
  }, [filteredData]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Get unique positions for filter
  const uniquePositions = Array.from(
    new Set(historyData.map((record) => record.position_code))
  ).sort();

  // Get statistics
  const statistics = useMemo(() => {
    const currentTires = historyData.filter(record => !record.removal_date).length;
    const totalServiceDays = historyData.reduce((total, record) => {
      if (record.removal_date) {
        const install = new Date(record.install_date);
        const removal = new Date(record.removal_date);
        const days = Math.ceil(Math.abs(removal.getTime() - install.getTime()) / (1000 * 60 * 60 * 24));
        return total + days;
      }
      return total;
    }, 0);
    
    const avgServiceDays = historyData.filter(record => record.removal_date).length > 0 
      ? Math.round(totalServiceDays / historyData.filter(record => record.removal_date).length)
      : 0;

    const mostCommonPosition = historyData.reduce((acc, record) => {
      acc[record.position_code] = (acc[record.position_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(mostCommonPosition).sort((a, b) => b[1] - a[1])[0];

    return {
      currentTires,
      totalRecords: historyData.length,
      avgServiceDays,
      mostCommonPosition: mostCommon ? `${mostCommon[0]} (${mostCommon[1]} times)` : 'N/A',
      dateRangeCount: filteredData.length,
    };
  }, [historyData, filteredData]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterPosition("all");
    setFilterStatus("all");
    setDateRange({
      startDate: undefined,
      endDate: undefined,
    });
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Quick date range presets
  const handleDateRangePreset = (preset: string) => {
    const today = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined = today;

    switch (preset) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case '3months':
        startDate = subMonths(today, 3);
        break;
      case 'year':
        startDate = startOfYear(today);
        break;
      case 'all':
        startDate = undefined;
        endDate = undefined;
        break;
      default:
        startDate = subMonths(today, 3);
    }

    setDateRange({ startDate, endDate });
    setCurrentPage(1);
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Serial Number",
      "Position Code",
      "Position Name",
      "Install Date",
      "Removal Date",
      "Service Duration",
      "Install Odometer",
      "Removal Odometer",
      "Service Mileage",
      "Brand",
      "Size",
      "Type",
      "Reason for Change",
      "Installed By",
      "Created Date",
    ];

    const csvData = sortedData.map((record) => [
      record.id,
      record.serial_number,
      record.position_code,
      record.position_name,
      formatDate(record.install_date),
      record.removal_date ? formatDate(record.removal_date) : "Current",
      getServiceDuration(record.install_date, record.removal_date),
      record.install_odometer.toLocaleString(),
      record.removal_odometer
        ? record.removal_odometer.toLocaleString()
        : "Current",
      getServiceMileage(record.install_odometer, record.removal_odometer),
      record.brand,
      record.size,
      getTireType(record),
      record.reason_for_change,
      record.created_by,
      formatDateTime(record.created_at),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tire-history-${vehicleNumber}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle print functionality
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tire History Report - ${vehicleNumber}</title>
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
            .stats-container {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 25px;
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
            .history-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 12px;
            }
            .history-table th {
              background-color: #2c3e50;
              color: white;
              padding: 8px;
              text-align: left;
              border: 1px solid #34495e;
              font-weight: bold;
            }
            .history-table td {
              padding: 6px 8px;
              border: 1px solid #ddd;
            }
            .history-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
            }
            .status-active {
              background-color: #d4edda;
              color: #155724;
            }
            .status-removed {
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
              font-size: 11px;
            }
            .date-range {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-bottom: 15px;
            }
            .print-summary {
              background: #f1f8ff;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 20px;
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Tire Installation History Report</h1>
          <p class="subtitle">Vehicle: ${vehicleNumber}</p>
          <p class="subtitle">Generated on ${format(new Date(), 'MMMM dd, yyyy')} at ${format(new Date(), 'hh:mm a')}</p>
        </div>
        
        <div class="date-range">
          ${dateRange.startDate 
            ? `Date Range: ${format(dateRange.startDate, 'MMM dd, yyyy')} to ${dateRange.endDate ? format(dateRange.endDate, 'MMM dd, yyyy') : 'Present'}`
            : 'Showing all records'
          }
        </div>
        
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-value">${statistics.totalRecords}</div>
            <div class="stat-label">Total Records</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${statistics.currentTires}</div>
            <div class="stat-label">Current Tires</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${statistics.avgServiceDays}</div>
            <div class="stat-label">Avg Days</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${statistics.dateRangeCount}</div>
            <div class="stat-label">Filtered Records</div>
          </div>
        </div>
        
        <div class="print-summary">
          Showing ${sortedData.length} of ${historyData.length} records • 
          Date range filtered: ${dateRange.startDate ? 'Yes' : 'No'} • 
          Generated by: System
        </div>
        
        <table class="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Serial No.</th>
              <th>Position</th>
              <th>Brand & Size</th>
              <th>Install Date</th>
              <th>Removal Date</th>
              <th>Duration</th>
              <th>Mileage</th>
              <th>Reason</th>
              <th>Installed By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${sortedData.map(record => {
              const isCurrent = !record.removal_date;
              const tireType = getTireType(record);
              return `
                <tr>
                  <td>${record.id}</td>
                  <td><strong>${record.serial_number}</strong></td>
                  <td>${record.position_code}<br><small>${record.position_name}</small></td>
                  <td>${record.brand}<br><small>${record.size}</small></td>
                  <td>${formatDate(record.install_date)}<br><small>${record.install_odometer.toLocaleString()} km</small></td>
                  <td>${record.removal_date ? formatDate(record.removal_date) + '<br><small>' + (record.removal_odometer?.toLocaleString() || '') + ' km</small>' : 'Current'}</td>
                  <td>${getServiceDuration(record.install_date, record.removal_date)}</td>
                  <td>${getServiceMileage(record.install_odometer, record.removal_odometer)}</td>
                  <td>${record.reason_for_change}</td>
                  <td>${record.created_by}</td>
                  <td>
                    <span class="status-badge ${isCurrent ? 'status-active' : 'status-removed'}">
                      ${isCurrent ? 'Active' : 'Removed'}
                    </span>
                    <br>
                    <span class="status-badge tire-type-${tireType.toLowerCase()}">
                      ${tireType}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="print-footer">
          <p>Report ID: TIRE-HIST-${vehicleNumber}-${Date.now().toString().slice(-6)}</p>
          <p>Fleet Management System | Confidential Document</p>
          <p>Page 1 of 1</p>
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

  // Get tire type badge color
  const getTireTypeColor = (type: string) => {
    const typeUpper = type.toUpperCase();
    switch (typeUpper) {
      case "NEW":
        return "bg-green-50 text-green-700 border-green-200";
      case "RETREAD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "USED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateRange({
      startDate: undefined,
      endDate: undefined,
    });
    setCurrentPage(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Tire Installation History
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span>Complete tire service history for vehicle </span>
                <Badge variant="secondary" className="font-mono">
                  {vehicleNumber}
                </Badge>
                {historyData.length > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant="outline" className="text-xs">
                      {historyData.length} total records
                    </Badge>
                  </>
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 gap-1.5 text-xs"
                disabled={sortedData.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Statistics Bar */}
        {historyData.length > 0 && (
          <div className="px-6 py-3 border-b bg-gradient-to-r from-amber-50 to-amber-25">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="text-xs font-medium text-gray-600">Total Records</div>
                  <div className="text-lg font-bold text-gray-900">{statistics.totalRecords}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-xs font-medium text-gray-600">Current Tires</div>
                  <div className="text-lg font-bold text-gray-900">{statistics.currentTires}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs font-medium text-gray-600">Avg Service Days</div>
                  <div className="text-lg font-bold text-gray-900">{statistics.avgServiceDays}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-xs font-medium text-gray-600">Most Used Position</div>
                  <div className="text-sm font-bold text-gray-900 truncate" title={statistics.mostCommonPosition}>
                    {statistics.mostCommonPosition}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-600" />
                <div>
                  <div className="text-xs font-medium text-gray-600">Filtered Records</div>
                  <div className="text-lg font-bold text-gray-900">{statistics.dateRangeCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="px-6 py-4 space-y-4 border-b bg-muted/30">
          {/* Search Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Search className="h-3.5 w-3.5" />
                Advanced Search
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search by serial, position, brand, reason, installer..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 pr-8 h-9 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="h-9 px-3 text-xs"
                  disabled={!searchTerm}
                >
                  Clear
                </Button>
              </div>
              <div className="text-xs text-muted-foreground pl-1">
                {searchTerm 
                  ? `${filteredData.length} results found for "${searchTerm}"`
                  : "Search across all fields. Use spaces for multiple terms."
                }
              </div>
            </div>

            {/* Compact Date Range Filter */}
            <div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label className="text-xs font-medium flex items-center gap-1">
      <CalendarIcon className="h-3.5 w-3.5" />
      Date Range Filter
    </Label>
    <div className="flex items-center gap-1">
      {dateRange.startDate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearDateFilter}
          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Clear
        </Button>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={dateRange.startDate ? "secondary" : "outline"}
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            {dateRange.startDate ? 'Change' : 'Dates'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1">
              {['week', 'month', '3months', 'year', 'today', 'all'].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateRangePreset(preset)}
                  className="h-7 text-xs"
                >
                  {preset === '3months' ? '3M' : preset === 'today' ? 'Today' : preset === 'all' ? 'All' : preset}
                </Button>
              ))}
            </div>
            
            <Separator />
            
            <div className="text-xs font-medium">Custom Range:</div>
            <CalendarComponent
              mode="range"
              selected={{
                from: dateRange.startDate,
                to: dateRange.endDate,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({
                    startDate: range.from,
                    endDate: range.to,
                  });
                  setCurrentPage(1);
                }
              }}
              numberOfMonths={1}
              className="rounded-md border p-1"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
  
  {dateRange.startDate && (
    <div className="text-xs text-blue-700 px-1">
      {dateRange.endDate ? (
        `${format(dateRange.startDate, "MMM dd")} - ${format(dateRange.endDate, "MMM dd")}`
      ) : (
        `From ${format(dateRange.startDate, "MMM dd, yyyy")}`
      )}
    </div>
  )}
</div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1 block">Position Filter</Label>
              <Select 
                value={filterPosition} 
                onValueChange={(value) => {
                  setFilterPosition(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <Hash className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {uniquePositions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Status Filter</Label>
              <Select 
                value={filterStatus} 
                onValueChange={(value) => {
                  setFilterStatus(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="current">Current Tires</SelectItem>
                  <SelectItem value="removed">Removed Tires</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex items-end gap-3">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="h-9 text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Reset All Filters
              </Button>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">
                  Showing {sortedData.length} of {historyData.length} records
                  {dateRange.startDate && " • Date filtered"}
                  {filterPosition !== "all" && " • Position filtered"}
                  {filterStatus !== "all" && " • Status filtered"}
                </div>
                <div className="text-xs font-medium mt-1">
                  Page {currentPage} of {totalPages} • {paginatedData.length} items on this page
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-hidden relative">
          {historyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <AlertCircle className="h-12 w-12 mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg mb-1">No History Found</h3>
              <p className="text-muted-foreground text-sm">
                No tire installation history available for this vehicle.
              </p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <AlertCircle className="h-12 w-12 mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg mb-1">No Matching Records</h3>
              <p className="text-muted-foreground text-sm mb-4">
                No records match your filters. Try adjusting your search criteria.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  size="sm"
                >
                  Clear All Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={clearDateFilter}
                  size="sm"
                >
                  Clear Dates
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className="min-w-[1200px]">
                <Table className="min-w-full text-xs">
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16 py-2 px-3 font-semibold text-[11px]">ID</TableHead>
                      <TableHead className="w-28 py-2 px-3 font-semibold text-[11px]">Serial</TableHead>
                      <TableHead className="w-24 py-2 px-3 font-semibold text-[11px]">Position</TableHead>
                      <TableHead className="w-40 py-2 px-3 font-semibold text-[11px]">Tire Details</TableHead>
                      <TableHead className="w-36 py-2 px-3 font-semibold text-[11px]">Installation</TableHead>
                      <TableHead className="w-36 py-2 px-3 font-semibold text-[11px]">Removal</TableHead>
                      <TableHead className="w-28 py-2 px-3 font-semibold text-[11px]">Duration</TableHead>
                      <TableHead className="w-28 py-2 px-3 font-semibold text-[11px]">Mileage</TableHead>
                      <TableHead className="w-64 py-2 px-3 font-semibold text-[11px]">Reason & Created By</TableHead>
                      <TableHead className="w-24 py-2 px-3 font-semibold text-[11px]">Status</TableHead>
                      <TableHead className="w-36 py-2 px-3 font-semibold text-[11px]">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((record) => {
                      const isCurrent = !record.removal_date;
                      const serviceDuration = getServiceDuration(
                        record.install_date,
                        record.removal_date
                      );
                      const serviceMileage = getServiceMileage(
                        record.install_odometer,
                        record.removal_odometer
                      );
                      const tireType = getTireType(record);

                      return (
                        <TableRow key={record.id} className="hover:bg-muted/30 border-b last:border-0">
                          <TableCell className="py-2 px-3 align-top">
                            <div className="font-mono text-[11px] font-medium text-muted-foreground">#{record.id}</div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                  tireType === "NEW"
                                    ? "bg-green-500"
                                    : tireType === "RETREAD"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <div className="font-mono text-xs font-medium truncate" title={record.serial_number}>
                                {record.serial_number}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="space-y-0.5">
                              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5">
                                {record.position_code}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground truncate" title={record.position_name}>
                                {record.position_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="space-y-1">
                              <div className="text-xs font-medium truncate" title={record.brand}>
                                {record.brand}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate" title={record.size}>
                                {record.size}
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0.5 ${getTireTypeColor(tireType)}`}
                              >
                                {tireType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                <span className="text-xs">
                                  {formatDate(record.install_date)}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground pl-4">
                                {record.install_odometer.toLocaleString()} km
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            {record.removal_date ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                  <span className="text-xs">
                                    {formatDate(record.removal_date)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground pl-4">
                                  {record.removal_odometer?.toLocaleString()} km
                                </div>
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] px-2 py-0.5"
                              >
                                Current
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="text-[11px] font-medium px-1.5 py-0.5 bg-muted/30 rounded inline-block">
                              {serviceDuration}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="text-[11px] font-medium px-1.5 py-0.5 bg-muted/30 rounded inline-block">
                              {serviceMileage}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="space-y-1">
                              <div className="text-[11px] line-clamp-2 max-h-8 overflow-hidden" title={record.reason_for_change}>
                                {record.reason_for_change}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                By: <span className="font-medium">{record.created_by}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            {isCurrent ? (
                              <Badge className="px-2 py-0.5 bg-green-50 text-green-700 border-green-200 text-xs">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs">
                                Removed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 align-top">
                            <div className="text-[10px] text-muted-foreground truncate" title={formatDateTime(record.created_at)}>
                              {formatDateTime(record.created_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && sortedData.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-3 bg-background">
            <div className="text-xs text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} records
              {dateRange.startDate && (
                <span className="ml-2">• Date filtered</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-3 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground px-2">Page</span>
                <div className="flex items-center gap-0.5">
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
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 min-w-8 text-xs"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground px-2">of {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-3 text-xs"
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Import the Label component
const Label = ({ className, children, ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);