"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  Search,
  Package,
  Eye,
  History,
  Download,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Info,
  Gauge,
  DollarSign,
  TrendingDown,
  Activity,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
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
  current_odometer?: number;
  current_vehicle?: string;
  vehicle_id?: number;
  install_date?: string;
  removal_date?: string;
  installation_count: number;
  total_distance: number;
  tread_depth_new: number;
  retread_count: number;
  last_retread_date?: string;
  location?: string;
  supplier_id?: number;
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

const TireCardSkeleton = () => (
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
      <Skeleton className="h-9 w-full" />
    </CardContent>
  </Card>
);

export default function TireSizePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<string>("serial");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    retreaded: 0,
    used: 0,
    inStore: 0,
    onVehicle: 0,
    awaitingRetread: 0,
    atRetreader: 0,
    totalValue: 0,
    avgDepth: 0,
    totalDistance: 0,
    avgAge: 0,
  });

  // Mobile collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    filters: true,
    summary: true,
  });

  const size = decodeURIComponent(params.size as string);
  
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
    if (size && isAuthenticated && hasPermission("inventory.view")) {
      fetchTiresBySize();
    }
  }, [size, activeTab, isAuthenticated, hasPermission]);

  const fetchTiresBySize = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${API_BASE_URL}/api/inventory/size/${encodeURIComponent(size)}`;
      if (activeTab !== "all") {
        url += `?status=${activeTab}`;
      }
      
      const response = await authFetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tires: ${response.status}`);
      }
      
      const data = await response.json();
      const tireList = Array.isArray(data) ? data : [];
      setTires(tireList);
      calculateStats(tireList);
    } catch (error) {
      console.error("Error fetching tires:", error);
      setError(error instanceof Error ? error.message : "Failed to load tires");
      toast.error("Failed to load tires");
      setTires([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tireList: Tire[]) => {
    const totalValue = tireList.reduce((sum, tire) => sum + tire.purchase_cost, 0);
    const totalDepth = tireList.reduce((sum, tire) => sum + tire.depth_remaining, 0);
    const totalDistance = tireList.reduce((sum, tire) => sum + tire.total_distance, 0);
    
    // Calculate average age in days
    const now = new Date();
    const totalAge = tireList.reduce((sum, tire) => {
      const purchaseDate = new Date(tire.purchase_date);
      const ageInDays = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + ageInDays;
    }, 0);

    const stats = {
      total: tireList.length,
      new: tireList.filter((t) => t.type === "NEW").length,
      retreaded: tireList.filter((t) => t.type === "RETREADED").length,
      used: tireList.filter((t) => t.type === "USED").length,
      inStore: tireList.filter((t) => t.status === "IN_STORE").length,
      onVehicle: tireList.filter((t) => t.status === "ON_VEHICLE").length,
      awaitingRetread: tireList.filter(
        (t) => t.status === "AWAITING_RETREAD"
      ).length,
      atRetreader: tireList.filter(
        (t) => t.status === "AT_RETREAD_SUPPLIER"
      ).length,
      totalValue,
      avgDepth: tireList.length > 0 ? totalDepth / tireList.length : 0,
      totalDistance,
      avgAge: tireList.length > 0 ? totalAge / tireList.length : 0,
    };
    setStats(stats);
  };

  const refreshData = () => {
    fetchTiresBySize();
  };

  const handleDeleteTire = async (tireId: number) => {
    if (!hasPermission("tire.delete")) {
      toast.error("You don't have permission to delete tires");
      return;
    }

    if (!confirm("Are you sure you want to delete this tire? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/inventory/${tireId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Tire deleted successfully");
        fetchTiresBySize();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tire");
      }
    } catch (error) {
      console.error("Error deleting tire:", error);
      toast.error("Failed to delete tire");
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
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

  const formatDistance = (distance?: number) => {
    if (!distance) return "N/A";
    return distance.toLocaleString() + " km";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const filteredTires = tires
    .filter(
      (tire) =>
        tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
        tire.brand.toLowerCase().includes(search.toLowerCase()) ||
        tire.pattern.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "serial") {
        return sortOrder === "asc" 
          ? a.serial_number.localeCompare(b.serial_number)
          : b.serial_number.localeCompare(a.serial_number);
      } else if (sortBy === "brand") {
        return sortOrder === "asc"
          ? a.brand.localeCompare(b.brand)
          : b.brand.localeCompare(a.brand);
      } else if (sortBy === "depth") {
        return sortOrder === "asc"
          ? a.depth_remaining - b.depth_remaining
          : b.depth_remaining - a.depth_remaining;
      } else if (sortBy === "distance") {
        return sortOrder === "asc"
          ? a.total_distance - b.total_distance
          : b.total_distance - a.total_distance;
      }
      return 0;
    });

  const exportToCSV = () => {
    if (!hasPermission("inventory.export")) {
      toast.error("You don't have permission to export inventory");
      return;
    }

    const headers = [
      "Serial Number",
      "Brand",
      "Pattern",
      "Type",
      "Status",
      "Position",
      "Location",
      "Purchase Date",
      `Purchase Cost (${currencySymbol})`,
      "Supplier",
      "Depth Remaining (mm)",
      "Installation Count",
      `Total Distance (km)`,
      "Retread Count",
      "Last Retread Date",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredTires.map((tire) =>
        [
          tire.serial_number,
          tire.brand,
          tire.pattern,
          tire.type,
          tire.status,
          tire.position || "N/A",
          tire.location || "N/A",
          formatDate(tire.purchase_date),
          tire.purchase_cost,
          tire.purchase_supplier,
          tire.depth_remaining,
          tire.installation_count,
          tire.total_distance,
          tire.retread_count,
          formatDate(tire.last_retread_date),
        ].map(cell => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tires-${size.replace(/\//g, "-")}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("CSV export started");
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-48 sm:w-64 mb-2" />
            <Skeleton className="h-4 w-36 sm:w-48" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-20 sm:w-24" />
            <Skeleton className="h-10 w-20 sm:w-24" />
            <Skeleton className="h-10 w-28 sm:w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tire Size</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View tires by size</p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            You don't have permission to view inventory. Please contact your administrator.
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{size}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Tires of this size</p>
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

  return (
    <PermissionGuard permissionCode="inventory.view" action="view">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{size}</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              All tires of size {size} in inventory
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {systemSettings.company_name} • {currencySymbol} ({currency})
              </p>
            )}
          </div>
          
          {/* Action Buttons - Horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            <Button variant="outline" size="sm" onClick={refreshData} disabled={loading} className="whitespace-nowrap">
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <PermissionGuard permissionCode="inventory.view" action="view" fallback={null}>
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredTires.length === 0} className="whitespace-nowrap">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionCode="tire.create" action="create">
              <Button size="sm" asChild className="whitespace-nowrap">
                <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Tire</span>
                </Link>
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Overview - Collapsible on mobile */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Tires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.new} new • {stats.retreaded} retreaded
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">In Store</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.inStore}</div>
                    <p className="text-xs text-muted-foreground">Available for installation</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">On Vehicles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stats.onVehicle}</div>
                    <p className="text-xs text-muted-foreground">Currently in use</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Retread Queue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {stats.awaitingRetread + stats.atRetreader}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting or at retreader</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">
                      {formatCurrency(stats.totalValue)}
                    </div>
                    <p className="text-xs text-muted-foreground">{stats.total} tires</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tabs - Scrollable on mobile */}
            <div className="overflow-x-auto pb-1 -mb-1">
              <TabsList className="inline-flex w-auto sm:grid sm:grid-cols-5 sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-3 sm:px-4">All</TabsTrigger>
                <TabsTrigger value="IN_STORE" className="text-xs sm:text-sm px-3 sm:px-4">In Store</TabsTrigger>
                <TabsTrigger value="ON_VEHICLE" className="text-xs sm:text-sm px-3 sm:px-4">On Vehicle</TabsTrigger>
                <TabsTrigger value="USED_STORE" className="text-xs sm:text-sm px-3 sm:px-4">Used Store</TabsTrigger>
                <TabsTrigger value="AWAITING_RETREAD" className="text-xs sm:text-sm px-3 sm:px-4">Retread</TabsTrigger>
              </TabsList>
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
                      <SelectItem value="serial">Serial</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                      <SelectItem value="depth">Depth</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
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
                    placeholder="Search tires..."
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
                  <SelectItem value="serial">Serial</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="depth">Depth</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
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
                  placeholder="Search tires..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <TireCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredTires.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium">No tires found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {search
                        ? "Try a different search term"
                        : `No tires found with status: ${activeTab.replace("_", " ")}`}
                    </p>
                    {activeTab === "all" && (
                      <PermissionGuard permissionCode="tire.create" action="create">
                        <Button className="mt-4" size="sm" asChild>
                          <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Tire
                          </Link>
                        </Button>
                      </PermissionGuard>
                    )}
                  </div>
                ) : (
                  <div className="sm:rounded-md border">
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial #</TableHead>
                            <TableHead>Brand & Pattern</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Position/Vehicle</TableHead>
                            <TableHead>Depth</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Retreads</TableHead>
                            <TableHead>Purchase Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTires.map((tire) => (
                            <TableRow key={tire.id} className="hover:bg-accent/50">
                              <TableCell className="font-mono font-medium text-xs">
                                {tire.serial_number}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{tire.brand}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {tire.pattern}
                                  </div>
                                </div>
                              </TableCell>
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
                              <TableCell>
                                {tire.status === "ON_VEHICLE" ? (
                                  <div>
                                    <div className="font-medium text-xs">
                                      {tire.position || "N/A"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {tire.current_vehicle || "Unknown"}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {tire.position || "N/A"}
                                  </span>
                                )}
                                {tire.location && tire.status !== "ON_VEHICLE" && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {tire.location}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="relative w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="absolute h-full rounded-full bg-green-500 dark:bg-green-600"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (tire.depth_remaining / (tire.tread_depth_new || 12)) * 100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium">
                                    {tire.depth_remaining}mm
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">
                                {tire.total_distance ? (
                                  <div>
                                    <div>{formatDistance(tire.total_distance)}</div>
                                    {tire.installation_count > 1 && (
                                      <div className="text-xs text-muted-foreground">
                                        {tire.installation_count} installs
                                      </div>
                                    )}
                                  </div>
                                ) : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {tire.retread_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                {formatDate(tire.purchase_date)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
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
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/inventory/movement?tire=${tire.id}`}>
                                            <History className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Movement history</p>
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
                                      
                                      <PermissionGuard permissionCode="tire.edit" action="edit">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/inventory/${tire.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Tire
                                          </Link>
                                        </DropdownMenuItem>
                                      </PermissionGuard>
                                      
                                      <PermissionGuard permissionCode="tire.assign" action="create">
                                        {tire.status === "IN_STORE" && (
                                          <DropdownMenuItem asChild>
                                            <Link href={`/tires/assign/${tire.id}`}>
                                              <Package className="mr-2 h-4 w-4" />
                                              Assign to Vehicle
                                            </Link>
                                          </DropdownMenuItem>
                                        )}
                                      </PermissionGuard>
                                      
                                      <PermissionGuard permissionCode="tire.assign" action="delete">
                                        {tire.status === "ON_VEHICLE" && (
                                          <DropdownMenuItem asChild>
                                            <Link href={`/tires/remove/${tire.id}?vehicle=${tire.vehicle_id}`}>
                                              <Package className="mr-2 h-4 w-4" />
                                              Remove from Vehicle
                                            </Link>
                                          </DropdownMenuItem>
                                        )}
                                      </PermissionGuard>
                                      
                                      <PermissionGuard permissionCode="tire.retread" action="create">
                                        {(tire.status === "USED_STORE" ||
                                          tire.status === "ON_VEHICLE") &&
                                          tire.depth_remaining <= 4 && (
                                            <DropdownMenuItem asChild>
                                              <Link href={`/retreads/create/${tire.id}`}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Schedule Retread
                                              </Link>
                                            </DropdownMenuItem>
                                          )}
                                      </PermissionGuard>
                                      
                                      <PermissionGuard permissionCode="tire.delete" action="delete">
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                          onClick={() => handleDeleteTire(tire.id)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Tire
                                        </DropdownMenuItem>
                                      </PermissionGuard>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    {filteredTires.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium">No tires found</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {search
                            ? "Try a different search term"
                            : `No tires found with status: ${activeTab.replace("_", " ")}`}
                        </p>
                        {activeTab === "all" && (
                          <PermissionGuard permissionCode="tire.create" action="create">
                            <Button className="mt-4" size="sm" asChild>
                              <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Tire
                              </Link>
                            </Button>
                          </PermissionGuard>
                        )}
                      </div>
                    ) : (
                      <div className="sm:rounded-md border">
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Serial #</TableHead>
                                <TableHead>Brand & Pattern</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Position/Vehicle</TableHead>
                                <TableHead>Depth</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Retreads</TableHead>
                                <TableHead>Purchase Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTires.map((tire) => (
                                <TableRow key={tire.id} className="hover:bg-accent/50">
                                  <TableCell className="font-mono font-medium text-xs">
                                    {tire.serial_number}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{tire.brand}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {tire.pattern}
                                      </div>
                                    </div>
                                  </TableCell>
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
                                  <TableCell>
                                    {tire.status === "ON_VEHICLE" ? (
                                      <div>
                                        <div className="font-medium text-xs">
                                          {tire.position || "N/A"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {tire.current_vehicle || "Unknown"}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {tire.position || "N/A"}
                                      </span>
                                    )}
                                    {tire.location && tire.status !== "ON_VEHICLE" && (
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate max-w-[100px]" title={tire.location}>
                                          {tire.location}
                                        </span>
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="relative w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                          className="absolute h-full rounded-full bg-green-500 dark:bg-green-600"
                                          style={{
                                            width: `${Math.min(
                                              100,
                                              (tire.depth_remaining / (tire.tread_depth_new || 12)) * 100
                                            )}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium">
                                        {tire.depth_remaining}mm
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {tire.total_distance ? (
                                      <div>
                                        <div>{formatDistance(tire.total_distance)}</div>
                                        {tire.installation_count > 1 && (
                                          <div className="text-xs text-muted-foreground">
                                            {tire.installation_count} installs
                                          </div>
                                        )}
                                      </div>
                                    ) : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {tire.retread_count}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {formatDate(tire.purchase_date)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
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
                                      
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" asChild>
                                              <Link href={`/inventory/movement?tire=${tire.id}`}>
                                                <History className="h-4 w-4" />
                                              </Link>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Movement history</p>
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
                                          
                                          <PermissionGuard permissionCode="tire.edit" action="edit">
                                            <DropdownMenuItem asChild>
                                              <Link href={`/inventory/${tire.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Tire
                                              </Link>
                                            </DropdownMenuItem>
                                          </PermissionGuard>
                                          
                                          <PermissionGuard permissionCode="tire.assign" action="create">
                                            {tire.status === "IN_STORE" && (
                                              <DropdownMenuItem asChild>
                                                <Link href={`/tires/assign/${tire.id}`}>
                                                  <Package className="mr-2 h-4 w-4" />
                                                  Assign to Vehicle
                                                </Link>
                                              </DropdownMenuItem>
                                            )}
                                          </PermissionGuard>
                                          
                                          <PermissionGuard permissionCode="tire.assign" action="delete">
                                            {tire.status === "ON_VEHICLE" && (
                                              <DropdownMenuItem asChild>
                                                <Link href={`/tires/remove/${tire.id}?vehicle=${tire.vehicle_id}`}>
                                                  <Package className="mr-2 h-4 w-4" />
                                                  Remove from Vehicle
                                                </Link>
                                              </DropdownMenuItem>
                                            )}
                                          </PermissionGuard>
                                          
                                          <PermissionGuard permissionCode="tire.retread" action="create">
                                            {(tire.status === "USED_STORE" ||
                                              tire.status === "ON_VEHICLE") &&
                                              tire.depth_remaining <= 4 && (
                                                <DropdownMenuItem asChild>
                                                  <Link href={`/retreads/create/${tire.id}`}>
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Schedule Retread
                                                  </Link>
                                                </DropdownMenuItem>
                                              )}
                                          </PermissionGuard>
                                          
                                          <PermissionGuard permissionCode="tire.delete" action="delete">
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                              onClick={() => handleDeleteTire(tire.id)}
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Delete Tire
                                            </DropdownMenuItem>
                                          </PermissionGuard>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Cards - IMPROVED VERSION */}
                        <div className="sm:hidden space-y-3 p-3">
                          {filteredTires.map((tire) => (
                            <Card key={tire.id} className="overflow-hidden hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                {/* Header with Serial, Type and Actions */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded font-medium">
                                        {tire.serial_number}
                                      </span>
                                      <Badge variant="outline" className={cn("text-xs", getTypeColor(tire.type))}>
                                        {tire.type}
                                      </Badge>
                                      <Badge variant="outline" className={cn("text-xs", getStatusColor(tire.status))}>
                                        {tire.status.replace("_", " ")}
                                      </Badge>
                                    </div>
                                    <h3 className="font-semibold text-base truncate">{tire.brand}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{tire.pattern} • {tire.size}</p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 shrink-0 ml-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/inventory/${tire.id}`}>
                                          <Eye className="mr-2 h-4 w-4" />
                                          View Details
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/inventory/movement?tire=${tire.id}`}>
                                          <History className="mr-2 h-4 w-4" />
                                          Movement History
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
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  <div className="bg-muted/30 rounded p-2 text-center">
                                    <div className="text-xs text-muted-foreground">Depth</div>
                                    <div className="font-bold text-sm">{tire.depth_remaining}mm</div>
                                    <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                      <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            (tire.depth_remaining / (tire.tread_depth_new || 12)) * 100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="bg-muted/30 rounded p-2 text-center">
                                    <div className="text-xs text-muted-foreground">Distance</div>
                                    <div className="font-bold text-sm truncate" title={formatDistance(tire.total_distance)}>
                                      {tire.total_distance ? `${Math.round(tire.total_distance / 1000)}k km` : 'N/A'}
                                    </div>
                                    {tire.installation_count > 0 && (
                                      <div className="text-xs text-muted-foreground">
                                        {tire.installation_count} installs
                                      </div>
                                    )}
                                  </div>
                                  <div className="bg-muted/30 rounded p-2 text-center">
                                    <div className="text-xs text-muted-foreground">Retreads</div>
                                    <div className="font-bold text-sm">{tire.retread_count}</div>
                                    {tire.last_retread_date && (
                                      <div className="text-xs text-muted-foreground truncate" title={formatDate(tire.last_retread_date)}>
                                        {formatDate(tire.last_retread_date)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <div>
                                      <div className="text-xs text-muted-foreground">Purchase</div>
                                      <div className="text-xs font-medium">{formatDate(tire.purchase_date)}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
                                    <div>
                                      <div className="text-xs text-muted-foreground">Cost</div>
                                      <div className="text-xs font-mono font-medium">{formatCurrency(tire.purchase_cost)}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Conditional Location/Position Info */}
                                {tire.status === "ON_VEHICLE" ? (
                                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2 mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        <span className="font-medium">Position: {tire.position || "N/A"}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate" title={tire.current_vehicle}>
                                        {tire.current_vehicle || "Unknown"}
                                      </div>
                                    </div>
                                  </div>
                                ) : tire.location && (
                                  <div className="bg-muted/30 rounded p-2 mb-3">
                                    <div className="flex items-center gap-1 text-xs">
                                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                      <span className="truncate" title={tire.location}>{tire.location}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                  {tire.status === "IN_STORE" && hasPermission("tire.assign") && (
                                    <Button size="sm" className="w-full" asChild>
                                      <Link href={`/tires/assign/${tire.id}`}>
                                        <Package className="mr-2 h-4 w-4" />
                                        Assign to Vehicle
                                      </Link>
                                    </Button>
                                  )}

                                  {tire.status === "ON_VEHICLE" && hasPermission("tire.assign") && (
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                      <Link href={`/tires/remove/${tire.id}?vehicle=${tire.vehicle_id}`}>
                                        <Package className="mr-2 h-4 w-4" />
                                        Remove from Vehicle
                                      </Link>
                                    </Button>
                                  )}

                                  {tire.status === "USED_STORE" && tire.depth_remaining <= 4 && hasPermission("tire.retread") && (
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                      <Link href={`/retreads/create/${tire.id}`}>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Schedule Retread
                                      </Link>
                                    </Button>
                                  )}

                                  {hasPermission("tire.delete") && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                      onClick={() => handleDeleteTire(tire.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Tire
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              {filteredTires.length > 0 && (
                <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Showing {filteredTires.length} of {tires.length} tires
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <span>{stats.inStore} in store</span>
                      <span className="hidden xs:inline">•</span>
                      <span>{stats.onVehicle} on vehicles</span>
                      <span className="hidden xs:inline">•</span>
                      <span>Value: {formatCurrency(stats.totalValue)}</span>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions & Summary - Collapsible on mobile */}
        <Collapsible
          open={expandedSections.summary}
          onOpenChange={() => toggleSection('summary')}
          className="border rounded-lg lg:border-0 lg:rounded-none"
        >
          <div className="flex items-center justify-between p-4 lg:hidden">
            <h2 className="text-sm font-semibold">Quick Actions & Summary</h2>
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
          <CollapsibleContent className="lg:block">
            <div className="p-4 lg:p-0">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <PermissionGuard permissionCode="tire.create" action="create">
                      <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                        <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                          <Package className="mr-2 h-4 w-4" />
                          Add Tire of This Size
                        </Link>
                      </Button>
                    </PermissionGuard>
                    
                    <PermissionGuard permissionCode="po.create" action="create">
                      <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                        <Link href={`/purchases/new-purchase?size=${encodeURIComponent(size)}`}>
                          <Package className="mr-2 h-4 w-4" />
                          Purchase Tires
                        </Link>
                      </Button>
                    </PermissionGuard>
                    
                    <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                      <Link href={`/inventory/movement?size=${encodeURIComponent(size)}`}>
                        <History className="mr-2 h-4 w-4" />
                        View Movement History
                      </Link>
                    </Button>

                    <Button variant="outline" className="w-full justify-start" size="sm" onClick={exportToCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Export to CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Size Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium mb-2">Status Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm">In Store</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 sm:w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 dark:bg-green-600"
                                  style={{
                                    width: `${stats.total > 0 ? (stats.inStore / stats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-medium min-w-[30px] sm:min-w-[40px] text-right">
                                {stats.inStore}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm">On Vehicle</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 sm:w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 dark:bg-blue-600"
                                  style={{
                                    width: `${stats.total > 0 ? (stats.onVehicle / stats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-medium min-w-[30px] sm:min-w-[40px] text-right">
                                {stats.onVehicle}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm">Retread Queue</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 sm:w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-500 dark:bg-orange-600"
                                  style={{
                                    width: `${stats.total > 0 ? ((stats.awaitingRetread + stats.atRetreader) / stats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-medium min-w-[30px] sm:min-w-[40px] text-right">
                                {stats.awaitingRetread + stats.atRetreader}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm">Used Store</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 sm:w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-500 dark:bg-yellow-600"
                                  style={{
                                    width: `${stats.total > 0 ? (stats.used / stats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm font-medium min-w-[30px] sm:min-w-[40px] text-right">
                                {stats.used}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm font-medium">Total Value:</span>
                          <span className="text-base sm:text-lg font-bold">
                            {formatCurrency(stats.totalValue)}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Based on purchase cost • Avg. {formatCurrency(stats.total > 0 ? stats.totalValue / stats.total : 0)} per tire
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Total Distance</p>
                          <p className="text-xs sm:text-sm font-bold truncate">{formatNumber(Math.round(stats.totalDistance))} km</p>
                        </div>
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Avg. Depth</p>
                          <p className="text-xs sm:text-sm font-bold">{stats.avgDepth.toFixed(1)} mm</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

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