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
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("suppliers");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchSuppliers();
  }, [filterType]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const url = filterType !== "all" 
        ? `http://localhost:5000/api/suppliers?type=${filterType}`
        : "http://localhost:5000/api/suppliers";
      
      const response = await fetch(url);
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "SERVICE_PROVIDER":
        return "bg-green-100 text-green-800 border-green-200";
      case "OTHER":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
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

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email.toLowerCase().includes(search.toLowerCase()) ||
      supplier.phone.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = suppliers.reduce((sum, supplier) => sum + supplier.balance, 0);
  const totalSuppliers = suppliers.length;

  return (
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
          <Button variant="outline" onClick={fetchSuppliers} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/suppliers/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Link>
          </Button>
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
              totalBalance > 0 ? "text-red-600" : "text-green-600"
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
              {suppliers.filter(s => Math.abs(s.balance) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              With active transactions
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
                      ? "Try a different search term"
                      : "Get started by adding your first supplier"}
                  </p>
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
                                  <span className="text-sm truncate">{supplier.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {supplier.balance > 0 ? (
                                <>
                                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                                  <span className="font-medium text-red-600">
                                    {formatCurrency(supplier.balance)}
                                  </span>
                                </>
                              ) : supplier.balance < 0 ? (
                                <>
                                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(Math.abs(supplier.balance))}
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">Paid</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(supplier.created_at)}
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
                                  <DropdownMenuItem asChild>
                                    <Link href={`/suppliers/${supplier.id}/ledger`}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Ledger
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/suppliers/${supplier.id}/payment`}>
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      Add Payment
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/purchases?supplier=${supplier.id}`}>
                                      <Receipt className="mr-2 h-4 w-4" />
                                      View Purchases
                                    </Link>
                                  </DropdownMenuItem>
                                  {supplier.type === "RETREAD_SUPPLIER" && (
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
                <div className="text-sm text-muted-foreground">
                  Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}