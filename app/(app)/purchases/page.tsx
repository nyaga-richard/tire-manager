"use client";

import { useState, useEffect, useRef } from "react";
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
  User,
  DollarSign,
  FileText,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  AlertCircle,
  Layers,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart3,
  ShoppingBag,
  Printer,
  X,
  PackageOpen,
  CreditCard,
  CalendarDays,
  Truck as TruckIcon,
  FileText as FileTextIcon,
  Printer as PrinterIcon,
  Download as DownloadIcon,
  ShoppingBag as ShoppingBagIcon,
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
import { useReactToPrint } from "react-to-print";

interface PurchaseTransaction {
  id: number;
  type: "PURCHASE" | "RETREAD_SEND" | "RETREAD_RETURN";
  date: string;
  description: string;
  supplier_name: string;
  tire_serial: string;
  tire_size: string;
  tire_brand: string;
  amount: number;
  user_name: string;
  reference: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  quantity?: number;
  unit_price?: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_type: string;
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
  item_count: number;
  total_received: number | null;
}

interface PurchaseAnalytics {
  totalPurchases: number;
  totalRetreadingCost: number;
  monthlySpending: number;
  purchaseCount: number;
  retreadCount: number;
  topSuppliers: Array<{ name: string; total: number }>;
  monthlyTrend: "up" | "down";
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
const defaultAnalytics: PurchaseAnalytics = {
  totalPurchases: 0,
  totalRetreadingCost: 0,
  monthlySpending: 0,
  purchaseCount: 0,
  retreadCount: 0,
  topSuppliers: [],
  monthlyTrend: "up",
};

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

// Purchase Order Modal Component
interface PurchaseOrderModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseOrderModal = ({ order, isOpen, onClose }: PurchaseOrderModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PO-${order?.po_number || 'Order'}`,
    pageStyle: `
      @media print {
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          -webkit-print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
      }
      @page {
        margin: 20mm;
      }
    `,
    onAfterPrint: () => toast.success("Purchase order printed successfully"),
    onPrintError: () => toast.error("Failed to print purchase order"),
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
      case "CLOSED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ORDERED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "PARTIALLY_RECEIVED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const calculateTax = (total: number) => {
    return total * 0.10; // 10% tax
  };

  const calculateShipping = () => {
    return order?.shipping_amount || 0;
  };

  const calculateFinalAmount = () => {
    const total = order?.total_amount || 0;
    const tax = calculateTax(total);
    const shipping = calculateShipping();
    return total + tax + shipping;
  };

  if (!order || !isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b no-print">
              <div>
                <h2 className="text-2xl font-bold">Purchase Order Details</h2>
                <p className="text-muted-foreground">PO: {order.po_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print/PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  // Export as JSON
                  const dataStr = JSON.stringify(order, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const link = document.createElement('a');
                  link.setAttribute('href', dataUri);
                  link.setAttribute('download', `PO-${order.po_number}.json`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("Order data exported as JSON");
                }}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Content - Printable Area */}
            <div className="flex-1 overflow-auto p-6">
              <div ref={printRef} className="space-y-8">
                {/* Printable Header */}
                <div className="border-b pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold">PURCHASE ORDER</h1>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">Order #:</span>
                          <span className="font-mono text-lg font-bold">{order.po_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">Date:</span>
                          <span>{formatDate(order.po_date)}</span>
                        </div>
                        <div className="mt-2">
                          <Badge className={`${getStatusColor(order.status)}`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.replace("_", " ")}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold mb-2">Fleet Management System</div>
                      <div className="text-sm text-muted-foreground">
                        123 Fleet Street<br />
                        Industrial Area<br />
                        City, State 12345<br />
                        Phone: (555) 123-4567<br />
                        Email: info@fleetmanagement.com
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supplier and Delivery Information */}
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Supplier Information
                    </h3>
                    <div className="space-y-2">
                      <p className="font-bold text-lg">{order.supplier_name}</p>
                      <p className="text-sm text-muted-foreground">Type: {order.supplier_type}</p>
                      {order.shipping_address && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Shipping Address:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {order.shipping_address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TruckIcon className="h-4 w-4" />
                      Delivery Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">Expected Delivery:</p>
                        <p className="text-muted-foreground">
                          {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "Not specified"}
                        </p>
                      </div>
                      {order.delivery_date && (
                        <div>
                          <p className="font-medium text-green-600">Actual Delivery:</p>
                          <p className="text-muted-foreground">
                            {formatDate(order.delivery_date)}
                          </p>
                        </div>
                      )}
                    </div>

                    {order.terms && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Terms
                        </h4>
                        <p className="text-sm font-medium">{order.terms}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PackageOpen className="h-4 w-4" />
                    Order Items
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">#</TableHead>
                          <TableHead className="font-semibold">Tire Size</TableHead>
                          <TableHead className="font-semibold text-right">Quantity</TableHead>
                          <TableHead className="font-semibold text-right">Unit Price</TableHead>
                          <TableHead className="font-semibold text-right">Line Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Sample Items - In real app, fetch from API */}
                        {Array.from({ length: order.item_count }).map((_, index) => {
                          const unitPrice = 450 + (index * 70);
                          const quantity = 4;
                          const lineTotal = unitPrice * quantity;
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>295/80R22.5</TableCell>
                              <TableCell className="text-right">{quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(unitPrice)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(lineTotal)}</TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Summary Rows */}
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="text-right font-semibold">Subtotal:</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="text-right font-semibold">Tax (10%):</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(order.tax_amount)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="text-right font-semibold">Shipping:</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(order.shipping_amount)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-primary/10 border-t-2 border-primary">
                          <TableCell colSpan={3}></TableCell>
                          <TableCell className="text-right font-bold text-lg">GRAND TOTAL:</TableCell>
                          <TableCell className="text-right font-bold text-lg">{formatCurrency(order.final_amount)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Total Items: {order.item_count} • Received: {order.total_received || 0} • 
                    Progress: {order.total_received && order.item_count ? 
                      Math.round((order.total_received / order.item_count) * 100) : 0}%
                  </div>
                </div>

                {/* Notes and Additional Information */}
                {(order.notes || order.billing_address) && (
                  <div className="grid grid-cols-2 gap-8">
                    {order.notes && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Special Instructions</h3>
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm whitespace-pre-line">{order.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.billing_address && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Billing Address</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm whitespace-pre-line">{order.billing_address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer for Print */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="font-semibold">Prepared By:</p>
                      <p className="text-sm text-muted-foreground">User #{order.created_by}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(order.created_at)}</p>
                    </div>
                    
                    {order.approved_by && (
                      <div>
                        <p className="font-semibold">Approved By:</p>
                        <p className="text-sm text-muted-foreground">User #{order.approved_by}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(order.approved_date)}</p>
                      </div>
                    )}

                    <div className="text-right">
                      <p className="font-semibold">Delivery Status:</p>
                      <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">This is an automatically generated purchase order from Fleet Management System</p>
                    <p className="mt-4 text-xs">
                      Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Non Printable */}
            <div className="border-t p-6 flex justify-between no-print">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Created by: User #{order.created_by}</span>
                </div>
                {order.approved_by && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approved by: User #{order.approved_by}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING", "APPROVED"].includes(order.status) && (
                  <Button asChild>
                    <Link href={`/purchases/orders/${order.id}/receive`}>
                      <Truck className="mr-2 h-4 w-4" />
                      Receive Goods
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function PurchasesPage() {
  const [transactions, setTransactions] = useState<PurchaseTransaction[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [analytics, setAnalytics] = useState<PurchaseAnalytics>(defaultAnalytics);
  const [orderAnalytics, setOrderAnalytics] = useState<PurchaseOrderAnalytics>(defaultOrderAnalytics);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("month");
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("all");
  const [timeRangeOrders, setTimeRangeOrders] = useState<string>("month");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Initial load - runs once when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        console.log("Loading initial data...");
        
        // Load data for the default tab (orders)
        await Promise.all([
          fetchPurchaseOrders(),
          fetchOrderAnalytics(),
        ]);
        
        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array = runs only once on mount

  // Load data when filters/tabs change (after initial load)
  useEffect(() => {
    if (!initialLoadComplete) return; // Skip if initial load hasn't completed
    
    const loadFilteredData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === "orders") {
          await Promise.all([
            fetchPurchaseOrders(),
            fetchOrderAnalytics(),
          ]);
        } else {
          await Promise.all([
            fetchTransactions(),
            fetchAnalytics(),
          ]);
        }
      } catch (error) {
        console.error("Error fetching filtered data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadFilteredData();
  }, [activeTab, filterType, filterStatus, timeRange, orderFilterStatus, timeRangeOrders, initialLoadComplete]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === "orders") {
        await Promise.all([
          fetchPurchaseOrders(),
          fetchOrderAnalytics(),
        ]);
      } else {
        await Promise.all([
          fetchTransactions(),
          fetchAnalytics(),
        ]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);
      params.append("timeRange", timeRange);

      const response = await fetch(
        `http://localhost:5000/api/purchases/transactions?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
      toast.error(`Failed to load transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams();
      if (orderFilterStatus !== "all") params.append("status", orderFilterStatus);
      if (search) params.append("search", search);
      params.append("timeRange", timeRangeOrders);

      const response = await fetch(
        `http://localhost:5000/api/purchase-orders?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch purchase orders: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setPurchaseOrders(data.data);
      } else if (Array.isArray(data)) {
        setPurchaseOrders(data);
      } else {
        setPurchaseOrders([]);
        console.warn("Unexpected data format for purchase orders:", data);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setPurchaseOrders([]);
      toast.error(`Failed to load purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/purchases/stats?timeRange=${timeRange}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics(defaultAnalytics);
      toast.error(`Failed to load analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fetchOrderAnalytics = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/purchase-orders/stats?timeRange=${timeRangeOrders}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order analytics: ${response.status} ${response.statusText}`);
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

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "New Purchase";
      case "RETREAD_SEND":
        return "Send for Retreading";
      case "RETREAD_RETURN":
        return "Return from Retreading";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETREAD_SEND":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "RETREAD_RETURN":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <ShoppingCart className="h-4 w-4" />;
      case "RETREAD_SEND":
      case "RETREAD_RETURN":
        return <Wrench className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
      case "CLOSED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ORDERED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "PARTIALLY_RECEIVED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const getOrderProgress = (order: PurchaseOrder) => {
    if (order.total_received === null || order.item_count === 0) return 0;
    return Math.round((order.total_received / order.item_count) * 100);
  };

  const openOrderDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.tire_serial.toLowerCase().includes(search.toLowerCase()) ||
      transaction.tire_brand.toLowerCase().includes(search.toLowerCase()) ||
      transaction.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = purchaseOrders.filter(
    (order) =>
      order.po_number.toLowerCase().includes(search.toLowerCase()) ||
      order.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  const exportReport = async (type: string) => {
    try {
      toast.info(`Preparing ${type} report...`);
      const csvContent = "data:text/csv;charset=utf-8,";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} report download started`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Show loading overlay when loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg bg-white p-6 shadow-xl">
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases & Procurement</h1>
          <p className="text-muted-foreground">
            Manage tire purchase orders, retreading transactions, and procurement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={activeTab === "orders" ? timeRangeOrders : timeRange} 
            onValueChange={(value) => activeTab === "orders" ? setTimeRangeOrders(value) : setTimeRange(value)}
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
          
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
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
              <DropdownMenuItem asChild>
                <Link href="/purchases/retread">
                  <Wrench className="mr-2 h-4 w-4" />
                  Send for Retreading
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Analytics Cards - Dynamic based on active tab */}
      {activeTab === "orders" ? (
        <>
          {/* Purchase Order Analytics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBagIcon className="h-4 w-4 text-muted-foreground" />
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

          {/* Status Distribution and Top Suppliers */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Orders by Status</CardTitle>
                <CardDescription>Distribution of purchase orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                {orderAnalytics.ordersByStatus && orderAnalytics.ordersByStatus.length > 0 ? (
                  <div className="space-y-4">
                    {orderAnalytics.ordersByStatus.map((statusItem) => (
                      <div key={statusItem.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(statusItem.status)}>
                            {statusItem.status.replace("_", " ")}
                          </Badge>
                          <div className="text-sm">{statusItem.count} orders</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(statusItem.value)}</div>
                          <div className="text-xs text-muted-foreground">
                            {orderAnalytics.totalOrders > 0 
                              ? Math.round((statusItem.count / orderAnalytics.totalOrders) * 100) 
                              : 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No status data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Suppliers</CardTitle>
                <CardDescription>Suppliers with highest order volume</CardDescription>
              </CardHeader>
              <CardContent>
                {orderAnalytics.ordersBySupplier && orderAnalytics.ordersBySupplier.length > 0 ? (
                  <div className="space-y-4">
                    {orderAnalytics.ordersBySupplier.map((supplier, index) => (
                      <div key={supplier.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Building className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{supplier.count} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(supplier.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            {orderAnalytics.totalOrderValue > 0 
                              ? Math.round((supplier.value / orderAnalytics.totalOrderValue) * 100) 
                              : 0}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Building className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No supplier data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Transaction Analytics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics?.totalPurchases || 0)}
                </div>
                <div className="flex items-center text-xs">
                  {analytics?.monthlyTrend === "up" ? (
                    <TrendingUpIcon className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDownIcon className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className="text-muted-foreground">
                    {analytics?.monthlyTrend === "up" ? "+" : "-"}12% from last month
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retreading Cost</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics?.totalRetreadingCost || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total spent on retreading
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics?.monthlySpending || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  This {timeRange === "week" ? "week" : "month"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Count</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analytics?.purchaseCount || 0) + (analytics?.retreadCount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.purchaseCount || 0} purchases, {analytics?.retreadCount || 0} retreads
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Suppliers */}
          {analytics?.topSuppliers && analytics.topSuppliers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Suppliers</CardTitle>
                <CardDescription>Highest spending suppliers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topSuppliers.map((supplier, index) => (
                    <div key={supplier.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">Supplier #{index + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(supplier.total)}</p>
                        <p className="text-xs text-muted-foreground">Total spent</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="purchases">Purchases Only</TabsTrigger>
            <TabsTrigger value="retreading">Retreading Only</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            {activeTab === "orders" ? (
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
            ) : (
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="PURCHASE">Purchases</SelectItem>
                  <SelectItem value="RETREAD_SEND">Retread Sends</SelectItem>
                  <SelectItem value="RETREAD_RETURN">Retread Returns</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={
                  activeTab === "orders" 
                    ? "Search purchase orders..." 
                    : "Search transactions..."
                }
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {ordersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading purchase orders...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No purchase orders found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search
                      ? "Try a different search term"
                      : "Get started by creating your first purchase order"}
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/purchases/new-purchase">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Purchase Order
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const progress = getOrderProgress(order);
                        return (
                          <TableRow key={order.id} className="hover:bg-accent/50">
                            <TableCell>
                              <div className="font-mono font-bold">
                                {order.po_number}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                <span>{order.supplier_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order.supplier_type}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {formatDate(order.po_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={order.expected_delivery_date ? "" : "text-muted-foreground"}>
                                {formatDate(order.expected_delivery_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.item_count} items</div>
                                <div className="text-xs text-muted-foreground">
                                  {order.total_received !== null ? `${order.total_received} received` : '0 received'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-bold">
                                {formatCurrency(order.final_amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Subtotal: {formatCurrency(order.total_amount)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
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
                            <TableCell className="text-right">
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
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredOrders.length} of {purchaseOrders.length} purchase orders
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport("purchase-orders")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Orders
                    </Button>
                    <Button asChild>
                      <Link href="/purchases/new-purchase">
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* All Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading transactions...</p>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No transactions found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search
                      ? "Try a different search term"
                      : "Get started by creating your first transaction"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tire Details</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-accent/50">
                          <TableCell>
                            <div className="font-medium">
                              {formatDate(transaction.date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getTransactionTypeColor(transaction.type)}
                            >
                              <div className="flex items-center gap-1">
                                {getTransactionIcon(transaction.type)}
                                {getTransactionTypeLabel(transaction.type)}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {transaction.tire_serial}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {transaction.tire_size} • {transaction.tire_brand}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <span>{transaction.supplier_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </div>
                            {transaction.quantity && transaction.unit_price && (
                              <div className="text-xs text-muted-foreground">
                                {transaction.quantity} × {formatCurrency(transaction.unit_price)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {transaction.reference}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{transaction.user_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(transaction.status)}
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/purchases/${transaction.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            {filteredTransactions.length > 0 && (
              <CardFooter className="border-t px-6 py-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredTransactions.length} transactions
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport("transactions")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Purchases Only Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Transactions</CardTitle>
              <CardDescription>
                New tire purchases and procurement records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading purchases...</p>
                  </div>
                </div>
              ) : filteredTransactions.filter(t => t.type === "PURCHASE").length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No purchase transactions found</h3>
                  <p className="text-muted-foreground mt-1">
                    Start by creating a purchase transaction
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Tire Details</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions
                        .filter(t => t.type === "PURCHASE")
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.tire_serial}</div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.tire_size} • {transaction.tire_brand}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{transaction.supplier_name}</TableCell>
                            <TableCell>{transaction.quantity || 1}</TableCell>
                            <TableCell>{formatCurrency(transaction.unit_price || transaction.amount)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => exportReport("purchases")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Purchase Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Retreading Only Tab */}
        <TabsContent value="retreading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retreading Transactions</CardTitle>
              <CardDescription>
                Tire retreading send and return records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading retreading transactions...</p>
                  </div>
                </div>
              ) : filteredTransactions.filter(t => t.type === "RETREAD_SEND" || t.type === "RETREAD_RETURN").length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No retreading transactions found</h3>
                  <p className="text-muted-foreground mt-1">
                    Send tires for retreading to see records here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tire Details</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions
                        .filter(t => t.type === "RETREAD_SEND" || t.type === "RETREAD_RETURN")
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getTransactionTypeColor(transaction.type)}
                              >
                                {getTransactionTypeLabel(transaction.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.tire_serial}</div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.tire_size} • {transaction.tire_brand}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{transaction.supplier_name}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  Total retreading cost: {formatCurrency(analytics?.totalRetreadingCost || 0)}
                </p>
                <p className="text-muted-foreground">
                  {analytics?.retreadCount || 0} retreading transactions
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => exportReport("retreading")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Retreading Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Order Modal */}
      <PurchaseOrderModal 
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}