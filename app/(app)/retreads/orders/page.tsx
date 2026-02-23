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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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
  Menu,
  ChevronDown,
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
import { format, parseISO, isValid } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import Link from "next/link";
import router from "next/router";

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

// Mobile Order Card Component
const MobileOrderCard = ({
  order,
  onView,
  onPrint,
  getStatusBadge,
  formatCurrency,
  formatDate,
}: {
  order: RetreadOrder;
  onView: (id: number) => void;
  onPrint: (order: RetreadOrder) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatCurrency: (amount: number) => string;
  formatDate: (date?: string) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-sm">
                {order.order_number}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm truncate">{order.supplier_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(order.id)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Tires</div>
            <div className="text-sm font-medium">
              {order.received_tires ? `${order.received_tires}/${order.total_tires}` : order.total_tires}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Cost</div>
            <div className="text-sm font-medium">{formatCurrency(order.total_cost || 0)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="text-sm">{formatDate(order.created_at)}</div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              {order.sent_date && (
                <div>
                  <div className="text-xs text-muted-foreground">Sent</div>
                  <div className="text-sm flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {formatDate(order.sent_date)}
                  </div>
                </div>
              )}
              {order.expected_completion_date && (
                <div>
                  <div className="text-xs text-muted-foreground">Expected</div>
                  <div className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(order.expected_completion_date)}
                  </div>
                </div>
              )}
              {order.received_date && (
                <div>
                  <div className="text-xs text-muted-foreground">Received</div>
                  <div className="text-sm flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {formatDate(order.received_date)}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onPrint(order)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {order.status === "DRAFT" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/retreads/${order.id}/edit`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Skeleton Components
const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16" />
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <div className="border-b p-4">
    <Skeleton className="h-12 w-full" />
  </div>
);

export default function RetreadOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<RetreadOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Mobile state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("tire.retread") && !hasPermission("inventory.view")) {
        toast.error("You don't have permission to view retread orders");
        router.push("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && (hasPermission("tire.retread") || hasPermission("inventory.view"))) {
      fetchOrders();
      fetchSuppliers();
    }
  }, [currentPage, statusFilter, supplierFilter, sortBy, sortOrder, search, dateRange, isAuthenticated, hasPermission]);

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
      
      const response = await authFetch(`${API_BASE_URL}/api/retread/retread-orders?${params}`);
      
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
      const response = await authFetch(`${API_BASE_URL}/api/suppliers?type=RETREAD`);
      
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
    setIsFilterSheetOpen(false);
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/retreads/${orderId}`);
  };

  const handleEditOrder = (orderId: number) => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to edit orders");
      return;
    }
    router.push(`/retreads/${orderId}/edit`);
    setIsMobileMenuOpen(false);
  };

  const handleReceiveOrder = (orderId: number) => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to receive orders");
      return;
    }
    router.push(`/retreads/${orderId}/receive`);
    setIsMobileMenuOpen(false);
  };

  const handleSendOrder = async (orderId: number) => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to send orders");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/retread/retread-orders/${orderId}/send`, {
        method: "PUT",
        body: JSON.stringify({ 
          user_id: user?.id,
          user_name: user?.full_name || user?.username || "System"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order marked as sent");
        fetchOrders();
        setIsMobileMenuOpen(false);
      } else {
        toast.error(data.error || "Failed to send order");
      }
    } catch (error) {
      console.error("Error sending order:", error);
      toast.error("Failed to send order");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to cancel orders");
      return;
    }

    if (!confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/api/retread/retread-orders/${orderId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ 
          user_id: user?.id,
          user_name: user?.full_name || user?.username || "System"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order cancelled successfully");
        fetchOrders();
        setIsMobileMenuOpen(false);
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
    
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to delete orders");
      return;
    }
    
    try {
      const response = await authFetch(`${API_BASE_URL}/api/retread/retread-orders/${selectedOrder.id}`, {
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
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to duplicate orders");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/retread/retread-orders/${orderId}/duplicate`, {
        method: "POST",
        body: JSON.stringify({ 
          user_id: user?.id,
          user_name: user?.full_name || user?.username || "System"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order duplicated successfully");
        fetchOrders();
        setIsMobileMenuOpen(false);
      } else {
        toast.error(data.error || "Failed to duplicate order");
      }
    } catch (error) {
      console.error("Error duplicating order:", error);
      toast.error("Failed to duplicate order");
    }
  };

  const handleExportOrders = () => {
    if (!hasPermission("inventory.export")) {
      toast.error("You don't have permission to export orders");
      return;
    }

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
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
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
      DRAFT: { color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700", icon: Clock, label: "Draft" },
      SENT: { color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800", icon: Truck, label: "Sent" },
      IN_PROGRESS: { color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800", icon: Package, label: "In Progress" },
      COMPLETED: { color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800", icon: CheckCircle, label: "Completed" },
      CANCELLED: { color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800", icon: XCircle, label: "Cancelled" },
      RECEIVED: { color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800", icon: CheckCircle, label: "Received" },
      PARTIALLY_RECEIVED: { color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800", icon: AlertCircle, label: "Partially Received" },
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1 text-xs`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid Date";
      
      const formatStr = systemSettings?.date_format || "MMM d, yyyy";
      
      if (formatStr === "dd/MM/yyyy") {
        return format(date, "dd/MM/yyyy");
      } else if (formatStr === "MM/dd/yyyy") {
        return format(date, "MM/dd/yyyy");
      } else if (formatStr === "yyyy-MM-dd") {
        return format(date, "yyyy-MM-dd");
      } else if (formatStr === "dd-MM-yyyy") {
        return format(date, "dd-MM-yyyy");
      } else if (formatStr === "dd MMM yyyy") {
        return format(date, "dd MMM yyyy");
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid Date";
      const timeFormat = systemSettings?.time_format || "HH:mm";
      return `${formatDate(dateString)} ${format(date, timeFormat)}`;
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0).replace(currency, currencySymbol);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSupplierFilter("all");
    setDateRange({});
    setSortBy("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
    setIsFilterSheetOpen(false);
  };

  // Permission checks
  const canView = hasPermission("tire.retread") || hasPermission("inventory.view");
  const canManage = hasPermission("tire.retread");
  const canExport = hasPermission("inventory.export");

  // Calculate stats from current orders
  const stats = {
    total: totalOrders,
    active: orders.filter(o => ["SENT", "IN_PROGRESS"].includes(o.status)).length,
    completed: orders.filter(o => ["COMPLETED", "RECEIVED"].includes(o.status)).length,
    draft: orders.filter(o => o.status === "DRAFT").length,
  };

  // Show loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied - fallback if redirect doesn't happen
  if (!canView) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Retread Orders</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Access denied</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view retread orders. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Retread Orders</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and track all retread orders
          </p>
          {systemSettings?.company_name && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {systemSettings.company_name} • {currencySymbol} ({currency})
            </p>
          )}
        </div>
      </div>

      {/* Desktop Actions */}
      <div className="hidden sm:flex items-center gap-2">
        {canExport && (
          <Button variant="outline" onClick={handleExportOrders} disabled={orders.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
        <Button variant="outline" onClick={refreshData} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
        {canManage && (
          <Button onClick={() => router.push("/retreads/create-batch")}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        )}
      </div>

      {/* Mobile Actions - Stacked below title */}
      <div className="sm:hidden space-y-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsFilterSheetOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </div>
        {canManage && (
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => router.push("/retreads/create-batch")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Order
          </Button>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Orders
            </SheetTitle>
            <SheetDescription>
              Apply filters to narrow down results
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSearch} className="space-y-4 py-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
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
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
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
            </div>

            {/* Supplier Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier</Label>
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
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort By</Label>
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

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Apply Filters
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Mobile Actions Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Actions</SheetTitle>
            <SheetDescription>
              Choose an action to perform
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            {canExport && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  handleExportOrders();
                  setIsMobileMenuOpen(false);
                }}
                disabled={orders.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Orders
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                refreshData();
                setIsMobileMenuOpen(false);
              }}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Filters Toggle */}
      <div className="hidden sm:block">
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
      </div>

      {/* Error Display */}
      {apiError && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{apiError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table - Desktop */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="mt-2 text-muted-foreground">Loading orders...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center px-4">
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
              {!search && statusFilter === "all" && supplierFilter === "all" && canManage && (
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
                    <TableHead className="whitespace-nowrap">Order #</TableHead>
                    <TableHead className="whitespace-nowrap">Supplier</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Tires</TableHead>
                    <TableHead className="whitespace-nowrap">Total Cost</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="whitespace-nowrap">Sent</TableHead>
                    <TableHead className="whitespace-nowrap">Expected</TableHead>
                    <TableHead className="whitespace-nowrap">Received</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewOrder(order.id)}>
                      <TableCell className="font-mono font-medium whitespace-nowrap">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">
                            {order.supplier_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="font-mono">
                          {order.received_tires ? 
                            `${order.received_tires}/${order.total_tires}` : 
                            order.total_tires}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatCurrency(order.total_cost || 0)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(order.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {order.sent_date ? (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(order.sent_date)}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {order.expected_completion_date ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatDate(order.expected_completion_date)}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {order.received_date ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">{formatDate(order.received_date)}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                            
                            {order.status === "DRAFT" && canManage && (
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
                            
                            {(order.status === "SENT" || order.status === "IN_PROGRESS") && canManage && (
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
                            
                            {(order.status === "COMPLETED" || order.status === "PARTIALLY_RECEIVED") && canManage && (
                              <DropdownMenuItem onClick={() => handleReceiveOrder(order.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {order.status === "COMPLETED" ? "Receive Order" : "Continue Receiving"}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => window.open(`mailto:?subject=Retread Order ${order.order_number}&body=Order Details: ${window.location.origin}/retreads/${order.id}`, '_blank')}>
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

      {/* Mobile Orders */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center px-4">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground mt-1">
                {search || statusFilter !== "all" || supplierFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first retread order"}
              </p>
              {(search || statusFilter !== "all" || supplierFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters} className="mt-4 w-full">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Filter Summary */}
            {(search || statusFilter !== "all" || supplierFilter !== "all") && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm truncate flex-1">
                      {search && <span>Search: "{search}"</span>}
                      {statusFilter !== "all" && (
                        <span className={search ? "ml-2" : ""}>
                          Status: {statusFilter}
                        </span>
                      )}
                      {supplierFilter !== "all" && (
                        <span className={(search || statusFilter !== "all") ? "ml-2" : ""}>
                          Supplier: {suppliers.find(s => s.id.toString() === supplierFilter)?.name || supplierFilter}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2 shrink-0"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Order Cards */}
            {orders.map((order) => (
              <MobileOrderCard
                key={order.id}
                order={order}
                onView={handleViewOrder}
                onPrint={handlePrintOrder}
                getStatusBadge={getStatusBadge}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}

            {/* Mobile Pagination */}
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground text-center mb-3">
                  Page {currentPage} of {totalPages} • {totalOrders} orders
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order #{selectedOrder?.order_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} className="w-full sm:w-auto">
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <div className="truncate">
          Logged in as: {user?.full_name || user?.username}
        </div>
        <div className="flex flex-wrap gap-1">
          <span>Role: {user?.role}</span>
          {systemSettings?.company_name && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="block sm:inline text-xs">
                {systemSettings.company_name}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Missing Label component
const Label = ({ children, className, ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props}>
    {children}
  </label>
);