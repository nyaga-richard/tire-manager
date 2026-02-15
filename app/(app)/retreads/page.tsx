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
  RefreshCw,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Download,
  Filter,
  Eye,
  MoreHorizontal,
  TrendingUp,
  BarChart3,
  DollarSign,
  Building,
  Calendar,
  XCircle,
  Plus,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  type: "NEW" | "RETREADED";
  status: "USED_STORE" | "AWAITING_RETREAD" | "AT_RETREAD_SUPPLIER";
  purchase_date: string;
  purchase_cost: number;
  current_location: string;
  supplier_name?: string;
  previous_retread_count?: number;
  depth_remaining: number;
  tread_depth_new: number;
  installation_count: number;
  total_distance: number;
}

interface RetreadMovement {
  id: number;
  movement_date: string;
  movement_type: "STORE_TO_RETREAD_SUPPLIER" | "RETREAD_SUPPLIER_TO_STORE";
  supplier_id: number;
  supplier_name: string;
  tire_id: number;
  serial_number: string;
  size: string;
  brand: string;
  type: "NEW" | "RETREADED";
  status: string;
  notes: string;
  processed_by: string;
}

interface RetreadOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name: string;
  status: "DRAFT" | "SENT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RECEIVED";
  total_tires: number;
  total_cost: number;
  expected_completion_date?: string;
  sent_date?: string;
  received_date?: string;
  created_at: string;
  tires: Array<{
    id: number;
    serial_number: string;
    size: string;
    brand: string;
    status: string;
  }>;
}

interface Supplier {
  id: number;
  name: string;
  type: "RETREAD";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  average_cost?: number;
  total_jobs?: number;
}

