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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  Plus,
  ShoppingCart,
  Wrench,
  Filter,
  Building,
  DollarSign,
  FileText,
  ChevronDown,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  AlertCircle,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart3,
  ShoppingBag,
  ChevronRight,
  Menu,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PurchaseOrderDetails from "@/components/purchase-order-details";
import { useSettings } from "@/hooks/useSettings";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface PurchaseOrderItem {
  id: number;
  po_id: number;
  size: string;
  brand: string | null;
  model: string | null;
  type: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  line_total: number;
  received_total: number;
  remaining_quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tires_generated: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_type: string;
  supplier_contact?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_address?: string;
  po_date: string;
  expected_delivery_date: string | null;
  delivery_date: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED" | "CLOSED";
  total_amount: number;
  tax_amount: number;
  shipping_amount: number;
  final_amount: number;
  notes: string | null;
  terms: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  created_by: number;
  approved_by: number | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
  total_received?: number | null;
  total_pending?: number | null;
  items?: PurchaseOrderItem[];
  created_by_name?: string;
  approved_by_name?: string | null;
}

interface PurchaseOrderAnalytics {
  totalOrders: number;
  totalOrderValue: number;
  averageOrderValue: number;
  ordersThisMonth: number;
  pendingOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  orderTrend: "up" | "down";
  ordersByStatus: Array<{ status: string; count: number; value: number }>;
  ordersBySupplier: Array<{ name: string; count: number; value: number }>;
  monthlyOrderValue: number;
  averageDeliveryTime: number | null;
}

// Default analytics states
const defaultOrderAnalytics: PurchaseOrderAnalytics = {
  totalOrders: 0,
  totalOrderValue: 0,
  averageOrderValue: 0,
  ordersThisMonth: 0,
  pendingOrders: 0,
  receivedOrders: 0,
  cancelledOrders: 0,
  orderTrend: "up",
  ordersByStatus: [],
  ordersBySupplier: [],
  monthlyOrderValue: 0,
  averageDeliveryTime: null,
};

