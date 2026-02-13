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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface InventoryBySize {
  size: string;
  new_count: number;
  retreaded_count: number;
  used_count: number;
  retread_candidates_count: number;
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
}

export default function InventoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
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
  const [isAddTireModalOpen, setIsAddTireModalOpen] = useState(false);

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
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const filteredInventory = inventoryBySize.filter(
    (item) =>
      item.size.toLowerCase().includes(search.toLowerCase()) ||
      item.new_count.toString().includes(search) ||
      item.retreaded_count.toString().includes(search)
  );

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">Manage tire inventory</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view inventory. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="inventory.view" action="view">
      <div className="space-y-6">
        {/* Add Tire Modal */}
        <PermissionGuard permissionCode="tire.create" action="create">
          <AddTireModal
            isOpen={isAddTireModalOpen}
            onClose={() => setIsAddTireModalOpen(false)}
            onSuccess={handleTireAdded}
          />
        </PermissionGuard>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">
              Manage tire inventory, track retreads, and monitor disposals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshAll} disabled={loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <PermissionGuard permissionCode="grn.view" action="view">
              <Button variant="outline" asChild>
                <Link href="/grns">
                  <FileText className="mr-2 h-4 w-4" />
                  View GRNs
                </Link>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionCode="tire.create" action="create">
              <Button onClick={() => setIsAddTireModalOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                Add Tire
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tires</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.in_store || 0) +
                  (stats?.on_vehicle || 0) +
                  (stats?.used_store || 0) +
                  (stats?.awaiting_retread || 0) +
                  (stats?.at_retreader || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.new_tires || 0} new • {stats?.retreaded_tires || 0}{" "}
                retreaded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Store</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.in_store || 0}</div>
              <p className="text-xs text-muted-foreground">
                Available for installation
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retread Queue</CardTitle>
              <RefreshCw className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.awaiting_retread || 0) + (stats?.at_retreader || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting or at retreader
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.total_value || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Inventory value</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="retread">Retread</TabsTrigger>
            <TabsTrigger value="disposal">Disposal</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Inventory by Size */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory by Size</CardTitle>
                    <CardDescription>
                      View tire inventory grouped by size
                    </CardDescription>
                  </div>
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
              </CardHeader>
              <CardContent>
                {loading && activeTab === "overview" ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading inventory...</p>
                    </div>
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No inventory found</h3>
                    <p className="text-muted-foreground">
                      {search ? "Try adjusting your search criteria" : "No tires in inventory"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tire Size</TableHead>
                          <TableHead className="text-center">New</TableHead>
                          <TableHead className="text-center">Retreaded</TableHead>
                          <TableHead className="text-center">Used</TableHead>
                          <TableHead className="text-center">
                            Retread Candidates
                          </TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const total =
                            item.new_count +
                            item.retreaded_count +
                            item.used_count;
                          return (
                            <TableRow key={item.size}>
                              <TableCell className="font-medium">
                                {item.size}
                              </TableCell>
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
                                  className={
                                    item.retread_candidates_count > 0
                                      ? "bg-orange-50 dark:bg-orange-950"
                                      : ""
                                  }
                                >
                                  {item.retread_candidates_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{total}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
                                          <Link
                                            href={`/inventory/size/${encodeURIComponent(
                                              item.size
                                            )}`}
                                          >
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
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
                                          <Link
                                            href={`/inventory/movement?size=${encodeURIComponent(
                                              item.size
                                            )}`}
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
              {filteredInventory.length > 0 && (
                <CardFooter className="border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredInventory.length} tire sizes
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Store Tires Tab */}
          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tires in Store</CardTitle>
                    <CardDescription>
                      Tires currently in storage ({storeTires.length} total)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={storeFilter} onValueChange={setStoreFilter}>
                      <SelectTrigger className="w-[180px]">
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
              <CardContent>
                {loading && activeTab === "store" ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading tires...</p>
                    </div>
                  </div>
                ) : storeTires.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No tires in store</h3>
                    <p className="text-muted-foreground">
                      Add tires to your inventory
                    </p>
                    <PermissionGuard permissionCode="tire.create" action="create">
                      <Button className="mt-4" onClick={() => setIsAddTireModalOpen(true)}>
                        <Package className="mr-2 h-4 w-4" />
                        Add Tire
                      </Button>
                    </PermissionGuard>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storeTires.map((tire) => (
                          <TableRow key={tire.id}>
                            <TableCell className="font-mono">
                              {tire.serial_number}
                            </TableCell>
                            <TableCell>{tire.size}</TableCell>
                            <TableCell>{tire.brand}</TableCell>
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
                              {formatDate(tire.purchase_date)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(tire.purchase_cost)}
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
                                      className="text-red-600"
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retread Candidates Tab */}
          <TabsContent value="retread" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Retread Candidates</CardTitle>
                  <CardDescription>
                    Tires eligible for retreading ({retreadCandidates.length} total)
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loading && activeTab === "retread" ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading retread candidates...</p>
                    </div>
                  </div>
                ) : retreadCandidates.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No retread candidates</h3>
                    <p className="text-muted-foreground">
                      No tires currently eligible for retreading
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Remaining Depth</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {retreadCandidates.map((tire) => (
                          <TableRow key={tire.id}>
                            <TableCell className="font-mono">
                              {tire.serial_number}
                            </TableCell>
                            <TableCell>{tire.size}</TableCell>
                            <TableCell>{tire.brand}</TableCell>
                            <TableCell>{tire.position || "N/A"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  tire.depth_remaining > 4
                                    ? "bg-green-100 dark:bg-green-950"
                                    : "bg-orange-100 dark:bg-orange-950"
                                }
                              >
                                {tire.depth_remaining} mm
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
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <PermissionGuard permissionCode="tire.retread" action="create">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/retreads/create/${tire.id}`}>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Schedule Retread
                                    </Link>
                                  </Button>
                                </PermissionGuard>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                      >
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Disposal Tab */}
          <TabsContent value="disposal" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Tires Pending Disposal</CardTitle>
                  <CardDescription>
                    Tires marked for disposal ({pendingDisposal.length} total)
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loading && activeTab === "disposal" ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading pending disposals...</p>
                    </div>
                  </div>
                ) : pendingDisposal.length === 0 ? (
                  <div className="text-center py-8">
                    <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No pending disposals</h3>
                    <p className="text-muted-foreground">
                      No tires currently pending disposal
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Last Used Date</TableHead>
                          <TableHead>Days Since Last Use</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingDisposal.map((tire) => {
                          const lastUsed = tire.last_movement_date 
                            ? new Date(tire.last_movement_date) 
                            : new Date(tire.purchase_date);
                          const today = new Date();
                          const daysSince = Math.floor(
                            (today.getTime() - lastUsed.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return (
                            <TableRow key={tire.id}>
                              <TableCell className="font-mono">
                                {tire.serial_number}
                              </TableCell>
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
                                  className={
                                    daysSince > 180
                                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                                  }
                                >
                                  {daysSince} days
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <PermissionGuard permissionCode="tire.dispose" action="edit">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDisposeTire(tire.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Dispose Now
                                    </Button>
                                  </PermissionGuard>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}