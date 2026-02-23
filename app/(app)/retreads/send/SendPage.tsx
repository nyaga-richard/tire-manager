"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Truck,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Package,
  ChevronDown,
  Building,
  Phone,
  Mail,
  MapPin,
  Info,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  type: "NEW";
  status: "USED_STORE" | "AWAITING_RETREAD";
  purchase_date: string;
  purchase_cost: number;
  depth_remaining: number;
  tread_depth_new: number;
  installation_count: number;
  total_distance: number;
}

interface Supplier {
  id: number;
  name: string;
  type: "RETREAD";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  average_retread_cost?: number;
}

// Mobile Tire Card Component
const MobileTireCard = ({
  tire,
  formatDistance,
  formatDate,
  formatCurrency,
}: {
  tire: Tire;
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
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-mono font-medium text-sm">
              {tire.serial_number}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {tire.size}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">{tire.brand}</span>
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
          {/* Tread Depth */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
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
              <div className="text-sm font-medium">{tire.installation_count}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <Badge variant="outline" className="text-xs">
                {tire.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-2 border-t pt-3">
            {tire.model && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Model:</span>
                <span className="text-sm">{tire.model}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Purchase Date:</span>
              <span className="text-sm">{formatDate(tire.purchase_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Purchase Cost:</span>
              <span className="text-sm">{formatCurrency(tire.purchase_cost)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Supplier Info Card
const MobileSupplierCard = ({ 
  supplier,
  formatCurrency 
}: { 
  supplier: Supplier | undefined;
  formatCurrency: (amount: number) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!supplier) return null;

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Supplier Details</h3>
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

        <div className="mt-2">
          <div className="font-medium">{supplier.name}</div>
          {supplier.contact_person && (
            <div className="text-sm text-muted-foreground">{supplier.contact_person}</div>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-2 border-t pt-3">
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{supplier.email}</span>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                <span className="flex-1">{supplier.address}</span>
              </div>
            )}
            {supplier.average_retread_cost && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Avg Cost/Tire:</span>
                <span className="font-medium">{formatCurrency(supplier.average_retread_cost)}</span>
              </div>
            )}
          </div>
        )}
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

export default function SendForRetreadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tireIdsParam = searchParams.get("tires");
  
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();

  const [selectedTires, setSelectedTires] = useState<Tire[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile state
  const [isNoticeSheetOpen, setIsNoticeSheetOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    send_date: new Date(),
    expected_cost: "",
    notes: "",
    user_id: user?.id?.toString() || "",
  });

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("tire.retread")) {
        toast.error("You don't have permission to send tires for retreading");
        router.push("/retreads");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (tireIdsParam && isAuthenticated && hasPermission("tire.retread")) {
      fetchSelectedTires();
    }
    if (isAuthenticated && hasPermission("tire.retread")) {
      fetchSuppliers();
    }
  }, [tireIdsParam, isAuthenticated, hasPermission]);

  const fetchSelectedTires = async () => {
    try {
      setError(null);
      const tireIds = tireIdsParam?.split(",").map(Number);
      const tireData: Tire[] = [];
      
      for (const id of tireIds || []) {
        try {
          const response = await authFetch(`${API_BASE_URL}/api/tires/${id}`);
          if (response.ok) {
            const tire = await response.json();
            if (tire && tire.id) {
              tireData.push(tire);
            }
          }
        } catch (err) {
          console.error(`Error fetching tire ${id}:`, err);
        }
      }
      
      setSelectedTires(tireData);
      
      if (tireData.length === 0) {
        setError("No valid tires found. Please go back and select tires.");
      }
    } catch (error) {
      console.error("Error fetching tires:", error);
      setError("Failed to load selected tires");
      toast.error("Failed to load selected tires");
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch(`${API_BASE_URL}/api/suppliers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Supplier[] = await response.json(); // API returns raw array

      if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
        setFormData(prev => ({
          ...prev,
          supplier_id: data[0].id.toString(), // auto-select first supplier
          user_id: user?.id?.toString() || "",
        }));
      } else {
        console.warn("No suppliers found", data);
        setSuppliers([]);
        setFormData(prev => ({ ...prev, supplier_id: "" }));
        setError("No retread suppliers found. Please add suppliers first.");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError("Failed to load suppliers");
      toast.error("Failed to load suppliers");
      setSuppliers([]);
      setFormData(prev => ({ ...prev, supplier_id: "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to send tires for retreading");
      return;
    }

    if (selectedTires.length === 0) {
      toast.error("No tires selected");
      return;
    }

    if (!formData.supplier_id) {
      toast.error("Please select a retread supplier");
      return;
    }

    if (!formData.expected_cost || parseFloat(formData.expected_cost) <= 0) {
      toast.error("Please enter a valid expected cost");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        tire_ids: selectedTires.map(t => t.id),
        supplier_id: parseInt(formData.supplier_id),
        send_date: format(formData.send_date, "yyyy-MM-dd"),
        expected_cost: parseFloat(formData.expected_cost),
        user_id: user?.id,
        user_name: user?.full_name || user?.username || "System",
        notes: formData.notes,
      };

      const response = await authFetch(`${API_BASE_URL}/api/tires/retread/send-batch`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully sent ${data.sent_tires.length} tires for retreading`);
        router.push("/retreads");
      } else {
        throw new Error(data.error || "Failed to send tires");
      }
    } catch (error) {
      console.error("Error sending tires:", error);
      setError(error instanceof Error ? error.message : "Failed to send tires for retreading");
      toast.error("Failed to send tires for retreading");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalCost = () => {
    const perTireCost = parseFloat(formData.expected_cost) || 0;
    return perTireCost * selectedTires.length;
  };

  const getSelectedSupplier = () => {
    return suppliers.find(s => s.id.toString() === formData.supplier_id);
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

  const formatDateTime = (dateString: string): string => {
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace(currency, currencySymbol);
  };

  const formatDistance = (distance?: number) => {
    if (!distance && distance !== 0) return "N/A";
    return distance.toLocaleString() + " km";
  };

  // Show loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
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
      <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/retreads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Send Tires for Retreading
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              You don't have permission to access this page
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to send tires for retreading. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/retreads">Return to Retreads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href="/retreads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
            Send Tires for Retreading
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            {selectedTires.length} tire{selectedTires.length !== 1 ? 's' : ''} selected
          </p>
          {systemSettings?.company_name && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {systemSettings.company_name} • {currencySymbol} ({currency})
            </p>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Selected Tires */}
            <div className="lg:col-span-2 space-y-6">
              {/* Desktop Tires Table */}
              <Card className="hidden sm:block">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Selected Tires</CardTitle>
                  <CardDescription>
                    {selectedTires.length} tires selected for retreading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTires.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No tires selected</h3>
                      <p className="text-muted-foreground mt-1">
                        Go back to select tires for retreading
                      </p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/retreads">
                          Select Tires
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Serial #</TableHead>
                            <TableHead className="whitespace-nowrap">Size</TableHead>
                            <TableHead className="whitespace-nowrap">Brand & Model</TableHead>
                            <TableHead className="whitespace-nowrap">Depth</TableHead>
                            <TableHead className="whitespace-nowrap">Distance</TableHead>
                            <TableHead className="whitespace-nowrap">Installs</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTires.map((tire) => (
                            <TableRow key={tire.id}>
                              <TableCell className="font-mono font-medium whitespace-nowrap">
                                {tire.serial_number}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant="outline">{tire.size}</Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div>
                                  <div className="font-medium">{tire.brand}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {tire.model}
                                  </div>
                                </div>
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
                              <TableCell className="whitespace-nowrap">
                                {formatDistance(tire.total_distance)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Badge variant="outline">{tire.installation_count}</Badge>
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
                    Total tires: {selectedTires.length}
                  </div>
                </CardFooter>
              </Card>

              {/* Mobile Tires Cards */}
              <div className="sm:hidden space-y-3">
                {selectedTires.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-40 text-center p-4">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No tires selected</h3>
                      <p className="text-muted-foreground mt-1">
                        Go back to select tires
                      </p>
                      <Button variant="outline" className="mt-4 w-full" asChild>
                        <Link href="/retreads">
                          Select Tires
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-3">
                        <div className="text-sm font-medium mb-2">
                          {selectedTires.length} tire{selectedTires.length !== 1 ? 's' : ''} selected
                        </div>
                      </CardContent>
                    </Card>
                    {selectedTires.map((tire) => (
                      <MobileTireCard
                        key={tire.id}
                        tire={tire}
                        formatDistance={formatDistance}
                        formatDate={formatDate}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Notes Card - Desktop */}
              <Card className="hidden sm:block">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                  <CardDescription>
                    Add notes or special instructions for the retreader
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes / Instructions</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any special instructions or notes for the retreader..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Retread Details */}
            <div className="space-y-6">
              {/* Mobile Notice Button */}
              {selectedTires.length > 0 && (
                <div className="sm:hidden">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setIsNoticeSheetOpen(true)}
                  >
                    <span className="flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      Important Notice
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Mobile Notice Sheet */}
              <Sheet open={isNoticeSheetOpen} onOpenChange={setIsNoticeSheetOpen}>
                <SheetContent side="bottom" className="h-auto rounded-t-xl">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      Important Notice
                    </SheetTitle>
                    <SheetDescription>
                      What happens when you send tires for retreading
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        Sending {selectedTires.length} tire{selectedTires.length > 1 ? 's' : ''} for retreading will:
                      </p>
                      <ul className="space-y-2 text-sm text-yellow-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Change tire status to "AT_RETREAD_SUPPLIER"</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Update supplier ledger</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Create movement records</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Tires will be unavailable until returned</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Retread Details</CardTitle>
                  <CardDescription>
                    Configure retreading parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Supplier Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Retread Supplier *</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => handleInputChange("supplier_id", value)}
                    >
                      <SelectTrigger id="supplier">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Desktop Supplier Details */}
                    <div className="hidden sm:block">
                      {getSelectedSupplier() && (
                        <div className="text-sm text-muted-foreground p-2 border rounded-md bg-gray-50 mt-2">
                          <div className="font-medium">{getSelectedSupplier()?.contact_person}</div>
                          <div>{getSelectedSupplier()?.phone}</div>
                          <div>{getSelectedSupplier()?.email}</div>
                          <div className="truncate">{getSelectedSupplier()?.address}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Supplier Card */}
                  <div className="sm:hidden">
                    <MobileSupplierCard 
                      supplier={getSelectedSupplier()} 
                      formatCurrency={formatCurrency}
                    />
                  </div>

                  {/* Send Date */}
                  <div className="space-y-2">
                    <Label htmlFor="send_date">Send Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.send_date && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.send_date ? (
                            format(formData.send_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.send_date}
                          onSelect={(date) => date && handleInputChange("send_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Expected Cost */}
                  <div className="space-y-2">
                    <Label htmlFor="expected_cost">Expected Cost per Tire ({currencySymbol}) *</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        id="expected_cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.expected_cost}
                        onChange={(e) => handleInputChange("expected_cost", e.target.value)}
                        placeholder="250.00"
                        required
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <Card>
                    <CardContent className="pt-4 sm:pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Cost per tire:</span>
                          <span className="font-medium">
                            {formatCurrency(parseFloat(formData.expected_cost || "0"))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Number of tires:</span>
                          <span className="font-medium">{selectedTires.length}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Estimated Total:</span>
                          <span className="text-primary">{formatCurrency(calculateTotalCost())}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mobile Notes */}
                  <div className="sm:hidden space-y-2">
                    <Label htmlFor="mobile-notes">Notes / Instructions</Label>
                    <Textarea
                      id="mobile-notes"
                      placeholder="Add any special instructions..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Notice Card */}
              {selectedTires.length > 0 && (
                <Card className="hidden sm:block">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-yellow-700">
                          <p className="font-medium">Important Notice</p>
                          <p className="mt-1">
                            Sending {selectedTires.length} tire{selectedTires.length > 1 ? 's' : ''} for retreading will:
                          </p>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>Change tire status to "AT_RETREAD_SUPPLIER"</li>
                            <li>Update supplier ledger</li>
                            <li>Create movement records</li>
                            <li>Tires will be unavailable until returned</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Card */}
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 order-2 sm:order-1"
                        onClick={() => router.back()}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 order-1 sm:order-2"
                        disabled={selectedTires.length === 0 || !formData.supplier_id || submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Send for Retreading
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
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