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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  RefreshCw,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  MoreHorizontal,
  BarChart3,
  Building,
  XCircle,
  Plus,
  Loader2,
  ListOrdered,
  Filter,
  Menu,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Gauge,
  RotateCcw,
  Calendar,
  DollarSign,
  Link,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { format, parseISO, isValid } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
  retread_count?: number;
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
  status: "DRAFT" | "SENT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RECEIVED" | "PARTIALLY_RECEIVED";
  total_tires: number;
  total_cost: number;
  expected_completion_date?: string;
  sent_date?: string;
  received_date?: string;
  created_at: string;
  received_tires?: number;
}

interface Supplier {
  id: number;
  name: string;
  type: "RETREAD" | "TIRE";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  average_cost_per_tire?: number;
  total_orders?: number;
  total_tires_processed?: number;
  avg_turnaround_days?: number;
}

// Mobile Tire Card Component
const MobileTireCard = ({
  tire,
  selected,
  onSelect,
  onViewDetails,
  getStatusColor,
  formatDistance,
  formatNumber,
  formatDate,
  formatCurrency,
}: {
  tire: Tire;
  selected: boolean;
  onSelect: (id: number) => void;
  onViewDetails: (id: number) => void;
  getStatusColor: (status: string) => string;
  formatDistance: (distance?: number) => string;
  formatNumber: (num?: number) => string;
  formatDate: (dateString?: string) => string;
  formatCurrency: (amount: number) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const treadPercentage = (tire.depth_remaining / tire.tread_depth_new) * 100;

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(tire.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono font-medium text-sm truncate">
                  {tire.serial_number}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {tire.size}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getStatusColor(tire.status)}
                  >
                    {tire.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Basic Info */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Brand</div>
                <div className="text-sm font-medium">{tire.brand}</div>
                {tire.model && (
                  <div className="text-xs text-muted-foreground">{tire.model}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Depth</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.min(100, treadPercentage)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {tire.depth_remaining}mm
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Distance</div>
                <div className="text-sm font-medium">{formatDistance(tire.total_distance)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Installs</div>
                <div className="text-sm font-medium">
                  <Badge variant="outline" className="text-xs">
                    {formatNumber(tire.installation_count)}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Retreads</div>
                <div className="text-sm font-medium">
                  <Badge variant="outline" className="text-xs">
                    {tire.retread_count || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Purchase Date</div>
                <div className="text-sm">{formatDate(tire.purchase_date)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Purchase Cost</div>
                <div className="text-sm font-medium">{formatCurrency(tire.purchase_cost)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="text-sm">{tire.current_location}</div>
              </div>
              {tire.supplier_name && (
                <div>
                  <div className="text-xs text-muted-foreground">Supplier</div>
                  <div className="text-sm">{tire.supplier_name}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onViewDetails(tire.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onSelect(tire.id)}
              >
                {selected ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Deselect
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Movement Card Component
const MobileMovementCard = ({
  movement,
  formatDate,
  getMovementTypeColor,
  getStatusColor,
}: {
  movement: RetreadMovement;
  formatDate: (dateString?: string) => string;
  getMovementTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
}) => {
  return (
    <Card className="mb-2 last:mb-0">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={getMovementTypeColor(movement.movement_type)}
              >
                {movement.movement_type === "STORE_TO_RETREAD_SUPPLIER"
                  ? "→ Sent"
                  : "← Returned"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(movement.movement_date)}
              </span>
            </div>
            <div className="mt-2">
              <div className="font-mono text-sm font-medium">{movement.serial_number}</div>
              <div className="text-xs text-muted-foreground">
                {movement.size} • {movement.brand}
              </div>
            </div>
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">Supplier:</span> {movement.supplier_name}
            </div>
          </div>
          <Badge
            variant="outline"
            className={getStatusColor(movement.status)}
          >
            {movement.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Mobile Supplier Card Component
const MobileSupplierCard = ({
  supplier,
  formatCurrency,
  formatNumber,
}: {
  supplier: Supplier;
  formatCurrency: (amount: number) => string;
  formatNumber: (num?: number) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium">{supplier.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {supplier.contact_person || "No contact"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Basic Stats */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">Orders</div>
            <div className="text-lg font-bold">{formatNumber(supplier.total_orders)}</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded">
            <div className="text-xs text-muted-foreground">Tires</div>
            <div className="text-lg font-bold">{formatNumber(supplier.total_tires_processed)}</div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Avg Cost/Tire:</span>
                <span className="text-sm font-medium">{formatCurrency(supplier.average_cost_per_tire || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Avg Turnaround:</span>
                <span className="text-sm font-medium">
                  {supplier.avg_turnaround_days ? 
                    `${Math.round(supplier.avg_turnaround_days)} days` : "N/A"}
                </span>
              </div>
              {supplier.phone && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Phone:</span>
                  <span className="text-sm">{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Email:</span>
                  <span className="text-sm truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div>
                  <span className="text-xs text-muted-foreground">Address:</span>
                  <p className="text-sm mt-1">{supplier.address}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
  <div className="border-b p-4">
    <Skeleton className="h-12 w-full" />
  </div>
);

export default function RetreadsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [activeTab, setActiveTab] = useState("eligible");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTires, setSelectedTires] = useState<number[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Mobile state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data states
  const [eligibleTires, setEligibleTires] = useState<Tire[]>([]);
  const [retreadMovements, setRetreadMovements] = useState<RetreadMovement[]>([]);
  const [retreadOrders, setRetreadOrders] = useState<RetreadOrder[]>([]);
  const [supplierStats, setSupplierStats] = useState<Supplier[]>([]);
  
  // Filters
  const [sizeFilter, setSizeFilter] = useState("all");

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("tire.retread") && !hasPermission("inventory.view")) {
        toast.error("You don't have permission to view retreading");
        router.push("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && (hasPermission("tire.retread") || hasPermission("inventory.view"))) {
      fetchData();
      fetchSuppliers();
    }
  }, [activeTab, isAuthenticated, hasPermission]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === "eligible") {
        const response = await authFetch(`${API_BASE_URL}/api/tires/retread/eligible`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setEligibleTires(data.data);
        } else if (Array.isArray(data)) {
          setEligibleTires(data);
        } else {
          console.error("Unexpected API response structure:", data);
          setEligibleTires([]);
          toast.error("Failed to parse eligible tires data");
        }
      } else if (activeTab === "suppliers") {
        const response = await authFetch(`${API_BASE_URL}/api/tires/retread/cost-analysis`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.suppliers)) {
          setSupplierStats(data.suppliers);
        } else if (Array.isArray(data)) {
          setSupplierStats(data);
        } else {
          console.error("Unexpected supplier stats response:", data);
          setSupplierStats([]);
          toast.error("Failed to parse supplier analysis data");
        }
      }

      // Always fetch orders and movements for stats and recent movements
      const ordersResponse = await authFetch(`${API_BASE_URL}/api/retread/retread-orders`);
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        
        if (ordersData.success && Array.isArray(ordersData.data)) {
          setRetreadOrders(ordersData.data);
        } else if (Array.isArray(ordersData)) {
          setRetreadOrders(ordersData);
        }
      }

      const movementsResponse = await authFetch(`${API_BASE_URL}/api/tires/retread/status`);
      
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json();
        
        if (movementsData.success && Array.isArray(movementsData.data)) {
          setRetreadMovements(movementsData.data);
        } else if (Array.isArray(movementsData)) {
          setRetreadMovements(movementsData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/suppliers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different API response structures
      if (Array.isArray(data)) {
        // Direct array response
        setSuppliers(data);
      } else if (data.data && Array.isArray(data.data)) {
        // Wrapped in data property
        setSuppliers(data.data);
      } else if (data.success && Array.isArray(data.data)) {
        // Standard API response with success flag
        setSuppliers(data.data);
      } else {
        console.error("Unexpected API response structure:", data);
        setSuppliers([]);
        toast.error("Failed to parse suppliers data");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers");
      setSuppliers([]);
    }
  };

  const refreshData = () => {
    fetchData();
    fetchSuppliers();
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
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to send tires for retreading");
      return;
    }

    if (selectedTires.length === 0) {
      toast.error("Please select at least one tire");
      return;
    }

    router.push(`/retreads/create-batch?tires=${selectedTires.join(",")}`);
  };

  const handleMarkForRetreading = async () => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to mark tires for retreading");
      return;
    }

    if (selectedTires.length === 0) {
      toast.error("Please select at least one tire");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/tires/retread/mark`, {
        method: "POST",
        body: JSON.stringify({
          tire_ids: selectedTires,
          user_id: user?.id,
          user_name: user?.full_name || user?.username || "System",
          notes: "Marked for retreading from dashboard"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Marked ${data.marked_tires.length} tires for retreading`);
        refreshData();
      } else {
        toast.error(data.error || "Failed to mark tires");
      }
    } catch (error) {
      console.error("Error marking tires:", error);
      toast.error("Failed to mark tires");
    }
  };

  const handleCreateOrder = () => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to create retread orders");
      return;
    }
    router.push("/retreads/create-batch");
  };

  const handleViewOrders = () => {
    router.push("/retreads/orders");
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/retreads/${orderId}`);
  };

  const handleReceiveOrder = (orderId: number) => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to receive retread orders");
      return;
    }
    router.push(`/retreads/${orderId}/receive`);
  };

  const handleSendOrder = async (orderId: number) => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to send retread orders");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/retread/retread-orders/${orderId}/send`, {
        method: "PUT",
        body: JSON.stringify({ 
          user_id: user?.id,
          user_name: user?.full_name || user?.username || "System"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Order marked as sent");
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || "Failed to send order");
      }
    } catch (error) {
      console.error("Error sending order:", error);
      toast.error("Failed to send order");
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "USED_STORE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "AWAITING_RETREAD":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      case "AT_RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700", icon: Clock },
      SENT: { color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800", icon: Truck },
      IN_PROGRESS: { color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800", icon: Package },
      COMPLETED: { color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800", icon: CheckCircle },
      CANCELLED: { color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800", icon: XCircle },
      RECEIVED: { color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800", icon: CheckCircle },
      PARTIALLY_RECEIVED: { color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800", icon: AlertCircle },
    };
    
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getMovementTypeColor = (type: string): string => {
    switch (type) {
      case "STORE_TO_RETREAD_SUPPLIER":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "RETREAD_SUPPLIER_TO_STORE":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid Date";
      
      const formatStr = systemSettings?.date_format || "MMM dd, yyyy";
      
      if (formatStr === "dd/MM/yyyy") {
        return format(date, "dd/MM/yyyy");
      } else if (formatStr === "MM/dd/yyyy") {
        return format(date, "MM/dd/yyyy");
      } else if (formatStr === "yyyy-MM-dd") {
        return format(date, "yyyy-MM-dd");
      } else if (formatStr === "dd-MM-yyyy") {
        return format(date, "dd-MM-yyyy");
      } else if (formatStr === "dd MMM yyyy") {
        return format(date, "dd MMM yyyy");
      } else {
        return format(date, "MMM dd, yyyy");
      }
    } catch {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid Date";
      const timeFormat = systemSettings?.time_format || "HH:mm";
      return `${formatDate(dateString)} ${format(date, timeFormat)}`;
    } catch {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(currency, currencySymbol);
  };

  const formatDistance = (distance?: number): string =>
    distance ? `${distance.toLocaleString()} km` : "Not recorded";

  const formatNumber = (num?: number): string => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString();
  };

  // Filter eligible tires
  const filteredEligibleTires = eligibleTires.filter(tire =>
    tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    tire.brand.toLowerCase().includes(search.toLowerCase()) ||
    tire.size.toLowerCase().includes(search.toLowerCase())
  ).filter(tire => sizeFilter === "all" || tire.size === sizeFilter);

  // Calculate summary stats
  const summaryStats = {
    eligible: eligibleTires.length,
    atSupplier: retreadMovements.filter(m => m.status === "AT_RETREAD_SUPPLIER").length,
    returned: retreadMovements.filter(m => m.movement_type === "RETREAD_SUPPLIER_TO_STORE").length,
    suppliers: suppliers.length,
    pendingOrders: retreadOrders.filter(o => o.status === "SENT" || o.status === "IN_PROGRESS").length,
    totalOrders: retreadOrders.length,
  };

  const clearFilters = () => {
    setSearch("");
    setSizeFilter("all");
    setIsFilterSheetOpen(false);
  };

  // Permission checks
  const canViewRetread = hasPermission("tire.retread") || hasPermission("inventory.view");
  const canCreateRetread = hasPermission("tire.retread");
  const canManageOrders = hasPermission("tire.retread");

  // Show loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied - fallback if redirect doesn't happen
  if (!canViewRetread) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Retreading Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage tire retreading process</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view retreading. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // If user has permission, render the page
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Retreading Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage tire retreading process from selection to return
          </p>
          {systemSettings?.company_name && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {systemSettings.company_name} • {currencySymbol} ({currency})
            </p>
          )}
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          {canManageOrders && (
            <>
              <Button variant="outline" onClick={handleViewOrders}>
                <ListOrdered className="mr-2 h-4 w-4" />
                Orders
              </Button>
              <Button onClick={handleCreateOrder}>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex sm:hidden items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsFilterSheetOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="mr-2 h-4 w-4" />
            Menu
          </Button>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Tires
            </SheetTitle>
            <SheetDescription>
              Apply filters to narrow down results
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by serial, brand, size..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Size Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Size</Label>
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {Array.from(new Set(eligibleTires.map(t => t.size))).map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1" 
                onClick={() => setIsFilterSheetOpen(false)}
              >
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Actions</SheetTitle>
            <SheetDescription>
              Choose an action to perform
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                refreshData();
                setIsMobileMenuOpen(false);
              }}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            
            {canManageOrders && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    handleViewOrders();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <ListOrdered className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    handleCreateOrder();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Order
                </Button>
              </>
            )}
            
            {canCreateRetread && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  router.push("/retreads/return");
                  setIsMobileMenuOpen(false);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Return from Retreading
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                router.push("/suppliers");
                setIsMobileMenuOpen(false);
              }}
            >
              <Building className="mr-2 h-4 w-4" />
              Manage Suppliers
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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
            <p className="text-xs text-muted-foreground">All suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="eligible" className="flex-1 sm:flex-initial">Eligible Tires</TabsTrigger>
            <TabsTrigger value="suppliers" className="flex-1 sm:flex-initial">Supplier Analysis</TabsTrigger>
          </TabsList>
          
          {/* Desktop Search and Filter */}
          <div className="hidden sm:flex items-center gap-2">
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
          </div>

          {/* Mobile Search and Filter Indicator */}
          <div className="sm:hidden">
            {(search || sizeFilter !== "all") && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {search && <span>Search: "{search}"</span>}
                      {sizeFilter !== "all" && (
                        <span className={search ? "ml-2" : ""}>
                          Size: {sizeFilter}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Eligible Tires Tab */}
        <TabsContent value="eligible">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Tires Eligible for Retreading</CardTitle>
                  <CardDescription>
                    Tires in USED_STORE status that can be sent for retreading
                  </CardDescription>
                </div>
                {selectedTires.length > 0 && canCreateRetread && (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedTires.length} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkForRetreading}
                      >
                        Mark
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendForRetreading}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-2 text-muted-foreground">Loading tires...</p>
                  </div>
                </div>
              ) : filteredEligibleTires.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No eligible tires found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search || sizeFilter !== "all" 
                      ? "Try adjusting your filters" 
                      : "No tires available for retreading"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            {canCreateRetread && (
                              <Checkbox
                                checked={selectedTires.length === filteredEligibleTires.length}
                                onCheckedChange={handleSelectAll}
                              />
                            )}
                          </TableHead>
                          <TableHead className="whitespace-nowrap">Serial #</TableHead>
                          <TableHead className="whitespace-nowrap">Size</TableHead>
                          <TableHead className="whitespace-nowrap">Brand & Model</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap">Depth</TableHead>
                          <TableHead className="whitespace-nowrap">Distance</TableHead>
                          <TableHead className="whitespace-nowrap">Installs</TableHead>
                          <TableHead className="whitespace-nowrap">Prev Retreads</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEligibleTires.map((tire) => (
                          <TableRow key={tire.id}>
                            <TableCell>
                              {canCreateRetread && (
                                <Checkbox
                                  checked={selectedTires.includes(tire.id)}
                                  onCheckedChange={() => handleSelectTire(tire.id)}
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-mono font-medium whitespace-nowrap">
                              {tire.serial_number}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">{tire.size}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div>
                                <div className="font-medium">{tire.brand}</div>
                                {tire.model && (
                                  <div className="text-sm text-muted-foreground">
                                    {tire.model}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={getStatusColor(tire.status)}
                              >
                                {tire.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
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
                            <TableCell className="whitespace-nowrap">{formatDistance(tire.total_distance)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">{formatNumber(tire.installation_count)}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">
                                {tire.retread_count || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => router.push(`/inventory/${tire.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {canCreateRetread && (
                                    <DropdownMenuItem onClick={() => handleSelectTire(tire.id)}>
                                      {selectedTires.includes(tire.id) ? (
                                        <>
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Deselect
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Select
                                        </>
                                      )}
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

                  {/* Mobile Tire Cards */}
                  <div className="md:hidden space-y-3">
                    {filteredEligibleTires.map((tire) => (
                      <MobileTireCard
                        key={tire.id}
                        tire={tire}
                        selected={selectedTires.includes(tire.id)}
                        onSelect={canCreateRetread ? handleSelectTire : () => {}}
                        onViewDetails={(id) => router.push(`/inventory/${id}`)}
                        getStatusColor={getStatusColor}
                        formatDistance={formatDistance}
                        formatNumber={formatNumber}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredEligibleTires.length} of {eligibleTires.length} eligible tires
              </div>
            </CardFooter>
          </Card>

          {/* Recent Movements - Desktop */}
          {retreadMovements.length > 0 && (
            <Card className="hidden md:block mt-4">
              <CardHeader>
                <CardTitle>Recent Movements</CardTitle>
                <CardDescription>
                  Latest tire movements to/from retread suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Serial #</TableHead>
                        <TableHead className="whitespace-nowrap">Supplier</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retreadMovements.slice(0, 5).map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(movement.movement_date)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={getMovementTypeColor(movement.movement_type)}
                            >
                              {movement.movement_type === "STORE_TO_RETREAD_SUPPLIER"
                                ? "Sent"
                                : "Returned"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-medium whitespace-nowrap">
                            {movement.serial_number}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{movement.supplier_name}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={getStatusColor(movement.status)}
                            >
                              {movement.status.replace(/_/g, " ")}
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

          {/* Recent Movements - Mobile */}
          {retreadMovements.length > 0 && (
            <div className="md:hidden mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {retreadMovements.slice(0, 3).map((movement) => (
                      <MobileMovementCard
                        key={movement.id}
                        movement={movement}
                        formatDate={formatDate}
                        getMovementTypeColor={getMovementTypeColor}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-2 text-muted-foreground">Loading supplier data...</p>
                  </div>
                </div>
              ) : supplierStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No supplier data</h3>
                  <p className="text-muted-foreground mt-1">
                    No retreading jobs recorded yet
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Supplier</TableHead>
                          <TableHead className="whitespace-nowrap">Contact Person</TableHead>
                          <TableHead className="whitespace-nowrap">Orders</TableHead>
                          <TableHead className="whitespace-nowrap">Tires Processed</TableHead>
                          <TableHead className="whitespace-nowrap">Avg Cost per Tire</TableHead>
                          <TableHead className="whitespace-nowrap">Avg Turnaround</TableHead>
                          <TableHead className="whitespace-nowrap">Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplierStats.map((supplier) => (
                          <TableRow key={`supplier-${supplier.id}`}>
                            <TableCell className="whitespace-nowrap">
                              <div>
                                <div className="font-medium">{supplier.name}</div>
                                {supplier.address && (
                                  <div className="text-xs text-muted-foreground">
                                    {supplier.address}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{supplier.contact_person || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">
                                {formatNumber(supplier.total_orders)}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">
                                {formatNumber(supplier.total_tires_processed)}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-medium">
                              {formatCurrency(supplier.average_cost_per_tire || 0)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline" className="bg-blue-50">
                                {supplier.avg_turnaround_days ? 
                                  `${Math.round(supplier.avg_turnaround_days)}d` : "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm">{supplier.phone || "-"}</div>
                              {supplier.email && (
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {supplier.email}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Supplier Cards */}
                  <div className="md:hidden space-y-3">
                    {supplierStats.map((supplier) => (
                      <MobileSupplierCard
                        key={supplier.id}
                        supplier={supplier}
                        formatCurrency={formatCurrency}
                        formatNumber={formatNumber}
                      />
                    ))}
                  </div>
                </>
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

      {/* Quick Actions - Desktop */}
      <div className="hidden md:grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canCreateRetread && (
              <>
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
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Return from Retreading
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleViewOrders}
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              View All Retread Orders
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/suppliers")}
            >
              <Building className="mr-2 h-4 w-4" />
              Manage Suppliers
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
                          style={{ width: `${Math.min(100, (summaryStats.eligible / 50) * 100)}%` }}
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
                          style={{ width: `${Math.min(100, (summaryStats.pendingOrders / 20) * 100)}%` }}
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
                          style={{ width: `${Math.min(100, (summaryStats.atSupplier / 30) * 100)}%` }}
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
                          style={{ width: `${Math.min(100, (summaryStats.returned / 40) * 100)}%` }}
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

      {/* Quick Actions - Mobile */}
      <div className="md:hidden space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canCreateRetread && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCreateOrder}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Retread Order
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleViewOrders}
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              View All Retread Orders
            </Button>
            {canCreateRetread && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/retreads/return")}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Return from Retreading
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retread Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-xs text-muted-foreground">Sent</div>
                  <div className="text-lg font-bold text-blue-600">
                    {retreadOrders.filter(o => o.status === "SENT").length}
                  </div>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <div className="text-xs text-muted-foreground">In Progress</div>
                  <div className="text-lg font-bold text-yellow-600">
                    {retreadOrders.filter(o => o.status === "IN_PROGRESS").length}
                  </div>
                </div>
                <div className="p-2 bg-muted/30 rounded col-span-2">
                  <div className="text-xs text-muted-foreground">Completed</div>
                  <div className="text-lg font-bold text-green-600">
                    {retreadOrders.filter(o => o.status === "COMPLETED" || o.status === "RECEIVED").length}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
  );
}

// Missing Label component
const Label = ({ children, className, ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props}>
    {children}
  </label>
);