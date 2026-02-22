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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subDays, subYears, startOfYear } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "./ui/card";

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
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    stats: true,
  });
  const [selectedRecord, setSelectedRecord] = useState<TireInstallationHistory | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
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
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "RETREAD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "USED":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRowClick = (record: TireInstallationHistory) => {
    setSelectedRecord(record);
    setDetailViewOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl h-[95vh] max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Header - Fixed at top */}
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">Tire Installation History</span>
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm">
                <span className="truncate">Complete tire service history for vehicle</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {vehicleNumber}
                </Badge>
                {historyData.length > 0 && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {historyData.length} records
                    </Badge>
                  </>
                )}
              </DialogDescription>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Printer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs"
                disabled={sortedData.length === 0}
              >
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Statistics Bar - Collapsible on mobile */}
          {historyData.length > 0 && (
            <Collapsible
              open={expandedSections.stats}
              onOpenChange={() => toggleSection('stats')}
              className="border-b"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:hidden">
                <span className="text-xs font-medium">Statistics Overview</span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {expandedSections.stats ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="sm:block">
                <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-50 to-amber-25">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">Total Records</div>
                        <div className="text-sm sm:text-lg font-bold text-gray-900">{statistics.totalRecords}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">Current Tires</div>
                        <div className="text-sm sm:text-lg font-bold text-gray-900">{statistics.currentTires}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">Avg Days</div>
                        <div className="text-sm sm:text-lg font-bold text-gray-900">{statistics.avgServiceDays}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                      <div className="min-w-0 col-span-2 sm:col-span-1">
                        <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">Most Used</div>
                        <div className="text-xs sm:text-sm font-bold text-gray-900 truncate" title={statistics.mostCommonPosition}>
                          {statistics.mostCommonPosition}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-gray-600 truncate">Filtered</div>
                        <div className="text-sm sm:text-lg font-bold text-gray-900">{statistics.dateRangeCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Filters and Search - Collapsible on mobile */}
          <Collapsible
            open={expandedSections.filters}
            onOpenChange={() => toggleSection('filters')}
            className="border-b"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:hidden">
              <span className="text-xs font-medium">Filters & Search</span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {expandedSections.filters ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="sm:block">
              <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 bg-muted/30">
                {/* Search Bar */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      Search
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Search serial, position, brand..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-7 pr-7 h-8 text-xs"
                        />
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearSearch}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Date Range Filter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Date Range
                      </Label>
                      <div className="flex items-center gap-1">
                        {dateRange.startDate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearDateFilter}
                            className="h-5 px-1.5 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Clear
                          </Button>
                        )}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={dateRange.startDate ? "secondary" : "outline"}
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                            >
                              <CalendarIcon className="h-2.5 w-2.5 mr-1" />
                              {dateRange.startDate ? 'Change' : 'Select'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] p-2" align="end">
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-1">
                                {['week', 'month', '3months', 'year', 'today', 'all'].map((preset) => (
                                  <Button
                                    key={preset}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDateRangePreset(preset)}
                                    className="h-6 text-[10px]"
                                  >
                                    {preset === '3months' ? '3M' : preset === 'today' ? 'Today' : preset === 'all' ? 'All' : preset}
                                  </Button>
                                ))}
                              </div>
                              
                              <Separator />
                              
                              <div className="text-[10px] font-medium">Custom:</div>
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
                      <div className="text-[10px] text-blue-700 px-1 truncate">
                        {dateRange.endDate ? (
                          `${format(dateRange.startDate, "MMM d")} - ${format(dateRange.endDate, "MMM d")}`
                        ) : (
                          `From ${format(dateRange.startDate, "MMM d, yyyy")}`
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Position</Label>
                    <Select 
                      value={filterPosition} 
                      onValueChange={(value) => {
                        setFilterPosition(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Positions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Positions</SelectItem>
                        {uniquePositions.map((position) => (
                          <SelectItem key={position} value={position} className="text-xs">
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-1 block">Status</Label>
                    <Select 
                      value={filterStatus} 
                      onValueChange={(value) => {
                        setFilterStatus(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Status</SelectItem>
                        <SelectItem value="current" className="text-xs">Current Tires</SelectItem>
                        <SelectItem value="removed" className="text-xs">Removed Tires</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset Filters
                  </Button>
                  <div className="text-[10px] text-muted-foreground">
                    Showing {sortedData.length} of {historyData.length} records
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* History Table/List */}
          <div className="p-4 sm:p-6">
            {historyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-3 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">No History Found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No tire installation history available for this vehicle.
                </p>
              </div>
            ) : sortedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-3 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">No Matching Records</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Try adjusting your search criteria.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table className="min-w-[1200px]">
                    <TableHeader className="bg-background border-b">
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
                          <TableRow 
                            key={record.id} 
                            className="hover:bg-muted/30 border-b last:border-0 cursor-pointer"
                            onClick={() => handleRowClick(record)}
                          >
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
                                <div className="font-mono text-xs font-medium truncate max-w-[100px]" title={record.serial_number}>
                                  {record.serial_number}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className="space-y-0.5">
                                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5">
                                  {record.position_code}
                                </Badge>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={record.position_name}>
                                  {record.position_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className="space-y-1">
                                <div className="text-xs font-medium truncate max-w-[100px]" title={record.brand}>
                                  {record.brand}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate max-w-[100px]" title={record.size}>
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
                              <div className="text-[10px] text-muted-foreground truncate max-w-[100px]" title={formatDateTime(record.created_at)}>
                                {formatDateTime(record.created_at)}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card List */}
                <div className="sm:hidden space-y-3">
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
                      <Card 
                        key={record.id} 
                        className="overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleRowClick(record)}
                      >
                        <CardContent className="p-3">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                                  tireType === "NEW"
                                    ? "bg-green-500"
                                    : tireType === "RETREAD"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <span className="font-mono text-xs font-medium">{record.serial_number}</span>
                            </div>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              #{record.id}
                            </Badge>
                          </div>

                          {/* Position */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {record.position_code}
                            </Badge>
                            <span className="text-xs truncate">{record.position_name}</span>
                          </div>

                          {/* Tire Details */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                              <div className="text-[10px] text-muted-foreground">Brand</div>
                              <div className="truncate">{record.brand}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Size</div>
                              <div>{record.size}</div>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="space-y-1 text-xs mb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px]">Install:</span>
                              </div>
                              <span>{formatDate(record.install_date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px]">Removal:</span>
                              </div>
                              {record.removal_date ? (
                                <span>{formatDate(record.removal_date)}</span>
                              ) : (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Odometer */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                              <div className="text-[10px] text-muted-foreground">Install Odo</div>
                              <div className="font-mono text-xs">{record.install_odometer.toLocaleString()} km</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground">Removal Odo</div>
                              <div className="font-mono text-xs">
                                {record.removal_odometer?.toLocaleString() || 'N/A'} km
                              </div>
                            </div>
                          </div>

                          {/* Service Info */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className="bg-muted/30 rounded p-1.5">
                              <div className="text-[10px] text-muted-foreground">Duration</div>
                              <div className="font-medium">{serviceDuration}</div>
                            </div>
                            <div className="bg-muted/30 rounded p-1.5">
                              <div className="text-[10px] text-muted-foreground">Mileage</div>
                              <div className="font-medium">{serviceMileage}</div>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="text-xs mb-2">
                            <div className="text-[10px] text-muted-foreground mb-1">Reason</div>
                            <div className="text-xs line-clamp-2">{record.reason_for_change}</div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2">
                            <span>By: {record.created_by}</span>
                            <span>{formatDateTime(record.created_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pagination - Fixed at bottom */}
        {totalPages > 1 && sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t px-4 sm:px-6 py-3 bg-background shrink-0">
            <div className="text-[10px] sm:text-xs text-muted-foreground order-2 sm:order-1">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
            </div>
            <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Prev</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 min-w-7 sm:h-8 sm:w-8 text-xs"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <span className="text-xs text-muted-foreground px-1 hidden sm:inline">
                of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail View Dialog */}
        <Dialog open={detailViewOpen} onOpenChange={setDetailViewOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Tire Installation Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedRecord && (
              <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Serial Number</div>
                    <div className="font-mono font-medium">{selectedRecord.serial_number}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Position</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedRecord.position_code}
                      </Badge>
                      <span className="text-sm truncate">{selectedRecord.position_name}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Brand</div>
                    <div>{selectedRecord.brand}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Size</div>
                    <div>{selectedRecord.size}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <Badge variant="outline" className={getTireTypeColor(getTireType(selectedRecord))}>
                      {getTireType(selectedRecord)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Install Date</div>
                    <div>{formatDate(selectedRecord.install_date)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedRecord.install_odometer.toLocaleString()} km
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Removal Date</div>
                    {selectedRecord.removal_date ? (
                      <>
                        <div>{formatDate(selectedRecord.removal_date)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedRecord.removal_odometer?.toLocaleString()} km
                        </div>
                      </>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">Current</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Service Duration</div>
                    <div className="font-medium">{getServiceDuration(selectedRecord.install_date, selectedRecord.removal_date)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Service Mileage</div>
                    <div className="font-medium">{getServiceMileage(selectedRecord.install_odometer, selectedRecord.removal_odometer)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Reason for Change</div>
                  <div className="text-sm">{selectedRecord.reason_for_change}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Installed By</div>
                    <div>{selectedRecord.created_by}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Created Date</div>
                    <div>{formatDateTime(selectedRecord.created_at)}</div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button variant="outline" size="sm" onClick={() => setDetailViewOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

// Import the Label component
const Label = ({ className, children, ...props }: any) => (
  <label className={`text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);