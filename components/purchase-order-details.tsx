"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
  AlertCircle,
  Building,
  User,
  CalendarDays,
  FileText as FileTextIcon,
  Truck as TruckIcon,
  PackageOpen,
  CreditCard,
  Printer as PrinterIcon,
  Download as DownloadIcon,
  X,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Info,
  MapPin,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";

// API Base URL constant
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_contact: string;
  supplier_phone: string;
  supplier_email: string;
  supplier_address: string;
  supplier_type: string;
  po_date: string;
  expected_delivery_date: string | null;
  delivery_date: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED" | "CLOSED";
  total_amount: number; // Subtotal EXCLUDING VAT
  tax_amount: number; // Total VAT amount
  tax_rate?: number; // Tax rate percentage
  tax_name?: string; // Tax name (e.g., VAT)
  shipping_amount: number;
  final_amount: number; // Total INCLUDING VAT + shipping
  notes: string | null;
  terms: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  created_by: number;
  created_by_name: string;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    po_id: number;
    size: string;
    brand: string;
    model: string;
    type: string;
    quantity: number;
    received_quantity: number;
    unit_price: number; // This is price INCLUDING VAT from database
    line_total: number; // This is line total INCLUDING VAT from database
    received_total: number;
    remaining_quantity: number;
    notes: string;
    created_at: string;
    updated_at: string;
    tires_generated: number;
  }>;
  item_count?: number;
  total_received?: number | null;
}