export default function RetreadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("eligible");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTires, setSelectedTires] = useState<number[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Data states
  const [eligibleTires, setEligibleTires] = useState<Tire[]>([]);
  const [retreadMovements, setRetreadMovements] = useState<RetreadMovement[]>([]);
  const [retreadOrders, setRetreadOrders] = useState<RetreadOrder[]>([]);
  const [supplierStats, setSupplierStats] = useState<Supplier[]>([]);
  
  // Filters
  const [sizeFilter, setSizeFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
    fetchSuppliers();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === "eligible") {
        const response = await fetch("http://localhost:5000/api/tires/retread/eligible");
        const data = await response.json();
        if (data.success) {
          setEligibleTires(data.data);
        }
      } else if (activeTab === "orders") {
        // Fetch retread orders
        const ordersResponse = await fetch("http://localhost:5000/api/retread-orders");
        const ordersData = await ordersResponse.json();
        if (ordersData.success) {
          setRetreadOrders(ordersData.data);
        }

        // Also fetch movements for the summary
        const movementsResponse = await fetch("http://localhost:5000/api/tires/retread/status");
        const movementsData = await movementsResponse.json();
        if (movementsData.success) {
          setRetreadMovements(movementsData.data);
        }
      } else if (activeTab === "suppliers") {
        const response = await fetch("http://localhost:5000/api/tires/retread/cost-analysis");
        const data = await response.json();
        if (data.success) {
          setSupplierStats(data.suppliers);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/suppliers");
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const refreshData = () => {
    fetchData();
    setSelectedTires([]);
  };

  const handleSelectTire = (tireId: number) => {
    setSelectedTires(prev =>
      prev.includes(tireId)
        ? prev.filter(id => id !== tireId)
        : [...prev, tireId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTires.length === filteredEligibleTires.length) {
      setSelectedTires([]);
    } else {
      setSelectedTires(filteredEligibleTires.map(t => t.id));
    }
  };

  const handleSendForRetreading = async () => {
    if (selectedTires.length === 0) {
      alert("Please select at least one tire");
      return;
    }

    router.push(`/retreads/create?tires=${selectedTires.join(",")}`);
  };

  const handleMarkForRetreading = async () => {
    if (selectedTires.length === 0) {
      alert("Please select at least one tire");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/tires/retread/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tire_ids: selectedTires,
          user_id: 1, // Get from auth context
          notes: "Marked for retreading from dashboard"
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Marked ${data.marked_tires.length} tires for retreading`);
        refreshData();
      } else {
        alert("Failed to mark tires: " + data.error);
      }
    } catch (error) {
      console.error("Error marking tires:", error);
      alert("Failed to mark tires");
    }
  };

  const handleCreateOrder = () => {
    router.push("/retreads/create-batch");
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/retreads/${orderId}`);
  };

  const handleReceiveOrder = (orderId: number) => {
    router.push(`/retreads/${orderId}/receive`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "USED_STORE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "AWAITING_RETREAD":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "AT_RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock },
      SENT: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Truck },
      IN_PROGRESS: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Package },
      COMPLETED: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      CANCELLED: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      RECEIVED: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case "STORE_TO_RETREAD_SUPPLIER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETREAD_SUPPLIER_TO_STORE":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
    }).format(amount);
  };

  const formatDistance = (distance?: number) =>
    distance ? `${distance.toLocaleString()} km` : "Not recorded";

  // Filter eligible tires
  const filteredEligibleTires = eligibleTires.filter(tire =>
    tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    tire.brand.toLowerCase().includes(search.toLowerCase()) ||
    tire.size.toLowerCase().includes(search.toLowerCase())
  );

  // Filter orders
  const filteredOrders = retreadOrders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.supplier_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSupplier = supplierFilter === "all" || order.supplier_id.toString() === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Calculate summary stats
  const summaryStats = {
    eligible: eligibleTires.length,
    atSupplier: retreadMovements.filter(m => m.status === "AT_RETREAD_SUPPLIER").length,
    returned: retreadMovements.filter(m => m.type === "RETREADED").length,
    suppliers: suppliers.length,
    pendingOrders: retreadOrders.filter(o => o.status === "SENT" || o.status === "IN_PROGRESS").length,
    totalOrders: retreadOrders.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Retreading Management</h1>
          <p className="text-muted-foreground">
            Manage tire retreading process from selection to return
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateOrder}>
            <Plus className="mr-2 h-4 w-4" />
            New Retread Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible Tires</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.eligible}</div>
            <p className="text-xs text-muted-foreground">Ready for retreading</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Retreader</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.atSupplier}</div>
            <p className="text-xs text-muted-foreground">Currently being retreaded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.returned}</div>
            <p className="text-xs text-muted-foreground">Successfully retreaded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Building className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.suppliers}</div>
            <p className="text-xs text-muted-foreground">Retread service providers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="eligible">Eligible Tires</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Analysis</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {activeTab === "eligible" && (
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {Array.from(new Set(eligibleTires.map(t => t.size))).map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {activeTab === "orders" && (
              <>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="RECEIVED">Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-40">
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Eligible Tires Tab */}
        <TabsContent value="eligible">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tires Eligible for Retreading</CardTitle>
                  <CardDescription>
                    Tires in USED_STORE status that can be sent for retreading
                  </CardDescription>
                </div>
                {selectedTires.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedTires.length} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkForRetreading}
                    >
                      Mark for Retreading
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendForRetreading}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Send for Retreading
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading tires...</p>
                  </div>
                </div>
              ) : filteredEligibleTires.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No eligible tires found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search ? "Try a different search term" : "No tires available for retreading"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTires.length === filteredEligibleTires.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Serial #</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Brand & Model</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Depth</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Installations</TableHead>
                        <TableHead>Previous Retreads</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEligibleTires.map((tire) => (
                        <TableRow key={tire.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTires.includes(tire.id)}
                              onCheckedChange={() => handleSelectTire(tire.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {tire.serial_number}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tire.size}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{tire.brand}</div>
                              <div className="text-sm text-muted-foreground">
                                {tire.model}
                              </div>
                            </div>
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
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-green-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (tire.depth_remaining / tire.tread_depth_new) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {tire.depth_remaining}mm
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatDistance(tire.total_distance)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tire.installation_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tire.previous_retread_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => router.push(`/inventory/${tire.id}`)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Button>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => handleSelectTire(tire.id)}
                                  >
                                    {selectedTires.includes(tire.id) ? (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Deselect
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Select for Retreading
                                      </>
                                    )}
                                  </Button>
                                </DropdownMenuItem>
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
            <CardFooter className="border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredEligibleTires.length} of {eligibleTires.length} eligible tires
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Retread Purchase Orders</CardTitle>
                  <CardDescription>
                    Manage and track all retread orders
                  </CardDescription>
                </div>
                <Button onClick={handleCreateOrder} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading orders...</p>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No retread orders found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search ? "Try a different search term" : "Create your first retread order to get started"}
                  </p>
                  {!search && (
                    <Button onClick={handleCreateOrder} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Order
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tires</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Expected Completion</TableHead>
                        <TableHead>Received Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">
                                {order.supplier_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.total_tires}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.total_cost)}
                          </TableCell>
                          <TableCell>{formatDate(order.sent_date)}</TableCell>
                          <TableCell>{formatDate(order.expected_completion_date)}</TableCell>
                          <TableCell>{formatDate(order.received_date)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {order.status === "COMPLETED" && (
                                  <DropdownMenuItem onClick={() => handleReceiveOrder(order.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Receive Order
                                  </DropdownMenuItem>
                                )}
                                {(order.status === "SENT" || order.status === "IN_PROGRESS") && (
                                  <DropdownMenuItem>
                                    <Truck className="mr-2 h-4 w-4" />
                                    Track Order
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {order.status === "DRAFT" && (
                                  <DropdownMenuItem>
                                    <Package className="mr-2 h-4 w-4" />
                                    Edit Order
                                  </DropdownMenuItem>
                                )}
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
            <CardFooter className="border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {retreadOrders.length} orders
              </div>
            </CardFooter>
          </Card>

          {/* Recent Movements Card */}
          {retreadMovements.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Movements</CardTitle>
                <CardDescription>
                  Latest tire movements to/from retread suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Serial #</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retreadMovements.slice(0, 5).map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>{formatDate(movement.movement_date)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getMovementTypeColor(movement.movement_type)}
                            >
                              {movement.movement_type === "STORE_TO_RETREAD_SUPPLIER"
                                ? "Sent"
                                : "Returned"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {movement.serial_number}
                          </TableCell>
                          <TableCell>{movement.supplier_name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusColor(movement.status)}
                            >
                              {movement.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Supplier Analysis Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Retread Supplier Analysis</CardTitle>
              <CardDescription>
                Cost and performance analysis by retread supplier
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading supplier data...</p>
                  </div>
                </div>
              ) : supplierStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No supplier data</h3>
                  <p className="text-muted-foreground mt-1">
                    No retreading jobs recorded yet
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Jobs Completed</TableHead>
                        <TableHead>Tires Retreaded</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Avg Cost per Tire</TableHead>
                        <TableHead>Avg Turnaround (days)</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierStats.map((supplier) => (
                        <TableRow key={`supplier-${supplier.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supplier.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {supplier.address}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{supplier.contact_person}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {supplier.total_jobs || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {supplier.total_jobs ? Math.round(supplier.total_jobs * 8) : 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(supplier.total_jobs ? (supplier.total_jobs * (supplier.average_cost || 0) * 8) : 0)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(supplier.average_cost || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50">
                              {supplier.total_jobs ? "7-10" : "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{supplier.phone}</div>
                            <div className="text-xs text-muted-foreground">
                              {supplier.email}
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
                Showing {supplierStats.length} retread suppliers
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCreateOrder}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Retread Order
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/retreads/return")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Return from Retreading
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/suppliers?type=RETREAD")}
            >
              <Building className="mr-2 h-4 w-4" />
              Manage Retread Suppliers
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Retread Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Current Distribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Eligible for Retreading</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{ width: `${(summaryStats.eligible / 50) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {summaryStats.eligible}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Orders</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(summaryStats.pendingOrders / 20) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {summaryStats.pendingOrders}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">At Retread Supplier</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${(summaryStats.atSupplier / 30) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {summaryStats.atSupplier}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Successfully Retreaded</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(summaryStats.returned / 40) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {summaryStats.returned}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Order Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {retreadOrders.filter(o => o.status === "SENT").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {retreadOrders.filter(o => o.status === "IN_PROGRESS").length}
                    </div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {retreadOrders.filter(o => o.status === "COMPLETED" || o.status === "RECEIVED").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
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