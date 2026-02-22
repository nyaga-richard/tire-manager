"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  History,
  Eye,
  ArrowLeft,
  TrendingUp,
  Package,
  Car,
  RefreshCw as RetreadIcon,
  Trash2,
  Warehouse,
  Building,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  User,
  DollarSign,
  ShoppingCart,
  Wrench,
  Truck,
  FileText,
  Receipt,
  Hash,
  Building2,
  Printer,
  AlertCircle,
  TrendingDown,
  Gauge,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Movement {
  id: number;
  tire_id: number;
  serial_number: string;
  size: string;
  brand: string;
  pattern: string;
  from_location: string;
  to_location: string;
  movement_type:
    | "PURCHASE_TO_STORE"
    | "STORE_TO_VEHICLE"
    | "VEHICLE_TO_STORE"
    | "STORE_TO_RETREAD_SUPPLIER"
    | "RETREAD_SUPPLIER_TO_STORE"
    | "STORE_TO_DISPOSAL";
  movement_date: string;
  user_id: number;
  user_name: string;
  notes: string;
  reference_id?: number;
  reference_type?: string;
  vehicle_number?: string;
  vehicle_id?: number;
  supplier_name?: string;
  supplier_id?: number;
  purchase_cost?: number;
  retread_cost?: number;
  disposal_reason?: string;
  position?: string;
  install_odometer?: number;
  removal_odometer?: number;
  document_number?: string;
  reference_number?: string;
  tire_condition?: string;
}

interface StockLedgerEntry {
  id: number;
  date: string;
  user_name: string;
  location: string;
  opening_stock: number;
  quantity_in: number;
  quantity_out: number;
  closing_stock: number;
  price?: number;
  reference: string;
  document_no: string;
  type: string;
  movement: Movement;
}

interface MovementStats {
  movement_type: string;
  count: number;
  unique_tires: number;
}

// Skeleton Components
const LedgerEntrySkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

