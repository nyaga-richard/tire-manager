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
  Download,
  RefreshCw,
  Eye,
  Plus,
  Building,
  Phone,
  Mail,
  User,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Receipt,
  AlertCircle,
  ChevronDown,
  Menu,
  X,
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
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
}

// Mobile Supplier Card Component
const MobileSupplierCard = ({
  supplier,
  getSupplierTypeColor,
  getSupplierTypeLabel,
  formatCurrency,
  formatDate,
  onViewLedger,
  hasEditPermission,
  hasCreatePermission,
  hasAccountingPermission,
  hasPOViewPermission,
  hasRetreadViewPermission,
}: {
  supplier: Supplier;
  getSupplierTypeColor: (type: string) => string;
  getSupplierTypeLabel: (type: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onViewLedger: (id: number) => void;
  hasEditPermission: boolean;
  hasCreatePermission: boolean;
  hasAccountingPermission: boolean;
  hasPOViewPermission: boolean;
  hasRetreadViewPermission: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-medium truncate">{supplier.name}</h3>
            </div>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={getSupplierTypeColor(supplier.type)}
              >
                {getSupplierTypeLabel(supplier.type)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewLedger(supplier.id)}
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

        {/* Balance */}
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Balance</div>
          <div className="flex items-center gap-2">
            {supplier.balance > 0 ? (
              <>
                <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(supplier.balance)}
                </span>
              </>
            ) : supplier.balance < 0 ? (
              <>
                <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(Math.abs(supplier.balance))}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No outstanding balance</span>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-muted-foreground">Contact Person</div>
            <div className="text-sm flex items-center gap-1">
              <User className="h-3 w-3" />
              {supplier.contact_person || "N/A"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Added On</div>
            <div className="text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(supplier.created_at)}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Contact Info */}
            {(supplier.phone || supplier.email) && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Contact Information</div>
                <div className="space-y-2">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a href={`tel:${supplier.phone}`} className="hover:underline">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <a href={`mailto:${supplier.email}`} className="hover:underline truncate">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            {supplier.address && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Address</div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                  <span>{supplier.address}</span>
                </div>
              </div>
            )}

            {/* Additional Info */}
            {(supplier.tax_id || supplier.payment_terms || supplier.credit_limit) && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Additional Information</div>
                <div className="space-y-1 text-sm">
                  {supplier.tax_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ID:</span>
                      <span>{supplier.tax_id}</span>
                    </div>
                  )}
                  {supplier.payment_terms && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Terms:</span>
                      <span>{supplier.payment_terms}</span>
                    </div>
                  )}
                  {supplier.credit_limit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Limit:</span>
                      <span>{formatCurrency(supplier.credit_limit)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {hasEditPermission && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/suppliers/${supplier.id}/edit`}>
                    <Building className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}

              {hasAccountingPermission && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/suppliers/${supplier.id}/payment`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment
                  </Link>
                </Button>
              )}

              {hasPOViewPermission && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/purchases?supplier=${supplier.id}`}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Purchases
                  </Link>
                </Button>
              )}

              {supplier.type === "RETREAD_SUPPLIER" && hasRetreadViewPermission && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/retreads?supplier=${supplier.id}`}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retreads
                  </Link>
                </Button>
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
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <div className="border-b p-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  </div>
);

export default function SuppliersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("suppliers");
  const [filterType, setFilterType] = useState<string>("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("supplier.view")) {
        toast.error("You don't have permission to view suppliers");
        router.push("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("supplier.view")) {
      fetchSuppliers();
    }
  }, [filterType, isAuthenticated, hasPermission]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${API_BASE_URL}/api/suppliers`;
      if (filterType !== "all") {
        url += `?type=${filterType}`;
      }
      
      const response = await authFetch(url);
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError(error instanceof Error ? error.message : "Failed to load suppliers");
      toast.error("Failed to load suppliers", {
        description: error instanceof Error ? error.message : "Please try again",
      });
      setSuppliers([]);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(currency, currencySymbol);
  };

  const formatDate = (dateString: string) => {
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

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = suppliers.reduce((sum, supplier) => sum + (supplier.balance || 0), 0);
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => Math.abs(s.balance || 0) > 0).length;

  const handleViewLedger = (supplierId: number) => {
    router.push(`/suppliers/${supplierId}/ledger`);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterType("all");
    setIsFilterSheetOpen(false);
  };

  // Permission checks
  const canCreate = hasPermission("supplier.create");
  const canEdit = hasPermission("supplier.edit");
  const canView = hasPermission("supplier.view");
  const canAccounting = hasPermission("accounting.create");
  const canViewPO = hasPermission("po.view");
  const canViewRetread = hasPermission("tire.retread");

  // Show loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

  // Show permission denied - fallback if redirect doesn't happen
  if (!canView) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage suppliers and track payments</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view suppliers. Please contact your administrator.
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
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage suppliers and track payments</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={fetchSuppliers} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If user has permission, render the page
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage suppliers and track payments
          </p>
          {systemSettings?.company_name && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {systemSettings.company_name} • {currencySymbol} ({currency})
            </p>
          )}
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchSuppliers} 
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          
          {canCreate && (
            <Button asChild>
              <Link href="/suppliers/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Link>
            </Button>
          )}
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

      {/* Stats Cards - Responsive Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              All supplier types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalBalance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            }`}>
              {formatCurrency(Math.abs(totalBalance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBalance > 0 ? "Amount owed" : "Credit balance"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSuppliers}
            </div>
            <p className="text-xs text-muted-foreground">
              With outstanding balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Tabs and Filters */}
      <div className="hidden sm:block">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="suppliers">All Suppliers</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="TIRE_SUPPLIER">Tire Suppliers</SelectItem>
                  <SelectItem value="RETREAD_SUPPLIER">Retread Suppliers</SelectItem>
                  <SelectItem value="SERVICE_PROVIDER">Service Providers</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search suppliers..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Suppliers Tab - Desktop */}
          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading suppliers...</p>
                    </div>
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <Building className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No suppliers found</h3>
                    <p className="text-muted-foreground mt-1">
                      {search
                        ? "Try a different search term or filter"
                        : "Get started by adding your first supplier"}
                    </p>
                    {!search && filterType === "all" && canCreate && (
                      <Button asChild className="mt-4">
                        <Link href="/suppliers/add">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Supplier
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Supplier Name</TableHead>
                          <TableHead className="whitespace-nowrap">Type</TableHead>
                          <TableHead className="whitespace-nowrap">Contact Person</TableHead>
                          <TableHead className="whitespace-nowrap">Contact Info</TableHead>
                          <TableHead className="whitespace-nowrap">Balance</TableHead>
                          <TableHead className="whitespace-nowrap">Added On</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuppliers.map((supplier) => (
                          <TableRow key={supplier.id} className="hover:bg-accent/50">
                            <TableCell className="whitespace-nowrap">
                              <div className="font-medium">{supplier.name}</div>
                              {supplier.address && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  <MapPin className="inline h-3 w-3 mr-1" />
                                  {supplier.address}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={getSupplierTypeColor(supplier.type)}
                              >
                                {getSupplierTypeLabel(supplier.type)}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {supplier.contact_person ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span>{supplier.contact_person}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="space-y-1">
                                {supplier.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{supplier.phone}</span>
                                  </div>
                                )}
                                {supplier.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm truncate max-w-[150px]">
                                      {supplier.email}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {supplier.balance > 0 ? (
                                  <>
                                    <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                      {formatCurrency(supplier.balance)}
                                    </span>
                                  </>
                                ) : supplier.balance < 0 ? (
                                  <>
                                    <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {formatCurrency(Math.abs(supplier.balance))}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">Paid</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm">
                                {formatDate(supplier.created_at)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewLedger(supplier.id)}
                                        className="h-8 w-8"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View ledger</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    
                                    <DropdownMenuItem onClick={() => handleViewLedger(supplier.id)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Ledger
                                    </DropdownMenuItem>
                                    
                                    {canEdit && (
                                      <DropdownMenuItem asChild>
                                        <Link href={`/suppliers/${supplier.id}/edit`}>
                                          <Building className="mr-2 h-4 w-4" />
                                          Edit Supplier
                                        </Link>
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {canAccounting && (
                                      <DropdownMenuItem asChild>
                                        <Link href={`/suppliers/${supplier.id}/payment`}>
                                          <CreditCard className="mr-2 h-4 w-4" />
                                          Add Payment
                                        </Link>
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuSeparator />
                                    
                                    {canViewPO && (
                                      <DropdownMenuItem asChild>
                                        <Link href={`/purchases?supplier=${supplier.id}`}>
                                          <Receipt className="mr-2 h-4 w-4" />
                                          View Purchases
                                        </Link>
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {supplier.type === "RETREAD_SUPPLIER" && canViewRetread && (
                                      <DropdownMenuItem asChild>
                                        <Link href={`/retreads?supplier=${supplier.id}`}>
                                          <RefreshCw className="mr-2 h-4 w-4" />
                                          View Retreads
                                        </Link>
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              {filteredSuppliers.length > 0 && (
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Balance: {formatCurrency(totalBalance)}
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Suppliers
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
                  type="search"
                  placeholder="Search by name, contact, email..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="TIRE_SUPPLIER">Tire Suppliers</SelectItem>
                  <SelectItem value="RETREAD_SUPPLIER">Retread Suppliers</SelectItem>
                  <SelectItem value="SERVICE_PROVIDER">Service Providers</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
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
                fetchSuppliers();
                setIsMobileMenuOpen(false);
              }}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            
            {canCreate && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                asChild
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link href="/suppliers/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Suppliers View */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading suppliers...</p>
            </div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center px-4">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No suppliers found</h3>
              <p className="text-muted-foreground mt-1">
                {search || filterType !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first supplier"}
              </p>
              {!search && filterType === "all" && canCreate && (
                <Button asChild className="mt-4 w-full">
                  <Link href="/suppliers/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Filter Summary */}
            {(search || filterType !== "all") && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {search && <span>Search: "{search}"</span>}
                      {filterType !== "all" && (
                        <span className={search ? "ml-2" : ""}>
                          Type: {getSupplierTypeLabel(filterType)}
                        </span>
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

            {/* Mobile Supplier Cards */}
            {filteredSuppliers.map((supplier) => (
              <MobileSupplierCard
                key={supplier.id}
                supplier={supplier}
                getSupplierTypeColor={getSupplierTypeColor}
                getSupplierTypeLabel={getSupplierTypeLabel}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onViewLedger={handleViewLedger}
                hasEditPermission={canEdit}
                hasCreatePermission={canCreate}
                hasAccountingPermission={canAccounting}
                hasPOViewPermission={canViewPO}
                hasRetreadViewPermission={canViewRetread}
              />
            ))}

            {/* Mobile Footer */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Balance:</span>
                  <span className={`text-lg font-bold ${
                    totalBalance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  }`}>
                    {formatCurrency(Math.abs(totalBalance))}
                  </span>
                </div>
                {systemSettings?.company_name && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {systemSettings.company_name} • {currencySymbol}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
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

// Missing Label import
const Label = ({ children, className, ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props}>
    {children}
  </label>
);