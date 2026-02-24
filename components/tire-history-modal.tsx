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
import { useTheme } from "@/contexts/ThemeContext";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
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

  // Theme-aware color classes
  const themeClasses = {
    headerGradient: isDark 
      ? "bg-gradient-to-r from-gray-900 to-gray-800" 
      : "bg-gradient-to-r from-slate-50 to-white",
    statsGradient: isDark
      ? "bg-gradient-to-r from-amber-950/50 to-amber-900/30"
      : "bg-gradient-to-r from-amber-50 to-amber-25",
    filtersBg: isDark ? "bg-gray-900" : "bg-muted/30",
    tableHeaderBg: isDark ? "bg-gray-800" : "bg-background",
    tableRowHover: isDark ? "hover:bg-gray-800/50" : "hover:bg-muted/30",
    cardBg: isDark ? "bg-gray-900" : "bg-white",
    cardHover: isDark ? "hover:bg-gray-800" : "hover:bg-accent/50",
    border: isDark ? "border-gray-700" : "border-gray-200",
    textMuted: isDark ? "text-gray-400" : "text-muted-foreground",
    textPrimary: isDark ? "text-gray-100" : "text-gray-900",
    textSecondary: isDark ? "text-gray-300" : "text-gray-700",
  };

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

  // Get tire type badge color (theme-aware)
  const getTireTypeColor = (type: string) => {
    const typeUpper = type.toUpperCase();
    if (isDark) {
      switch (typeUpper) {
        case "NEW":
          return "bg-green-900 text-green-100 border-green-700";
        case "RETREAD":
          return "bg-yellow-900 text-yellow-100 border-yellow-700";
        case "USED":
          return "bg-blue-900 text-blue-100 border-blue-700";
        default:
          return "bg-gray-800 text-gray-100 border-gray-700";
      }
    } else {
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
    }
  };

  // Get status badge color (theme-aware)
  const getStatusBadgeColor = (isCurrent: boolean) => {
    if (isCurrent) {
      return isDark
        ? "bg-green-900 text-green-100 border-green-700"
        : "bg-green-50 text-green-700 border-green-200";
    } else {
      return isDark
        ? "bg-gray-800 text-gray-300 border-gray-700"
        : "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get tire type dot color
  const getTireTypeDotColor = (type: string) => {
    const typeUpper = type.toUpperCase();
    switch (typeUpper) {
      case "NEW":
        return "bg-green-500";
      case "RETREAD":
        return "bg-yellow-500";
      case "USED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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

  function handlePrint(event: React.MouseEvent<HTMLButtonElement>): void {
    throw new Error("Function not implemented.");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-4xl h-[95vh] max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Header - Fixed at top */}
        <DialogHeader className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${themeClasses.headerGradient} shrink-0`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className={`flex items-center gap-2 text-base sm:text-lg ${isDark ? 'text-gray-100' : ''}`}>
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">Tire Installation History</span>
              </DialogTitle>
              <DialogDescription className={`flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm ${isDark ? 'text-gray-400' : ''}`}>
                <span className="truncate">Complete tire service history for vehicle</span>
                <Badge variant="secondary" className={`font-mono text-xs ${isDark ? 'bg-gray-800 text-gray-300' : ''}`}>
                  {vehicleNumber}
                </Badge>
                {historyData.length > 0 && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <Badge variant="outline" className={`text-[10px] sm:text-xs ${isDark ? 'border-gray-700 text-gray-300' : ''}`}>
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
                className={`h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs ${
                  isDark 
                    ? 'bg-blue-900 hover:bg-blue-800 text-blue-100 border-blue-700' 
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <Printer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className={`h-7 sm:h-8 gap-1 sm:gap-1.5 text-xs ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
                disabled={sortedData.length === 0}
              >
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-950' : ''}`}>
          {/* Statistics Bar - Collapsible on mobile */}
          {historyData.length > 0 && (
            <Collapsible
              open={expandedSections.stats}
              onOpenChange={() => toggleSection('stats')}
              className={`border-b ${isDark ? 'border-gray-800' : ''}`}
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:hidden">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : ''}`}>Statistics Overview</span>
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
                <div className={`px-4 sm:px-6 py-3 ${themeClasses.statsGradient}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <div className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>Total Records</div>
                        <div className={`text-sm sm:text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{statistics.totalRecords}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                      <div className="min-w-0">
                        <div className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>Current Tires</div>
                        <div className={`text-sm sm:text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{statistics.currentTires}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <div className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>Avg Days</div>
                        <div className={`text-sm sm:text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{statistics.avgServiceDays}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                      <div className="min-w-0 col-span-2 sm:col-span-1">
                        <div className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>Most Used</div>
                        <div className={`text-xs sm:text-sm font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} truncate`} title={statistics.mostCommonPosition}>
                          {statistics.mostCommonPosition}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <div className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>Filtered</div>
                        <div className={`text-sm sm:text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{statistics.dateRangeCount}</div>
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
            className={`border-b ${isDark ? 'border-gray-800' : ''}`}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:hidden">
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : ''}`}>Filters & Search</span>
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
              <div className={`px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 ${themeClasses.filtersBg}`}>
                {/* Search Bar */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <Label className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-gray-300' : ''}`}>
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
                          className={`pl-7 pr-7 h-8 text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : ''}`}
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
                      <Label className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-gray-300' : ''}`}>
                        <CalendarIcon className="h-3 w-3" />
                        Date Range
                      </Label>
                      <div className="flex items-center gap-1">
                        {dateRange.startDate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearDateFilter}
                            className={`h-5 px-1.5 text-[10px] ${
                              isDark 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-950' 
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                          >
                            Clear
                          </Button>
                        )}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={dateRange.startDate ? "secondary" : "outline"}
                              size="sm"
                              className={`h-6 px-2 text-[10px] ${isDark ? 'border-gray-700' : ''}`}
                            >
                              <CalendarIcon className="h-2.5 w-2.5 mr-1" />
                              {dateRange.startDate ? 'Change' : 'Select'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className={`w-[280px] p-2 ${isDark ? 'bg-gray-900 border-gray-700' : ''}`} align="end">
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-1">
                                {['week', 'month', '3months', 'year', 'today', 'all'].map((preset) => (
                                  <Button
                                    key={preset}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDateRangePreset(preset)}
                                    className={`h-6 text-[10px] ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
                                  >
                                    {preset === '3months' ? '3M' : preset === 'today' ? 'Today' : preset === 'all' ? 'All' : preset}
                                  </Button>
                                ))}
                              </div>
                              
                              <Separator className={isDark ? 'bg-gray-800' : ''} />
                              
                              <div className={`text-[10px] font-medium ${isDark ? 'text-gray-300' : ''}`}>Custom:</div>
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
                                className={`rounded-md border p-1 ${isDark ? 'border-gray-700' : ''}`}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {dateRange.startDate && (
                      <div className={`text-[10px] ${isDark ? 'text-blue-400' : 'text-blue-700'} px-1 truncate`}>
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
                    <Label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-300' : ''}`}>Position</Label>
                    <Select 
                      value={filterPosition} 
                      onValueChange={(value) => {
                        setFilterPosition(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className={`h-8 text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : ''}`}>
                        <SelectValue placeholder="All Positions" />
                      </SelectTrigger>
                      <SelectContent className={isDark ? 'bg-gray-900 border-gray-700' : ''}>
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
                    <Label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-300' : ''}`}>Status</Label>
                    <Select 
                      value={filterStatus} 
                      onValueChange={(value) => {
                        setFilterStatus(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className={`h-8 text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : ''}`}>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className={isDark ? 'bg-gray-900 border-gray-700' : ''}>
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
                    className={`h-7 text-xs ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset Filters
                  </Button>
                  <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    Showing {sortedData.length} of {historyData.length} records
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* History Table/List */}
          <div className={`p-4 sm:p-6 ${isDark ? 'bg-gray-950' : ''}`}>
            {historyData.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-8 sm:py-12 text-center ${isDark ? 'text-gray-400' : ''}`}>
                <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-3 text-muted-foreground opacity-50" />
                <h3 className={`font-semibold text-sm sm:text-base mb-1 ${isDark ? 'text-gray-300' : ''}`}>No History Found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No tire installation history available for this vehicle.
                </p>
              </div>
            ) : sortedData.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-8 sm:py-12 text-center ${isDark ? 'text-gray-400' : ''}`}>
                <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-3 text-muted-foreground opacity-50" />
                <h3 className={`font-semibold text-sm sm:text-base mb-1 ${isDark ? 'text-gray-300' : ''}`}>No Matching Records</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  Try adjusting your search criteria.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    size="sm"
                    className={`h-7 text-xs ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader className={themeClasses.tableHeaderBg}>
                      <TableRow className={`hover:bg-transparent border-b ${isDark ? 'border-gray-800' : ''}`}>
                        <TableHead className={`w-16 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>ID</TableHead>
                        <TableHead className={`w-28 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Serial</TableHead>
                        <TableHead className={`w-24 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Position</TableHead>
                        <TableHead className={`w-40 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Tire Details</TableHead>
                        <TableHead className={`w-36 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Installation</TableHead>
                        <TableHead className={`w-36 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Removal</TableHead>
                        <TableHead className={`w-28 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Duration</TableHead>
                        <TableHead className={`w-28 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Mileage</TableHead>
                        <TableHead className={`w-64 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Reason & Created By</TableHead>
                        <TableHead className={`w-24 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Status</TableHead>
                        <TableHead className={`w-36 py-2 px-3 font-semibold text-[11px] ${isDark ? 'text-gray-300' : ''}`}>Created Date</TableHead>
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
                            className={`${themeClasses.tableRowHover} border-b ${isDark ? 'border-gray-800' : ''} last:border-0 cursor-pointer`}
                            onClick={() => handleRowClick(record)}
                          >
                            <TableCell className={`py-2 px-3 align-top ${isDark ? 'text-gray-400' : ''}`}>
                              <div className={`font-mono text-[11px] font-medium ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`}>#{record.id}</div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${getTireTypeDotColor(tireType)}`}
                                />
                                <div className={`font-mono text-xs font-medium truncate max-w-[100px] ${isDark ? 'text-gray-300' : ''}`} title={record.serial_number}>
                                  {record.serial_number}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className="space-y-0.5">
                                <Badge variant="outline" className={`font-mono text-[10px] px-1.5 py-0.5 ${isDark ? 'border-gray-700 text-gray-300' : ''}`}>
                                  {record.position_code}
                                </Badge>
                                <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'} truncate max-w-[80px]`} title={record.position_name}>
                                  {record.position_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className="space-y-1">
                                <div className={`text-xs font-medium truncate max-w-[100px] ${isDark ? 'text-gray-300' : ''}`} title={record.brand}>
                                  {record.brand}
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'} truncate max-w-[100px]`} title={record.size}>
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
                                  <Calendar className={`h-3 w-3 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`} />
                                  <span className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>
                                    {formatDate(record.install_date)}
                                  </span>
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'} pl-4`}>
                                  {record.install_odometer.toLocaleString()} km
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              {record.removal_date ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Calendar className={`h-3 w-3 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`} />
                                    <span className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>
                                      {formatDate(record.removal_date)}
                                    </span>
                                  </div>
                                  <div className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'} pl-4`}>
                                    {record.removal_odometer?.toLocaleString()} km
                                  </div>
                                </div>
                              ) : (
                                <Badge className={`px-2 py-0.5 ${getStatusBadgeColor(true)}`}>
                                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                  Current
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className={`text-[11px] font-medium px-1.5 py-0.5 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-muted/30'} rounded inline-block`}>
                                {serviceDuration}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className={`text-[11px] font-medium px-1.5 py-0.5 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-muted/30'} rounded inline-block`}>
                                {serviceMileage}
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className="space-y-1">
                                <div className={`text-[11px] line-clamp-2 max-h-8 overflow-hidden ${isDark ? 'text-gray-300' : ''}`} title={record.reason_for_change}>
                                  {record.reason_for_change}
                                </div>
                                <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                  By: <span className={`font-medium ${isDark ? 'text-gray-300' : ''}`}>{record.created_by}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              {isCurrent ? (
                                <Badge className={`px-2 py-0.5 ${getStatusBadgeColor(true)}`}>
                                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className={`px-2 py-0.5 ${isDark ? 'border-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800'}`}>
                                  Removed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-3 align-top">
                              <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'} truncate max-w-[100px]`} title={formatDateTime(record.created_at)}>
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
                        className={`overflow-hidden cursor-pointer ${themeClasses.cardHover} transition-colors ${isDark ? 'bg-gray-900 border-gray-800' : ''}`}
                        onClick={() => handleRowClick(record)}
                      >
                        <CardContent className="p-3">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${getTireTypeDotColor(tireType)}`}
                              />
                              <span className={`font-mono text-xs font-medium ${isDark ? 'text-gray-300' : ''}`}>{record.serial_number}</span>
                            </div>
                            <Badge variant="outline" className={`font-mono text-[10px] ${isDark ? 'border-gray-700 text-gray-400' : ''}`}>
                              #{record.id}
                            </Badge>
                          </div>

                          {/* Position */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`font-mono text-[10px] ${isDark ? 'border-gray-700 text-gray-300' : ''}`}>
                              {record.position_code}
                            </Badge>
                            <span className={`text-xs truncate ${isDark ? 'text-gray-300' : ''}`}>{record.position_name}</span>
                          </div>

                          {/* Tire Details */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                              <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Brand</div>
                              <div className={`truncate ${isDark ? 'text-gray-300' : ''}`}>{record.brand}</div>
                            </div>
                            <div>
                              <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Size</div>
                              <div className={isDark ? 'text-gray-300' : ''}>{record.size}</div>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="space-y-1 text-xs mb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Calendar className={`h-3 w-3 ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`} />
                                <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Install:</span>
                              </div>
                              <span className={isDark ? 'text-gray-300' : ''}>{formatDate(record.install_date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Calendar className={`h-3 w-3 ${isDark ? 'text-gray-500' : 'text-muted-foreground'}`} />
                                <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Removal:</span>
                              </div>
                              {record.removal_date ? (
                                <span className={isDark ? 'text-gray-300' : ''}>{formatDate(record.removal_date)}</span>
                              ) : (
                                <Badge className={`text-[10px] ${getStatusBadgeColor(true)}`}>
                                  Current
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Odometer */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                              <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Install Odo</div>
                              <div className={`font-mono text-xs ${isDark ? 'text-gray-300' : ''}`}>{record.install_odometer.toLocaleString()} km</div>
                            </div>
                            <div>
                              <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Removal Odo</div>
                              <div className={`font-mono text-xs ${isDark ? 'text-gray-300' : ''}`}>
                                {record.removal_odometer?.toLocaleString() || 'N/A'} km
                              </div>
                            </div>
                          </div>

                          {/* Service Info */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className={`${isDark ? 'bg-gray-800' : 'bg-muted/30'} rounded p-1.5`}>
                              <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Duration</div>
                              <div className={`font-medium ${isDark ? 'text-gray-300' : ''}`}>{serviceDuration}</div>
                            </div>
                            <div className={`${isDark ? 'bg-gray-800' : 'bg-muted/30'} rounded p-1.5`}>
                              <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Mileage</div>
                              <div className={`font-medium ${isDark ? 'text-gray-300' : ''}`}>{serviceMileage}</div>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="text-xs mb-2">
                            <div className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'} mb-1`}>Reason</div>
                            <div className={`text-xs line-clamp-2 ${isDark ? 'text-gray-300' : ''}`}>{record.reason_for_change}</div>
                          </div>

                          {/* Footer */}
                          <div className={`flex items-center justify-between text-[10px] ${isDark ? 'text-gray-400' : 'text-muted-foreground'} border-t ${isDark ? 'border-gray-800' : ''} pt-2`}>
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
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t ${isDark ? 'border-gray-800' : ''} px-4 sm:px-6 py-3 bg-background shrink-0`}>
            <div className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'} order-2 sm:order-1`}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length}
            </div>
            <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
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
                      className={`h-7 w-7 min-w-7 sm:h-8 sm:w-8 text-xs ${
                        currentPage === pageNum 
                          ? '' 
                          : isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'} px-1 hidden sm:inline`}>
                of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail View Dialog */}
        <Dialog open={detailViewOpen} onOpenChange={setDetailViewOpen}>
          <DialogContent className={`max-w-[95vw] sm:max-w-lg rounded-lg p-4 sm:p-6 ${isDark ? 'bg-gray-900 border-gray-800' : ''}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 text-base sm:text-lg ${isDark ? 'text-gray-100' : ''}`}>
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Tire Installation Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedRecord && (
              <div className={`space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto ${isDark ? 'text-gray-300' : ''}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Serial Number</div>
                    <div className={`font-mono font-medium ${isDark ? 'text-gray-100' : ''}`}>{selectedRecord.serial_number}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Position</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`font-mono text-xs ${isDark ? 'border-gray-700 text-gray-300' : ''}`}>
                        {selectedRecord.position_code}
                      </Badge>
                      <span className={`text-sm truncate ${isDark ? 'text-gray-300' : ''}`}>{selectedRecord.position_name}</span>
                    </div>
                  </div>
                </div>

                <Separator className={isDark ? 'bg-gray-800' : ''} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Brand</div>
                    <div className={isDark ? 'text-gray-300' : ''}>{selectedRecord.brand}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Size</div>
                    <div className={isDark ? 'text-gray-300' : ''}>{selectedRecord.size}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Type</div>
                    <Badge variant="outline" className={getTireTypeColor(getTireType(selectedRecord))}>
                      {getTireType(selectedRecord)}
                    </Badge>
                  </div>
                </div>

                <Separator className={isDark ? 'bg-gray-800' : ''} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Install Date</div>
                    <div className={isDark ? 'text-gray-300' : ''}>{formatDate(selectedRecord.install_date)}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
                      {selectedRecord.install_odometer.toLocaleString()} km
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Removal Date</div>
                    {selectedRecord.removal_date ? (
                      <>
                        <div className={isDark ? 'text-gray-300' : ''}>{formatDate(selectedRecord.removal_date)}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
                          {selectedRecord.removal_odometer?.toLocaleString()} km
                        </div>
                      </>
                    ) : (
                      <Badge className={getStatusBadgeColor(true)}>Current</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Service Duration</div>
                    <div className={`font-medium ${isDark ? 'text-gray-300' : ''}`}>{getServiceDuration(selectedRecord.install_date, selectedRecord.removal_date)}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Service Mileage</div>
                    <div className={`font-medium ${isDark ? 'text-gray-300' : ''}`}>{getServiceMileage(selectedRecord.install_odometer, selectedRecord.removal_odometer)}</div>
                  </div>
                </div>

                <div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Reason for Change</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : ''}`}>{selectedRecord.reason_for_change}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Installed By</div>
                    <div className={isDark ? 'text-gray-300' : ''}>{selectedRecord.created_by}</div>
                  </div>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>Created Date</div>
                    <div className={isDark ? 'text-gray-300' : ''}>{formatDateTime(selectedRecord.created_at)}</div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setDetailViewOpen(false)}
                    className={isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
                  >
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

// Import the Label component (theme-aware)
const Label = ({ className, children, ...props }: any) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  return (
    <label 
      className={`text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isDark ? 'text-gray-300' : ''} ${className}`} 
      {...props}
    >
      {children}
    </label>
  );
};