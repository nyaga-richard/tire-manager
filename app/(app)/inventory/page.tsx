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
  Eye,
  Search,
  Package,
  RefreshCw,
  Trash2,
  History,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  FileText,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Gauge,
  ChevronDown,
  ChevronUp,
  Edit,
  MoreHorizontal,
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
import AddTireModal from "@/components/add-tire-modal";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface InventoryBySize {
  size: string;
  new_count: number;
  retreaded_count: number;
  used_count: number;
  retread_candidates_count: number;
  total_value?: number;
  average_cost?: number;
}

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  pattern: string;
  type: "NEW" | "RETREADED" | "USED";
  status:
    | "IN_STORE"
    | "ON_VEHICLE"
    | "USED_STORE"
    | "AWAITING_RETREAD"
    | "AT_RETREAD_SUPPLIER"
    | "DISPOSED";
  position: string;
  purchase_date: string;
  purchase_cost: number;
  purchase_supplier: string;
  depth_remaining: number;
  last_movement_date?: string;
  vehicle_id?: number;
  vehicle_number?: string;
  current_odometer?: number;
  retread_count?: number;
}

interface DashboardStats {
  in_store: number;
  on_vehicle: number;
  used_store: number;
  awaiting_retread: number;
  at_retreader: number;
  disposed: number;
  new_tires: number;
  retreaded_tires: number;
  total_value: number;
  average_tire_age?: number;
  utilization_rate?: number;
  retread_rate?: number;
}

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
  <div className="border-b p-3 sm:p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  </div>
);

