"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Badge as BadgeIcon,
  Menu,
  ChevronDown,
  ChevronRight,
  Truck,
  Building,
  Calendar,
  Package,
  DollarSign,
  FileText,
  Info,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { useTaxRates } from "@/hooks/useTaxRates";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Supplier {
  id: number;
  name: string;
  type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  balance?: number;
  payment_term_id?: number;
  payment_term_name?: string;
  payment_term_days?: number;
}

interface TireSize {
  id?: number;
  size: string;
  description?: string;
}

interface TaxRate {
  id: number;
  name: string;
  rate: number;
  type: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
}

interface PurchaseOrderItem {
  id: number;
  size: string;
  quantity: number;
  vatInclusivePrice: number;
  lineTotalIncludingVAT: number;
  priceExcludingVAT: number;
  lineTotalExcludingVAT: number;
}

// Mobile Item Card Component
const MobileItemCard = ({
  item,
  index,
  sizes,
  sizesLoading,
  onUpdate,
  onRemove,
  loading,
  currencySymbol,
  selectedTaxRate,
  VAT_RATE,
  formData,
}: {
  item: PurchaseOrderItem;
  index: number;
  sizes: TireSize[];
  sizesLoading: boolean;
  onUpdate: (index: number, field: keyof PurchaseOrderItem, value: any) => void;
  onRemove: (index: number) => void;
  loading: boolean;
  currencySymbol: string;
  selectedTaxRate?: TaxRate;
  VAT_RATE: number;
  formData: any; // Pass formData to check items length
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0 relative">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              {index + 1}
            </div>
            <h3 className="font-medium">Item #{index + 1}</h3>
          </div>
          <div className="flex gap-1">
            {formData.items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Basic Info - Always visible */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Size</div>
            <div className="text-sm font-medium truncate">
              {item.size || "Not selected"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Quantity</div>
            <div className="text-sm font-medium">{item.quantity}</div>
          </div>
        </div>

        <div className="mt-2 flex justify-between items-center">
          <div>
            <div className="text-xs text-muted-foreground">Price per tire</div>
            <div className="text-sm font-medium">
              {currencySymbol} {item.vatInclusivePrice.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Line Total</div>
            <div className="text-sm font-bold text-primary">
              {currencySymbol} {item.lineTotalIncludingVAT.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Tire Size */}
            <div className="space-y-1">
              <Label className="text-xs">
                Tire Size <span className="text-red-500">*</span>
              </Label>
              <Select
                value={item.size}
                onValueChange={(value) => onUpdate(index, "size", value)}
                disabled={loading || sizesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading sizes...
                    </SelectItem>
                  ) : sizes.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No sizes available
                    </SelectItem>
                  ) : (
                    sizes.map((size) => (
                      <SelectItem key={size.size} value={size.size}>
                        <div className="flex flex-col">
                          <span>{size.size}</span>
                          {size.description && (
                            <span className="text-xs text-muted-foreground">
                              {size.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <Label className="text-xs">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(e) => onUpdate(index, "quantity", parseInt(e.target.value) || 1)}
                placeholder="1"
                required
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <Label className="text-xs">
                Price per Tire ({currencySymbol}) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.vatInclusivePrice || ""}
                onChange={(e) => onUpdate(index, "vatInclusivePrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
                disabled={loading}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Includes {selectedTaxRate?.rate || VAT_RATE}% {selectedTaxRate?.name || 'VAT'}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-muted/50 rounded-lg p-2 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Excluding VAT:</span>
                <span className="font-medium">
                  {currencySymbol} {item.priceExcludingVAT.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Total (inc. VAT):</span>
                <span className="font-medium">
                  {currencySymbol} {item.lineTotalIncludingVAT.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function NewPurchasePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  const { taxRates, defaultTaxRate, loading: taxRatesLoading } = useTaxRates();
  
  const [loading, setLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sizes, setSizes] = useState<TireSize[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOrderDetailsSheetOpen, setIsOrderDetailsSheetOpen] = useState(false);
  
  // Get default VAT rate from settings
  const VAT_RATE = defaultTaxRate?.rate || systemSettings?.vat_rate || 16;
  const VAT_RATE_DECIMAL = VAT_RATE / 100;
  
  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';
  
  const [formData, setFormData] = useState({
    supplier_id: "",
    po_date: new Date(),
    expected_delivery_date: undefined as Date | undefined,
    status: "DRAFT",
    notes: "",
    terms: "",
    shipping_address: "",
    billing_address: "",
    tax_rate_id: defaultTaxRate?.id?.toString() || "",
    shipping_amount: 0,
    items: [
      {
        id: 1,
        size: "",
        quantity: 1,
        vatInclusivePrice: 0,
        lineTotalIncludingVAT: 0,
        priceExcludingVAT: 0,
        lineTotalExcludingVAT: 0,
      },
    ],
  });

  // Update tax rate when default loads
  useEffect(() => {
    if (defaultTaxRate && !formData.tax_rate_id) {
      setFormData(prev => ({ ...prev, tax_rate_id: defaultTaxRate.id.toString() }));
    }
  }, [defaultTaxRate]);

  // Update payment terms when supplier is selected
  useEffect(() => {
    if (selectedSupplier?.payment_term_name) {
      setFormData(prev => ({ ...prev, terms: selectedSupplier.payment_term_name || prev.terms }));
    }
  }, [formData.supplier_id]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Check permission for creating purchase orders
  useEffect(() => {
    if (!authLoading && isAuthenticated && !hasPermission("po.create")) {
      router.push("/purchases");
      toast.error("You don't have permission to create purchase orders");
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("po.create")) {
      fetchSuppliers();
      fetchTireSizes();
    }
  }, [isAuthenticated, hasPermission]);

  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/suppliers`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }
      
      const data = await response.json();
      const suppliersArray = Array.isArray(data) 
        ? data 
        : Array.isArray(data.suppliers) 
          ? data.suppliers 
          : [];
          
      setSuppliers(suppliersArray);
      
      if (suppliersArray.length === 0) {
        toast.warning("No suppliers found. Please add suppliers first.");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setError(error instanceof Error ? error.message : "Failed to load suppliers");
      toast.error("Failed to load suppliers");
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchTireSizes = async () => {
    try {
      setSizesLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/tires/meta/sizes`);

      if (!response.ok) {
        throw new Error("Tire sizes endpoint unavailable");
      }

      const result = await response.json();

      if (!result?.success || !Array.isArray(result.data)) {
        throw new Error("Invalid tire sizes response");
      }

      const normalizedSizes: TireSize[] = result.data.map((size: string) => ({
        size,
        description: ""
      }));

      setSizes(normalizedSizes);

    } catch (error) {
      console.error("Error fetching tire sizes:", error);
      // Use fallback sizes
      const fallbackSizes: TireSize[] = [
        { size: "295/80R22.5", description: "Steer axle" },
        { size: "11R22.5", description: "Drive axle" },
        { size: "285/75R24.5", description: "Large truck" },
        { size: "275/70R22.5", description: "Medium truck" },
        { size: "245/70R19.5", description: "Light truck" }
      ];
      setSizes(fallbackSizes);
      toast.info("Using default tire sizes");
    } finally {
      setSizesLoading(false);
    }
  };

  // Calculate price excluding VAT from VAT-inclusive price
  const calculatePriceExcludingVAT = (vatInclusivePrice: number): number => {
    if (vatInclusivePrice <= 0) return 0;
    return vatInclusivePrice / (1 + VAT_RATE_DECIMAL);
  };

  // Calculate VAT amount from VAT-inclusive price
  const calculateVATAmount = (vatInclusivePrice: number): number => {
    if (vatInclusivePrice <= 0) return 0;
    const exclusivePrice = vatInclusivePrice / (1 + VAT_RATE_DECIMAL);
    return vatInclusivePrice - exclusivePrice;
  };

  // Update item calculations when price changes
  const updateItemCalculations = (item: PurchaseOrderItem): PurchaseOrderItem => {
    const priceExcludingVAT = calculatePriceExcludingVAT(item.vatInclusivePrice);
    const lineTotalIncludingVAT = item.vatInclusivePrice * item.quantity;
    const lineTotalExcludingVAT = priceExcludingVAT * item.quantity;

    return {
      ...item,
      priceExcludingVAT,
      lineTotalIncludingVAT,
      lineTotalExcludingVAT,
    };
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const newItems = [...formData.items];
    let updatedItem = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'vatInclusivePrice') {
      updatedItem = updateItemCalculations(updatedItem);
    }
    
    newItems[index] = updatedItem;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    const newId = formData.items.length > 0 
      ? Math.max(...formData.items.map(item => item.id)) + 1 
      : 1;
    
    const newItem: PurchaseOrderItem = {
      id: newId,
      size: "",
      quantity: 1,
      vatInclusivePrice: 0,
      lineTotalIncludingVAT: 0,
      priceExcludingVAT: 0,
      lineTotalExcludingVAT: 0,
    };
    
    setFormData({ ...formData, items: [...formData.items, newItem] });
    toast.success("New item added");
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    toast.success("Item removed from order");
  };

  // Calculate order totals
  const calculateOrderTotals = () => {
    const subtotalIncludingVAT = formData.items.reduce((total, item) => 
      total + item.lineTotalIncludingVAT, 0);
    
    const totalVAT = (subtotalIncludingVAT * VAT_RATE_DECIMAL) / (1 + VAT_RATE_DECIMAL);
    const subtotalExcludingVAT = subtotalIncludingVAT - totalVAT;
    const shippingAmount = formData.shipping_amount || 0;
    const correctFinalAmount = subtotalIncludingVAT + shippingAmount;

    return {
      subtotalExcludingVAT,
      totalVAT,
      subtotalIncludingVAT,
      shippingAmount,
      correctFinalAmount,
      vatRate: VAT_RATE
    };
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a purchase order");
      return;
    }

    // Validation
    if (!formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.size || item.quantity <= 0 || item.vatInclusivePrice < 0) {
        toast.error(`Please fill all required fields for item #${i + 1}`);
        return;
      }
    }
    
    setLoading(true);
    setError(null);

    try {
      const totals = calculateOrderTotals();
      
      // Get the selected tax rate
      const selectedTaxRate = taxRates.find(
        rate => rate.id.toString() === formData.tax_rate_id
      ) || defaultTaxRate;
      
      const orderData = {
        supplier_id: parseInt(formData.supplier_id),
        po_date: formData.po_date.toISOString().split("T")[0],
        expected_delivery_date: formData.expected_delivery_date 
          ? formData.expected_delivery_date.toISOString().split("T")[0]
          : null,
        status: saveAsDraft ? "DRAFT" : formData.status,
        notes: formData.notes || null,
        terms: formData.terms || null,
        shipping_address: formData.shipping_address || null,
        billing_address: formData.billing_address || null,
        shipping_amount: formData.shipping_amount,
        tax_rate_id: formData.tax_rate_id ? parseInt(formData.tax_rate_id) : null,
        tax_rate: selectedTaxRate?.rate || VAT_RATE,
        tax_name: selectedTaxRate?.name || 'VAT',
        created_by: user.id,
        total_amount: totals.subtotalExcludingVAT,
        items: formData.items.map(item => ({
          tire_size: item.size,
          quantity: item.quantity,
          unit_price: item.vatInclusivePrice,
          line_total: item.lineTotalIncludingVAT,
          received_quantity: 0
        }))
      };

      console.log("Creating purchase order with VAT:", VAT_RATE, "%");
      console.log("Order data:", orderData);

      const response = await authFetch(`${API_BASE_URL}/api/purchase-orders`, {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          saveAsDraft 
            ? "Purchase order saved as draft" 
            : "Purchase order created successfully"
        );
        router.push("/purchases");
        router.refresh();
      } else {
        throw new Error(result.error || result.message || "Failed to create purchase order");
      }
    } catch (error) {
      console.error("Error creating purchase order:", error);
      setError(error instanceof Error ? error.message : "Failed to create purchase order");
      toast.error("Failed to create purchase order", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateOrderTotals();
  const totalQuantity = formData.items.reduce((sum, item) => sum + item.quantity, 0);
  const selectedSupplier = suppliers.find(s => s.id.toString() === formData.supplier_id);
  const selectedTaxRate = taxRates.find(rate => rate.id.toString() === formData.tax_rate_id) || defaultTaxRate;

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show permission denied
  if (!hasPermission("po.create")) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/purchases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Purchase Order</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Create a new tire purchase order</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to create purchase orders. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/purchases">Return to Purchases</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="po.create" action="create">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/purchases">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Purchase Order</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create a new tire purchase order for your supplier
              </p>
              {systemSettings?.company_name && (
                <p className="text-xs text-muted-foreground mt-1">
                  Company: {systemSettings.company_name} • Currency: {currencySymbol} ({currency})
                </p>
              )}
            </div>
          </div>

          {/* Mobile Order Details Button */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsOrderDetailsSheetOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Order Details
              <ChevronRight className="ml-auto h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Details - Desktop */}
            <Card className="hidden lg:block lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Order Details</CardTitle>
                <CardDescription>Supplier and order information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">
                    Supplier <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, supplier_id: value })
                    }
                    required
                    disabled={suppliersLoading || loading}
                  >
                    <SelectTrigger>
                      {suppliersLoading ? (
                        <SelectValue placeholder="Loading suppliers..." />
                      ) : (
                        <SelectValue placeholder="Select supplier" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {suppliersLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading suppliers...
                        </SelectItem>
                      ) : suppliers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No suppliers available
                        </SelectItem>
                      ) : (
                        suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            <div className="flex flex-col">
                              <span>{supplier.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {supplier.type}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSupplier && (
                  <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                    {selectedSupplier.contact_person && (
                      <p><span className="font-medium">Contact:</span> {selectedSupplier.contact_person}</p>
                    )}
                    {selectedSupplier.phone && (
                      <p><span className="font-medium">Phone:</span> {selectedSupplier.phone}</p>
                    )}
                    {selectedSupplier.email && (
                      <p><span className="font-medium">Email:</span> {selectedSupplier.email}</p>
                    )}
                    {selectedSupplier.balance !== undefined && (
                      <p><span className="font-medium">Balance:</span> {currencySymbol} {selectedSupplier.balance.toLocaleString()}</p>
                    )}
                    {selectedSupplier.payment_term_name && (
                      <p><span className="font-medium">Payment Terms:</span> {selectedSupplier.payment_term_name}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="po_date">
                    Order Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    date={formData.po_date}
                    onSelect={(date) => date && setFormData({ ...formData, po_date: date })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                  <DatePicker
                    date={formData.expected_delivery_date}
                    onSelect={(date) => setFormData({ ...formData, expected_delivery_date: date })}
                    className="w-full"
                  />
                  {formData.expected_delivery_date && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs mt-1"
                      onClick={() => setFormData({ ...formData, expected_delivery_date: undefined })}
                      disabled={loading}
                    >
                      Clear date
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_rate_id">Tax Rate</Label>
                  <Select
                    value={formData.tax_rate_id}
                    onValueChange={(value) => setFormData({ ...formData, tax_rate_id: value })}
                    disabled={taxRatesLoading || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRatesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading tax rates...
                        </SelectItem>
                      ) : taxRates.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No tax rates available
                        </SelectItem>
                      ) : (
                        taxRates.filter(rate => rate.is_active).map((rate) => (
                          <SelectItem key={rate.id} value={rate.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{rate.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {rate.rate}%
                              </span>
                              {rate.is_default && (
                                <Badge className="ml-2 text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Current VAT rate: {VAT_RATE}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="ORDERED">Ordered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Payment Terms</Label>
                  <Input
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="e.g., Net 30 days"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_address">Shipping Address</Label>
                  <Textarea
                    id="shipping_address"
                    value={formData.shipping_address}
                    onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                    placeholder="Enter shipping address..."
                    rows={2}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing_address">Billing Address</Label>
                  <Textarea
                    id="billing_address"
                    value={formData.billing_address}
                    onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                    placeholder="Enter billing address..."
                    rows={2}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special instructions or notes..."
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Additional Charges</Label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="shipping_amount" className="text-sm">
                        Shipping Amount ({currencySymbol})
                      </Label>
                      <Input
                        id="shipping_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.shipping_amount || ""}
                        onChange={(e) => setFormData({ ...formData, shipping_amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Shipping is added to the grand total
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground border-t pt-4">
                  Created by: {user?.full_name || user?.username || "Unknown"}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Order Details Sheet */}
            <Sheet open={isOrderDetailsSheetOpen} onOpenChange={setIsOrderDetailsSheetOpen}>
              <SheetContent side="bottom" className="h-[90vh] rounded-t-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Order Details
                  </SheetTitle>
                  <SheetDescription>
                    Supplier and order information
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile_supplier_id">
                      Supplier <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, supplier_id: value })
                      }
                      required
                      disabled={suppliersLoading || loading}
                    >
                      <SelectTrigger>
                        {suppliersLoading ? (
                          <SelectValue placeholder="Loading suppliers..." />
                        ) : (
                          <SelectValue placeholder="Select supplier" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {suppliersLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading suppliers...
                          </SelectItem>
                        ) : suppliers.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No suppliers available
                          </SelectItem>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              <div className="flex flex-col">
                                <span>{supplier.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {supplier.type}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSupplier && (
                    <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                      {selectedSupplier.contact_person && (
                        <p><span className="font-medium">Contact:</span> {selectedSupplier.contact_person}</p>
                      )}
                      {selectedSupplier.phone && (
                        <p><span className="font-medium">Phone:</span> {selectedSupplier.phone}</p>
                      )}
                      {selectedSupplier.email && (
                        <p><span className="font-medium">Email:</span> {selectedSupplier.email}</p>
                      )}
                      {selectedSupplier.balance !== undefined && (
                        <p><span className="font-medium">Balance:</span> {currencySymbol} {selectedSupplier.balance.toLocaleString()}</p>
                      )}
                      {selectedSupplier.payment_term_name && (
                        <p><span className="font-medium">Payment Terms:</span> {selectedSupplier.payment_term_name}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="mobile_po_date">
                      Order Date <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      date={formData.po_date}
                      onSelect={(date) => date && setFormData({ ...formData, po_date: date })}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_expected_date">Expected Delivery Date</Label>
                    <DatePicker
                      date={formData.expected_delivery_date}
                      onSelect={(date) => setFormData({ ...formData, expected_delivery_date: date })}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_tax_rate">Tax Rate</Label>
                    <Select
                      value={formData.tax_rate_id}
                      onValueChange={(value) => setFormData({ ...formData, tax_rate_id: value })}
                      disabled={taxRatesLoading || loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxRates.filter(rate => rate.is_active).map((rate) => (
                          <SelectItem key={rate.id} value={rate.id.toString()}>
                            {rate.name} ({rate.rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_status">Order Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="ORDERED">Ordered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_terms">Payment Terms</Label>
                    <Input
                      id="mobile_terms"
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      placeholder="e.g., Net 30 days"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_shipping_address">Shipping Address</Label>
                    <Textarea
                      id="mobile_shipping_address"
                      value={formData.shipping_address}
                      onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                      placeholder="Enter shipping address..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_billing_address">Billing Address</Label>
                    <Textarea
                      id="mobile_billing_address"
                      value={formData.billing_address}
                      onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                      placeholder="Enter billing address..."
                      rows={2}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_notes">Notes</Label>
                    <Textarea
                      id="mobile_notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any special instructions..."
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Shipping Amount ({currencySymbol})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_amount || ""}
                      onChange={(e) => setFormData({ ...formData, shipping_amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1" 
                      onClick={() => setIsOrderDetailsSheetOpen(false)}
                    >
                      Save & Close
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsOrderDetailsSheetOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Order Items & Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Order Items</CardTitle>
                      <CardDescription>
                        Add tires to this purchase order
                      </CardDescription>
                    </div>
                    <div className="text-sm font-medium">
                      {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Desktop Items Table */}
                  <div className="hidden md:block space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={item.id} className="space-y-4 p-4 border rounded-lg relative group">
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeItem(index)}
                            disabled={loading}
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {index + 1}
                          </div>
                          <h3 className="font-medium">Item #{index + 1}</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`size_${index}`}>
                              Tire Size <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={item.size}
                              onValueChange={(value) => handleItemChange(index, "size", value)}
                              disabled={loading || sizesLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                {sizesLoading ? (
                                  <SelectItem value="loading" disabled>
                                    Loading sizes...
                                  </SelectItem>
                                ) : sizes.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    No sizes available
                                  </SelectItem>
                                ) : (
                                  sizes.map((size) => (
                                    <SelectItem key={size.size} value={size.size}>
                                      <div className="flex flex-col">
                                        <span>{size.size}</span>
                                        {size.description && (
                                          <span className="text-xs text-muted-foreground">
                                            {size.description}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`quantity_${index}`}>
                              Quantity <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`quantity_${index}`}
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                              placeholder="1"
                              required
                              disabled={loading}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`price_${index}`}>
                                Price per Tire ({currencySymbol}) <span className="text-red-500">*</span>
                              </Label>
                            </div>
                            <Input
                              id={`price_${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.vatInclusivePrice || ""}
                              onChange={(e) => handleItemChange(index, "vatInclusivePrice", parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              required
                              disabled={loading}
                            />
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Includes {selectedTaxRate?.rate || VAT_RATE}% {selectedTaxRate?.name || 'VAT'}
                              </span>
                              <span className="font-medium">
                                Total: {currencySymbol} {item.lineTotalIncludingVAT.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Items Cards */}
                  <div className="md:hidden space-y-3">
                    {formData.items.map((item, index) => (
                      <MobileItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        sizes={sizes}
                        sizesLoading={sizesLoading}
                        onUpdate={handleItemChange}
                        onRemove={removeItem}
                        loading={loading}
                        currencySymbol={currencySymbol}
                        selectedTaxRate={selectedTaxRate || undefined}
                        VAT_RATE={VAT_RATE}
                        formData={formData}
                      />
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addItem}
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Item
                  </Button>
                </CardFooter>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                  <CardDescription>Total costs and amounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Items:</span>
                      <span>{formData.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Quantity:</span>
                      <span>{totalQuantity} tires</span>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Subtotal (Including VAT):</span>
                          <span>{currencySymbol} {totals.subtotalIncludingVAT.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            {selectedTaxRate?.name || 'VAT'} ({selectedTaxRate?.rate || VAT_RATE}%):
                          </span>
                          <span>{currencySymbol} {totals.totalVAT.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Subtotal (Excluding VAT):</span>
                          <span className="text-sm font-medium">{currencySymbol} {totals.subtotalExcludingVAT.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Shipping:</span>
                      <span>{currencySymbol} {totals.shippingAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Grand Total:</span>
                        <span className="text-xl sm:text-2xl font-bold text-primary">
                          {currencySymbol} {totals.correctFinalAmount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total includes {selectedTaxRate?.rate || VAT_RATE}% {selectedTaxRate?.name || 'VAT'} on items
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t px-6 py-4">
                  <Button 
                    variant="outline" 
                    type="button" 
                    asChild
                    disabled={loading}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    <Link href="/purchases">Cancel</Link>
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={(e) => handleSubmit(e as any, true)}
                      disabled={loading || suppliersLoading || formData.items.length === 0 || !formData.supplier_id}
                      className="w-full sm:w-auto"
                    >
                      {loading ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || suppliersLoading || formData.items.length === 0 || !formData.supplier_id}
                      className="w-full sm:w-auto min-w-[180px]"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        "Create Order"
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          Logged in as: {user?.full_name || user?.username} • Role: {user?.role}
        </div>
      </div>
    </PermissionGuard>
  );
}