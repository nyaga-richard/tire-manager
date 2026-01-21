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
  Search,
  Download,
  RefreshCw,
  Eye,
  Plus,
  ShoppingCart,
  Car,
  Truck,
  Wrench,
  Trash2,
  Filter,
  MoreHorizontal,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  User,
  DollarSign,
  Building,
  FileText,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
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

interface PurchaseTransaction {
  id: number;
  type: "PURCHASE" | "INSTALL" | "REMOVE" | "RETREAD_SEND" | "RETREAD_RETURN" | "DISPOSE";
  date: string;
  description: string;
  supplier_name?: string;
  vehicle_number?: string;
  tire_serial: string;
  tire_size: string;
  tire_brand: string;
  amount?: number;
  user_name: string;
  reference: string;
  status: string;
  details?: any;
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
  position?: string;
  purchase_date: string;
  purchase_cost: number;
  purchase_supplier: string;
  depth_remaining: number;
  current_odometer?: number;
  current_vehicle?: string;
  vehicle_id?: number;
}

interface Supplier {
  id: number;
  name: string;
  type: string;
}

interface Vehicle {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<PurchaseTransaction[]>([]);
  const [tires, setTires] = useState<Tire[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [activeTab, filterType, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === "transactions") {
        await fetchTransactions();
      } else if (activeTab === "tires") {
        await fetchTires();
      }
      
      // Always fetch suppliers and vehicles for forms
      await fetchSuppliers();
      await fetchVehicles();
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

      const response = await fetch(
         `http://localhost:5000/api/tires/transactions?${params}`
      );

      const data = await response.json();

      // ✅ Normalize response
      const transactionsArray = Array.isArray(data)
        ? data
        : Array.isArray(data.transactions)
        ? data.transactions
        : [];

      setTransactions(transactionsArray);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };


