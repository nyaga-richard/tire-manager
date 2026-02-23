"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Building,
  Phone,
  Mail,
  User,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  RefreshCw,
  Download,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Printer,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Menu,
  Info,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO, isValid } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface SupplierLedgerEntry {
  id: number;
  supplier_id: number;
  date: string;
  description: string;
  transaction_type: "PURCHASE" | "RETREAD_SERVICE" | "PAYMENT";
  amount: number;
  reference_number: string;
  created_by: string;
  created_at: string;
  running_balance?: number;
}

interface Supplier {
  id: number;
  name: string;
  type: "TIRE_SUPPLIER" | "RETREAD_SUPPLIER" | "SERVICE_PROVIDER" | "OTHER";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  created_at: string;
  ledger: SupplierLedgerEntry[];
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
}

interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  transactionType?: string;
  searchQuery: string;
}

interface ProcessedLedgerEntry extends SupplierLedgerEntry {
  running_balance: number;
  dateTime: Date;
  displayDate: string;
  sortKey: string;
}

// Mobile Transaction Card Component
const MobileTransactionCard = ({
  entry,
  formatCurrency,
  getTransactionTypeLabel,
  getTransactionTypeColor,
}: {
  entry: ProcessedLedgerEntry;
  formatCurrency: (amount: number) => string;
  getTransactionTypeLabel: (type: string) => string;
  getTransactionTypeColor: (type: string) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDebit = entry.transaction_type !== "PAYMENT";
  const isCredit = entry.transaction_type === "PAYMENT";

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getTransactionTypeColor(entry.transaction_type)}
              >
                {getTransactionTypeLabel(entry.transaction_type)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {entry.displayDate}
              </span>
            </div>
            <div className="mt-2 font-medium truncate">
              {entry.description}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 ml-2"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Amount Summary */}
        <div className="mt-3 flex justify-between items-center">
          <div>
            {isDebit && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-red-600" />
                <span className="text-xs text-muted-foreground">Debit</span>
              </div>
            )}
            {isCredit && (
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-xs text-muted-foreground">Credit</span>
              </div>
            )}
          </div>
          <div className="text-right">
            {isDebit && (
              <div className="text-red-600 dark:text-red-400 font-medium">
                {formatCurrency(entry.amount)}
              </div>
            )}
            {isCredit && (
              <div className="text-green-600 dark:text-green-400 font-medium">
                {formatCurrency(entry.amount)}
              </div>
            )}
          </div>
        </div>

        {/* Running Balance */}
        <div className="mt-2 flex justify-between items-center border-t pt-2">
          <span className="text-xs text-muted-foreground">Running Balance</span>
          <span className={`font-mono font-medium ${
            entry.running_balance > 0
              ? "text-red-600 dark:text-red-400"
              : "text-green-600 dark:text-green-400"
          }`}>
            {formatCurrency(entry.running_balance)}
          </span>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {entry.reference_number && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Reference:</span>
                <span className="text-xs font-mono">{entry.reference_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Created By:</span>
              <span className="text-xs">{entry.created_by}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Created At:</span>
              <span className="text-xs">{entry.displayDate}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to safely parse dates
const safeParseDate = (dateString: string, timeString?: string): Date => {
  try {
    if (timeString && timeString.includes(' ')) {
      const isoString = timeString.replace(' ', 'T');
      const date = parseISO(isoString);
      if (isValid(date)) return date;
    }
    
    if (dateString) {
      const date = parseISO(`${dateString}T00:00:00`);
      if (isValid(date)) return date;
    }
    
    return new Date();
  } catch {
    return new Date();
  }
};

// Helper to create sort key
const createSortKey = (dateString: string, timeString?: string): string => {
  const date = safeParseDate(dateString, timeString);
  return date.toISOString();
};

export default function SupplierLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: "",
  });
  
  // Mobile state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const supplierId = params.id;

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("supplier.view")) {
        toast.error("You don't have permission to view supplier ledgers");
        router.push("/suppliers");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (supplierId && isAuthenticated && hasPermission("supplier.view")) {
      fetchSupplierDetails();
    }
  }, [supplierId, isAuthenticated, hasPermission]);

  // Process ledger with running balance calculation
  const processedLedger = useMemo(() => {
    if (!supplier?.ledger || !Array.isArray(supplier.ledger)) return [];

    const entriesWithDates = supplier.ledger
      .map(entry => {
        const dateTime = safeParseDate(entry.date, entry.created_at);
        const sortKey = createSortKey(entry.date, entry.created_at);
        
        return {
          ...entry,
          dateTime,
          sortKey,
          displayDate: isValid(dateTime) ? format(dateTime, "MMM d, yyyy HH:mm") : "Invalid Date"
        };
      })
      .filter(entry => isValid(entry.dateTime));

    const sortedByDate = [...entriesWithDates].sort((a, b) => {
      return a.sortKey.localeCompare(b.sortKey);
    });

    let runningBalance = 0;
    const withRunningBalance = sortedByDate.map(entry => {
      if (entry.transaction_type === "PURCHASE" || entry.transaction_type === "RETREAD_SERVICE") {
        runningBalance += entry.amount;
      } else if (entry.transaction_type === "PAYMENT") {
        runningBalance -= entry.amount;
      }
      
      return {
        ...entry,
        running_balance: runningBalance,
      };
    });

    return withRunningBalance;
  }, [supplier?.ledger]);

  // Apply filters and final sorting
  const filteredLedger = useMemo(() => {
    let result = [...processedLedger];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(entry =>
        entry.description.toLowerCase().includes(query) ||
        entry.reference_number?.toLowerCase().includes(query) ||
        entry.created_by.toLowerCase().includes(query) ||
        entry.transaction_type.toLowerCase().includes(query)
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(entry => {
        const entryDate = new Date(entry.dateTime);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(entry => {
        return entry.dateTime <= endDate;
      });
    }

    if (filters.transactionType && filters.transactionType !== "ALL") {
      result = result.filter(entry =>
        entry.transaction_type === filters.transactionType
      );
    }

    result.sort((a, b) => {
      if (sortOrder === "newest") {
        return b.sortKey.localeCompare(a.sortKey);
      } else {
        return a.sortKey.localeCompare(b.sortKey);
      }
    });

    return result;
  }, [processedLedger, sortOrder, filters]);

  // Paginated ledger
  const paginatedLedger = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredLedger.slice(startIndex, endIndex);
  }, [filteredLedger, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredLedger.length / pageSize);
  }, [filteredLedger.length, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortOrder]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/accounting/suppliers/${supplierId}/ledger`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Supplier not found");
        }
        throw new Error(`Failed to fetch ledger: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const supplierResponse = await authFetch(`${API_BASE_URL}/api/suppliers/${supplierId}`);
        let supplierData = { 
          name: "Unknown Supplier", 
          type: "OTHER", 
          contact_person: "", 
          phone: "", 
          email: "", 
          address: "", 
          created_at: new Date().toISOString() 
        };
        
        if (supplierResponse.ok) {
          const supplierJson = await supplierResponse.json();
          supplierData = supplierJson;
        }
        
        const validType = (type: string): type is Supplier["type"] => {
          return ["TIRE_SUPPLIER", "RETREAD_SUPPLIER", "SERVICE_PROVIDER", "OTHER"].includes(type);
        };

        setSupplier({
          id: Number(supplierId),
          name: supplierData.name || "Unknown Supplier",
          type: validType(supplierData.type) ? supplierData.type : "OTHER",
          contact_person: supplierData.contact_person || "",
          phone: supplierData.phone || "",
          email: supplierData.email || "",
          address: supplierData.address || "",
          balance: data.current_balance || 0,
          created_at: supplierData.created_at || new Date().toISOString(),
          ledger: data.data || []
        });
      } else {
        throw new Error(data.message || "Failed to fetch ledger");
      }
    } catch (error) {
      console.error("Error fetching supplier ledger:", error);
      setError(error instanceof Error ? error.message : "Failed to load supplier ledger");
      toast.error("Failed to load supplier ledger", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSupplierTypeLabel = (type: string) => {
    switch (type) {
      case "TIRE_SUPPLIER":
        return "Tire Supplier";
      case "RETREAD_SUPPLIER":
        return "Retread Supplier";
      case "SERVICE_PROVIDER":
        return "Service Provider";
      case "OTHER":
        return "Other";
      default:
        return type;
    }
  };

  const getSupplierTypeColor = (type: string) => {
    switch (type) {
      case "TIRE_SUPPLIER":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      case "SERVICE_PROVIDER":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "OTHER":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "Purchase";
      case "RETREAD_SERVICE":
        return "Retread Service";
      case "PAYMENT":
        return "Payment";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
      case "RETREAD_SERVICE":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      case "PAYMENT":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount)).replace(currency, currencySymbol);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      const date = safeParseDate(dateString);
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
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = safeParseDate(dateString);
      return `${formatDate(dateString)} ${format(date, "HH:mm")}`;
    } catch {
      return "Invalid Date";
    }
  };

  const exportToCSV = async () => {
    if (!hasPermission("supplier.export")) {
      toast.error("You don't have permission to export supplier data");
      return;
    }

    if (!filteredLedger.length) return;

    const headers = [
      "Date",
      "Time",
      "Description",
      "Type",
      "Reference",
      "Debit",
      "Credit",
      "Balance",
      "Created By",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredLedger.map(entry => {
        const datePart = format(entry.dateTime, "yyyy-MM-dd");
        const timePart = format(entry.dateTime, "HH:mm:ss");
        
        const row = [
          datePart,
          `"${timePart}"`,
          `"${entry.description.replace(/"/g, '""')}"`,
          entry.transaction_type,
          `"${entry.reference_number || ""}"`,
          entry.transaction_type !== "PAYMENT" ? entry.amount.toFixed(2) : "",
          entry.transaction_type === "PAYMENT" ? entry.amount.toFixed(2) : "",
          entry.running_balance.toFixed(2),
          `"${entry.created_by}"`,
        ];
        return row.join(",");
      }),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${supplier?.name?.replace(/[^a-z0-9]/gi, '_')}_Ledger_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Ledger exported to CSV");
  };

  const printLedger = () => {
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${supplier?.name} - Ledger Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .supplier-info { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .debit { color: #d32f2f; }
              .credit { color: #388e3c; }
              .positive { color: #d32f2f; }
              .negative { color: #388e3c; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
              .page-info { float: right; font-size: 12px; color: #666; }
              .generated-by { margin-top: 10px; font-size: 11px; color: #666; }
              .company-info { font-size: 12px; color: #666; margin-bottom: 10px; }
              @media print {
                @page { margin: 0.5in; }
                body { font-size: 12px; }
                table { font-size: 11px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${supplier?.name} - Transaction Ledger</h1>
              <div class="company-info">${systemSettings?.company_name || 'Fleet Management System'}</div>
              <p>Report generated on ${format(new Date(), "MMM d, yyyy HH:mm")}</p>
              <p class="generated-by">Generated by: ${user?.full_name || user?.username || 'System'}</p>
            </div>
            
            <div class="supplier-info">
              <p><strong>Supplier Type:</strong> ${getSupplierTypeLabel(supplier?.type || "")}</p>
              ${supplier?.contact_person ? `<p><strong>Contact:</strong> ${supplier.contact_person}</p>` : ""}
              <p><strong>Current Balance:</strong> 
                <span class="${supplier?.balance && supplier.balance > 0 ? 'positive' : 'negative'}">
                  ${supplier?.balance && supplier.balance > 0 ? '+' : ''}${currencySymbol} ${Math.abs(supplier?.balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </p>
              <p><strong>Showing:</strong> ${filteredLedger.length} transactions (Page ${currentPage} of ${totalPages})</p>
              ${filters.searchQuery ? `<p><strong>Search:</strong> "${filters.searchQuery}"</p>` : ''}
              ${filters.startDate ? `<p><strong>From:</strong> ${formatDate(filters.startDate.toISOString())}</p>` : ''}
              ${filters.endDate ? `<p><strong>To:</strong> ${formatDate(filters.endDate.toISOString())}</p>` : ''}
              <p><strong>Sort Order:</strong> ${sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th style="text-align: right;">Debit</th>
                  <th style="text-align: right;">Credit</th>
                  <th style="text-align: right;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${paginatedLedger.map(entry => {
                  const dateTime = formatDateTime(entry.date);
                  const debitAmount = entry.transaction_type !== "PAYMENT" ? entry.amount : 0;
                  const creditAmount = entry.transaction_type === "PAYMENT" ? entry.amount : 0;
                  
                  return `
                    <tr>
                      <td>${dateTime}</td>
                      <td>${entry.description}</td>
                      <td>${getTransactionTypeLabel(entry.transaction_type)}</td>
                      <td>${entry.reference_number || "N/A"}</td>
                      <td style="text-align: right;" class="debit">
                        ${debitAmount > 0 ? `${currencySymbol} ${debitAmount.toFixed(2)}` : ""}
                      </td>
                      <td style="text-align: right;" class="credit">
                        ${creditAmount > 0 ? `${currencySymbol} ${creditAmount.toFixed(2)}` : ""}
                      </td>
                      <td style="text-align: right;" class="${entry.running_balance > 0 ? 'positive' : 'negative'}">
                        ${currencySymbol} ${Math.abs(entry.running_balance).toFixed(2)}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Total Transactions: ${filteredLedger.length} | Current Page: ${currentPage} of ${totalPages}</p>
              <p>Print Date: ${format(new Date(), "MMM d, yyyy HH:mm:ss")}</p>
              <p>Report ID: LEDGER-${supplier?.id}-${Date.now().toString().slice(-6)}</p>
              <p>Currency: ${currency} (${currencySymbol})</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const handleDateFilter = (startDate?: Date, endDate?: Date) => {
    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const handleTransactionTypeFilter = (type: string) => {
    setFilters(prev => ({ ...prev, transactionType: type }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
    });
    setIsFilterSheetOpen(false);
  };

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Show loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied - fallback if redirect doesn't happen
  if (!hasPermission("supplier.view")) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Supplier Ledger</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View supplier transaction history</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view supplier ledgers. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/suppliers">Return to Suppliers</Link>
        </Button>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/suppliers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Supplier Ledger</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View supplier transaction history</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={fetchSupplierDetails} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/suppliers">Back to Suppliers</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Supplier Not Found</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              The supplier you're looking for doesn't exist
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Supplier ID: {supplierId} not found
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/suppliers">Return to Suppliers</Link>
        </Button>
      </div>
    );
  }

  // If user has permission, render the page
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
              {supplier.name} - Ledger
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Transaction history with running balance
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
          <Button variant="outline" onClick={printLedger} size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          
          {/* Only show Export button if user has export permission */}
          {hasPermission("supplier.export") && (
            <Button variant="outline" onClick={exportToCSV} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
          
          {hasPermission("accounting.create") && (
            <Button variant="outline" asChild size="sm">
              <Link href={`/suppliers/${supplier.id}/payment`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Payment
              </Link>
            </Button>
          )}
          
          <Button variant="outline" onClick={fetchSupplierDetails} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
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
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="mr-2 h-4 w-4" />
            Menu
          </Button>
        </div>
      </div>

      {/* Desktop Filters */}
      <Card className="hidden sm:block">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={filters.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.startDate && filters.endDate
                    ? `${formatDate(filters.startDate.toISOString())} - ${formatDate(filters.endDate.toISOString())}`
                    : "Date Range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4">
                  <div className="space-y-2">
                    <div>
                      <Label>From Date</Label>
                      <CalendarComponent
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => handleDateFilter(date, filters.endDate)}
                        className="rounded-md border"
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                    <div>
                      <Label>To Date</Label>
                      <CalendarComponent
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => handleDateFilter(filters.startDate, date)}
                        className="rounded-md border"
                        disabled={(date) => date > new Date()}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select
              value={filters.transactionType || "ALL"}
              onValueChange={handleTransactionTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="PURCHASE">Purchases</SelectItem>
                <SelectItem value="RETREAD_SERVICE">Retread Services</SelectItem>
                <SelectItem value="PAYMENT">Payments</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select
                value={sortOrder}
                onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4" />
                      Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <ChevronUp className="h-4 w-4" />
                      Oldest First
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Transactions
            </SheetTitle>
            <SheetDescription>
              Apply filters to narrow down results
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={filters.searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transaction Type</Label>
              <Select
                value={filters.transactionType || "ALL"}
                onValueChange={handleTransactionTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PURCHASE">Purchases</SelectItem>
                  <SelectItem value="RETREAD_SERVICE">Retread Services</SelectItem>
                  <SelectItem value="PAYMENT">Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort Order</Label>
              <Select
                value={sortOrder}
                onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4" />
                      Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <ChevronUp className="h-4 w-4" />
                      Oldest First
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">From Date</Label>
              <CalendarComponent
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => handleDateFilter(date, filters.endDate)}
                className="rounded-md border w-full"
                disabled={(date) => date > new Date()}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">To Date</Label>
              <CalendarComponent
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => handleDateFilter(filters.startDate, date)}
                className="rounded-md border w-full"
                disabled={(date) => date > new Date()}
              />
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

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
              className="w-full justify-start"
              onClick={() => {
                printLedger();
                setIsMobileMenuOpen(false);
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Ledger
            </Button>
            
            {hasPermission("supplier.export") && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  exportToCSV();
                  setIsMobileMenuOpen(false);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            
            {hasPermission("accounting.create") && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                asChild
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href={`/suppliers/${supplier.id}/payment`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment
                </Link>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                fetchSupplierDetails();
                setIsMobileMenuOpen(false);
              }}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setIsInfoSheetOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Info className="mr-2 h-4 w-4" />
              Supplier Info
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Supplier Info Sheet */}
      <Sheet open={isInfoSheetOpen} onOpenChange={setIsInfoSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Supplier Information
            </SheetTitle>
            <SheetDescription>
              {supplier.name} details and current balance
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getSupplierTypeColor(supplier.type)}
              >
                {getSupplierTypeLabel(supplier.type)}
              </Badge>
            </div>
            
            {supplier.contact_person && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{supplier.contact_person}</span>
              </div>
            )}
            
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${supplier.phone}`} className="text-sm hover:underline">
                  {supplier.phone}
                </a>
              </div>
            )}
            
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${supplier.email}`} className="text-sm hover:underline break-all">
                  {supplier.email}
                </a>
              </div>
            )}
            
            {supplier.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{supplier.address}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-2">Current Balance</div>
              <div className={`text-2xl font-bold ${
                supplier.balance > 0 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-green-600 dark:text-green-400"
              }`}>
                {supplier.balance > 0 ? "+" : ""}
                {formatCurrency(supplier.balance)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {supplier.balance > 0 
                  ? "Amount owed to supplier"
                  : "Credit balance with supplier"}
              </div>
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added On:</span>
                <span>{formatDate(supplier.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Transactions:</span>
                <span>{supplier.ledger.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Showing:</span>
                <span>
                  {filteredLedger.length} of {supplier.ledger.length}
                </span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info Card - Desktop */}
        <Card className="hidden lg:block lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Supplier Information</CardTitle>
            <CardDescription>Supplier details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Supplier Type: </span>
              <Badge
                variant="outline"
                className={getSupplierTypeColor(supplier.type)}
              >
                {getSupplierTypeLabel(supplier.type)}
              </Badge>
            </div>
            
            {supplier.contact_person && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Contact: </span>
                  {supplier.contact_person}
                </span>
              </div>
            )}
            
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Phone: </span>
                  {supplier.phone}
                </span>
              </div>
            )}
            
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Email: </span>
                  {supplier.email}
                </span>
              </div>
            )}
            
            {supplier.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                  <span className="font-medium">Address: </span>
                  {supplier.address}
                </span>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-sm font-medium mb-2">Current Balance</div>
                <div className={`text-3xl font-bold ${
                  supplier.balance > 0 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-green-600 dark:text-green-400"
                }`}>
                  {supplier.balance > 0 ? "+" : ""}
                  {formatCurrency(supplier.balance)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {supplier.balance > 0 
                    ? "Amount owed to supplier"
                    : "Credit balance with supplier"}
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added On:</span>
                  <span>{formatDate(supplier.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transactions:</span>
                  <span>{supplier.ledger.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Showing:</span>
                  <span>
                    {filteredLedger.length} of {supplier.ledger.length} transactions
                  </span>
                </div>
                {filteredLedger.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page:</span>
                    <span>
                      {currentPage} of {totalPages}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Ledger Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Transaction History</CardTitle>
                <CardDescription>
                  {filters.searchQuery || filters.startDate || filters.endDate || filters.transactionType
                    ? `Filtered results (${filteredLedger.length} transactions)`
                    : `All transactions (${supplier.ledger.length} total)`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLedger.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium">No transactions found</h4>
                <p className="text-sm text-muted-foreground">
                  {supplier.ledger.length === 0
                    ? "Start by making a purchase or recording a payment"
                    : "Try adjusting your filters or search terms"}
                </p>
                {(filters.searchQuery || filters.startDate || filters.endDate || filters.transactionType) && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Date & Time</TableHead>
                        <TableHead className="whitespace-nowrap">Description</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Reference</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Debit</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Credit</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLedger.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium">
                              {formatDateTime(entry.date)}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap max-w-xs">
                            <div className="truncate">{entry.description}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              By: {entry.created_by}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={getTransactionTypeColor(entry.transaction_type)}
                            >
                              {getTransactionTypeLabel(entry.transaction_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {entry.reference_number || "N/A"}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap font-mono">
                            {entry.transaction_type !== "PAYMENT" ? (
                              <div className="text-red-600 dark:text-red-400 font-medium">
                                {formatCurrency(entry.amount)}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">-</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap font-mono">
                            {entry.transaction_type === "PAYMENT" ? (
                              <div className="text-green-600 dark:text-green-400 font-medium">
                                {formatCurrency(entry.amount)}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">-</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className={`font-mono font-medium ${
                              entry.running_balance > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}>
                              {formatCurrency(entry.running_balance)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Transaction Cards */}
                <div className="md:hidden space-y-3">
                  {paginatedLedger.map((entry) => (
                    <MobileTransactionCard
                      key={entry.id}
                      entry={entry}
                      formatCurrency={formatCurrency}
                      getTransactionTypeLabel={getTransactionTypeLabel}
                      getTransactionTypeColor={getTransactionTypeColor}
                    />
                  ))}
                </div>
                
                {/* Pagination - Desktop */}
                {filteredLedger.length > 0 && (
                  <>
                    {/* Desktop Pagination */}
                    <div className="hidden md:flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, filteredLedger.length)} of{" "}
                        {filteredLedger.length} entries
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={goToFirstPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronFirst className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
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
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={goToLastPage}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronLast className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Pagination */}
                    <div className="md:hidden mt-4 space-y-3">
                      <div className="text-sm text-muted-foreground text-center">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, filteredLedger.length)} of{" "}
                        {filteredLedger.length}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="h-8 px-3"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Prev
                        </Button>
                        <span className="text-sm px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="h-8 px-3"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Filter Summary */}
      <div className="sm:hidden">
        {(filters.searchQuery || filters.startDate || filters.endDate || filters.transactionType) && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {filters.searchQuery && <span>Search: "{filters.searchQuery}"</span>}
                  {filters.transactionType && filters.transactionType !== "ALL" && (
                    <span className={filters.searchQuery ? "ml-2" : ""}>
                      Type: {getTransactionTypeLabel(filters.transactionType)}
                    </span>
                  )}
                  {(filters.startDate || filters.endDate) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {filters.startDate && formatDate(filters.startDate.toISOString())}
                      {filters.startDate && filters.endDate && " - "}
                      {filters.endDate && formatDate(filters.endDate.toISOString())}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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