"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  ArrowRight,
  Package,
  Calendar,
  AlertCircle,
  ChevronDown,
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Loader2,
  Filter,
  Menu,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Gauge,
  RotateCcw,
  DollarSign,
  Info,
  CheckCircle,
  Link,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  status: "USED_STORE" | "AWAITING_RETREAD";
  depth_remaining: number;
  tread_depth_new: number;
  installation_count: number;
  total_distance: number;
  retread_count?: number;
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
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Mobile Tire Card Component
const MobileTireCard = ({
  tire,
  selected,
  onSelect,
  formatDistance,
  formatDate,
  formatCurrency,
}: {
  tire: Tire;
  selected: boolean;
  onSelect: (id: number) => void;
  formatDistance: (distance?: number) => string;
  formatDate: (dateString: string) => string;
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
                    className={
                      tire.status === "USED_STORE"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                        : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                    }
                  >
                    {tire.status.replace("_", " ")}
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
            <div className="mt-3">
              <div className="font-medium">{tire.brand}</div>
              {tire.model && (
                <div className="text-sm text-muted-foreground">{tire.model}</div>
              )}
            </div>

            {/* Tread Depth */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Tread Depth</span>
                <span className="font-medium">{tire.depth_remaining}mm</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${Math.min(100, treadPercentage)}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Distance</div>
                <div className="text-sm font-medium">{formatDistance(tire.total_distance)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Installs</div>
                <div className="text-sm font-medium">
                  <Badge variant="outline" className="text-xs">
                    {tire.installation_count}
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
          <div className="mt-4 space-y-2 border-t pt-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Purchase Date:</span>
              <span className="text-sm">{formatDate(new Date().toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Purchase Cost:</span>
              <span className="text-sm">{formatCurrency(0)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Supplier Card Component
const MobileSupplierCard = ({
  supplier,
  selected,
  onSelect,
  formatCurrency,
}: {
  supplier: Supplier;
  selected: boolean;
  onSelect: (supplier: Supplier) => void;
  formatCurrency: (amount?: number) => string;
}) => {
  return (
    <Card 
      className={`mb-2 last:mb-0 cursor-pointer transition-colors ${
        selected ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={() => onSelect(supplier)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium">{supplier.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {supplier.contact_person || "No contact"}
            </div>
          </div>
          {selected && (
            <CheckCircle className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {supplier.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.average_cost_per_tire && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span>{formatCurrency(supplier.average_cost_per_tire)}/tire</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton Components
const TireCardSkeleton = () => (
  <Card className="mb-3">
    <CardContent className="p-4">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-full mt-3" />
    </CardContent>
  </Card>
);

export default function CreateRetreadBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [activeTab, setActiveTab] = useState("tires");
  const [tires, setTires] = useState<Tire[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  
  // Mobile state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSupplierSheetOpen, setIsSupplierSheetOpen] = useState(false);
  
  // Selection state
  const [selectedTires, setSelectedTires] = useState<number[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierOpen, setSupplierOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  
  // Review tab state
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("tire.retread")) {
        toast.error("You don't have permission to create retread orders");
        router.push("/retreads");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  // Check for pre-selected tires from URL
  useEffect(() => {
    const tiresParam = searchParams.get("tires");
    if (tiresParam) {
      const tireIds = tiresParam.split(",").map(Number);
      setSelectedTires(tireIds);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("tire.retread")) {
      Promise.all([fetchEligibleTires(), fetchSuppliers()]);
    }
  }, [isAuthenticated, hasPermission]);

  const fetchEligibleTires = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/tires/retread/eligible`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<Tire[]> = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Ensure all tires have required fields
        setTires(data.data.map((tire: any) => ({
          ...tire,
          total_distance: tire.total_distance || 0,
          installation_count: tire.installation_count || 0,
          retread_count: tire.retread_count || 0
        })));
      } else if (Array.isArray(data)) {
        // Handle direct array response
        setTires(data.map((tire: any) => ({
          ...tire,
          total_distance: tire.total_distance || 0,
          installation_count: tire.installation_count || 0,
          retread_count: tire.retread_count || 0
        })));
      } else {
        console.error("Unexpected API response structure:", data);
        setTires([]);
        setError(data.error || "Failed to fetch eligible tires");
        toast.error(data.error || "Failed to fetch eligible tires");
      }
    } catch (error) {
      console.error("Error fetching tires:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch tires");
      toast.error("Failed to fetch tires");
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
      
      let suppliersData: Supplier[] = [];
      
      if (data.success && Array.isArray(data.data)) {
        suppliersData = data.data;
      } else if (Array.isArray(data)) {
        suppliersData = data;
      } else if (data.data && Array.isArray(data.data)) {
        suppliersData = data.data;
      } else {
        console.error("Unexpected API response structure:", data);
        setError("Failed to parse suppliers data");
        toast.error("Failed to parse suppliers data");
        setSuppliers([]);
        return;
      }
      
      // ✅ no filtering
      setSuppliers(suppliersData);

      if (suppliersData.length > 0 && !selectedSupplier) {
        setSelectedSupplier(suppliersData[0]);
      }

    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch suppliers");
      toast.error("Failed to fetch suppliers");
      setSuppliers([]);
    }
  };

  const handleSelectTire = (tireId: number) => {
    setSelectedTires(prev =>
      prev.includes(tireId)
        ? prev.filter(id => id !== tireId)
        : [...prev, tireId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTires.length === filteredTires.length) {
      setSelectedTires([]);
    } else {
      setSelectedTires(filteredTires.map(t => t.id));
    }
  };

  const handleNext = async () => {
    if (selectedTires.length === 0) {
        toast.error("Please select at least one tire");
        return;
    }

    if (!selectedSupplier) {
        toast.error("Please select a retread supplier");
        return;
    }

    if (activeTab === "review") {
        // Create the retread order
        try {
            setSubmitting(true);
            setError(null);
            
            // Validate expected date
            if (expectedDate && new Date(expectedDate) < new Date()) {
                toast.error("Expected completion date must be in the future");
                setSubmitting(false);
                return;
            }

            const response = await authFetch(`${API_BASE_URL}/api/retread/retread-orders`, {
                method: "POST",
                body: JSON.stringify({
                    supplier_id: selectedSupplier.id,
                    tire_ids: selectedTires,
                    expected_completion_date: expectedDate || undefined,
                    notes: notes || undefined,
                    user_id: user?.id,
                    user_name: user?.full_name || user?.username || "System",
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Show success message with order number
                toast.success(
                    <div>
                        <strong>Retread order created successfully!</strong>
                        <br />
                        Order Number: <span className="font-mono font-bold">{data.data.order_number}</span>
                    </div>,
                    {
                        duration: 6000,
                        action: {
                            label: "View Order",
                            onClick: () => router.push(`/retreads/${data.data.id}?order_number=${data.data.order_number}`)
                        }
                    }
                );
                
                // Short delay to show the toast before redirecting
                setTimeout(() => {
                    router.push(`/retreads/${data.data.id}?order_number=${data.data.order_number}`);
                }, 1500);
            } else {
                setError(data.error || data.message || "Error creating retread order");
                toast.error(data.error || data.message || "Error creating retread order");
            }
        } catch (error) {
            console.error("Error creating retread order:", error);
            setError(error instanceof Error ? error.message : "Failed to create retread order");
            toast.error("Failed to create retread order");
        } finally {
            setSubmitting(false);
        }
    } else {
        // Move to next tab
        if (activeTab === "tires") {
            setActiveTab("supplier");
        } else if (activeTab === "supplier") {
            setActiveTab("review");
        }
    }
  };

  const handleBack = () => {
    router.push('/retreads');
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name);
    setSupplierOpen(false);
    setIsSupplierSheetOpen(false);
  };

  const handleClearSupplier = () => {
    setSelectedSupplier(null);
    setSupplierSearch("");
  };

  const formatDate = (dateString: string): string => {
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

  const formatDistance = (distance?: number) => {
    if (!distance && distance !== 0) return "N/A";
    return distance.toLocaleString() + " km";
  };

  const formatCurrency = (amount?: number) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(currency, currencySymbol);
  };

  // Get unique sizes from tires
  const uniqueSizes = useMemo(() => 
    Array.from(new Set(tires.map(t => t.size))).sort(),
    [tires]
  );

  // Filter tires based on search and size filter
  const filteredTires = useMemo(() => 
    tires.filter(tire => {
      const matchesSearch = 
        tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
        tire.brand.toLowerCase().includes(search.toLowerCase()) ||
        tire.model?.toLowerCase().includes(search.toLowerCase()) ||
        tire.size.toLowerCase().includes(search.toLowerCase());
      
      const matchesSize = sizeFilter === "all" || tire.size === sizeFilter;
      
      return matchesSearch && matchesSize;
    }),
    [tires, search, sizeFilter]
  );

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    
    const searchTerm = supplierSearch.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm) ||
      supplier.phone?.toLowerCase().includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm)
    );
  }, [suppliers, supplierSearch]);

  // Calculate selected tires summary
  const selectedTiresData = useMemo(() => 
    tires.filter(t => selectedTires.includes(t.id)),
    [tires, selectedTires]
  );

  const summaryStats = useMemo(() => ({
    totalTires: selectedTires.length,
    uniqueSizes: new Set(selectedTiresData.map(t => t.size)).size,
    uniqueBrands: new Set(selectedTiresData.map(t => t.brand)).size,
    totalRetreadCount: selectedTiresData.reduce((sum, t) => sum + (t.retread_count || 0), 0),
    avgDepth: selectedTiresData.reduce((sum, t) => sum + t.depth_remaining, 0) / (selectedTires.length || 1),
  }), [selectedTiresData, selectedTires.length]);

  const clearFilters = () => {
    setSearch("");
    setSizeFilter("all");
    setIsFilterSheetOpen(false);
  };

  // Show loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied - fallback if redirect doesn't happen
  if (!hasPermission("tire.retread")) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Retread Order</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Access denied</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create retread orders. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="mt-4 w-full sm:w-auto">
          <Link href="/retreads">Return to Retreads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleBack}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Retread Order</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Select tires and configure retreading parameters
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {systemSettings.company_name} • {currencySymbol} ({currency})
              </p>
            )}
          </div>
        </div>
        {selectedTires.length > 0 && activeTab === "tires" && (
          <div className="sm:hidden">
            <Button onClick={handleNext} className="w-full" disabled={submitting}>
              Continue to Supplier
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Mobile Continue Button (for tabs after tires) */}
      {selectedTires.length > 0 && activeTab !== "tires" && (
        <div className="sm:hidden">
          <Button onClick={handleNext} className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : activeTab === "review" ? (
              "Create Order"
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      )}

      {/* Desktop Continue Button */}
      {selectedTires.length > 0 && (
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">
            {selectedTires.length} tire{selectedTires.length !== 1 ? 's' : ''} selected
          </span>
          <Button onClick={handleNext} disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            {activeTab === "review" ? "Create Order" : "Continue"}
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tires" disabled={initializing} className="text-xs sm:text-sm">
            <Package className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Select</span> Tires
          </TabsTrigger>
          <TabsTrigger value="supplier" disabled={selectedTires.length === 0 || initializing} className="text-xs sm:text-sm">
            <Building className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Choose</span> Supplier
          </TabsTrigger>
          <TabsTrigger value="review" disabled={selectedTires.length === 0 || !selectedSupplier || initializing} className="text-xs sm:text-sm">
            <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Review &</span> Create
          </TabsTrigger>
        </TabsList>

        {/* Select Tires Tab */}
        <TabsContent value="tires">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Select Tires for Retreading</CardTitle>
                  <CardDescription>
                    Choose tires from USED_STORE status to send for retreading
                  </CardDescription>
                </div>
                
                {/* Desktop Search and Filter */}
                <div className="hidden sm:flex items-center gap-2">
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
                  <Select value={sizeFilter} onValueChange={setSizeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      {uniqueSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mobile Filter Button */}
                <div className="sm:hidden">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsFilterSheetOpen(true)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter Tires
                  </Button>
                </div>
              </div>
            </CardHeader>

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
                        {uniqueSizes.map(size => (
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

            <CardContent>
              {/* Mobile Filter Summary */}
              <div className="sm:hidden mb-4">
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
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <TireCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredTires.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No tires found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search ? "Try a different search term" : "No eligible tires available"}
                  </p>
                  {!search && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/inventory')}
                    >
                      View Inventory
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedTires.length === filteredTires.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="whitespace-nowrap">Serial #</TableHead>
                          <TableHead className="whitespace-nowrap">Size</TableHead>
                          <TableHead className="whitespace-nowrap">Brand & Model</TableHead>
                          <TableHead className="whitespace-nowrap">Status</TableHead>
                          <TableHead className="whitespace-nowrap">Depth</TableHead>
                          <TableHead className="whitespace-nowrap">Distance</TableHead>
                          <TableHead className="whitespace-nowrap">Installs</TableHead>
                          <TableHead className="whitespace-nowrap">Prev Retreads</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTires.map((tire) => (
                          <TableRow key={tire.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedTires.includes(tire.id)}
                                onCheckedChange={() => handleSelectTire(tire.id)}
                              />
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
                              <Badge variant="outline" className={
                                tire.status === "USED_STORE"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                                  : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                              }>
                                {tire.status.replace("_", " ")}
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
                              <Badge variant="outline">{tire.installation_count}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">
                                {tire.retread_count || 0}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Tire Cards */}
                  <div className="md:hidden space-y-3">
                    {filteredTires.map((tire) => (
                      <MobileTireCard
                        key={tire.id}
                        tire={tire}
                        selected={selectedTires.includes(tire.id)}
                        onSelect={handleSelectTire}
                        formatDistance={formatDistance}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-4 sm:px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTires.length} of {tires.length} eligible tires
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Choose Supplier Tab */}
        <TabsContent value="supplier">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Choose Retread Supplier</CardTitle>
              <CardDescription>
                Select a supplier for the retreading job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Desktop Supplier Selection */}
                <div className="hidden sm:block space-y-2">
                  <Label htmlFor="supplier-search">Search Supplier *</Label>
                  <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={supplierOpen}
                        className="w-full justify-between"
                      >
                        {selectedSupplier ? (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>{selectedSupplier.name}</span>
                          </div>
                        ) : (
                          "Select supplier..."
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search suppliers..."
                          value={supplierSearch}
                          onValueChange={setSupplierSearch}
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No suppliers found.</CommandEmpty>
                          <CommandGroup>
                            {filteredSuppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.id}
                                value={supplier.name}
                                onSelect={() => handleSupplierSelect(supplier)}
                              >
                                <div className="flex flex-col">
                                  <div className="font-medium">{supplier.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {supplier.contact_person} • {supplier.phone}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {selectedSupplier && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-muted-foreground">
                        Selected: <span className="font-medium">{selectedSupplier.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSupplier}
                        className="h-6 px-2"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Supplier Selection */}
                <div className="sm:hidden space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setIsSupplierSheetOpen(true)}
                  >
                    {selectedSupplier ? (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{selectedSupplier.name}</span>
                      </div>
                    ) : (
                      "Select supplier..."
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>

                  <Sheet open={isSupplierSheetOpen} onOpenChange={setIsSupplierSheetOpen}>
                    <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Select Supplier
                        </SheetTitle>
                        <SheetDescription>
                          Choose a retread supplier for this order
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4">
                        <div className="relative mb-4">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search suppliers..."
                            className="pl-8"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                          {filteredSuppliers.length === 0 ? (
                            <div className="text-center py-8">
                              <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No suppliers found</p>
                            </div>
                          ) : (
                            filteredSuppliers.map((supplier) => (
                              <MobileSupplierCard
                                key={supplier.id}
                                supplier={supplier}
                                selected={selectedSupplier?.id === supplier.id}
                                onSelect={handleSupplierSelect}
                                formatCurrency={formatCurrency}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {selectedSupplier && (
                  <Card>
                    <CardContent className="pt-4 sm:pt-6">
                      <h4 className="font-medium mb-4">Supplier Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{selectedSupplier.name}</div>
                            {selectedSupplier.contact_person && (
                              <div className="text-sm text-muted-foreground">
                                {selectedSupplier.contact_person}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedSupplier.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="text-sm">{selectedSupplier.phone}</div>
                            </div>
                          )}
                          
                          {selectedSupplier.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="text-sm truncate">{selectedSupplier.email}</div>
                            </div>
                          )}
                        </div>
                        
                        {selectedSupplier.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="text-sm">{selectedSupplier.address}</div>
                          </div>
                        )}
                        
                        {selectedSupplier.average_cost_per_tire && (
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Average Cost per Tire:</span>
                              <span className="font-medium">
                                {formatCurrency(selectedSupplier.average_cost_per_tire)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Selected Tires Summary */}
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <h4 className="font-medium mb-2">Selected Tires Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tires:</span>
                        <span className="font-medium">{summaryStats.totalTires}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unique Sizes:</span>
                        <span className="font-medium">{summaryStats.uniqueSizes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unique Brands:</span>
                        <span className="font-medium">{summaryStats.uniqueBrands}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Previous Retreads:</span>
                        <span className="font-medium">{summaryStats.totalRetreadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Depth:</span>
                        <span className="font-medium">{summaryStats.avgDepth.toFixed(1)}mm</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedSupplier?.average_cost_per_tire && (
                  <Card>
                    <CardContent className="pt-4 sm:pt-6">
                      <h4 className="font-medium mb-2">Estimated Cost</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost per Tire:</span>
                          <span className="font-medium">{formatCurrency(selectedSupplier.average_cost_per_tire)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Total Estimated Cost:</span>
                          <span className="font-bold text-base sm:text-lg">
                            {formatCurrency(selectedSupplier.average_cost_per_tire * selectedTires.length)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Desktop Continue Button */}
                <div className="hidden sm:flex justify-end">
                  <Button onClick={handleNext} disabled={!selectedSupplier}>
                    Continue to Review
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Review & Create Order</CardTitle>
              <CardDescription>
                Review your selection before creating the retread order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Warning Banner */}
                <div className="flex items-start gap-2 p-3 sm:p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Ready to Create</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      You are about to create a retread order for {selectedTires.length} tire
                      {selectedTires.length !== 1 ? 's' : ''} with {selectedSupplier?.name}. 
                      This will mark the tires as awaiting retreading.
                    </p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tire Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Tires:</span>
                          <span className="font-medium">{summaryStats.totalTires}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unique Sizes:</span>
                          <span className="font-medium">{summaryStats.uniqueSizes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unique Brands:</span>
                          <span className="font-medium">{summaryStats.uniqueBrands}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Average Depth:</span>
                          <span className="font-medium">{summaryStats.avgDepth.toFixed(1)}mm</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Supplier Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{selectedSupplier?.name}</div>
                        {selectedSupplier?.contact_person && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contact:</span>
                            <span>{selectedSupplier.contact_person}</span>
                          </div>
                        )}
                        {selectedSupplier?.phone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span>{selectedSupplier.phone}</span>
                          </div>
                        )}
                        {selectedSupplier?.average_cost_per_tire && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg. Cost/Tire:</span>
                              <span className="font-medium">
                                {formatCurrency(selectedSupplier.average_cost_per_tire)}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold mt-1">
                              <span>Total Estimated:</span>
                              <span className="text-primary">
                                {formatCurrency(selectedSupplier.average_cost_per_tire * selectedTires.length)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Date and Notes */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected-date">
                      Expected Completion Date <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="expected-date"
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty if not specified
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      Notes <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="notes"
                      placeholder="Add any additional notes or instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Desktop Action Buttons */}
                <div className="hidden sm:flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("supplier")}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={submitting}
                    className="min-w-[180px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Create Retread Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile Action Buttons (for review tab) */}
      {activeTab === "review" && (
        <div className="sm:hidden flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setActiveTab("supplier")}
            disabled={submitting}
          >
            Back
          </Button>
          <Button 
            className="flex-1"
            onClick={handleNext} 
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Order"
            )}
          </Button>
        </div>
      )}

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