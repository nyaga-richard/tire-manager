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

export default function SuppliersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("suppliers");
  const [filterType, setFilterType] = useState<string>("all");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

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
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
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

  // Show loading state
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
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Show permission denied
  if (!hasPermission("supplier.view")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">Manage suppliers and track payments</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view suppliers. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">Manage suppliers and track payments</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={fetchSuppliers} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="supplier.view" action="view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage suppliers and track payments
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            
            <PermissionGuard permissionCode="supplier.create" action="create">
              <Button asChild>
                <Link href="/suppliers/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Link>
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
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

          {/* Suppliers Tab */}
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
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Building className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No suppliers found</h3>
                    <p className="text-muted-foreground mt-1">
                      {search
                        ? "Try a different search term or filter"
                        : "Get started by adding your first supplier"}
                    </p>
                    {!search && filterType === "all" && (
                      <PermissionGuard permissionCode="supplier.create" action="create">
                        <Button asChild className="mt-4">
                          <Link href="/suppliers/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Supplier
                          </Link>
                        </Button>
                      </PermissionGuard>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Contact Info</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Added On</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuppliers.map((supplier) => (
                          <TableRow key={supplier.id} className="hover:bg-accent/50">
                            <TableCell>
                              <div className="font-medium">{supplier.name}</div>
                              {supplier.address && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  <MapPin className="inline h-3 w-3 mr-1" />
                                  {supplier.address}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getSupplierTypeColor(supplier.type)}
                              >
                                {getSupplierTypeLabel(supplier.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {supplier.contact_person ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span>{supplier.contact_person}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
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
                            <TableCell>
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
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(supplier.created_at)}
                              </div>
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
                                        <Link href={`/suppliers/${supplier.id}/ledger`}>
                                          <Eye className="h-4 w-4" />
                                        </Link>
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
                                    
                                    <PermissionGuard permissionCode="supplier.view" action="view">
                                      <DropdownMenuItem asChild>
                                        <Link href={`/suppliers/${supplier.id}/ledger`}>
                                          <FileText className="mr-2 h-4 w-4" />
                                          View Ledger
                                        </Link>
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                    
                                    <PermissionGuard permissionCode="supplier.edit" action="edit">
                                      <DropdownMenuItem asChild>
                                        <Link href={`/suppliers/${supplier.id}/edit`}>
                                          <Building className="mr-2 h-4 w-4" />
                                          Edit Supplier
                                        </Link>
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                    
                                    <PermissionGuard permissionCode="accounting.create" action="create">
                                      <DropdownMenuItem asChild>
                                        <Link href={`/suppliers/${supplier.id}/payment`}>
                                          <CreditCard className="mr-2 h-4 w-4" />
                                          Add Payment
                                        </Link>
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                    
                                    <DropdownMenuSeparator />
                                    
                                    <PermissionGuard permissionCode="po.view" action="view">
                                      <DropdownMenuItem asChild>
                                        <Link href={`/purchases?supplier=${supplier.id}`}>
                                          <Receipt className="mr-2 h-4 w-4" />
                                          View Purchases
                                        </Link>
                                      </DropdownMenuItem>
                                    </PermissionGuard>
                                    
                                    {supplier.type === "RETREAD_SUPPLIER" && (
                                      <PermissionGuard permissionCode="tire.retread" action="view">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/retreads?supplier=${supplier.id}`}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            View Retreads
                                          </Link>
                                        </DropdownMenuItem>
                                      </PermissionGuard>
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
                  <div className="flex items-center justify-between w-full">
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
    </PermissionGuard>
  );
}