interface PurchaseOrderModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mobile Item Card Component
const MobileItemCard = ({
  item,
  index,
  formatCurrency,
  taxName,
  taxRatePercent,
  lineVAT,
  lineExcludingVAT,
}: {
  item: PurchaseOrder['items'][0];
  index: number;
  formatCurrency: (amount: number) => string;
  taxName: string;
  taxRatePercent: number;
  lineVAT: number;
  lineExcludingVAT: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <div className="font-medium text-sm">{item.size}</div>
              <div className="text-xs text-muted-foreground">
                {item.brand} {item.model}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Basic Info */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-muted-foreground">Quantity</div>
            <div className="text-sm font-medium">{item.quantity}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Received</div>
            <div className="text-sm font-medium text-green-600">{item.received_quantity}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-sm font-medium text-orange-600">{item.remaining_quantity}</div>
          </div>
        </div>

        <div className="mt-2 flex justify-between items-center">
          <div>
            <div className="text-xs text-muted-foreground">Unit Price</div>
            <div className="text-sm font-medium">{formatCurrency(item.unit_price)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Line Total</div>
            <div className="text-sm font-bold text-primary">{formatCurrency(item.line_total)}</div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Type</div>
                <div className="text-sm">{item.type}</div>
              </div>
              {item.notes && (
                <div>
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="text-sm">{item.notes}</div>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Excluding {taxName}:</span>
                <span className="font-medium">{formatCurrency(lineExcludingVAT)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">{taxName} ({taxRatePercent}%):</span>
                <span className="font-medium">{formatCurrency(lineVAT)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1 pt-1 border-t">
                <span className="font-medium">Total (Inc. {taxName}):</span>
                <span className="font-bold">{formatCurrency(item.line_total)}</span>
              </div>
            </div>

            {/* Tires Generated */}
            {item.tires_generated > 0 && (
              <div className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-950 p-2 rounded">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{item.tires_generated} tires generated from this item</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Supplier Info Card
const MobileSupplierCard = ({ order, formatDate }: { order: PurchaseOrder; formatDate: (date: string | null) => string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Supplier Information</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        <div className="mt-2">
          <div className="font-medium">{order.supplier_name}</div>
          <div className="text-xs text-muted-foreground">{order.supplier_type}</div>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              <span>{order.supplier_contact}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{order.supplier_phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="break-all">{order.supplier_email}</span>
            </div>
            {order.supplier_address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                <span className="flex-1">{order.supplier_address}</span>
              </div>
            )}
            {order.shipping_address && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs font-medium mb-1">Shipping Address:</p>
                <p className="text-xs">{order.shipping_address}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Order Details Card
const MobileOrderDetailsCard = ({ order, formatDate, formatDateTime, getProgress }: { 
  order: PurchaseOrder; 
  formatDate: (date: string | null) => string;
  formatDateTime: (date: string | null) => string;
  getProgress: () => number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = getProgress();

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Order Details</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Basic Info */}
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Order Date:</span>
            <span className="text-xs font-medium">{formatDate(order.po_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Expected Delivery:</span>
            <span className="text-xs font-medium">{formatDate(order.expected_delivery_date)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
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

        {isExpanded && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Prepared By:</span>
              <span className="text-xs">{order.created_by_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Date Prepared:</span>
              <span className="text-xs">{formatDateTime(order.created_at)}</span>
            </div>
            
            {order.approved_by && order.approved_by_name && (
              <>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Approved By:</span>
                  <span className="text-xs">{order.approved_by_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Date Approved:</span>
                  <span className="text-xs">{formatDateTime(order.approved_date)}</span>
                </div>
              </>
            )}
            
            {order.terms && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs font-medium mb-1">Payment Terms:</p>
                <p className="text-xs">{order.terms}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function PurchaseOrderDetails({ orderId, isOpen, onClose }: PurchaseOrderModalProps) {
  const { user } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';
  
  // Get tax rate from order or use settings default
  const taxRate = order?.tax_rate !== undefined ? order.tax_rate / 100 : (systemSettings?.vat_rate || 16) / 100;
  const taxName = order?.tax_name || 'VAT';
  const taxRatePercent = order?.tax_rate !== undefined ? order.tax_rate : (systemSettings?.vat_rate || 16);

  useEffect(() => {
    if (orderId && isOpen) {
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [orderId, isOpen]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase-orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        throw new Error("Invalid order data format");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PO-${order?.po_number || 'Order'}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
          color: black;
          font-size: 12pt;
          line-height: 1.4;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .print-content {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
        }
        
        .no-print {
          display: none !important;
        }
        
        table {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        .print-section {
          page-break-inside: avoid;
          margin-bottom: 12pt;
        }
        
        .print-content {
          font-size: 10pt !important;
        }
        
        .print-table {
          font-size: 9pt !important;
        }
        
        .bg-opacity-10,
        .bg-primary/10,
        .bg-gray-50,
        .bg-yellow-50,
        .bg-blue-50 {
          background-color: #f9f9f9 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        table, th, td {
          border: 0.5pt solid #ddd !important;
        }
        
        .print-padding {
          padding: 4pt !important;
        }
      }
    `,
    onAfterPrint: () => toast.success("Purchase order printed successfully"),
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Failed to print purchase order");
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      const format = systemSettings?.date_format || "MMM dd, yyyy";
      
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      const dateFormat = systemSettings?.date_format || "MMM dd, yyyy";
      const timeFormat = systemSettings?.time_format || "HH:mm:ss";
      
      const dateStr = formatDate(dateString);
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: timeFormat.includes("ss") ? "2-digit" : undefined,
        hour12: timeFormat.includes("a")
      });
      
      return `${dateStr} ${timeStr}`;
    } catch {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace(currency, currencySymbol);
  };

  // Calculate exclusive price from inclusive price using order's tax rate
  const calculateExclusivePrice = (inclusivePrice: number): number => {
    return inclusivePrice / (1 + taxRate);
  };

  // Calculate VAT amount from inclusive price
  const calculateVATAmount = (inclusivePrice: number): number => {
    const exclusivePrice = calculateExclusivePrice(inclusivePrice);
    return inclusivePrice - exclusivePrice;
  };

  // Calculate line total excluding VAT
  const calculateLineTotalExcludingVAT = (lineTotalInclusive: number): number => {
    return lineTotalInclusive / (1 + taxRate);
  };

  // Calculate line VAT amount
  const calculateLineVAT = (lineTotalInclusive: number): number => {
    return lineTotalInclusive - calculateLineTotalExcludingVAT(lineTotalInclusive);
  };

  // Calculate subtotal from items (VAT inclusive)
  const calculateSubtotalInclusive = (): number => {
    if (!order || !order.items) return 0;
    return order.items.reduce((sum, item) => sum + item.line_total, 0);
  };

  // Calculate VAT from subtotal (working backwards)
  const calculateVATFromSubtotal = (): number => {
    const subtotalInclusive = calculateSubtotalInclusive();
    if (subtotalInclusive === 0) return 0;
    
    // Working backwards: VAT = (subtotalInclusive * taxRate) / (1 + taxRate)
    return (subtotalInclusive * taxRate) / (1 + taxRate);
  };

  // Calculate subtotal excluding VAT
  const calculateSubtotalExcludingVAT = (): number => {
    const subtotalInclusive = calculateSubtotalInclusive();
    const vatAmount = calculateVATFromSubtotal();
    return subtotalInclusive - vatAmount;
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

  const getProgress = () => {
    if (!order || !order.items || order.items.length === 0) return 0;
    
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = order.items.reduce((sum, item) => sum + item.received_quantity, 0);
    
    return totalQuantity > 0 ? Math.round((totalReceived / totalQuantity) * 100) : 0;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
            {/* Modal Header - Desktop */}
            <div className="hidden sm:flex items-center justify-between p-6 border-b no-print">
              <div>
                <h2 className="text-2xl font-bold">Purchase Orders Details</h2>
                <p className="text-muted-foreground">
                  {order ? `PO: ${order.po_number}` : "Loading..."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrint}
                  disabled={!order}
                >
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print/PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (!order) return;
                    
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
                  }}
                  disabled={!order}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Header - Mobile */}
            <div className="flex sm:hidden items-center justify-between p-4 border-b no-print">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-lg font-bold">PO Details</h2>
                  <p className="text-xs text-muted-foreground">
                    {order ? order.po_number : "Loading..."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="h-8"
              >
                <FileText className="mr-2 h-3 w-3" />
                Menu
              </Button>
            </div>

            {/* Mobile Menu Sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent side="bottom" className="h-auto rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>Actions</SheetTitle>
                  <SheetDescription>
                    Choose an action for this purchase order
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-2 py-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      handlePrint();
                      setMobileMenuOpen(false);
                    }}
                    disabled={!order}
                  >
                    <PrinterIcon className="mr-2 h-4 w-4" />
                    Print/PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (!order) return;
                      const dataStr = JSON.stringify(order, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const link = document.createElement('a');
                      link.setAttribute('href', dataUri);
                      link.setAttribute('download', `PO-${order.po_number}.json`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success("Order data exported as JSON");
                      setMobileMenuOpen(false);
                    }}
                    disabled={!order}
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  {order && ["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING", "APPROVED"].includes(order.status) && (
                    <Button 
                      className="w-full justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href={`/purchases/orders/${order.id}/receive`}>
                        <Truck className="mr-2 h-4 w-4" />
                        Receive Goods
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Modal Content - Printable Area */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading order details...</p>
                  </div>
                </div>
              ) : !order ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Order not found</h3>
                  <p className="text-muted-foreground mt-1">
                    The requested purchase order could not be loaded
                  </p>
                </div>
              ) : (
                <div ref={printRef} className="print-content space-y-6 sm:space-y-8">
                  {/* Printable Header - Desktop */}
                  <div className="hidden sm:block print-section border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div className="w-1/2">
                        <div className="mb-4">
                          <h1 className="text-2xl font-bold uppercase tracking-wide">PURCHASE ORDER</h1>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileTextIcon className="h-3 w-3" />
                              <span className="font-semibold text-sm">Order #:</span>
                              <span className="font-mono text-base font-bold">{order.po_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" />
                              <span className="font-semibold text-sm">Date:</span>
                              <span className="text-sm">{formatDate(order.po_date)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-bold mb-1">{systemSettings?.company_name || 'Fleet Management System'}</p>
                          {systemSettings?.company_address ? (
                            systemSettings.company_address.split('\n').map((line, i) => (
                              <p key={i} className="text-xs">{line}</p>
                            ))
                          ) : (
                            <>
                              <p className="text-xs">123 Fleet Street</p>
                              <p className="text-xs">Industrial Area</p>
                              <p className="text-xs">City, State 12345</p>
                            </>
                          )}
                          {systemSettings?.company_phone && (
                            <p className="text-xs">Phone: {systemSettings.company_phone}</p>
                          )}
                          {systemSettings?.company_email && (
                            <p className="text-xs">Email: {systemSettings.company_email}</p>
                          )}
                          {systemSettings?.company_tax_id && (
                            <p className="text-xs">Tax ID: {systemSettings.company_tax_id}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-1/2 text-right">
                        <div className="mb-4">
                          <Badge className={`${getStatusColor(order.status)} text-xs py-1`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.replace("_", " ")}
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-bold mb-1">Delivery Information</p>
                          <p className="text-xs">
                            <span className="font-medium">Expected:</span>{" "}
                            {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "Not specified"}
                          </p>
                          {order.delivery_date && (
                            <p className="text-xs">
                              <span className="font-medium text-green-600">Delivered:</span>{" "}
                              {formatDate(order.delivery_date)}
                            </p>
                          )}
                          <div className="mt-2">
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden inline-block">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${getProgress()}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getProgress()}% complete
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Header */}
                  <div className="sm:hidden space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1 text-xs">
                          {getStatusIcon(order.status)}
                          {order.status.replace("_", " ")}
                        </div>
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(order.po_date)}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h1 className="text-xl font-bold uppercase tracking-wide">PURCHASE ORDER</h1>
                      <p className="font-mono text-sm mt-1">{order.po_number}</p>
                    </div>

                    {/* Company Info */}
                    <Card>
                      <CardContent className="p-3">
                        <p className="font-bold text-sm">{systemSettings?.company_name || 'Fleet Management System'}</p>
                        {systemSettings?.company_address && (
                          <p className="text-xs text-muted-foreground mt-1">{systemSettings.company_address}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          {systemSettings?.company_phone && <span>📞 {systemSettings.company_phone}</span>}
                          {systemSettings?.company_email && <span>✉️ {systemSettings.company_email}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mobile Supplier and Order Details Cards */}
                  <div className="sm:hidden space-y-3">
                    <MobileSupplierCard order={order} formatDate={formatDate} />
                    <MobileOrderDetailsCard 
                      order={order} 
                      formatDate={formatDate} 
                      formatDateTime={formatDateTime}
                      getProgress={getProgress}
                    />
                  </div>

                  {/* Desktop Supplier Information */}
                  <div className="hidden sm:block print-section">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          Supplier Information
                        </h3>
                        <div className="text-sm space-y-1 border p-3 rounded">
                          <p className="font-bold">{order.supplier_name}</p>
                          <p>Contact: {order.supplier_contact}</p>
                          <p>Phone: {order.supplier_phone}</p>
                          <p>Email: {order.supplier_email}</p>
                          <p>Type: {order.supplier_type}</p>
                          <p className="text-xs">{order.supplier_address}</p>
                          
                          {order.shipping_address && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium text-xs">Shipping Address:</p>
                              <p className="text-xs">{order.shipping_address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <TruckIcon className="h-3 w-3" />
                          Order Details
                        </h3>
                        <div className="text-sm space-y-2 border p-3 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">Prepared By:</span>
                            <span>{order.created_by_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Date Prepared:</span>
                            <span>{formatDateTime(order.created_at)}</span>
                          </div>
                          
                          {order.approved_by && order.approved_by_name && (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium">Approved By:</span>
                                <span>{order.approved_by_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Date Approved:</span>
                                <span>{formatDateTime(order.approved_date)}</span>
                              </div>
                            </>
                          )}
                          
                          {order.terms && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium">Payment Terms:</p>
                              <p className="text-xs">{order.terms}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items - Desktop Table */}
                  <div className="hidden sm:block print-section">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <PackageOpen className="h-3 w-3" />
                      Order Items
                    </h3>
                    
                    <div className="border rounded overflow-hidden">
                      <Table className="print-table">
                        <TableHeader className="bg-gray-50 dark:bg-gray-800 print-padding">
                          <TableRow>
                            <TableHead className="font-semibold text-xs w-8 p-2">#</TableHead>
                            <TableHead className="font-semibold text-xs p-2">Size</TableHead>
                            <TableHead className="font-semibold text-xs p-2">Description</TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">Qty</TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">
                              <div>Unit Price</div>
                              <div className="text-xs text-muted-foreground font-normal">(Inc. {taxName})</div>
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">
                              <div>Total</div>
                              <div className="text-xs text-muted-foreground font-normal">(Inc. {taxName})</div>
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">Received</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => {
                            const lineVAT = calculateLineVAT(item.line_total);
                            const lineExcludingVAT = calculateLineTotalExcludingVAT(item.line_total);
                            
                            return (
                              <TableRow key={item.id} className="print-padding">
                                <TableCell className="text-xs font-medium p-2">{index + 1}</TableCell>
                                <TableCell className="text-xs p-2">{item.size}</TableCell>
                                <TableCell className="text-xs p-2">
                                  {item.brand} {item.model}
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {item.type} {item.notes ? `• ${item.notes}` : ''}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-right p-2">{item.quantity}</TableCell>
                                <TableCell className="text-xs text-right p-2">
                                  {formatCurrency(item.unit_price)}
                                </TableCell>
                                <TableCell className="text-xs text-right font-medium p-2">
                                  {formatCurrency(item.line_total)}
                                </TableCell>
                                <TableCell className="text-xs text-right p-2">
                                  <div>{item.received_quantity}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.remaining_quantity} pending
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Summary Rows */}
                          <TableRow className="bg-gray-50 dark:bg-gray-800 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">Subtotal:</TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(calculateSubtotalInclusive())}
                            </TableCell>
                          </TableRow>
                          
                          <TableRow className="bg-gray-50 dark:bg-gray-800 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">
                              <div>{taxName} ({taxRatePercent}%):</div>
                              <div className="text-[10px] text-muted-foreground font-normal">
                                Calculated on {formatCurrency(calculateSubtotalExcludingVAT())}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(calculateVATFromSubtotal())}
                            </TableCell>
                          </TableRow>
                          
                          <TableRow className="bg-gray-50 dark:bg-gray-800 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">Subtotal (Ex {taxName}):</TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(calculateSubtotalExcludingVAT())}
                            </TableCell>
                          </TableRow>
                          
                          <TableRow className="bg-gray-50 dark:bg-gray-800 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">Shipping:</TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(order.shipping_amount)}
                            </TableCell>
                          </TableRow>
                          
                          <TableRow className="bg-primary/10 border-t-2 border-primary print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-sm font-bold text-right p-2">GRAND TOTAL:</TableCell>
                            <TableCell className="text-sm font-bold text-right p-2" colSpan={2}>
                              {formatCurrency(
                                calculateSubtotalInclusive() + order.shipping_amount
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Total Items: {order.items.length} • Total Quantity: {order.items.reduce((sum, item) => sum + item.quantity, 0)} • 
                      Received: {order.items.reduce((sum, item) => sum + item.received_quantity, 0)} ({getProgress()}%)
                    </div>
                  </div>

                  {/* Mobile Order Items */}
                  <div className="sm:hidden space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <PackageOpen className="h-4 w-4" />
                      Order Items ({order.items.length})
                    </h3>
                    
                    {order.items.map((item, index) => {
                      const lineVAT = calculateLineVAT(item.line_total);
                      const lineExcludingVAT = calculateLineTotalExcludingVAT(item.line_total);
                      
                      return (
                        <MobileItemCard
                          key={item.id}
                          item={item}
                          index={index}
                          formatCurrency={formatCurrency}
                          taxName={taxName}
                          taxRatePercent={taxRatePercent}
                          lineVAT={lineVAT}
                          lineExcludingVAT={lineExcludingVAT}
                        />
                      );
                    })}

                    {/* Mobile Summary Card */}
                    <Card className="mt-4 bg-primary/5">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3">Order Summary</h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal (Inc. {taxName}):</span>
                            <span className="font-medium">{formatCurrency(calculateSubtotalInclusive())}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{taxName} ({taxRatePercent}%):</span>
                            <span className="font-medium">{formatCurrency(calculateVATFromSubtotal())}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal (Ex. {taxName}):</span>
                            <span className="font-medium">{formatCurrency(calculateSubtotalExcludingVAT())}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Shipping:</span>
                            <span className="font-medium">{formatCurrency(order.shipping_amount)}</span>
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Grand Total:</span>
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(calculateSubtotalInclusive() + order.shipping_amount)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mobile Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <Card>
                        <CardContent className="p-2 text-center">
                          <div className="text-xs text-muted-foreground">Items</div>
                          <div className="text-lg font-bold">{order.items.length}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-2 text-center">
                          <div className="text-xs text-muted-foreground">Total Qty</div>
                          <div className="text-lg font-bold">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-2 text-center">
                          <div className="text-xs text-muted-foreground">Received</div>
                          <div className="text-lg font-bold text-green-600">
                            {order.items.reduce((sum, item) => sum + item.received_quantity, 0)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* VAT Calculation Summary - Desktop */}
                  <div className="hidden sm:block mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <p className="font-semibold mb-1">{taxName} Calculation Summary:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Subtotal (Inc {taxName}):</span> {formatCurrency(calculateSubtotalInclusive())}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Subtotal (Ex {taxName}):</span> {formatCurrency(calculateSubtotalExcludingVAT())}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{taxName} Amount ({taxRatePercent}%):</span> {formatCurrency(calculateVATFromSubtotal())}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Shipping:</span> {formatCurrency(order.shipping_amount)}
                      </div>
                      <div className="col-span-2 mt-1 pt-1 border-t">
                        <span className="text-muted-foreground">Total Payable:</span>{" "}
                        <span className="font-semibold">
                          {formatCurrency(calculateSubtotalInclusive() + order.shipping_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes and Billing Address */}
                  {(order.notes || order.billing_address) && (
                    <div className="print-section">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {order.notes && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1">Special Instructions</h4>
                            <div className="text-xs p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                              <p className="whitespace-pre-line break-words">{order.notes}</p>
                            </div>
                          </div>
                        )}
                        
                        {order.billing_address && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Billing Address
                            </h4>
                            <div className="text-xs p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                              <p className="whitespace-pre-line break-words">{order.billing_address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer for Print */}
                  <div className="print-section border-t pt-4">
                    <div className="text-center text-xs text-muted-foreground">
                      <p>Thank you for your business!</p>
                      <p className="mt-0.5">This is an automatically generated purchase order from {systemSettings?.company_name || 'Fleet Management System'}</p>
                      <div className="mt-2 flex flex-col sm:flex-row justify-between items-center text-xs gap-2">
                        <div className="text-left">
                          <p>Page 1 of 1</p>
                          <p>Confidential</p>
                        </div>
                        <div className="text-right">
                          <p>Generated on {formatDateTime(new Date().toISOString())}</p>
                          <p>Document ID: PO-{order.po_number}</p>
                          <p>Generated by: {user?.full_name || user?.username || 'System'}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t text-[10px]">
                        <p>For inquiries, please contact: {systemSettings?.company_email || 'procurement@fleetmanagement.com'} | Phone: {systemSettings?.company_phone || '(555) 123-4567'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Desktop */}
            <div className="hidden sm:flex border-t p-6 justify-between no-print">
              {order && (
                <>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Created by: {order.created_by_name}</span>
                    </div>
                    {order.approved_by && order.approved_by_name && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Approved by: {order.approved_by_name}</span>
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
                </>
              )}
            </div>

            {/* Modal Footer - Mobile */}
            <div className="sm:hidden border-t p-4 no-print">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Close
                </Button>
                {order && ["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING", "APPROVED"].includes(order.status) && (
                  <Button className="flex-1" asChild>
                    <Link href={`/purchases/orders/${order.id}/receive`}>
                      <Truck className="mr-2 h-4 w-4" />
                      Receive
                    </Link>
                  </Button>
                )}
              </div>
              {order && (
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Created by: {order.created_by_name}
                  {order.approved_by && order.approved_by_name && (
                    <> • Approved by: {order.approved_by_name}</>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}