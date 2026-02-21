"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Search,
  RefreshCw,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MoreHorizontal,
  Building,
  XCircle,
  Plus,
  Loader2,
  Filter,
  Download,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Mail,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RetreadOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name: string;
  status: "DRAFT" | "SENT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RECEIVED" | "PARTIALLY_RECEIVED";
  total_tires: number;
  total_cost: number;
  expected_completion_date?: string;
  sent_date?: string;
  received_date?: string;
  created_at: string;
  created_by?: string;
  received_tires?: number;
  notes?: string;
  tires?: OrderTire[];
}

interface OrderTire {
  id: number;
  tire_id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  status: string;
  returned?: boolean;
  return_date?: string;
  retread_cost?: number;
  notes?: string;
}

interface Supplier {
  id: number;
  name: string;
  type: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function RetreadOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<RetreadOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 10;
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortBy, setSortBy] = useState<"created_at" | "expected_completion_date" | "total_cost">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<RetreadOrder | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, [currentPage, statusFilter, supplierFilter, sortBy, sortOrder]);

  const fetchOrders = async () => {
  try {
    setLoading(true);
    setApiError(null);
    
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (supplierFilter !== "all") params.append("supplier_id", supplierFilter);
    if (search) params.append("search", search);
    if (dateRange.from) params.append("from_date", dateRange.from.toISOString());
    if (dateRange.to) params.append("to_date", dateRange.to.toISOString());
    
    const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API Response:", data); // For debugging
    
    // Handle empty object response
    if (data && typeof data === 'object' && Object.keys(data).length === 0) {
      console.log("API returned empty object, treating as empty array");
      setOrders([]);
      setTotalPages(1);
      setTotalOrders(0);
      setLoading(false);
      return;
    }
    
    // Handle array response directly
    if (Array.isArray(data)) {
      console.log("API returned array directly");
      setOrders(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage) || 1);
      setTotalOrders(data.length);
      setLoading(false);
      return;
    }
    
    // Handle standard API response with success flag
    if (data && typeof data === 'object') {
      // Check if it's a success response with data array
      if (data.success === true) {
        if (Array.isArray(data.data)) {
          setOrders(data.data);
          setTotalPages(data.pagination?.pages || Math.ceil(data.data.length / itemsPerPage) || 1);
          setTotalOrders(data.pagination?.total || data.data.length);
          setLoading(false);
          return;
        } else {
          console.warn("Success response but data is not an array:", data.data);
          setOrders([]);
          setTotalPages(1);
          setTotalOrders(0);
          setLoading(false);
          return;
        }
      }
      
      // Check if it's an error response
      if (data.success === false) {
        setApiError(data.error || data.message || "Failed to fetch orders");
        setOrders([]);
        setTotalPages(1);
        setTotalOrders(0);
        toast.error(data.error || data.message || "Failed to fetch orders");
        setLoading(false);
        return;
      }
      
      // Check if data has a data property that's an array (alternative format)
      if (data.data && Array.isArray(data.data)) {
        setOrders(data.data);
        setTotalPages(data.pagination?.pages || Math.ceil(data.data.length / itemsPerPage) || 1);
        setTotalOrders(data.pagination?.total || data.data.length);
        setLoading(false);
        return;
      }
      
      // If we get here, it's an unexpected structure
      console.error("Unexpected API response structure:", data);
      setOrders([]);
      setTotalPages(1);
      setTotalOrders(0);
      
      // Show a more helpful error message
      if (process.env.NODE_ENV === 'development') {
        toast.error(`Unexpected API response format. Check console for details.`);
      } else {
        toast.error("Failed to parse orders data");
      }
    } else {
      console.error("Invalid API response type:", typeof data);
      setOrders([]);
      setTotalPages(1);
      setTotalOrders(0);
      toast.error("Invalid response from server");
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    setApiError(error instanceof Error ? error.message : "Failed to fetch orders");
    setOrders([]);
    setTotalPages(1);
    setTotalOrders(0);
    toast.error("Failed to fetch orders. Please check your connection.");
  } finally {
    setLoading(false);
  }
};

  const fetchSuppliers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/suppliers?type=RETREAD`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Suppliers API Response:", data); // For debugging
    
    // Handle empty object
    if (data && typeof data === 'object' && Object.keys(data).length === 0) {
      setSuppliers([]);
      return;
    }
    
    // Handle array response directly
    if (Array.isArray(data)) {
      setSuppliers(data);
      return;
    }
    
    // Handle object response
    if (data && typeof data === 'object') {
      // Check for success response with data array
      if (data.success === true && Array.isArray(data.data)) {
        setSuppliers(data.data);
        return;
      }
      
      // Check for data property that's an array
      if (data.data && Array.isArray(data.data)) {
        setSuppliers(data.data);
        return;
      }
      
      // If it's an object but not what we expect, log and set empty
      console.warn("Unexpected suppliers response format:", data);
      setSuppliers([]);
    } else {
      setSuppliers([]);
    }
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    setSuppliers([]);
    // Don't show toast for suppliers error as it's not critical
  }
};

  const refreshData = () => {
    fetchOrders();
    fetchSuppliers();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/retreads/${orderId}`);
  };

  const handleEditOrder = (orderId: number) => {
    router.push(`/retreads/${orderId}/edit`);
  };

  const handleReceiveOrder = (orderId: number) => {
    router.push(`/retreads/${orderId}/receive`);
  };

  const handleSendOrder = async (orderId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders/${orderId}/send`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1 }) // Get from auth context
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order marked as sent");
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to send order");
      }
    } catch (error) {
      console.error("Error sending order:", error);
      toast.error("Failed to send order");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1 }) // Get from auth context
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order cancelled successfully");
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders/${selectedOrder.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order deleted successfully");
        setShowDeleteDialog(false);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const handleDuplicateOrder = async (orderId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders/${orderId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1 }) // Get from auth context
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order duplicated successfully");
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to duplicate order");
      }
    } catch (error) {
      console.error("Error duplicating order:", error);
      toast.error("Failed to duplicate order");
    }
  };

  const handleExportOrders = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    try {
      // Create CSV content
      const headers = ["Order #", "Supplier", "Status", "Total Tires", "Total Cost", "Created Date", "Sent Date", "Received Date"];
      const rows = orders.map(order => [
        order.order_number,
        order.supplier_name,
        order.status,
        order.total_tires.toString(),
        order.total_cost.toString(),
        formatDate(order.created_at),
        formatDate(order.sent_date),
        formatDate(order.received_date),
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")) // Wrap cells in quotes to handle commas
      ].join("\n");
      
      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `retread-orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Orders exported successfully");
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Failed to export orders");
    }
  };

  const handlePrintOrder = (order: RetreadOrder) => {
    // Open print dialog
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Retread Order #${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .header { margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Retread Order #${order.order_number}</h1>
            <p>Supplier: ${order.supplier_name}</p>
            <p>Status: ${order.status}</p>
          </div>
          <div class="details">
            <p>Created: ${formatDate(order.created_at)}</p>
            <p>Expected Completion: ${formatDate(order.expected_completion_date)}</p>
            <p>Total Tires: ${order.total_tires}</p>
            <p>Total Cost: ${formatCurrency(order.total_cost)}</p>
          </div>
          ${order.tires ? `
            <h3>Tires in Order</h3>
            <table>
              <thead>
                <tr>
                  <th>Serial #</th>
                  <th>Size</th>
                  <th>Brand</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                ${order.tires.map(tire => `
                  <tr>
                    <td>${tire.serial_number}</td>
                    <td>${tire.size}</td>
                    <td>${tire.brand}</td>
                    <td>${tire.model}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : ""}
          <div class="footer">
            <p>Printed on ${format(new Date(), "PPP")}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock, label: "Draft" },
      SENT: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Truck, label: "Sent" },
      IN_PROGRESS: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Package, label: "In Progress" },
      COMPLETED: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, label: "Completed" },
      CANCELLED: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, label: "Cancelled" },
      RECEIVED: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: CheckCircle, label: "Received" },
      PARTIALLY_RECEIVED: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertCircle, label: "Partially Received" },
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMM d, yyyy HH:mm");
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSupplierFilter("all");
    setDateRange({});
    setSortBy("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Calculate stats from current orders
  const stats = {
    total: totalOrders,
    active: orders.filter(o => ["SENT", "IN_PROGRESS"].includes(o.status)).length,
    completed: orders.filter(o => ["COMPLETED", "RECEIVED"].includes(o.status)).length,
    draft: orders.filter(o => o.status === "DRAFT").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Retread Orders</h1>
            <p className="text-muted-foreground">
              Manage and track all retread orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportOrders} disabled={orders.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button onClick={() => router.push("/retreads/create-batch")}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search orders..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger>
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={`${sortBy}-${sortOrder}`} 
                  onValueChange={(value) => {
                    const [newSortBy, newSortOrder] = value.split("-") as [any, any];
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                >
                  <SelectTrigger>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="expected_completion_date-asc">Due Date (Earliest)</SelectItem>
                    <SelectItem value="expected_completion_date-desc">Due Date (Latest)</SelectItem>
                    <SelectItem value="total_cost-desc">Highest Cost</SelectItem>
                    <SelectItem value="total_cost-asc">Lowest Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between">
                <Button type="submit">Apply Filters</Button>
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Error Display */}
      {apiError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{apiError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="mt-2 text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground mt-1">
                {search || statusFilter !== "all" || supplierFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first retread order to get started"}
              </p>
              {(search || statusFilter !== "all" || supplierFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
              {!search && statusFilter === "all" && supplierFilter === "all" && (
                <Button onClick={() => router.push("/retreads/create-batch")} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tires</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewOrder(order.id)}>
                      <TableCell className="font-mono font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {order.supplier_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {order.received_tires ? 
                            `${order.received_tires}/${order.total_tires}` : 
                            order.total_tires}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total_cost || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(order.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.sent_date ? (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(order.sent_date)}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {order.expected_completion_date ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(order.expected_completion_date)}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {order.received_date ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">{formatDate(order.received_date)}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handlePrintOrder(order)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print Order
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {order.status === "DRAFT" && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Edit Order
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleSendOrder(order.id)}>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Send Order
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleDuplicateOrder(order.id)}>
                                  <Package className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Delete Order
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {(order.status === "SENT" || order.status === "IN_PROGRESS") && (
                              <>
                                <DropdownMenuItem onClick={() => handleReceiveOrder(order.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Receive Order
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleCancelOrder(order.id)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {(order.status === "COMPLETED" || order.status === "PARTIALLY_RECEIVED") && (
                              <DropdownMenuItem onClick={() => handleReceiveOrder(order.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {order.status === "COMPLETED" ? "Receive Order" : "Continue Receiving"}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => window.location.href = `mailto:?subject=Retread Order ${order.order_number}&body=Order Details: ${window.location.origin}/retreads/${order.id}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Email Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {/* Pagination */}
        {orders.length > 0 && (
          <CardFooter className="border-t px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order #{selectedOrder?.order_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}