export default function InventoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [inventoryBySize, setInventoryBySize] = useState<InventoryBySize[]>([]);
  const [storeTires, setStoreTires] = useState<Tire[]>([]);
  const [retreadCandidates, setRetreadCandidates] = useState<Tire[]>([]);
  const [pendingDisposal, setPendingDisposal] = useState<Tire[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("size");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isAddTireModalOpen, setIsAddTireModalOpen] = useState(false);
  
  // Mobile collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    filters: true,
    inventoryList: true,
  });

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Check permission for inventory view
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasPermission("inventory.view")) {
      router.push("/dashboard");
      toast.error("You don't have permission to view inventory");
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("inventory.view")) {
      refreshAll();
    }
  }, [isAuthenticated, hasPermission]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("inventory.view")) {
      if (activeTab === "store") {
        fetchStoreTires(storeFilter);
      } else if (activeTab === "retread") {
        fetchRetreadCandidates();
      } else if (activeTab === "disposal") {
        fetchPendingDisposal();
      }
    }
  }, [activeTab, storeFilter, isAuthenticated, hasPermission]);

  const fetchDashboardStats = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/inventory/dashboard-stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard statistics");
    }
  };

  const fetchInventoryBySize = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/inventory/by-size`);
      const data = await response.json();
      setInventoryBySize(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching inventory by size:", error);
      toast.error("Failed to load inventory by size");
      setInventoryBySize([]);
    }
  };

  const fetchStoreTires = async (status?: string) => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/inventory/store`;
      if (status && status !== "all") {
        url += `/${status}`;
      }
      const response = await authFetch(url);
      const data = await response.json();
      setStoreTires(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching store tires:", error);
      toast.error("Failed to load store tires");
      setStoreTires([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRetreadCandidates = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/inventory/retread-candidates`);
      const data = await response.json();
      setRetreadCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching retread candidates:", error);
      toast.error("Failed to load retread candidates");
      setRetreadCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDisposal = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/inventory/pending-disposal`);
      const data = await response.json();
      setPendingDisposal(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching pending disposal:", error);
      toast.error("Failed to load pending disposals");
      setPendingDisposal([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchInventoryBySize(),
      ]);
      
      if (activeTab === "store") {
        await fetchStoreTires(storeFilter);
      } else if (activeTab === "retread") {
        await fetchRetreadCandidates();
      } else if (activeTab === "disposal") {
        await fetchPendingDisposal();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError(error instanceof Error ? error.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const handleTireAdded = () => {
    toast.success("Tire added successfully");
    refreshAll();
  };

  const handleDisposeTire = async (tireId: number) => {
    if (!hasPermission("tire.dispose")) {
      toast.error("You don't have permission to dispose tires");
      return;
    }

    if (!confirm("Are you sure you want to mark this tire for disposal?")) {
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/inventory/${tireId}/dispose`, {
        method: "POST",
        body: JSON.stringify({
          disposed_by: user?.id,
          notes: "Marked for disposal from inventory",
        }),
      });

      if (response.ok) {
        toast.success("Tire marked for disposal");
        refreshAll();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to dispose tire");
      }
    } catch (error) {
      console.error("Error disposing tire:", error);
      toast.error("Failed to dispose tire");
    }
  };

  const exportInventory = () => {
    try {
      const headers = [
        "Size",
        "New",
        "Retreaded",
        "Used",
        "Retread Candidates",
        "Total",
        "Estimated Value"
      ];

      const rows = inventoryBySize.map(item => [
        item.size,
        item.new_count,
        item.retreaded_count,
        item.used_count,
        item.retread_candidates_count,
        item.new_count + item.retreaded_count + item.used_count,
        `${currencySymbol} ${((item.new_count + item.retreaded_count + item.used_count) * (item.average_cost || 10000)).toLocaleString()}`
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Inventory exported successfully");
    } catch (error) {
      console.error("Error exporting inventory:", error);
      toast.error("Failed to export inventory");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_STORE":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "ON_VEHICLE":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "USED_STORE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "AWAITING_RETREAD":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      case "AT_RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      case "DISPOSED":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "NEW":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "RETREADED":
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800";
      case "USED":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
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

  const filteredInventory = inventoryBySize
    .filter(
      (item) =>
        item.size.toLowerCase().includes(search.toLowerCase()) ||
        item.new_count.toString().includes(search) ||
        item.retreaded_count.toString().includes(search)
    )
    .sort((a, b) => {
      if (sortBy === "size") {
        return sortOrder === "asc" 
          ? a.size.localeCompare(b.size) 
          : b.size.localeCompare(a.size);
      } else if (sortBy === "total") {
        const totalA = a.new_count + a.retreaded_count + a.used_count;
        const totalB = b.new_count + b.retreaded_count + b.used_count;
        return sortOrder === "asc" ? totalA - totalB : totalB - totalA;
      }
      return 0;
    });

  const totalTires = (stats?.in_store || 0) +
    (stats?.on_vehicle || 0) +
    (stats?.used_store || 0) +
    (stats?.awaiting_retread || 0) +
    (stats?.at_retreader || 0);

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
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-96 w-full" />
      </div>
    );
  }

  // Show permission denied
  if (!hasPermission("inventory.view")) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage tire inventory</p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            You don't have permission to view inventory. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="inventory.view" action="view">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Add Tire Modal */}
        <PermissionGuard permissionCode="tire.create" action="create">
          <AddTireModal
            isOpen={isAddTireModalOpen}
            onClose={() => setIsAddTireModalOpen(false)}
            onSuccess={handleTireAdded}
          />
        </PermissionGuard>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Inventory</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              Manage tire inventory, track retreads, and monitor disposals
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {systemSettings.company_name} • {currencySymbol} ({currency})
              </p>
            )}
          </div>
          
          {/* Action Buttons - Horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            <PermissionGuard permissionCode="inventory.view" action="view" fallback={null}>
              <Button variant="outline" size="sm" onClick={exportInventory} disabled={inventoryBySize.length === 0} className="whitespace-nowrap">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </PermissionGuard>
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading} className="whitespace-nowrap">
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <PermissionGuard permissionCode="grn.view" action="view">
              <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
                <Link href="/grns">
                  <FileText className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">View GRNs</span>
                </Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionCode="tire.create" action="create">
              <Button size="sm" onClick={() => setIsAddTireModalOpen(true)} className="whitespace-nowrap">
                <Package className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Tire</span>
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard Stats - Collapsible on mobile */}
        <Collapsible
          open={expandedSections.stats}
          onOpenChange={() => toggleSection('stats')}
          className="border rounded-lg sm:border-0 sm:rounded-none"
        >
          <div className="flex items-center justify-between p-4 sm:hidden">
            <h2 className="text-sm font-semibold">Inventory Overview</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {expandedSections.stats ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="sm:block">
            <div className="p-4 sm:p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Tires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{totalTires}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.new_tires || 0} new • {stats?.retreaded_tires || 0} retreaded
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">In Store</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats?.in_store || 0}</div>
                    <p className="text-xs text-muted-foreground">Available for installation</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {stats?.utilization_rate ? `${stats.utilization_rate}%` : '0%'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.on_vehicle || 0} on vehicles
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {formatCurrency(stats?.total_value || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Inventory value</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto pb-1 -mb-1">
            <TabsList className="inline-flex w-auto sm:grid sm:grid-cols-4 sm:w-[400px]">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 sm:px-4">Overview</TabsTrigger>
              <TabsTrigger value="store" className="text-xs sm:text-sm px-3 sm:px-4">Store</TabsTrigger>
              <TabsTrigger value="retread" className="text-xs sm:text-sm px-3 sm:px-4">Retread</TabsTrigger>
              <TabsTrigger value="disposal" className="text-xs sm:text-sm px-3 sm:px-4">Disposal</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab - Inventory by Size */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Inventory by Size</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      View tire inventory grouped by size
                    </CardDescription>
                  </div>
                  
                  {/* Filters - Collapsible on mobile */}
                  <Collapsible
                    open={expandedSections.filters}
                    onOpenChange={() => toggleSection('filters')}
                    className="sm:hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Filter & Sort</span>
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
                            <SelectItem value="size">Size</SelectItem>
                            <SelectItem value="total">Total Count</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                          className="shrink-0"
                        >
                          {sortOrder === "asc" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search sizes..."
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
                        <SelectItem value="size">Size</SelectItem>
                        <SelectItem value="total">Total Count</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </Button>
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search sizes..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {loading && activeTab === "overview" ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium">No inventory found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {search ? "Try adjusting your search criteria" : "No tires in inventory"}
                    </p>
                  </div>
                ) : (
                  <div className="sm:rounded-md border">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tire Size</TableHead>
                            <TableHead className="text-center">New</TableHead>
                            <TableHead className="text-center">Retreaded</TableHead>
                            <TableHead className="text-center">Used</TableHead>
                            <TableHead className="text-center">Retread Candidates</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Est. Value</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInventory.map((item) => {
                            const total = item.new_count + item.retreaded_count + item.used_count;
                            return (
                              <TableRow key={item.size}>
                                <TableCell className="font-medium">{item.size}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950">
                                    {item.new_count}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950">
                                    {item.retreaded_count}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950">
                                    {item.used_count}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={item.retread_candidates_count > 0 ? "bg-orange-50 dark:bg-orange-950" : ""}
                                  >
                                    {item.retread_candidates_count}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">{total}</Badge>
                                </TableCell>
                                <TableCell className="text-center font-mono text-sm">
                                  {formatCurrency(total * (item.average_cost || 10000))}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="outline" size="sm" asChild>
                                            <Link href={`/inventory/size/${encodeURIComponent(item.size)}`}>
                                              <Eye className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>View all tires</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="outline" size="sm" asChild>
                                            <Link href={`/inventory/movement?size=${encodeURIComponent(item.size)}`}>
                                              <History className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Movement history</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3 p-3">
                      {filteredInventory.map((item) => {
                        const total = item.new_count + item.retreaded_count + item.used_count;
                        return (
                          <Card key={item.size} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-medium text-base">{item.size}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    Est. Value: {formatCurrency(total * (item.average_cost || 10000))}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Total: {total}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 mb-4">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground">New</div>
                                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 mt-1">
                                    {item.new_count}
                                  </Badge>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground">Retread</div>
                                  <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950 mt-1">
                                    {item.retreaded_count}
                                  </Badge>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground">Used</div>
                                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 mt-1">
                                    {item.used_count}
                                  </Badge>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground">Candidates</div>
                                  <Badge variant="outline" className={item.retread_candidates_count > 0 ? "bg-orange-50 dark:bg-orange-950" : ""}>
                                    {item.retread_candidates_count}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                  <Link href={`/inventory/size/${encodeURIComponent(item.size)}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View All
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1" asChild>
                                  <Link href={`/inventory/movement?size=${encodeURIComponent(item.size)}`}>
                                    <History className="h-4 w-4 mr-2" />
                                    History
                                  </Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
              
              {filteredInventory.length > 0 && (
                <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Showing {filteredInventory.length} tire size{filteredInventory.length !== 1 ? 's' : ''}
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Store Tires Tab */}
          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Tires in Store</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Tires currently in storage ({storeTires.length} total)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={storeFilter} onValueChange={setStoreFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tires</SelectItem>
                        <SelectItem value="IN_STORE">New Store</SelectItem>
                        <SelectItem value="USED_STORE">Used Store</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {loading && activeTab === "store" ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </div>
                ) : storeTires.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium">No tires in store</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Add tires to your inventory
                    </p>
                    <PermissionGuard permissionCode="tire.create" action="create">
                      <Button className="mt-4" size="sm" onClick={() => setIsAddTireModalOpen(true)}>
                        <Package className="mr-2 h-4 w-4" />
                        Add Tire
                      </Button>
                    </PermissionGuard>
                  </div>
                ) : (
                  <div className="sm:rounded-md border">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial #</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Purchase Date</TableHead>
                            <TableHead>Cost ({currencySymbol})</TableHead>
                            <TableHead>Depth</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {storeTires.map((tire) => (
                            <TableRow key={tire.id}>
                              <TableCell className="font-mono text-xs">{tire.serial_number}</TableCell>
                              <TableCell>{tire.size}</TableCell>
                              <TableCell>{tire.brand}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getTypeColor(tire.type)}>
                                  {tire.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(tire.status)}>
                                  {tire.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(tire.purchase_date)}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(tire.purchase_cost)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 rounded-full"
                                      style={{ width: `${Math.min(100, (tire.depth_remaining / 12) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">{tire.depth_remaining}mm</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/inventory/${tire.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                    <PermissionGuard permissionCode="tire.edit" action="edit">
                                      <DropdownMenuItem asChild>
                                        <Link href={`/inventory/${tire.id}/edit`}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit Tire
                                        </Link>
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/inventory/movement?tire=${tire.id}`}>
                                        <History className="mr-2 h-4 w-4" />
                                        View Movement
                                      </Link>
                                    </DropdownMenuItem>
                                    <PermissionGuard permissionCode="tire.dispose" action="create">
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                        onClick={() => handleDisposeTire(tire.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Dispose Tire
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3 p-3">
                      {storeTires.map((tire) => (
                        <Card key={tire.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                    {tire.serial_number}
                                  </span>
                                  <Badge variant="outline" className={getTypeColor(tire.type)}>
                                    {tire.type}
                                  </Badge>
                                </div>
                                <h3 className="font-medium text-base truncate">{tire.size} - {tire.brand}</h3>
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
                                    <Link href={`/inventory/${tire.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <PermissionGuard permissionCode="tire.edit" action="edit">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/inventory/${tire.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                  </PermissionGuard>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/movement?tire=${tire.id}`}>
                                      <History className="mr-2 h-4 w-4" />
                                      History
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Status</div>
                                <Badge variant="outline" className={getStatusColor(tire.status)}>
                                  {tire.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Purchase Date</div>
                                <div className="text-sm">{formatDate(tire.purchase_date)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Cost</div>
                                <div className="font-mono">{formatCurrency(tire.purchase_cost)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Depth</div>
                                <div className="flex items-center gap-1">
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 rounded-full"
                                      style={{ width: `${Math.min(100, (tire.depth_remaining / 12) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-sm">{tire.depth_remaining}mm</span>
                                </div>
                              </div>
                            </div>

                            {hasPermission("tire.dispose") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => handleDisposeTire(tire.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Dispose Tire
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retread Candidates Tab */}
          <TabsContent value="retread" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Retread Candidates</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Tires eligible for retreading ({retreadCandidates.length} total)
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {loading && activeTab === "retread" ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </div>
                ) : retreadCandidates.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <RefreshCw className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium">No retread candidates</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      No tires currently eligible for retreading
                    </p>
                  </div>
                ) : (
                  <div className="sm:rounded-md border">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial #</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Remaining Depth</TableHead>
                            <TableHead>Retread Count</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {retreadCandidates.map((tire) => (
                            <TableRow key={tire.id}>
                              <TableCell className="font-mono text-xs">{tire.serial_number}</TableCell>
                              <TableCell>{tire.size}</TableCell>
                              <TableCell>{tire.brand}</TableCell>
                              <TableCell>{tire.position || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={tire.depth_remaining > 4 ? "bg-green-100 dark:bg-green-950" : "bg-orange-100 dark:bg-orange-950"}>
                                  {tire.depth_remaining} mm
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(tire.status)}>
                                  {tire.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <PermissionGuard permissionCode="tire.retread" action="create">
                                    <Button variant="outline" size="sm" asChild>
                                      <Link href={`/retreads/create/${tire.id}`}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Schedule
                                      </Link>
                                    </Button>
                                  </PermissionGuard>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/inventory/${tire.id}`}>
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

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3 p-3">
                      {retreadCandidates.map((tire) => (
                        <Card key={tire.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                    {tire.serial_number}
                                  </span>
                                </div>
                                <h3 className="font-medium">{tire.size} - {tire.brand}</h3>
                              </div>
                              <Badge variant="outline" className={getStatusColor(tire.status)}>
                                {tire.status.replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Position</div>
                                <div>{tire.position || "N/A"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Depth</div>
                                <Badge variant="outline" className={tire.depth_remaining > 4 ? "bg-green-100 dark:bg-green-950" : "bg-orange-100 dark:bg-orange-950"}>
                                  {tire.depth_remaining} mm
                                </Badge>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Retread Count</div>
                                <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                              </div>
                            </div>

                            <PermissionGuard permissionCode="tire.retread" action="create">
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href={`/retreads/create/${tire.id}`}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Schedule Retread
                                </Link>
                              </Button>
                            </PermissionGuard>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Disposal Tab */}
          <TabsContent value="disposal" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Tires Pending Disposal</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Tires marked for disposal ({pendingDisposal.length} total)
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {loading && activeTab === "disposal" ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </div>
                ) : pendingDisposal.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Trash2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium">No pending disposals</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      No tires currently pending disposal
                    </p>
                  </div>
                ) : (
                  <div className="sm:rounded-md border">
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial #</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Last Used Date</TableHead>
                            <TableHead>Days Since Last Use</TableHead>
                            <TableHead>Current Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingDisposal.map((tire) => {
                            const lastUsed = tire.last_movement_date 
                              ? new Date(tire.last_movement_date) 
                              : new Date(tire.purchase_date);
                            const today = new Date();
                            const daysSince = Math.floor((today.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
                            return (
                              <TableRow key={tire.id}>
                                <TableCell className="font-mono text-xs">{tire.serial_number}</TableCell>
                                <TableCell>{tire.size}</TableCell>
                                <TableCell>{tire.brand}</TableCell>
                                <TableCell>
                                  {tire.last_movement_date 
                                    ? formatDate(tire.last_movement_date)
                                    : formatDate(tire.purchase_date)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={daysSince > 180 ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"}
                                  >
                                    {daysSince} days
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getStatusColor(tire.status)}>
                                    {tire.status.replace("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <PermissionGuard permissionCode="tire.dispose" action="edit">
                                      <Button variant="destructive" size="sm" onClick={() => handleDisposeTire(tire.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Dispose Now
                                      </Button>
                                    </PermissionGuard>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="outline" size="sm" asChild>
                                            <Link href={`/inventory/${tire.id}`}>
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
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden space-y-3 p-3">
                      {pendingDisposal.map((tire) => {
                        const lastUsed = tire.last_movement_date 
                          ? new Date(tire.last_movement_date) 
                          : new Date(tire.purchase_date);
                        const today = new Date();
                        const daysSince = Math.floor((today.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <Card key={tire.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                      {tire.serial_number}
                                    </span>
                                  </div>
                                  <h3 className="font-medium">{tire.size} - {tire.brand}</h3>
                                </div>
                                <Badge variant="outline" className={getStatusColor(tire.status)}>
                                  {tire.status.replace("_", " ")}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                <div>
                                  <div className="text-xs text-muted-foreground">Last Used</div>
                                  <div>{tire.last_movement_date ? formatDate(tire.last_movement_date) : formatDate(tire.purchase_date)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Days Since</div>
                                  <Badge variant="outline" className={daysSince > 180 ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"}>
                                    {daysSince} days
                                  </Badge>
                                </div>
                              </div>

                              <PermissionGuard permissionCode="tire.dispose" action="edit">
                                <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDisposeTire(tire.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Dispose Now
                                </Button>
                              </PermissionGuard>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
    </PermissionGuard>
  );
}