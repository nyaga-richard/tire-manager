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
}

export default function TireSizePage() {
  const params = useParams();
  const router = useRouter();
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    retreaded: 0,
    used: 0,
    inStore: 0,
    onVehicle: 0,
    awaitingRetread: 0,
    atRetreader: 0,
  });

  const size = decodeURIComponent(params.size as string);

  useEffect(() => {
    if (size) {
      fetchTiresBySize();
    }
  }, [size, activeTab]);

  const fetchTiresBySize = async () => {
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/inventory/size/${encodeURIComponent(
        size
      )}${activeTab !== "all" ? `?status=${activeTab}` : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      setTires(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error fetching tires:", error);
      setTires([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tireList: Tire[]) => {
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
    };
    setStats(stats);
  };

  const refreshData = () => {
    fetchTiresBySize();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_STORE":
        return "bg-green-100 text-green-800 border-green-200";
      case "ON_VEHICLE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "USED_STORE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "AWAITING_RETREAD":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "AT_RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DISPOSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "NEW":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "RETREADED":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "USED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return "N/A";
    return distance.toLocaleString() + " km";
  };

  const filteredTires = tires.filter(
    (tire) =>
      tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      tire.brand.toLowerCase().includes(search.toLowerCase()) ||
      tire.pattern.toLowerCase().includes(search.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = [
      "Serial Number",
      "Brand",
      "Pattern",
      "Type",
      "Status",
      "Position",
      "Purchase Date",
      "Purchase Cost",
      "Supplier",
      "Depth Remaining",
      "Installation Count",
      "Total Distance",
      "Retread Count",
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
          formatDate(tire.purchase_date),
          tire.purchase_cost,
          tire.purchase_supplier,
          tire.depth_remaining,
          tire.installation_count,
          tire.total_distance,
          tire.retread_count,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tires-${size.replace(/\//g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
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
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/inventory/add">
              <Package className="mr-2 h-4 w-4" />
              Add Tire
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CheckCircle className="h-4 w-4 text-green-500" />
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
            <TrendingUp className="h-4 w-4 text-blue-500" />
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
            <Clock className="h-4 w-4 text-orange-500" />
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Tires</TabsTrigger>
            <TabsTrigger value="IN_STORE">In Store</TabsTrigger>
            <TabsTrigger value="ON_VEHICLE">On Vehicle</TabsTrigger>
            <TabsTrigger value="USED_STORE">Used Store</TabsTrigger>
            <TabsTrigger value="AWAITING_RETREAD">Retread Queue</TabsTrigger>
          </TabsList>
          
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
                      : "No tires found with this filter"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
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
                        <TableRow key={tire.id}>
                          <TableCell className="font-mono font-medium">
                            {tire.serial_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{tire.brand}</div>
                              <div className="text-sm text-muted-foreground">
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
                                <div className="font-medium">
                                  {tire.position || "N/A"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {tire.current_vehicle || "Unknown Vehicle"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                {tire.position || "N/A"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 rounded-full bg-gray-200 flex-1"
                                style={{ minWidth: "40px" }}
                              >
                                <div
                                  className="h-full rounded-full bg-green-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (tire.depth_remaining /
                                        tire.tread_depth_new) *
                                        100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {tire.depth_remaining}mm
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistance(tire.total_distance)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tire.retread_count}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(tire.purchase_date)}</TableCell>
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
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/${tire.id}/edit`}>
                                      Edit Tire
                                    </Link>
                                  </DropdownMenuItem>
                                  {tire.status === "IN_STORE" && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/tires/assign/${tire.id}`}>
                                        Assign to Vehicle
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {tire.status === "ON_VEHICLE" && (
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/tires/remove/${tire.id}?vehicle=${tire.vehicle_id}`}
                                      >
                                        Remove from Vehicle
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {(tire.status === "USED_STORE" ||
                                    tire.status === "ON_VEHICLE") &&
                                    tire.depth_remaining <= 4 && (
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/retreads/create/${tire.id}`}
                                        >
                                          Schedule Retread
                                        </Link>
                                      </DropdownMenuItem>
                                    )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      console.log("Delete", tire.id)
                                    }
                                  >
                                    Delete Tire
                                  </DropdownMenuItem>
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
            <CardFooter className="border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTires.length} of {tires.length} tires
              </div>
            </CardFooter>
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
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/inventory/add?size=${encodeURIComponent(size)}`}>
                <Package className="mr-2 h-4 w-4" />
                Add Tire of This Size
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/purchases/create?size=${encodeURIComponent(size)}`}>
                <Package className="mr-2 h-4 w-4" />
                Purchase Tires
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/inventory/movement?size=${encodeURIComponent(size)}`}>
                <History className="mr-2 h-4 w-4" />
                View Movement History
              </Link>
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
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(stats.inStore / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats.inStore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">On Vehicle</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(stats.onVehicle / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats.onVehicle}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Retread Queue</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500"
                          style={{
                            width: `${((stats.awaitingRetread + stats.atRetreader) / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {stats.awaitingRetread + stats.atRetreader}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}