export default function MovementHistoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [filteredLedger, setFilteredLedger] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ledger");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalEntries, setTotalEntries] = useState(0);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const printRef = useRef<HTMLDivElement>(null);

  // Mobile collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    summary: true,
  });

  const tireId = searchParams.get("tire");
  const size = searchParams.get("size");

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Check permission for inventory movement view
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasPermission("inventory.view")) {
      router.push("/dashboard");
      toast.error("You don't have permission to view inventory movements");
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("inventory.view")) {
      fetchMovements();
    }
  }, [startDate, endDate, currentPage, isAuthenticated, hasPermission, tireId, size]);

  useEffect(() => {
    if (search) {
      const filtered = ledgerEntries.filter(
        (entry) =>
          entry.user_name.toLowerCase().includes(search.toLowerCase()) ||
          entry.reference.toLowerCase().includes(search.toLowerCase()) ||
          entry.document_no.toLowerCase().includes(search.toLowerCase()) ||
          entry.type.toLowerCase().includes(search.toLowerCase()) ||
          entry.movement.serial_number.toLowerCase().includes(search.toLowerCase()) ||
          entry.movement.size.toLowerCase().includes(search.toLowerCase()) ||
          entry.movement.brand.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredLedger(filtered);
    } else {
      setFilteredLedger(ledgerEntries);
    }
  }, [search, ledgerEntries]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : "",
        details: "true",
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      let url;
      if (tireId) {
        url = `${API_BASE_URL}/api/movements/tire/${tireId}?${params}`;
      } else if (size) {
        url = `${API_BASE_URL}/api/movements/size/${encodeURIComponent(
          size
        )}?${params}`;
      } else {
        url = `${API_BASE_URL}/api/movements?${params}`;
      }

      const response = await authFetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch movements: ${response.status}`);
      }
      
      const data = await response.json();
      
      const movements = Array.isArray(data) ? data : data.movements || [];
      const ledger = calculateStockLedger(movements);
      
      setLedgerEntries(ledger);
      setFilteredLedger(ledger);
      setTotalEntries(data.total || ledger.length);
      setTotalPages(data.totalPages || Math.ceil(ledger.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching movements:", error);
      setError(error instanceof Error ? error.message : "Failed to load movements");
      toast.error("Failed to load movement history");
      setLedgerEntries([]);
      setFilteredLedger([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStockLedger = (movements: Movement[]): StockLedgerEntry[] => {
    if (!movements.length) return [];

    const sortedMovements = [...movements].sort(
      (a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime()
    );

    const ledger: StockLedgerEntry[] = [];
    let runningStock = 0;

    const groupedMovements = sortedMovements.reduce((acc, movement) => {
      const key = `${movement.movement_date}-${movement.reference_number || movement.reference_type}-${movement.movement_type}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(movement);
      return acc;
    }, {} as Record<string, Movement[]>);

    Object.entries(groupedMovements).forEach(([key, transactionMovements]) => {
      const firstMovement = transactionMovements[0];
      let openingStock = runningStock;
      let quantityIn = 0;
      let quantityOut = 0;

      transactionMovements.forEach(movement => {
        if (movement.movement_type === "PURCHASE_TO_STORE" || 
            movement.movement_type === "RETREAD_SUPPLIER_TO_STORE") {
          quantityIn += 1;
        } else if (movement.movement_type === "VEHICLE_TO_STORE") {
          quantityIn += 1;
        } else if (movement.movement_type === "STORE_TO_VEHICLE" || 
                  movement.movement_type === "STORE_TO_RETREAD_SUPPLIER" ||
                  movement.movement_type === "STORE_TO_DISPOSAL") {
          quantityOut += 1;
        }
      });

      const closingStock = openingStock + quantityIn - quantityOut;
      runningStock = closingStock;

      const { type, documentNo, reference } = getTransactionDetails(firstMovement, transactionMovements.length);
      const price = getTransactionPrice(firstMovement);

      ledger.push({
        id: firstMovement.id,
        date: firstMovement.movement_date,
        user_name: firstMovement.user_name || "System",
        location: "MAIN_WAREHOUSE",
        opening_stock: openingStock,
        quantity_in: quantityIn,
        quantity_out: quantityOut,
        closing_stock: closingStock,
        price: price,
        reference: reference,
        document_no: documentNo,
        type: type,
        movement: firstMovement
      });
    });

    return ledger;
  };

  const getTransactionDetails = (movement: Movement, quantity: number) => {
    let type = "";
    let documentNo = "";
    let reference = "";

    switch (movement.movement_type) {
      case "PURCHASE_TO_STORE":
        type = "Purchase";
        documentNo = movement.document_number || `PUR-${movement.id}`;
        reference = `${movement.supplier_name || 'Supplier'}${movement.reference_number ? `/${movement.reference_number}` : ''}`;
        break;
      
      case "STORE_TO_VEHICLE":
        type = "Installation";
        documentNo = movement.document_number || `INST-${movement.id}`;
        reference = `${movement.vehicle_number || 'Vehicle'}${movement.position ? `/${movement.position}` : ''}`;
        break;
      
      case "VEHICLE_TO_STORE":
        type = "Return from Vehicle";
        documentNo = movement.document_number || `RET-${movement.id}`;
        reference = `${movement.notes ? `  ${movement.notes}` : ''}`;
        break;
      
      case "STORE_TO_RETREAD_SUPPLIER":
        type = "Send for Retreading";
        documentNo = movement.document_number || `RETREAD-SEND-${movement.id}`;
        reference = `${movement.supplier_name || 'Retreader'}`;
        break;
      
      case "RETREAD_SUPPLIER_TO_STORE":
        type = "Return from Retreading";
        documentNo = movement.document_number || `RETREAD-RET-${movement.id}`;
        reference = `${movement.supplier_name || 'Retreader'}`;
        break;
      
      case "STORE_TO_DISPOSAL":
        type = "Disposal";
        documentNo = movement.document_number || `DISP-${movement.id}`;
        reference = `${movement.disposal_reason || 'Disposed'}`;
        break;
      
      default:
        type = (movement.movement_type as string).replace(/_/g, " ");
        documentNo = `TRX-${movement.id}`;
        reference = movement.notes || "";
    }

    return { type, documentNo, reference };
  };

  const getTransactionPrice = (movement: Movement) => {
    switch (movement.movement_type) {
      case "PURCHASE_TO_STORE":
        return movement.purchase_cost;
      case "STORE_TO_RETREAD_SUPPLIER":
        return movement.retread_cost;
      default:
        return undefined;
    }
  };

  const refreshData = () => {
    setCurrentPage(1);
    fetchMovements();
  };

  const getTransactionTypeColor = (type: string) => {
    if (type.includes("Purchase") || type.includes("Return from Retreading")) {
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
    } else if (type.includes("Installation") || type.includes("Send for Retreading") || type.includes("Disposal")) {
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
    } else if (type.includes("Return from Vehicle")) {
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes("Purchase")) {
      return <ShoppingCart className="h-3 w-3" />;
    } else if (type.includes("Installation")) {
      return <Car className="h-3 w-3" />;
    } else if (type.includes("Return from Vehicle")) {
      return <Truck className="h-3 w-3" />;
    } else if (type.includes("Retreading")) {
      return <Wrench className="h-3 w-3" />;
    } else if (type.includes("Disposal")) {
      return <Trash2 className="h-3 w-3" />;
    } else {
      return <Package className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const dateFormat = systemSettings?.date_format || "MMM dd, yyyy";
      const timeFormat = systemSettings?.time_format || "HH:mm:ss";
      
      const dateStr = formatDateOnly(dateString);
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

  const formatDateOnly = (dateString: string) => {
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(currency, currencySymbol);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getSortedLedger = () => {
    return [...filteredLedger].sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "type") {
        return sortOrder === "asc"
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      } else if (sortBy === "user") {
        return sortOrder === "asc"
          ? a.user_name.localeCompare(b.user_name)
          : b.user_name.localeCompare(a.user_name);
      }
      return 0;
    });
  };

  const exportToCSV = () => {
    if (!hasPermission("inventory.export")) {
      toast.error("You don't have permission to export inventory movements");
      return;
    }

    if (!filteredLedger.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Date",
      "User Name",
      "Store Location",
      "Opening Stock",
      "Qty In",
      "Qty Out",
      "Closing Stock",
      `Price (${currencySymbol})`,
      "Reference",
      "Document No",
      "Type",
      "Serial Number",
      "Size",
      "Brand",
      "From Location",
      "To Location",
      "Condition",
    ];

    const csvContent = [
      headers.join(","),
      ...getSortedLedger().map((entry) =>
        [
          formatDateOnly(entry.date),
          entry.user_name,
          entry.location,
          formatNumber(entry.opening_stock),
          formatNumber(entry.quantity_in),
          formatNumber(entry.quantity_out),
          formatNumber(entry.closing_stock),
          entry.price ? entry.price : "",
          `"${entry.reference.replace(/"/g, '""')}"`,
          entry.document_no,
          entry.type,
          entry.movement.serial_number,
          entry.movement.size,
          entry.movement.brand,
          entry.movement.from_location || "",
          entry.movement.to_location || "",
          entry.movement.tire_condition || "",
        ].map(cell => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tire-stock-ledger-${startDate ? format(startDate, "yyyy-MM-dd") : "start"}-to-${endDate ? format(endDate, "yyyy-MM-dd") : "end"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("CSV export started");
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Could not open print window");
      return;
    }

    const printDate = format(new Date(), "MMMM dd, yyyy HH:mm:ss");
    const sortedLedger = getSortedLedger();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tire Stock Ledger Report</title>
        <style>
          @media print {
            @page {
              size: landscape;
              margin: 0.5in;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .print-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .print-subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
            }
            .print-meta {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 20px;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            .print-table th {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              font-weight: bold;
            }
            .print-table td {
              border: 1px solid #d1d5db;
              padding: 6px;
              vertical-align: top;
            }
            .print-table tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .print-footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #d1d5db;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 500;
            }
            .badge-in {
              background-color: #d1fae5;
              color: #065f46;
              border: 1px solid #a7f3d0;
            }
            .badge-out {
              background-color: #fee2e2;
              color: #991b1b;
              border: 1px solid #fecaca;
            }
            .no-print {
              display: none;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-mono {
              font-family: 'Courier New', monospace;
            }
            .summary-box {
              margin-bottom: 20px;
              padding: 10px;
              border: 1px solid #d1d5db;
              border-radius: 4px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .summary-item {
              padding: 10px;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              text-align: center;
            }
            .generated-by {
              margin-top: 5px;
              font-size: 10px;
              color: #666;
            }
            .company-info {
              font-size: 11px;
              margin-bottom: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">Tire Stock Ledger Report</div>
          <div class="print-subtitle">Complete Stock Movement History</div>
          <div class="company-info">
            <strong>${systemSettings?.company_name || 'Fleet Management System'}</strong>
          </div>
          <div class="print-meta">
            <div>
              <strong>Date Range:</strong> 
              ${startDate ? formatDateOnly(startDate.toISOString()) : 'All Dates'} 
              to 
              ${endDate ? formatDateOnly(endDate.toISOString()) : 'Current Date'}
            </div>
            <div>
              <strong>Generated:</strong> ${printDate}
            </div>
          </div>
          <div class="generated-by">
            <strong>Generated by:</strong> ${user?.full_name || user?.username || 'System'}
          </div>
          ${tireId ? `<div><strong>Filter:</strong> Tire ID: ${tireId}</div>` : ''}
          ${size ? `<div><strong>Filter:</strong> Size: ${size}</div>` : ''}
        </div>

        <div class="summary-grid">
          <div class="summary-item">
            <div style="font-size: 18px; font-weight: bold;">${formatNumber(totalEntries)}</div>
            <div style="font-size: 11px; color: #666;">Total Transactions</div>
          </div>
          <div class="summary-item">
            <div style="font-size: 18px; font-weight: bold; color: #059669;">
              ${formatNumber(sortedLedger.reduce((sum, entry) => sum + entry.quantity_in, 0))}
            </div>
            <div style="font-size: 11px; color: #666;">Total Quantity In</div>
          </div>
          <div class="summary-item">
            <div style="font-size: 18px; font-weight: bold; color: #dc2626;">
              ${formatNumber(sortedLedger.reduce((sum, entry) => sum + entry.quantity_out, 0))}
            </div>
            <div style="font-size: 11px; color: #666;">Total Quantity Out</div>
          </div>
          <div class="summary-item">
            <div style="font-size: 18px; font-weight: bold; color: #2563eb;">
              ${sortedLedger.length > 0 ? formatNumber(sortedLedger[sortedLedger.length - 1].closing_stock) : '0'}
            </div>
            <div style="font-size: 11px; color: #666;">Current Stock</div>
          </div>
        </div>

        <table class="print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User Name</th>
              <th>Location</th>
              <th class="text-right">Opening Stock</th>
              <th class="text-right">Qty In</th>
              <th class="text-right">Qty Out</th>
              <th class="text-right">Closing Stock</th>
              <th class="text-right">Price</th>
              <th>Reference</th>
              <th>Document No</th>
              <th>Type</th>
              <th>Serial Number</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            ${sortedLedger.map(entry => `
              <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.user_name}</td>
                <td>${entry.location}</td>
                <td class="text-right font-mono">${formatNumber(entry.opening_stock)}</td>
                <td class="text-right">
                  ${entry.quantity_in > 0 ? `<span class="badge badge-in">+${formatNumber(entry.quantity_in)}</span>` : '0'}
                </td>
                <td class="text-right">
                  ${entry.quantity_out > 0 ? `<span class="badge badge-out">-${formatNumber(entry.quantity_out)}</span>` : '0'}
                </td>
                <td class="text-right font-mono">${formatNumber(entry.closing_stock)}</td>
                <td class="text-right font-mono">${entry.price ? formatCurrency(entry.price).replace(/[^0-9.,]/g, '') : '-'}</td>
                <td>${entry.reference.replace(/"/g, '&quot;')}</td>
                <td class="font-mono">${entry.document_no}</td>
                <td>${entry.type}</td>
                <td class="font-mono">${entry.movement.serial_number}</td>
                <td>${entry.movement.size}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="print-footer">
          <div>Page 1 of 1 • Total Records: ${sortedLedger.length}</div>
          <div>Generated by ${systemSettings?.company_name || 'Tire Management System'}</div>
          <div>Report ID: STOCK-LEDGER-${Date.now().toString().slice(-6)}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48 sm:w-64 mb-2" />
              <Skeleton className="h-4 w-36 sm:w-48" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-20 sm:w-24" />
            <Skeleton className="h-10 w-20 sm:w-24" />
            <Skeleton className="h-10 w-28 sm:w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <LedgerEntrySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show permission denied
  if (!hasPermission("inventory.view")) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Stock Ledger</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View tire movement history</p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            You don't have permission to view inventory movements. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/inventory">Return to Inventory</Link>
        </Button>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {tireId ? "Tire Movements" : size ? `Movements: ${size}` : "Stock Ledger"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Error loading data</p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={refreshData} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/inventory">Back to Inventory</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sortedLedger = getSortedLedger();

  return (
    <PermissionGuard permissionCode="inventory.view" action="view">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-area,
            .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
                {tireId 
                  ? "Tire Movement History" 
                  : size 
                  ? `Stock Movements: ${size}` 
                  : "Tire Stock Ledger"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">
                {tireId
                  ? "Viewing stock movements for specific tire"
                  : size
                  ? `Viewing stock movements for size: ${size}`
                  : "Complete stock movement ledger"}
              </p>
              {systemSettings?.company_name && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {systemSettings.company_name} • {currencySymbol} ({currency})
                </p>
              )}
            </div>
          </div>
          
          {/* Action Buttons - Horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            <Button variant="outline" size="sm" onClick={handlePrint} className="whitespace-nowrap">
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="outline" size="sm" onClick={refreshData} disabled={loading} className="whitespace-nowrap">
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <PermissionGuard permissionCode="inventory.view" action="view" fallback={null}>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLedger.length === 0} className="whitespace-nowrap">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Date Range Selector - Collapsible on mobile */}
        <Collapsible
          open={expandedSections.filters}
          onOpenChange={() => toggleSection('filters')}
          className="border rounded-lg sm:border-0 sm:rounded-none no-print"
        >
          <div className="flex items-center justify-between p-4 sm:hidden">
            <h2 className="text-sm font-semibold">Date Range</h2>
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
            <Card className="border-0 sm:border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Start Date</label>
                      <DatePicker
                        date={startDate}
                        onSelect={setStartDate}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">End Date</label>
                      <DatePicker
                        date={endDate}
                        onSelect={setEndDate}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <Button onClick={refreshData} disabled={loading} size="sm" className="w-full sm:w-auto">
                    <Calendar className="mr-2 h-4 w-4" />
                    Apply Date Range
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="ledger" className="flex-1 sm:flex-none">Stock Ledger</TabsTrigger>
              <TabsTrigger value="summary" className="flex-1 sm:flex-none">Summary View</TabsTrigger>
            </TabsList>
            
            {/* Filters - Collapsible on mobile */}
            <Collapsible
              open={expandedSections.filters}
              onOpenChange={() => toggleSection('filters')}
              className="sm:hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Search & Sort</span>
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
              <CollapsibleContent className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="type">Transaction Type</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="shrink-0"
                  >
                    {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Desktop filters */}
            <div className="hidden sm:flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="type">Transaction Type</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stock Ledger Tab */}
          <TabsContent value="ledger" className="space-y-4">
            <Card ref={printRef}>
              <CardHeader className="no-print pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Stock Movement Ledger</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Complete transaction history with running stock totals
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                    {formatNumber(totalEntries)} total entries
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <LedgerEntrySkeleton key={i} />
                    ))}
                  </div>
                ) : filteredLedger.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Receipt className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium">No ledger entries found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {search
                        ? "Try a different search term"
                        : "No transactions recorded in this date range"}
                    </p>
                  </div>
                ) : (
                  <div className="sm:rounded-md border">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <div className="relative overflow-auto max-h-[600px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="w-[180px]">Date</TableHead>
                              <TableHead className="w-[140px]">User Name</TableHead>
                              <TableHead className="w-[140px]">Location</TableHead>
                              <TableHead className="w-[120px] text-right">Opening</TableHead>
                              <TableHead className="w-[100px] text-right">In</TableHead>
                              <TableHead className="w-[100px] text-right">Out</TableHead>
                              <TableHead className="w-[120px] text-right">Closing</TableHead>
                              <TableHead className="w-[100px] text-right">Price</TableHead>
                              <TableHead className="w-[200px]">Reference</TableHead>
                              <TableHead className="w-[120px]">Doc No</TableHead>
                              <TableHead className="w-[140px]">Type</TableHead>
                              <TableHead className="w-[80px] text-right no-print">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedLedger.map((entry) => (
                              <TableRow key={entry.id} className="hover:bg-accent/50">
                                <TableCell className="font-medium text-xs">
                                  {formatDate(entry.date)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="truncate max-w-[100px]" title={entry.user_name}>
                                      {entry.user_name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span>{entry.location}</span>
                                  </div>
                                  {entry.movement.from_location && entry.movement.to_location && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <MapPin className="h-2 w-2 shrink-0" />
                                      <span className="truncate max-w-[100px]" title={`${entry.movement.from_location} → ${entry.movement.to_location}`}>
                                        {entry.movement.from_location} → {entry.movement.to_location}
                                      </span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  <span className="text-muted-foreground">
                                    {formatNumber(entry.opening_stock)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {entry.quantity_in > 0 ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 whitespace-nowrap">
                                      <Plus className="mr-1 h-3 w-3" />
                                      {formatNumber(entry.quantity_in)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {entry.quantity_out > 0 ? (
                                    <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 whitespace-nowrap">
                                      <Minus className="mr-1 h-3 w-3" />
                                      {formatNumber(entry.quantity_out)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                  {formatNumber(entry.closing_stock)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {entry.price ? formatCurrency(entry.price) : "-"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getTransactionIcon(entry.type)}
                                    <span className="truncate max-w-[150px]" title={entry.reference}>
                                      {entry.reference}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <span className="font-mono text-xs truncate max-w-[80px]" title={entry.document_no}>
                                      {entry.document_no}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs whitespace-nowrap", getTransactionTypeColor(entry.type))}
                                  >
                                    {entry.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right no-print">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <PermissionGuard permissionCode="inventory.view" action="view">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/inventory/${entry.movement.tire_id}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Tire
                                          </Link>
                                        </DropdownMenuItem>
                                      </PermissionGuard>
                                      {entry.movement.vehicle_id && (
                                        <PermissionGuard permissionCode="vehicle.view" action="view">
                                          <DropdownMenuItem asChild>
                                            <Link href={`/vehicles/${entry.movement.vehicle_id}`}>
                                              <Car className="mr-2 h-4 w-4" />
                                              View Vehicle
                                            </Link>
                                          </DropdownMenuItem>
                                        </PermissionGuard>
                                      )}
                                      {entry.movement.supplier_id && (
                                        <PermissionGuard permissionCode="supplier.view" action="view">
                                          <DropdownMenuItem asChild>
                                            <Link href={`/suppliers/${entry.movement.supplier_id}`}>
                                              <Building className="mr-2 h-4 w-4" />
                                              View Supplier
                                            </Link>
                                          </DropdownMenuItem>
                                        </PermissionGuard>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <Link href={`/inventory/movement?tire=${entry.movement.tire_id}`}>
                                          <History className="mr-2 h-4 w-4" />
                                          View All Movements
                                        </Link>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3 p-3">
                      {sortedLedger.map((entry) => (
                        <Card key={entry.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            {/* Header with Date and Actions */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium">{formatDate(entry.date)}</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs", getTransactionTypeColor(entry.type))}
                                >
                                  {entry.type}
                                </Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/${entry.movement.tire_id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Tire
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/movement?tire=${entry.movement.tire_id}`}>
                                      <History className="mr-2 h-4 w-4" />
                                      All Movements
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Tire Info */}
                            <div className="bg-muted/30 rounded p-3 mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono text-xs">{entry.movement.serial_number}</span>
                              </div>
                              <p className="text-sm font-medium">{entry.movement.brand} - {entry.movement.pattern}</p>
                              <p className="text-xs text-muted-foreground">{entry.movement.size}</p>
                            </div>

                            {/* Stock Movement Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                                <div className="text-xs text-muted-foreground">Opening</div>
                                <div className="font-bold text-sm">{formatNumber(entry.opening_stock)}</div>
                              </div>
                              <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded">
                                <div className="text-xs text-muted-foreground">In</div>
                                <div className="font-bold text-sm text-green-600">
                                  {entry.quantity_in > 0 ? `+${formatNumber(entry.quantity_in)}` : '0'}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded">
                                <div className="text-xs text-muted-foreground">Out</div>
                                <div className="font-bold text-sm text-red-600">
                                  {entry.quantity_out > 0 ? `-${formatNumber(entry.quantity_out)}` : '0'}
                                </div>
                              </div>
                            </div>

                            {/* Closing Stock */}
                            <div className="flex items-center justify-between p-2 bg-primary/5 rounded mb-3">
                              <span className="text-sm font-medium">Closing Stock</span>
                              <span className="text-lg font-bold">{formatNumber(entry.closing_stock)}</span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div>
                                <div className="text-xs text-muted-foreground">User</div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs truncate">{entry.user_name}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Document</div>
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-mono truncate">{entry.document_no}</span>
                                </div>
                              </div>
                              {entry.price && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Price</div>
                                  <div className="font-mono text-sm">{formatCurrency(entry.price)}</div>
                                </div>
                              )}
                            </div>

                            {/* Reference */}
                            <div className="p-2 bg-muted/30 rounded">
                              <div className="text-xs text-muted-foreground mb-1">Reference</div>
                              <div className="text-sm break-words">{entry.reference}</div>
                            </div>

                            {/* Location Info */}
                            {entry.movement.from_location && entry.movement.to_location && (
                              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {entry.movement.from_location} → {entry.movement.to_location}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              {filteredLedger.length > 0 && (
                <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4 no-print">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Showing {filteredLedger.length} of {totalEntries} entries
                      {size && ` for size: ${size}`}
                      {tireId && ` for tire: ${filteredLedger[0]?.movement.serial_number || tireId}`}
                    </div>
                    
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                              }}
                              className={cn(
                                "text-xs sm:text-sm",
                                currentPage === 1 ? "pointer-events-none opacity-50" : ""
                              )}
                            />
                          </PaginationItem>
                          
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
                              <PaginationItem key={pageNum} className="hidden xs:inline-block">
                                <PaginationLink
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(pageNum);
                                  }}
                                  isActive={currentPage === pageNum}
                                  className="text-xs sm:text-sm h-8 w-8"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                              }}
                              className={cn(
                                "text-xs sm:text-sm",
                                currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                              )}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Summary Tab - Mobile Friendly */}
          <TabsContent value="summary" className="space-y-4">
            <Collapsible
              open={expandedSections.summary}
              onOpenChange={() => toggleSection('summary')}
              className="border rounded-lg sm:border-0 sm:rounded-none"
            >
              <div className="flex items-center justify-between p-4 sm:hidden">
                <h2 className="text-sm font-semibold">Summary Overview</h2>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {expandedSections.summary ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="sm:block">
                <div className="p-4 sm:p-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Transactions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{formatNumber(totalEntries)}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          In selected range
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Qty In</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                          {formatNumber(sortedLedger.reduce((sum, entry) => sum + entry.quantity_in, 0))}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Added to stock
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Qty Out</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-red-600">
                          {formatNumber(sortedLedger.reduce((sum, entry) => sum + entry.quantity_out, 0))}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Removed from stock
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Current Stock</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">
                          {sortedLedger.length > 0 
                            ? formatNumber(sortedLedger[sortedLedger.length - 1].closing_stock)
                            : "0"}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Latest closing
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Transaction Type Distribution</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Breakdown of transaction types in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedLedger.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground">No transaction data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from(new Set(sortedLedger.map(e => e.type))).map((type) => {
                      const count = sortedLedger.filter(e => e.type === type).length;
                      const percentage = (count / sortedLedger.length) * 100;
                      const totalQty = sortedLedger
                        .filter(e => e.type === type)
                        .reduce((sum, e) => sum + e.quantity_in + e.quantity_out, 0);
                      
                      return (
                        <div key={type} className="space-y-1 sm:space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="shrink-0">{getTransactionIcon(type)}</div>
                              <span className="text-xs sm:text-sm font-medium truncate">{type}</span>
                            </div>
                            <div className="text-xs sm:text-sm font-medium whitespace-nowrap ml-2">
                              {count} txns • {totalQty} tires
                            </div>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: getTransactionTypeColor(type).includes("green") 
                                  ? "#10b981" 
                                  : getTransactionTypeColor(type).includes("red")
                                  ? "#ef4444"
                                  : "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Value Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Value Summary</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Financial impact of inventory movements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Purchase Value</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">
                      {formatCurrency(
                        sortedLedger
                          .filter(e => e.type.includes("Purchase"))
                          .reduce((sum, e) => sum + (e.price || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Retread Value</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 truncate">
                      {formatCurrency(
                        sortedLedger
                          .filter(e => e.type.includes("Retreading"))
                          .reduce((sum, e) => sum + (e.price || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 border rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">Net Inventory Value</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 truncate">
                      {formatCurrency(
                        sortedLedger.length > 0
                          ? (sortedLedger[sortedLedger.length - 1].closing_stock * 
                             (sortedLedger.find(e => e.price)?.price || 0))
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-xs text-muted-foreground border-t pt-4 space-y-1 no-print">
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
    </PermissionGuard>
  );
}