// Mobile Order Card Component
const MobileOrderCard = ({ 
  order, 
  onViewDetails,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getOrderProgress 
}: { 
  order: PurchaseOrder;
  onViewDetails: (order: PurchaseOrder) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | null) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getOrderProgress: (order: PurchaseOrder) => number;
}) => {
  const progress = getOrderProgress(order);
  const itemsCount = order.item_count || 0;
  const receivedCount = order.total_received || 0;
  const pendingCount = itemsCount - receivedCount;

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header with Order Number and Status */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-mono font-bold text-lg">
              {order.po_number}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{order.supplier_name}</span>
              <span className="text-xs text-muted-foreground">({order.supplier_type})</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={getStatusColor(order.status)}
          >
            <div className="flex items-center gap-1 text-xs">
              {getStatusIcon(order.status)}
              {order.status.replace("_", " ")}
            </div>
          </Badge>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Order Date</div>
            <div className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(order.po_date)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Expected Delivery</div>
            <div className="text-sm font-medium">
              {formatDate(order.expected_delivery_date)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Items</div>
            <div className="text-sm font-medium">
              <span className="font-bold">{itemsCount}</span> total
            </div>
            {itemsCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {receivedCount} rec • {pendingCount} pend
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total Amount</div>
            <div className="text-sm font-bold text-primary">
              {formatCurrency(order.final_amount)}
            </div>
            <div className="text-xs text-muted-foreground">
              Sub: {formatCurrency(order.total_amount)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Receiving Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails(order)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Details
          </Button>
          
          {["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING", "APPROVED"].includes(order.status) && (
            <PermissionGuard permissionCode="po.receive" action="edit">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/purchases/orders/${order.id}/receive`}>
                  <Truck className="h-4 w-4 mr-2" />
                  Receive
                </Link>
              </Button>
            </PermissionGuard>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function PurchasesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [orderAnalytics, setOrderAnalytics] = useState<PurchaseOrderAnalytics>(defaultOrderAnalytics);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab] = useState("orders");
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("all");
  const [timeRangeOrders, setTimeRangeOrders] = useState<string>("month");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Check permission for purchases view
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasPermission("po.view")) {
      router.push("/dashboard");
      toast.error("You don't have permission to view purchases");
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  // Initial load - runs once when component mounts
  useEffect(() => {
    if (!authLoading && isAuthenticated && hasPermission("po.view")) {
      const loadInitialData = async () => {
        try {
          setLoading(true);
          setError(null);
          console.log("Loading initial data...");
          
          // Load data for purchase orders
          await Promise.all([
            fetchPurchaseOrders(),
            fetchOrderAnalytics(),
          ]);
          
          setInitialLoadComplete(true);
        } catch (error) {
          console.error("Error loading initial data:", error);
          setError(error instanceof Error ? error.message : "Failed to load initial data");
          toast.error("Failed to load initial data");
        } finally {
          setLoading(false);
        }
      };

      loadInitialData();
    }
  }, [authLoading, isAuthenticated, hasPermission]);

  // Load data when filters change (after initial load)
  useEffect(() => {
    if (!initialLoadComplete || !isAuthenticated || !hasPermission("po.view")) return;
    
    const loadFilteredData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await Promise.all([
          fetchPurchaseOrders(),
          fetchOrderAnalytics(),
        ]);
      } catch (error) {
        console.error("Error fetching filtered data:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadFilteredData();
  }, [orderFilterStatus, timeRangeOrders, search, initialLoadComplete, isAuthenticated, hasPermission]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchPurchaseOrders(),
        fetchOrderAnalytics(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams();
      if (orderFilterStatus !== "all") params.append("status", orderFilterStatus);
      if (search) params.append("search", search);
      params.append("timeRange", timeRangeOrders);

      // Fetch the list of purchase orders
      const listResponse = await authFetch(
        `${API_BASE_URL}/api/purchase-orders?${params}`
      );
      
      if (!listResponse.ok) {
        throw new Error(`Failed to fetch purchase orders list: ${listResponse.status}`);
      }
      
      const listData = await listResponse.json();
      
      let ordersList = [];
      if (listData.success && Array.isArray(listData.data)) {
        ordersList = listData.data;
      } else if (Array.isArray(listData)) {
        ordersList = listData;
      } else {
        console.warn("Unexpected data format for purchase orders list:", listData);
        setPurchaseOrders([]);
        return;
      }
      
      // For each order, fetch its detailed information
      const ordersWithDetails = [];
      
      for (const order of ordersList) {
        try {
          const detailResponse = await authFetch(`${API_BASE_URL}/api/purchase-orders/${order.id}`);
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            
            if (detailData.success && detailData.data) {
              const detailedOrder = detailData.data;
              const items = detailedOrder.items || [];
              const itemCount = items.length;
              
              const totalReceived = items.reduce((sum: number, item: any) => {
                return sum + (parseInt(item.received_quantity) || 0);
              }, 0);
              
              const totalOrdered = items.reduce((sum: number, item: any) => {
                return sum + (parseInt(item.quantity) || 0);
              }, 0);
              
              const totalPending = Math.max(0, totalOrdered - totalReceived);
              
              ordersWithDetails.push({
                ...order,
                ...detailedOrder,
                items,
                item_count: itemCount,
                total_received: totalReceived,
                total_pending: totalPending,
              });
            } else {
              ordersWithDetails.push({
                ...order,
                items: [],
                item_count: order.item_count || 0,
                total_received: order.total_received || 0,
                total_pending: (order.item_count || 0) - (order.total_received || 0)
              });
            }
          } else {
            console.warn(`Failed to fetch details for order ${order.id}: ${detailResponse.status}`);
            ordersWithDetails.push({
              ...order,
              items: [],
              item_count: order.item_count || 0,
              total_received: order.total_received || 0,
              total_pending: (order.item_count || 0) - (order.total_received || 0)
            });
          }
        } catch (error) {
          console.error(`Error fetching details for order ${order.id}:`, error);
          ordersWithDetails.push({
            ...order,
            items: [],
            item_count: order.item_count || 0,
            total_received: order.total_received || 0,
            total_pending: (order.item_count || 0) - (order.total_received || 0)
          });
        }
      }
      
      setPurchaseOrders(ordersWithDetails);
      
    } catch (error) {
      console.error("Error in fetchPurchaseOrders:", error);
      setPurchaseOrders([]);
      toast.error(`Failed to load purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderAnalytics = async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/purchase-orders/stats?timeRange=${timeRangeOrders}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order analytics: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.ordersByStatus && Array.isArray(data.ordersByStatus)) {
        setOrderAnalytics(data);
      } else {
        calculateOrderAnalytics();
      }
    } catch (error) {
      console.error("Error fetching order analytics:", error);
      calculateOrderAnalytics();
      toast.error(`Failed to load order analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const calculateOrderAnalytics = () => {
    const totalOrders = purchaseOrders.length;
    const totalOrderValue = purchaseOrders.reduce((sum, order) => sum + order.final_amount, 0);
    const averageOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const ordersThisMonth = purchaseOrders.filter(order => {
      const orderDate = new Date(order.po_date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    }).length;
    
    const pendingOrders = purchaseOrders.filter(order => 
      ["DRAFT", "PENDING", "APPROVED", "ORDERED"].includes(order.status)
    ).length;
    
    const receivedOrders = purchaseOrders.filter(order => 
      ["RECEIVED", "CLOSED"].includes(order.status)
    ).length;
    
    const cancelledOrders = purchaseOrders.filter(order => 
      order.status === "CANCELLED"
    ).length;

    const ordersByStatus = purchaseOrders.reduce((acc, order) => {
      const existing = acc.find(item => item.status === order.status);
      if (existing) {
        existing.count += 1;
        existing.value += order.final_amount;
      } else {
        acc.push({
          status: order.status,
          count: 1,
          value: order.final_amount
        });
      }
      return acc;
    }, [] as Array<{ status: string; count: number; value: number }>);

    const ordersBySupplier = purchaseOrders.reduce((acc, order) => {
      const existing = acc.find(item => item.name === order.supplier_name);
      if (existing) {
        existing.count += 1;
        existing.value += order.final_amount;
      } else {
        acc.push({
          name: order.supplier_name,
          count: 1,
          value: order.final_amount
        });
      }
      return acc;
    }, [] as Array<{ name: string; count: number; value: number }>);

    ordersBySupplier.sort((a, b) => b.value - a.value);

    setOrderAnalytics({
      totalOrders,
      totalOrderValue,
      averageOrderValue,
      ordersThisMonth,
      pendingOrders,
      receivedOrders,
      cancelledOrders,
      orderTrend: "up",
      ordersByStatus: ordersByStatus || [],
      ordersBySupplier: ordersBySupplier.slice(0, 5) || [],
      monthlyOrderValue: totalOrderValue,
      averageDeliveryTime: null,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
      case "CLOSED":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "PENDING":
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "ORDERED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
      case "PARTIALLY_RECEIVED":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING":
      case "DRAFT":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "ORDERED":
        return <Package className="h-4 w-4" />;
      case "PARTIALLY_RECEIVED":
        return <Truck className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(currency, currencySymbol);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      const format = systemSettings?.date_format || "MMM dd, yyyy";
      
      // Date format mapping
      if (format === "dd/MM/yyyy") {
        return date.toLocaleDateString("en-GB");
      } else if (format === "MM/dd/yyyy") {
        return date.toLocaleDateString("en-US");
      } else if (format === "yyyy-MM-dd") {
        return date.toISOString().split('T')[0];
      } else if (format === "dd-MM-yyyy") {
        return date.toLocaleDateString("en-GB").replace(/\//g, '-');
      } else if (format === "dd MMM yyyy") {
        return date.toLocaleDateString("en-US", { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
      } else {
        // Default: "MMM dd, yyyy"
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return "Invalid date";
    }
  };

  const getOrderProgress = (order: PurchaseOrder) => {
    if (order.items && order.items.length > 0) {
      const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalReceived = order.items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
      
      if (totalOrdered === 0) return 0;
      
      const progress = Math.round((totalReceived / totalOrdered) * 100);
      return Math.min(100, progress);
    }
    
    const itemsCount = order.item_count || 0;
    const receivedCount = order.total_received || 0;
    
    if (itemsCount === 0) return 0;
    
    const progress = Math.round((receivedCount / itemsCount) * 100);
    return Math.min(100, progress);
  };

  const getOrderItemsCount = (order: PurchaseOrder) => {
    return order.item_count || 0;
  };

  const getOrderReceivedCount = (order: PurchaseOrder) => {
    return order.total_received || 0;
  };

  const getOrderPendingCount = (order: PurchaseOrder) => {
    if (order.total_pending !== undefined && order.total_pending !== null) {
      return order.total_pending;
    }
    
    const itemsCount = getOrderItemsCount(order);
    const receivedCount = getOrderReceivedCount(order);
    
    return Math.max(0, itemsCount - receivedCount);
  };

  const openOrderDetails = (order: PurchaseOrder) => {
    setSelectedOrderId(order.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  const filteredOrders = purchaseOrders.filter(
    (order) =>
      order.po_number?.toLowerCase().includes(search.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportReport = async (type: string) => {
    try {
      toast.info(`Preparing ${type} report...`);
      
      // Generate CSV content from filtered orders
      const headers = ["Order Number", "Supplier", "Order Date", "Expected Delivery", "Items", "Total Amount", "Status", "Progress"];
      
      const csvRows = filteredOrders.map(order => {
        const itemsCount = getOrderItemsCount(order);
        const progress = getOrderProgress(order);
        
        return [
          order.po_number,
          order.supplier_name,
          formatDate(order.po_date),
          formatDate(order.expected_delivery_date),
          itemsCount,
          order.final_amount,
          order.status,
          `${progress}%`
        ].join(",");
      });
      
      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} report download started`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  const applyFilters = (status: string, timeRange: string) => {
    setOrderFilterStatus(status);
    setTimeRangeOrders(timeRange);
    setIsFilterSheetOpen(false);
  };

  const clearFilters = () => {
    setOrderFilterStatus("all");
    setTimeRangeOrders("month");
    setSearch("");
    setIsFilterSheetOpen(false);
  };

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show permission denied
  if (!hasPermission("po.view")) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchases & Procurement</h1>
            <p className="text-muted-foreground">Manage purchase orders and transactions</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view purchases. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchases & Procurement</h1>
            <p className="text-muted-foreground">Manage purchase orders and transactions</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="po.view" action="view">
      <div className="space-y-6">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl max-w-[90%] sm:max-w-md">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div>
                  <p className="font-medium">Loading purchase data...</p>
                  <p className="text-sm text-muted-foreground">Please wait</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Purchases & Procurement</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage tire purchase orders and procurement
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1">
                Company: {systemSettings.company_name} • Currency: {currencySymbol} ({currency})
              </p>
            )}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Select 
              value={timeRangeOrders} 
              onValueChange={setTimeRangeOrders}
            >
              <SelectTrigger className="w-[130px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchData} disabled={loading} size="sm">
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            
            <PermissionGuard permissionCode="po.create" action="create">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/purchases/new-purchase">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Link>
                  </DropdownMenuItem>
                  <PermissionGuard permissionCode="tire.retread" action="create">
                    <DropdownMenuItem asChild>
                      <Link href="/purchases/retread">
                        <Wrench className="mr-2 h-4 w-4" />
                        Send for Retreading
                      </Link>
                    </DropdownMenuItem>
                  </PermissionGuard>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGuard>
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setIsFilterSheetOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Menu className="mr-2 h-4 w-4" />
                  Actions
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>Actions</SheetTitle>
                  <SheetDescription>
                    Choose an action to perform
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-2 py-4">
                  <Button 
                    variant="outline" 
                    onClick={fetchData} 
                    disabled={loading}
                    className="w-full justify-start"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh Data
                  </Button>
                  
                  <PermissionGuard permissionCode="po.create" action="create">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/purchases/new-purchase">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Create Purchase Order
                      </Link>
                    </Button>
                    
                    <PermissionGuard permissionCode="tire.retread" action="create">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href="/purchases/retread">
                          <Wrench className="mr-2 h-4 w-4" />
                          Send for Retreading
                        </Link>
                      </Button>
                    </PermissionGuard>
                  </PermissionGuard>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Analytics Cards - Responsive Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orderAnalytics.totalOrders}
              </div>
              <div className="flex items-center text-xs">
                {orderAnalytics.orderTrend === "up" ? (
                  <TrendingUpIcon className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDownIcon className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className="text-muted-foreground">
                  {orderAnalytics.ordersThisMonth} this month
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(orderAnalytics.totalOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(orderAnalytics.averageOrderValue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orderAnalytics.pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                {orderAnalytics.totalOrders > 0 
                  ? Math.round((orderAnalytics.pendingOrders / orderAnalytics.totalOrders) * 100) 
                  : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(orderAnalytics.monthlyOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {orderAnalytics.ordersThisMonth} orders this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Desktop */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={orderFilterStatus} onValueChange={setOrderFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="ORDERED">Ordered</SelectItem>
                <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search purchase orders..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters - Mobile Sheet */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetContent side="bottom" className="h-auto rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Filter Orders</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down results
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
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
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={orderFilterStatus} onValueChange={setOrderFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="ORDERED">Ordered</SelectItem>
                    <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Time Range</Label>
                <Select value={timeRangeOrders} onValueChange={setTimeRangeOrders}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1" 
                  onClick={() => setIsFilterSheetOpen(false)}
                >
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Purchase Orders - Desktop Table */}
        <Card className="hidden sm:block">
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading purchase orders...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No purchase orders found</h3>
                <p className="text-muted-foreground mt-1">
                  {search
                    ? "Try a different search term"
                    : "Get started by creating your first purchase order"}
                </p>
                <PermissionGuard permissionCode="po.create" action="create">
                  <Button className="mt-4" asChild>
                    <Link href="/purchases/new-purchase">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Link>
                  </Button>
                </PermissionGuard>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Order Number</TableHead>
                      <TableHead className="whitespace-nowrap">Supplier</TableHead>
                      <TableHead className="whitespace-nowrap">Order Date</TableHead>
                      <TableHead className="whitespace-nowrap">Expected Delivery</TableHead>
                      <TableHead className="whitespace-nowrap">Items</TableHead>
                      <TableHead className="whitespace-nowrap">Total Amount ({currencySymbol})</TableHead>
                      <TableHead className="whitespace-nowrap">Progress</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const itemsCount = getOrderItemsCount(order);
                      const receivedCount = getOrderReceivedCount(order);
                      const pendingCount = getOrderPendingCount(order);
                      const progress = getOrderProgress(order);
                      
                      return (
                        <TableRow key={order.id} className="hover:bg-accent/50">
                          <TableCell className="whitespace-nowrap">
                            <div className="font-mono font-bold">
                              {order.po_number}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span>{order.supplier_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.supplier_type}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium">
                              {formatDate(order.po_date)}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className={order.expected_delivery_date ? "" : "text-muted-foreground"}>
                              {formatDate(order.expected_delivery_date)}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div>
                              <div className="font-medium">{itemsCount} items</div>
                              <div className="text-xs text-muted-foreground">
                                {receivedCount} rec • {pendingCount} pend
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-bold">
                              {formatCurrency(order.final_amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Sub: {formatCurrency(order.total_amount)}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={getStatusColor(order.status)}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {order.status.replace("_", " ")}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openOrderDetails(order)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View order details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING", "APPROVED"].includes(order.status) && (
                                <PermissionGuard permissionCode="po.receive" action="edit">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/purchases/orders/${order.id}/receive`}>
                                            <Truck className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Receive goods</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </PermissionGuard>
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
          {filteredOrders.length > 0 && (
            <CardFooter className="border-t px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredOrders.length} of {purchaseOrders.length} purchase orders
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport("purchase-orders")}
                    className="flex-1 sm:flex-none"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <PermissionGuard permissionCode="po.create" action="create">
                    <Button asChild size="sm" className="flex-1 sm:flex-none">
                      <Link href="/purchases/new-purchase">
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                      </Link>
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Purchase Orders - Mobile Cards */}
        <div className="sm:hidden space-y-4">
          {ordersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading purchase orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center px-4">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No purchase orders found</h3>
                <p className="text-muted-foreground mt-1">
                  {search
                    ? "Try a different search term"
                    : "Get started by creating your first purchase order"}
                </p>
                <PermissionGuard permissionCode="po.create" action="create">
                  <Button className="mt-4 w-full" asChild>
                    <Link href="/purchases/new-purchase">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Link>
                  </Button>
                </PermissionGuard>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredOrders.map((order) => (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={openOrderDetails}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getOrderProgress={getOrderProgress}
                />
              ))}
              
              {/* Mobile Footer */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Showing {filteredOrders.length} of {purchaseOrders.length} purchase orders
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport("purchase-orders")}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <PermissionGuard permissionCode="po.create" action="create">
                      <Button asChild size="sm" className="flex-1">
                        <Link href="/purchases/new-purchase">
                          <Plus className="mr-2 h-4 w-4" />
                          New Order
                        </Link>
                      </Button>
                    </PermissionGuard>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Purchase Order Details Modal */}
        <PurchaseOrderDetails 
          orderId={selectedOrderId}
          isOpen={isModalOpen}
          onClose={closeModal}
        />

        {/* Footer */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          Logged in as: {user?.full_name || user?.username} • Role: {user?.role}
        </div>
      </div>
    </PermissionGuard>
  );
}