  const fetchTires = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") {
        if (filterType === "IN_STORE") params.append("status", "IN_STORE");
        else if (filterType === "ON_VEHICLE") params.append("status", "ON_VEHICLE");
        else if (filterType === "RETREAD") params.append("status", "AWAITING_RETREAD,AT_RETREAD_SUPPLIER");
      }
      
      const response = await fetch(`http://localhost:5000/api/tires?${params}`);
      const data = await response.json();
      setTires(data);
    } catch (error) {
      console.error("Error fetching tires:", error);
      setTires([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/suppliers");
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/vehicles");
      const data = await response.json();
      setVehicles(data.vehicles || data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setVehicles([]);
    }
  };

  const handlePurchaseTires = async (tireData: any) => {
    try {
      const response = await fetch("http://localhost:5000/api/tires/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tireData),
      });

      if (response.ok) {
        toast.success("Tires purchased successfully");
        fetchData();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to purchase tires");
        return false;
      }
    } catch (error) {
      console.error("Error purchasing tires:", error);
      toast.error("Failed to purchase tires");
      return false;
    }
  };

  const handleInstallTire = async (installData: any) => {
    try {
      const response = await fetch("http://localhost:5000/api/tires/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(installData),
      });

      if (response.ok) {
        toast.success("Tire installed successfully");
        fetchData();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to install tire");
        return false;
      }
    } catch (error) {
      console.error("Error installing tire:", error);
      toast.error("Failed to install tire");
      return false;
    }
  };

  const handleRemoveTire = async (removeData: any) => {
    try {
      const response = await fetch("http://localhost:5000/api/tires/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(removeData),
      });

      if (response.ok) {
        toast.success("Tire removed successfully");
        fetchData();
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove tire");
        return false;
      }
    } catch (error) {
      console.error("Error removing tire:", error);
      toast.error("Failed to remove tire");
      return false;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "Purchase";
      case "INSTALL":
        return "Install on Vehicle";
      case "REMOVE":
        return "Remove from Vehicle";
      case "RETREAD_SEND":
        return "Send for Retreading";
      case "RETREAD_RETURN":
        return "Return from Retreading";
      case "DISPOSE":
        return "Disposal";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "INSTALL":
        return "bg-green-100 text-green-800 border-green-200";
      case "REMOVE":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "RETREAD_SEND":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "RETREAD_RETURN":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "DISPOSE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <ShoppingCart className="h-4 w-4" />;
      case "INSTALL":
        return <Car className="h-4 w-4" />;
      case "REMOVE":
        return <Truck className="h-4 w-4" />;
      case "RETREAD_SEND":
      case "RETREAD_RETURN":
        return <Wrench className="h-4 w-4" />;
      case "DISPOSE":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
      case "AWAITING_RETREAD":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
      case "DISPOSED":
        return "bg-red-100 text-red-800 border-red-200";
      case "IN_PROGRESS":
      case "AT_RETREAD_SUPPLIER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTireStatusColor = (status: string) => {
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

  const getTireTypeColor = (type: string) => {
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.tire_serial.toLowerCase().includes(search.toLowerCase()) ||
      transaction.tire_brand.toLowerCase().includes(search.toLowerCase()) ||
      transaction.tire_size.toLowerCase().includes(search.toLowerCase()) ||
      transaction.description.toLowerCase().includes(search.toLowerCase()) ||
      transaction.user_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTires = tires.filter(
    (tire) =>
      tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      tire.brand.toLowerCase().includes(search.toLowerCase()) ||
      tire.size.toLowerCase().includes(search.toLowerCase()) ||
      tire.pattern?.toLowerCase().includes(search.toLowerCase()) ||
      tire.purchase_supplier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases & Transactions</h1>
          <p className="text-muted-foreground">
            Manage tire purchases, installations, retreading, and disposals
          </p>
        </div>
        <div className="flex items-center gap-2">
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
                New Transaction
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/purchases/new-purchase">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase Tires
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/purchases/install">
                  <Car className="mr-2 h-4 w-4" />
                  Install on Vehicle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/purchases/remove">
                  <Truck className="mr-2 h-4 w-4" />
                  Remove from Vehicle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/purchases/retread">
                  <Wrench className="mr-2 h-4 w-4" />
                  Send for Retreading
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/purchases/dispose">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Dispose Tire
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All transaction types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tires in Store</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tires.filter(t => t.status === "IN_STORE").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for installation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tires.filter(t => t.status === "ON_VEHICLE").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retread Queue</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tires.filter(t => t.status === "AWAITING_RETREAD" || t.status === "AT_RETREAD_SUPPLIER").length}
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
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="tires">Tire Inventory</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {activeTab === "transactions" ? (
                  <>
                    <SelectItem value="PURCHASE">Purchases</SelectItem>
                    <SelectItem value="INSTALL">Installations</SelectItem>
                    <SelectItem value="REMOVE">Removals</SelectItem>
                    <SelectItem value="RETREAD_SEND">Retread Sends</SelectItem>
                    <SelectItem value="RETREAD_RETURN">Retread Returns</SelectItem>
                    <SelectItem value="DISPOSE">Disposals</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="IN_STORE">In Store</SelectItem>
                    <SelectItem value="ON_VEHICLE">On Vehicle</SelectItem>
                    <SelectItem value="RETREAD">Retread Queue</SelectItem>
                    <SelectItem value="NEW">New Tires</SelectItem>
                    <SelectItem value="RETREADED">Retreaded Tires</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={
                  activeTab === "transactions" 
                    ? "Search transactions..." 
                    : "Search tires..."
                }
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Transactions Tab */}
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
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead>Tire Details</TableHead>
                        <TableHead>Supplier/Vehicle</TableHead>
                        <TableHead>Amount</TableHead>
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
                              {formatDateTime(transaction.date)}
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
                            {transaction.supplier_name ? (
                              <div className="flex items-center gap-2">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                <span>{transaction.supplier_name}</span>
                              </div>
                            ) : transaction.vehicle_number ? (
                              <div className="flex items-center gap-2">
                                <Car className="h-3 w-3 text-muted-foreground" />
                                <span>{transaction.vehicle_number}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.amount ? (
                              <div className="font-medium">
                                {formatCurrency(transaction.amount)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                                      <Link href={`/inventory/${transaction.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View details</p>
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
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/movement?tire=${transaction.id}`}>
                                      <Clock className="mr-2 h-4 w-4" />
                                      View History
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to cancel this transaction?")) {
                                        // Handle cancellation
                                      }
                                    }}
                                  >
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Cancel Transaction
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
            {filteredTransactions.length > 0 && (
              <CardFooter className="border-t px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Tires Tab */}
        <TabsContent value="tires" className="space-y-4">
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
                      : "Get started by purchasing your first tires"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Size & Brand</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Position/Vehicle</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Depth</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTires.map((tire) => (
                        <TableRow key={tire.id} className="hover:bg-accent/50">
                          <TableCell className="font-mono font-medium">
                            {tire.serial_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{tire.size}</div>
                              <div className="text-sm text-muted-foreground">
                                {tire.brand} {tire.pattern && `• ${tire.pattern}`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getTireTypeColor(tire.type)}
                            >
                              {tire.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getTireStatusColor(tire.status)}
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
                                  {tire.current_vehicle || "Unknown"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                {tire.position || "N/A"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDate(tire.purchase_date)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(tire.purchase_cost)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tire.purchase_supplier}
                            </div>
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
                                    width: `${Math.min(100, (tire.depth_remaining / 15) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {tire.depth_remaining}mm
                              </span>
                            </div>
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                                  {tire.status === "IN_STORE" && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/purchases/install?tire=${tire.id}`}>
                                        <Car className="mr-2 h-4 w-4" />
                                        Install on Vehicle
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {tire.status === "ON_VEHICLE" && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/purchases/remove?tire=${tire.id}`}>
                                        <Truck className="mr-2 h-4 w-4" />
                                        Remove from Vehicle
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {(tire.status === "USED_STORE" || tire.status === "ON_VEHICLE") && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/purchases/retread?tire=${tire.id}`}>
                                        <Wrench className="mr-2 h-4 w-4" />
                                        Send for Retreading
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {tire.status !== "DISPOSED" && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/purchases/dispose?tire=${tire.id}`}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Dispose Tire
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/movement?tire=${tire.id}`}>
                                      <Clock className="mr-2 h-4 w-4" />
                                      View Movement History
                                    </Link>
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
            {filteredTires.length > 0 && (
              <CardFooter className="border-t px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTires.length} of {tires.length} tires
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === "PURCHASE")
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total spent on tire purchases
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Retreading Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === "RETREAD_SEND")
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total retreading expenses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Installations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions.filter(t => t.type === "INSTALL").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tires installed on vehicles
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>
                Transaction activity over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Monthly reports coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Reports</CardTitle>
              <CardDescription>
                Generate and download reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Purchase History
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Installation Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Retreading Summary
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Disposal Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}