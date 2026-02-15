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
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show permission denied
  if (!hasPermission("inventory.view")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tire Size</h1>
            <p className="text-muted-foreground">View tires by size</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view inventory. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/inventory">Return to Inventory</Link>
        </Button>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{size}</h1>
            <p className="text-muted-foreground">Tires of this size</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/inventory">Back to Inventory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="inventory.view" action="view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{size}</h1>
            <p className="text-muted-foreground">
              All tires of size {size} in inventory
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1">
                {systemSettings.company_name} • Currency: {currencySymbol} ({currency})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshData} disabled={loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <PermissionGuard permissionCode="inventory.view" action="view" fallback={null}>
              <Button variant="outline" onClick={exportToCSV} disabled={filteredTires.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionCode="tire.create" action="create">
              <Button asChild>
                <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                  <Package className="mr-2 h-4 w-4" />
                  Add Tire
                </Link>
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tires</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.new} new • {stats.retreaded} retreaded • {stats.used} used
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Store</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inStore}</div>
              <p className="text-xs text-muted-foreground">
                Available for installation
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Vehicles</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onVehicle}</div>
              <p className="text-xs text-muted-foreground">
                Currently in use
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retread Queue</CardTitle>
              <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.awaitingRetread + stats.atRetreader}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting or at retreader
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total} tires
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="IN_STORE">In Store</TabsTrigger>
              <TabsTrigger value="ON_VEHICLE">On Vehicle</TabsTrigger>
              <TabsTrigger value="USED_STORE">Used Store</TabsTrigger>
              <TabsTrigger value="AWAITING_RETREAD">Retread</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
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
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading tires...</p>
                    </div>
                  </div>
                ) : filteredTires.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No tires found</h3>
                    <p className="text-muted-foreground mt-1">
                      {search
                        ? "Try a different search term"
                        : `No tires found with status: ${activeTab.replace("_", " ")}`}
                    </p>
                    {activeTab === "all" && (
                      <PermissionGuard permissionCode="tire.create" action="create">
                        <Button className="mt-4" asChild>
                          <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Tire
                          </Link>
                        </Button>
                      </PermissionGuard>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
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
                              <Badge
                                variant="outline"
                                className={getTypeColor(tire.type)}
                              >
                                {tire.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusColor(tire.status)}
                              >
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
                                    {tire.current_vehicle || "Unknown Vehicle"}
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
                                        <Link
                                          href={`/inventory/movement?tire=${tire.id}`}
                                        >
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
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
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
                                          <Link
                                            href={`/tires/remove/${tire.id}?vehicle=${tire.vehicle_id}`}
                                          >
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
                                            <Link
                                              href={`/retreads/create/${tire.id}`}
                                            >
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
                )}
              </CardContent>
              {filteredTires.length > 0 && (
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredTires.length} of {tires.length} tires
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{stats.inStore} in store</span>
                      <span>•</span>
                      <span>{stats.onVehicle} on vehicles</span>
                      <span>•</span>
                      <span>Value: {formatCurrency(stats.totalValue)}</span>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PermissionGuard permissionCode="tire.create" action="create">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                    <Package className="mr-2 h-4 w-4" />
                    Add Tire of This Size
                  </Link>
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permissionCode="po.create" action="create">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/purchases/new-purchase?size=${encodeURIComponent(size)}`}>
                    <Package className="mr-2 h-4 w-4" />
                    Purchase Tires
                  </Link>
                </Button>
              </PermissionGuard>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/inventory/movement?size=${encodeURIComponent(size)}`}>
                  <History className="mr-2 h-4 w-4" />
                  View Movement History
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Size Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Status Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In Store</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 dark:bg-green-600"
                            style={{
                              width: `${stats.total > 0 ? (stats.inStore / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[40px] text-right">
                          {stats.inStore}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">On Vehicle</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 dark:bg-blue-600"
                            style={{
                              width: `${stats.total > 0 ? (stats.onVehicle / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[40px] text-right">
                          {stats.onVehicle}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Retread Queue</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 dark:bg-orange-600"
                            style={{
                              width: `${stats.total > 0 ? ((stats.awaitingRetread + stats.atRetreader) / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[40px] text-right">
                          {stats.awaitingRetread + stats.atRetreader}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Used Store</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 dark:bg-yellow-600"
                            style={{
                              width: `${stats.total > 0 ? (stats.used / stats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[40px] text-right">
                          {stats.used}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Value:</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(stats.totalValue)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on purchase cost • Avg. {formatCurrency(stats.total > 0 ? stats.totalValue / stats.total : 0)} per tire
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">Total Distance</p>
                    <p className="text-sm font-bold">{formatNumber(Math.round(stats.totalDistance))} km</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="text-xs text-muted-foreground">Avg. Depth</p>
                    <p className="text-sm font-bold">{stats.avgDepth.toFixed(1)} mm</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          Logged in as: {user?.full_name || user?.username} • Role: {user?.role}
          {systemSettings?.company_name && ` • ${systemSettings.company_name}`}
        </div>
      </div>
    </PermissionGuard>
  );
}


