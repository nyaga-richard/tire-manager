"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";

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

export default function TireHistoryModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleNumber,
  historyData,
}: TireHistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return historyData.filter((record) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        record.serial_number.toLowerCase().includes(searchLower) ||
        record.position_code.toLowerCase().includes(searchLower) ||
        record.brand.toLowerCase().includes(searchLower) ||
        record.reason_for_change.toLowerCase().includes(searchLower);

      // Type filter
      const recordType = getTireType(record).toLowerCase();
      const matchesType =
        filterType === "all" || recordType === filterType;

      // Position filter
      const matchesPosition =
        filterPosition === "all" || record.position_code === filterPosition;

      // Status filter
      const isCurrent = !record.removal_date;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "current" && isCurrent) ||
        (filterStatus === "removed" && !isCurrent);

      return matchesSearch && matchesType && matchesPosition && matchesStatus;
    });
  }, [historyData, searchTerm, filterType, filterPosition, filterStatus]);

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

  // Get unique tire types for filter
  const uniqueTypes = Array.from(
    new Set(historyData.map((record) => getTireType(record).toLowerCase()))
  ).sort();

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterPosition("all");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tire Installation History
          </DialogTitle>
          <DialogDescription>
            Complete tire service history for vehicle {vehicleNumber}
            {historyData.length > 0 && (
              <span className="ml-2 text-primary">
                ({historyData.length} total records, {filteredData.length} filtered)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="px-6 py-4 space-y-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search serial, position, brand, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9"
              />
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
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tire Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-full">
                <Hash className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Position" />
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
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="whitespace-nowrap"
              >
                Reset All Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2"
                disabled={sortedData.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-blue-50">
                Total: {historyData.length}
              </Badge>
              <Badge variant="outline" className="bg-green-50">
                Filtered: {sortedData.length}
              </Badge>
              {sortedData.length > 0 && (
                <Badge variant="outline" className="bg-amber-50">
                  Page {currentPage}/{totalPages}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-hidden px-6">
          {historyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-xl mb-2">No History Found</h3>
              <p className="text-muted-foreground max-w-md text-lg">
                No tire installation history available for this vehicle.
              </p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-xl mb-2">No Matching Records</h3>
              <p className="text-muted-foreground max-w-md text-lg">
                No records match your filters. Try adjusting your search criteria.
              </p>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="mt-6"
                size="lg"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="whitespace-nowrap w-[80px] font-semibold">ID</TableHead>
                    <TableHead className="whitespace-nowrap w-[140px] font-semibold">Serial No.</TableHead>
                    <TableHead className="whitespace-nowrap w-[120px] font-semibold">Position</TableHead>
                    <TableHead className="whitespace-nowrap w-[180px] font-semibold">Tire Details</TableHead>
                    <TableHead className="whitespace-nowrap w-[160px] font-semibold">Installation</TableHead>
                    <TableHead className="whitespace-nowrap w-[160px] font-semibold">Removal</TableHead>
                    <TableHead className="whitespace-nowrap w-[140px] font-semibold">Duration</TableHead>
                    <TableHead className="whitespace-nowrap w-[140px] font-semibold">Mileage</TableHead>
                    <TableHead className="whitespace-nowrap w-[200px] font-semibold">Reason & Created By</TableHead>
                    <TableHead className="whitespace-nowrap w-[120px] font-semibold">Status</TableHead>
                    <TableHead className="whitespace-nowrap w-[160px] font-semibold">Created Date</TableHead>
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
                      <TableRow key={record.id} className="hover:bg-muted/50 border-b">
                        <TableCell className="py-3">
                          <div className="font-mono text-sm font-medium">#{record.id}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full flex-shrink-0 ${
                                tireType === "NEW"
                                  ? "bg-green-500"
                                  : tireType === "RETREAD"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                            />
                            <div className="font-mono text-sm font-medium truncate" title={record.serial_number}>
                              {record.serial_number}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <Badge variant="outline" className="font-mono text-sm px-2 py-1">
                              {record.position_code}
                            </Badge>
                            <div className="text-xs text-muted-foreground truncate" title={record.position_name}>
                              {record.position_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">{record.brand}</div>
                            <div className="text-sm text-muted-foreground">{record.size}</div>
                            <Badge
                              variant="outline"
                              className={`text-xs px-2 py-1 ${getTireTypeColor(tireType)}`}
                            >
                              {tireType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="text-sm font-medium">
                                {formatDate(record.install_date)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.install_odometer.toLocaleString()} km
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {record.removal_date ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span className="text-sm font-medium">
                                  {formatDate(record.removal_date)}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.removal_odometer?.toLocaleString()} km
                              </div>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1.5"
                            >
                              Current
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm font-medium px-2 py-1 bg-muted/50 rounded-md inline-block">
                            {serviceDuration}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm font-medium px-2 py-1 bg-muted/50 rounded-md inline-block">
                            {serviceMileage}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="space-y-2">
                            <div className="text-sm line-clamp-3" title={record.reason_for_change}>
                              {record.reason_for_change}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              By: <span className="font-medium">{record.created_by}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {isCurrent ? (
                            <Badge className={getStatusColor(record.removal_date)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="px-3 py-1.5 bg-gray-100 text-gray-800">
                              Removed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-xs text-muted-foreground" title={formatDateTime(record.created_at)}>
                            {formatDateTime(record.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && sortedData.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
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
                      className="h-9 w-9"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}