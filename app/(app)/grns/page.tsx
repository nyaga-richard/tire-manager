"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Search,
  Download,
  Filter,
  Truck,
  FileText,
  Building,
  User,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DatePicker } from "@/components/ui/date-picker";
import { GRNDetails } from "@/components/grn-details";
import { SupplierInvoiceModal } from "@/components/supplier-invoice-modal";
import PurchaseOrderDetails from "@/components/purchase-order-details";

interface GRN {
  id: number;
  grn_number: string;
  po_id: number;
  po_number: string;
  receipt_date: string;
  received_by: number;
  received_by_name: string;
  supplier_name: string;
  supplier_code: string;
  supplier_id: number;
  supplier_invoice_number: string | null;
  delivery_note_number: string | null;
  vehicle_number: string | null;
  driver_name: string | null;
  item_count: number;
  total_quantity: number;
  total_value: number;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  notes: string;
  created_at: string;
  updated_at: string;
  accounting_transaction_id?: string | null;
  items: any[];
  tires: any[];
}

export default function GRNsPage() {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrnId, setSelectedGrnId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Supplier Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedGrnForInvoice, setSelectedGrnForInvoice] = useState<GRN | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);

  useEffect(() => {
    fetchGRNs();
  }, [page, status, startDate, endDate]);

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append("search", search);
      }

      if (status !== "all") {
        params.append("status", status);
      }

      if (startDate) {
        params.append("start_date", format(startDate, "yyyy-MM-dd"));
      }

      if (endDate) {
        params.append("end_date", format(endDate, "yyyy-MM-dd"));
      }

      const response = await fetch(`http://localhost:5000/api/grn?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGrns(data.data || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.total_pages || 1);
      } else {
        toast.error("Failed to load GRNs");
        setGrns([]);
      }
    } catch (error: any) {
      console.error("Error fetching GRNs:", error);
      toast.error(`Failed to load GRNs: ${error.message}`);
      setGrns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (grnId: number) => {
    setSelectedGrnId(grnId);
    setShowDetails(true);
  };

  const handleInvoiceSupplier = (grn: GRN) => {
    // Check if already invoiced
    if (grn.supplier_invoice_number) {
      toast.info(`GRN ${grn.grn_number} already invoiced (${grn.supplier_invoice_number})`);
      
      // Optionally, open view-only modal
      setSelectedGrnForInvoice(grn);
      setShowInvoiceModal(true);
      return;
    }
    
    // Check if already has accounting entries
    if (grn.accounting_transaction_id) {
      toast.info(`GRN ${grn.grn_number} already has accounting entries`);
      return;
    }
    
    setSelectedGrnForInvoice(grn);
    setShowInvoiceModal(true);
  };

  const handleInvoiceCreated = () => {
    // Refresh the GRNs list to show updated accounting status
    fetchGRNs();
    toast.success("Supplier invoice recorded in accounting system!");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGRNs();
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if GRN is invoiced
  const isGRNInvoiced = (grn: GRN) => {
    return !!grn.supplier_invoice_number || !!grn.accounting_transaction_id;
  };

  const getInvoiceStatusBadge = (grn: GRN) => {
    if (grn.supplier_invoice_number) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Invoiced
        </Badge>
      );
    } else if (grn.accounting_transaction_id) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
          <Calculator className="h-3 w-3 mr-1" />
          Accounted
        </Badge>
      );
    }
    return null;
  };

  const getInvoiceButtonTooltip = (grn: GRN) => {
    if (grn.supplier_invoice_number) {
      return `View Invoice: ${grn.supplier_invoice_number}`;
    } else if (grn.accounting_transaction_id) {
      return `View Accounting Entry`;
    } else {
      return "Record Supplier Invoice";
    }
  };

  const exportToCSV = () => {
    try {
      if (grns.length === 0) {
        toast.error("No data to export");
        return;
      }

      const headers = [
        "GRN Number",
        "PO Number",
        "Receipt Date",
        "Supplier",
        "Received By",
        "Item Count",
        "Total Quantity",
        "Total Value",
        "Status",
        "Invoice Number",
        "Accounting Transaction",
        "Created Date"
      ];
      
      const rows = grns.map(grn => [
        grn.grn_number,
        grn.po_number,
        formatDate(grn.receipt_date),
        grn.supplier_name,
        grn.received_by_name || "N/A",
        grn.item_count.toString(),
        grn.total_quantity.toString(),
        formatCurrency(grn.total_value),
        grn.status,
        grn.supplier_invoice_number || "",
        grn.accounting_transaction_id || "Not recorded",
        formatDate(grn.created_at)
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `grns-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("GRNs exported successfully");
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("Failed to export GRNs");
    }
  };

  return (
    <div className="space-y-6">
      {/* GRN Details Dialog Component */}
      {selectedGrnId && (
        <GRNDetails
          grnId={selectedGrnId}
          open={showDetails}
          onOpenChange={setShowDetails}
        />
      )}

      {/* Supplier Invoice Accounting Modal */}
      {selectedGrnForInvoice && (
        <SupplierInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedGrnForInvoice(null);
          }}
          grn={selectedGrnForInvoice}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goods Received Notes</h1>
          <p className="text-muted-foreground">
            Track all goods received from suppliers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchGRNs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={grns.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter GRNs by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="GRN, PO, supplier..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                />
              </div>
            </div>

            {/* Second row for Items per page */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Items per page</label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(parseInt(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Spacer columns for alignment */}
              <div className="hidden md:block"></div>
              <div className="hidden lg:block"></div>
              <div className="hidden lg:block"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  <Filter className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  disabled={loading}
                >
                  Clear Filters
                </Button>
              </div>
              
              {/* Results Info */}
              <div className="text-sm text-muted-foreground flex items-center">
                {grns.length > 0 && (
                  <span>
                    Showing {Math.min(limit, grns.length)} of {total} GRNs
                  </span>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* GRNs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Goods Received Notes</CardTitle>
              <CardDescription>
                {total} GRNs found • Page {page} of {totalPages}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading GRNs...</p>
              </div>
            </div>
          ) : grns.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No GRNs found</h3>
              <p className="text-muted-foreground">
                {search || status !== "all" || startDate || endDate
                  ? "Try adjusting your filters"
                  : "No GRNs have been created yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">GRN Number</TableHead>
                    <TableHead className="w-[150px]">PO Number</TableHead>
                    <TableHead className="w-[120px]">Receipt Date</TableHead>
                    <TableHead className="w-[200px]">Supplier</TableHead>
                    <TableHead className="w-[100px]">Items</TableHead>
                    <TableHead className="w-[120px]">Total Value</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[150px]">Received By</TableHead>
                    <TableHead className="w-[130px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grns.map((grn) => {
                    const invoiced = isGRNInvoiced(grn);
                    
                    return (
                      <TableRow key={grn.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{grn.grn_number}</span>
                            {getInvoiceStatusBadge(grn)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => {
                              setSelectedPoId(grn.po_id);
                              setPoModalOpen(true);
                            }}
                            className="text-blue-600 hover:underline truncate block text-left"
                          >
                            {grn.po_number}
                          </button>
                        </TableCell>
                        <TableCell>{formatDate(grn.receipt_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{grn.supplier_name}</div>
                              {grn.supplier_code && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {grn.supplier_code}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <div>{grn.item_count} items</div>
                              <div className="text-xs text-muted-foreground">
                                {grn.total_quantity} units
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(grn.total_value)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1 ${getStatusColor(grn.status)}`}
                          >
                            {getStatusIcon(grn.status)}
                            <span className="truncate">{grn.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{grn.received_by_name || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* View Details Button */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleViewDetails(grn.id)}
                                    className="h-8 w-8"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View GRN Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Invoice Button - Conditionally shown */}
                            {!invoiced && grn.status === "COMPLETED" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleInvoiceSupplier(grn)}
                                      className="h-8 w-8"
                                      title="Record Supplier Invoice"
                                    >
                                      <Receipt className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Record Supplier Invoice</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {/* View Invoice Button - for already invoiced GRNs */}
                            {invoiced && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleInvoiceSupplier(grn)}
                                      className="h-8 w-8"
                                      title={getInvoiceButtonTooltip(grn)}
                                    >
                                      <Calculator className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{getInvoiceButtonTooltip(grn)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {grns.length > 0 && (
          <CardFooter className="border-t px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(limit, grns.length)} of {total} GRNs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="h-9"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="h-9"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      {selectedPoId && (
        <PurchaseOrderDetails
          orderId={selectedPoId}
          isOpen={poModalOpen}
          onClose={() => {
            setPoModalOpen(false);
            setSelectedPoId(null);
          }}
        />
      )}
    </div>
  );
}