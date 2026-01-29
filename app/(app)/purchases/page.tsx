"use client";

import { useState, useEffect } from "react";
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
  Wrench,
  Filter,
  Building,
  User,
  DollarSign,
  FileText,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  type: "PURCHASE" | "RETREAD_SEND" | "RETREAD_RETURN";
  date: string;
  description: string;
  supplier_name: string;
  tire_serial: string;
  tire_size: string;
  tire_brand: string;
  amount: number;
  user_name: string;
  reference: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  quantity?: number;
  unit_price?: number;
}

interface PurchaseAnalytics {
  totalPurchases: number;
  totalRetreadingCost: number;
  monthlySpending: number;
  purchaseCount: number;
  retreadCount: number;
  topSuppliers: Array<{ name: string; total: number }>;
  monthlyTrend: "up" | "down";
}

// Default analytics state
const defaultAnalytics: PurchaseAnalytics = {
  totalPurchases: 0,
  totalRetreadingCost: 0,
  monthlySpending: 0,
  purchaseCount: 0,
  retreadCount: 0,
  topSuppliers: [],
  monthlyTrend: "up",
};

export default function PurchasesPage() {
  const [transactions, setTransactions] = useState<PurchaseTransaction[]>([]);
  const [analytics, setAnalytics] = useState<PurchaseAnalytics>(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("month");

  useEffect(() => {
    fetchData();
  }, [activeTab, filterType, filterStatus, timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTransactions(),
        fetchAnalytics(),
      ]);
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
      params.append("timeRange", timeRange);

      const response = await fetch(
        `http://localhost:5000/api/purchases/transactions?${params}`
      );
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/purchases/analytics?timeRange=${timeRange}`
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalytics(defaultAnalytics);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "New Purchase";
      case "RETREAD_SEND":
        return "Send for Retreading";
      case "RETREAD_RETURN":
        return "Return from Retreading";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETREAD_SEND":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "RETREAD_RETURN":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <ShoppingCart className="h-4 w-4" />;
      case "RETREAD_SEND":
      case "RETREAD_RETURN":
        return <Wrench className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
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

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.tire_serial.toLowerCase().includes(search.toLowerCase()) ||
      transaction.tire_brand.toLowerCase().includes(search.toLowerCase()) ||
      transaction.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(search.toLowerCase())
  );

  // Safe function to check if analytics has data
  const hasTopSuppliers = analytics?.topSuppliers && analytics.topSuppliers.length > 0;

  const exportReport = async (type: string) => {
    try {
      toast.info(`Preparing ${type} report...`);
      // For now, simulate export - you'll need to implement actual API endpoint
      const csvContent = "data:text/csv;charset=utf-8,";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} report download started`);
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases & Retreading</h1>
          <p className="text-muted-foreground">
            Manage tire purchases and retreading transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
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
                <Link href="/purchases/retread">
                  <Wrench className="mr-2 h-4 w-4" />
                  Send for Retreading
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.totalPurchases || 0)}
            </div>
            <div className="flex items-center text-xs">
              {analytics?.monthlyTrend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className="text-muted-foreground">
                {analytics?.monthlyTrend === "up" ? "+" : "-"}12% from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retreading Cost</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.totalRetreadingCost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total spent on retreading
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.monthlySpending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This {timeRange === "week" ? "week" : "month"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Count</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.purchaseCount || 0) + (analytics?.retreadCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.purchaseCount || 0} purchases, {analytics?.retreadCount || 0} retreads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers - Only show if we have data */}
      {hasTopSuppliers && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Suppliers</CardTitle>
            <CardDescription>Highest spending suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topSuppliers.map((supplier, index) => (
                <div key={supplier.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-xs text-muted-foreground">Supplier #{index + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(supplier.total)}</p>
                    <p className="text-xs text-muted-foreground">Total spent</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="purchases">Purchases Only</TabsTrigger>
            <TabsTrigger value="retreading">Retreading Only</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PURCHASE">Purchases</SelectItem>
                <SelectItem value="RETREAD_SEND">Retread Sends</SelectItem>
                <SelectItem value="RETREAD_RETURN">Retread Returns</SelectItem>
              </SelectContent>
            </Select>
            
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

        {/* All Transactions Tab */}
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
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tire Details</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reference</TableHead>
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
                              {formatDate(transaction.date)}
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
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <span>{transaction.supplier_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </div>
                            {transaction.quantity && transaction.unit_price && (
                              <div className="text-xs text-muted-foreground">
                                {transaction.quantity} × {formatCurrency(transaction.unit_price)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {transaction.reference}
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
                                      <Link href={`/purchases/${transaction.id}`}>
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
            {filteredTransactions.length > 0 && (
              <CardFooter className="border-t px-6 py-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredTransactions.length} transactions
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportReport("transactions")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Purchases Only Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Transactions</CardTitle>
              <CardDescription>
                New tire purchases and procurement records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading purchases...</p>
                  </div>
                </div>
              ) : filteredTransactions.filter(t => t.type === "PURCHASE").length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No purchase transactions found</h3>
                  <p className="text-muted-foreground mt-1">
                    Start by creating a purchase transaction
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Tire Details</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions
                        .filter(t => t.type === "PURCHASE")
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.tire_serial}</div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.tire_size} • {transaction.tire_brand}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{transaction.supplier_name}</TableCell>
                            <TableCell>{transaction.quantity || 1}</TableCell>
                            <TableCell>{formatCurrency(transaction.unit_price || transaction.amount)}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => exportReport("purchases")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Purchase Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Retreading Only Tab */}
        <TabsContent value="retreading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Retreading Transactions</CardTitle>
              <CardDescription>
                Tire retreading send and return records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading retreading transactions...</p>
                  </div>
                </div>
              ) : filteredTransactions.filter(t => t.type === "RETREAD_SEND" || t.type === "RETREAD_RETURN").length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No retreading transactions found</h3>
                  <p className="text-muted-foreground mt-1">
                    Send tires for retreading to see records here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tire Details</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions
                        .filter(t => t.type === "RETREAD_SEND" || t.type === "RETREAD_RETURN")
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getTransactionTypeColor(transaction.type)}
                              >
                                {getTransactionTypeLabel(transaction.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.tire_serial}</div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.tire_size} • {transaction.tire_brand}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{transaction.supplier_name}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  Total retreading cost: {formatCurrency(analytics?.totalRetreadingCost || 0)}
                </p>
                <p className="text-muted-foreground">
                  {analytics?.retreadCount || 0} retreading transactions
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => exportReport("retreading")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Retreading Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}