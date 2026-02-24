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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GRNDetails } from "@/components/grn-details";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  Truck,
  Package,
  AlertCircle,
  XCircle,
  Plus,
  Minus,
  Save,
  RotateCcw,
  Calendar,
  Building,
  User,
  FileText,
  ShoppingBag,
  Layers,
  Barcode,
  Key,
  Copy,
  Check,
  X,
  Download,
  Printer,
  Info,
  Menu,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { format, parseISO, isValid } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface PurchaseOrderItem {
  id: number;
  po_id: number;
  size: string;
  brand: string;
  model: string;
  type: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  line_total: number;
  received_total: number;
  remaining_quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tires_created?: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_type: string;
  po_date: string;
  expected_delivery_date: string | null;
  delivery_date: string | null;
  status: string;
  total_amount: number;
  tax_amount: number;
  shipping_amount: number;
  final_amount: number;
  notes: string | null;
  terms: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  created_by: number;
  approved_by: number | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
  created_by_name?: string;
  approved_by_name?: string | null;
  tax_rate?: number;
  tax_name?: string;
}

interface ReceivingItem {
  po_item_id: number;
  size: string;
  brand: string;
  model: string;
  type: string;
  ordered_quantity: number;
  previously_received: number;
  remaining_quantity: number;
  current_receive: number;
  unit_price: number;
  serial_numbers: string[];
  batch_number: string;
  location: string;
  condition: "GOOD" | "DAMAGED" | "DEFECTIVE";
  notes: string;
}

interface GRNDocument {
  grn_number: string;
  grnId: number;
  items: Array<{
    grnItemId: number;
    po_item_id: number;
    quantity_received: number;
    serial_numbers: string[];
    brand: string;
  }>;
  tires: Array<{
    id: number;
    serial_number: string;
    po_item_id: number;
  }>;
}

// Mobile Item Card Component
const MobileItemCard = ({
  item,
  onUpdateQuantity,
  onUpdateBrand,
  onUpdateCondition,
  onUpdateBatchNumber,
  onUpdateNotes,
  submitting,
  formatCurrency,
  getConditionColor,
}: {
  item: ReceivingItem;
  onUpdateQuantity: (poItemId: number, quantity: number) => void;
  onUpdateBrand: (poItemId: number, brand: string) => void;
  onUpdateCondition: (poItemId: number, condition: "GOOD" | "DAMAGED" | "DEFECTIVE") => void;
  onUpdateBatchNumber: (poItemId: number, batchNumber: string) => void;
  onUpdateNotes: (poItemId: number, notes: string) => void;
  submitting: boolean;
  formatCurrency: (amount: number) => string;
  getConditionColor: (condition: string) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemTotal = item.current_receive * item.unit_price;

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header - Always visible */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium text-lg">{item.size}</div>
            <div className="text-sm text-muted-foreground">
              {item.model} • {item.type}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Unit: {formatCurrency(item.unit_price)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Quantity Controls - Always visible */}
        <div className="flex items-center justify-between mt-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Ordered: {item.ordered_quantity}</div>
            <div className="text-xs text-muted-foreground">Received: {item.previously_received}</div>
            <div className="text-xs font-medium">Remaining: {item.remaining_quantity}</div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(item.po_item_id, item.current_receive - 1)}
              disabled={item.current_receive <= 0 || submitting}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <Input
              type="number"
              min="0"
              max={item.remaining_quantity}
              value={item.current_receive}
              onChange={(e) => onUpdateQuantity(item.po_item_id, parseInt(e.target.value) || 0)}
              className="w-16 text-center h-8"
              disabled={submitting}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateQuantity(item.po_item_id, item.current_receive + 1)}
              disabled={item.current_receive >= item.remaining_quantity || submitting}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Item Total - Always visible */}
        {item.current_receive > 0 && (
          <div className="mt-2 text-right">
            <div className="text-sm font-medium">{formatCurrency(itemTotal)}</div>
            <div className="text-xs text-muted-foreground">
              {item.current_receive} × {formatCurrency(item.unit_price)}
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Brand */}
            <div className="space-y-1">
              <Label className="text-xs">
                Brand <span className="text-red-500">*</span>
              </Label>
              <Input
                value={item.brand}
                onChange={(e) => onUpdateBrand(item.po_item_id, e.target.value)}
                placeholder="Enter brand (e.g., Michelin)"
                className="w-full text-sm"
                required={item.current_receive > 0}
                disabled={submitting}
              />
            </div>

            {/* Batch Number */}
            <div className="space-y-1">
              <Label className="text-xs">Batch Number</Label>
              <Input
                value={item.batch_number}
                onChange={(e) => onUpdateBatchNumber(item.po_item_id, e.target.value)}
                placeholder="Batch number"
                className="w-full text-sm"
                disabled={submitting}
              />
            </div>

            {/* Condition */}
            <div className="space-y-1">
              <Label className="text-xs">Condition</Label>
              <Select
                value={item.condition}
                onValueChange={(value: "GOOD" | "DAMAGED" | "DEFECTIVE") => 
                  onUpdateCondition(item.po_item_id, value)
                }
                disabled={submitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOD">
                    <Badge className={getConditionColor("GOOD")}>Good</Badge>
                  </SelectItem>
                  <SelectItem value="DAMAGED">
                    <Badge className={getConditionColor("DAMAGED")}>Damaged</Badge>
                  </SelectItem>
                  <SelectItem value="DEFECTIVE">
                    <Badge className={getConditionColor("DEFECTIVE")}>Defective</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={item.notes}
                onChange={(e) => onUpdateNotes(item.po_item_id, e.target.value)}
                placeholder="Add notes for this item"
                rows={2}
                className="text-sm"
                disabled={submitting}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Serial Number Card Component
const MobileSerialCard = ({
  item,
  onUpdateSerial,
  onGenerateBatch,
  submitting,
}: {
  item: ReceivingItem;
  onUpdateSerial: (poItemId: number, index: number, value: string) => void;
  onGenerateBatch: (poItemId: number) => void;
  submitting: boolean;
}) => {
  const enteredCount = (item.serial_numbers || []).filter(sn => sn.trim() !== "").length;

  return (
    <Card className="mb-3 last:mb-0 border-l-4 border-l-blue-500">
      <CardHeader className="py-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium">
              {item.size} • {item.brand || 'No brand'} • Qty: {item.current_receive}
            </CardTitle>
            <CardDescription>
              Enter unique serial numbers for each tire
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGenerateBatch(item.po_item_id)}
            disabled={!item.brand || item.brand.trim() === "" || submitting}
            className="ml-2"
          >
            <Key className="mr-2 h-3 w-3" />
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: item.current_receive }).map((_, index) => (
            <div key={index} className="space-y-1">
              <Label className="text-xs">Tire {index + 1}</Label>
              <Input
                value={(item.serial_numbers?.[index] || "")}
                onChange={(e) => onUpdateSerial(item.po_item_id, index, e.target.value)}
                placeholder={`SN-${item.size}-${index + 1}`}
                className="text-sm"
                disabled={submitting}
              />
            </div>
          ))}
        </div>
        
        {item.current_receive > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className={enteredCount === item.current_receive ? "text-green-600" : ""}>
              {enteredCount} / {item.current_receive} entered
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const text = (item.serial_numbers || []).filter(sn => sn.trim() !== "").join('\n');
                navigator.clipboard.writeText(text);
                toast.success("Serial numbers copied to clipboard");
              }}
              disabled={enteredCount === 0 || submitting}
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Skeleton Components
const SectionSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-32 w-full" />
    </CardContent>
  </Card>
);

export default function ReceiveGoodsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  const orderId = params.id as string;

  const [grnDetailsOpen, setGrnDetailsOpen] = useState(false);
  const [selectedGrnId, setSelectedGrnId] = useState<number | null>(null);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [generatedGRN, setGeneratedGRN] = useState<GRNDocument | null>(null);
  const [showGRNDialog, setShowGRNDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDeliverySheetOpen, setIsDeliverySheetOpen] = useState(false);
  const [receivingData, setReceivingData] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    supplier_invoice_number: "",
    delivery_note_number: "",
    vehicle_number: "",
    driver_name: "",
    receiving_notes: "",
    inspection_notes: "",
  });

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Get tax info from order or settings
  const taxName = order?.tax_name || 'VAT';
  const taxRate = order?.tax_rate || systemSettings?.vat_rate || 16;

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("po.receive")) {
        toast.error("You don't have permission to receive goods");
        router.push("/purchases");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (orderId && isAuthenticated && hasPermission("po.receive")) {
      fetchOrderDetails();
    }
  }, [orderId, isAuthenticated, hasPermission]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/purchase-orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const orderData = data.data;
        setOrder(orderData);
        
        if (orderData.items && Array.isArray(orderData.items)) {
          const items = orderData.items.map((item: PurchaseOrderItem) => ({
            po_item_id: item.id,
            size: item.size,
            brand: "",
            model: item.model || "",
            type: item.type || "NEW",
            ordered_quantity: item.quantity,
            previously_received: item.received_quantity || 0,
            remaining_quantity: item.remaining_quantity || item.quantity - (item.received_quantity || 0),
            current_receive: 0,
            unit_price: item.unit_price,
            serial_numbers: [],
            batch_number: `BATCH-${orderData.po_number}-${item.id}`,
            location: "WAREHOUSE-A",
            condition: "GOOD" as const,
            notes: "",
          }));
          setReceivingItems(items);
        }
      } else {
        throw new Error(data.message || "Failed to load purchase order");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error instanceof Error ? error.message : "Failed to load purchase order");
      toast.error("Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  };

  const updateReceivingQuantity = (poItemId: number, quantity: number) => {
    setReceivingItems(prev =>
      prev.map(item => {
        if (item.po_item_id === poItemId) {
          const newQuantity = Math.max(0, Math.min(
            quantity,
            item.remaining_quantity
          ));
          
          const currentSerials = item.serial_numbers || [];
          let newSerials = [...currentSerials];
          
          if (newQuantity > currentSerials.length) {
            const additional = Array(newQuantity - currentSerials.length).fill("");
            newSerials = [...currentSerials, ...additional];
          } else if (newQuantity < currentSerials.length) {
            newSerials = currentSerials.slice(0, newQuantity);
          }
          
          return { 
            ...item, 
            current_receive: newQuantity,
            serial_numbers: newSerials
          };
        }
        return item;
      })
    );
  };

  const updateSerialNumber = (poItemId: number, index: number, value: string) => {
    setReceivingItems(prev =>
      prev.map(item => {
        if (item.po_item_id === poItemId) {
          const newSerials = [...(item.serial_numbers || [])];
          newSerials[index] = value.toUpperCase();
          return { ...item, serial_numbers: newSerials };
        }
        return item;
      })
    );
  };

  const updateReceivingBrand = (poItemId: number, brand: string) => {
    setReceivingItems(prev =>
      prev.map(item => {
        if (item.po_item_id === poItemId) {
          return { ...item, brand };
        }
        return item;
      })
    );
  };

  const generateBatchSerialNumbers = (poItemId: number) => {
    setReceivingItems(prev =>
      prev.map(item => {
        if (item.po_item_id === poItemId) {
          const batchPrefix = `${(item.brand || 'TIR').slice(0, 3).toUpperCase()}-${item.size.replace('/', '-')}-${Date.now().toString().slice(-6)}`;
          const newSerials = Array(item.current_receive)
            .fill("")
            .map((_, idx) => `${batchPrefix}-${(idx + 1).toString().padStart(3, '0')}`);
          return { ...item, serial_numbers: newSerials };
        }
        return item;
      })
    );
  };

  const updateReceivingCondition = (poItemId: number, condition: "GOOD" | "DAMAGED" | "DEFECTIVE") => {
    setReceivingItems(prev =>
      prev.map(item =>
        item.po_item_id === poItemId ? { ...item, condition } : item
      )
    );
  };

  const updateReceivingField = (poItemId: number, field: keyof ReceivingItem, value: string) => {
    setReceivingItems(prev =>
      prev.map(item =>
        item.po_item_id === poItemId ? { ...item, [field]: value } : item
      )
    );
  };

  const updateReceivingData = (field: keyof typeof receivingData, value: string) => {
    setReceivingData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FULLY_RECEIVED":
      case "RECEIVED":
      case "CLOSED":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "ORDERED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
      case "PARTIALLY_RECEIVED":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "GOOD":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "DAMAGED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "DEFECTIVE":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace(currency, currencySymbol);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
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
      return "Invalid date";
    }
  };

  const calculateTotalReceived = () => {
    return receivingItems.reduce((sum, item) => sum + item.current_receive, 0);
  };

  const calculateTotalValue = () => {
    return receivingItems.reduce((sum, item) => 
      sum + (item.current_receive * item.unit_price), 0
    );
  };

  const validateReceiving = () => {
    const hasItemsToReceive = receivingItems.some(item => item.current_receive > 0);
    if (!hasItemsToReceive) {
      toast.error("Please specify quantities to receive");
      return false;
    }

    const hasInvalidQuantities = receivingItems.some(item => 
      item.current_receive > item.remaining_quantity
    );
    if (hasInvalidQuantities) {
      toast.error("Cannot receive more than remaining quantity");
      return false;
    }

    if (!receivingData.receipt_date) {
      toast.error("Receipt date is required");
      return false;
    }

    for (const item of receivingItems) {
      if (item.current_receive > 0) {
        if (!item.brand || item.brand.trim() === "") {
          toast.error(`Please enter brand for ${item.size} tires`);
          return false;
        }

        const trimmedBrand = item.brand.trim();
        if (trimmedBrand.length < 2) {
          toast.error(`Brand name for ${item.size} must be at least 2 characters`);
          return false;
        }
        
        const enteredSerials = (item.serial_numbers || []).filter(sn => sn.trim() !== "");
        if (enteredSerials.length !== item.current_receive) {
          toast.error(`Please enter all ${item.current_receive} serial numbers for ${item.size} ${item.brand}`);
          return false;
        }
        
        const uniqueSerials = new Set(enteredSerials);
        if (uniqueSerials.size !== enteredSerials.length) {
          toast.error(`Duplicate serial numbers found for ${item.size} ${item.brand}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleReceiveGoods = async () => {
    if (!hasPermission("po.receive")) {
      toast.error("You don't have permission to receive goods");
      return;
    }

    if (!validateReceiving()) return;
    if (!user) {
      toast.error("You must be logged in to receive goods");
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const itemsToReceive = receivingItems
        .filter(item => item.current_receive > 0)
        .map(item => ({
          po_item_id: item.po_item_id,
          quantity_received: item.current_receive,
          unit_cost: item.unit_price,
          batch_number: item.batch_number,
          brand: item.brand.trim(),
          serial_numbers: (item.serial_numbers || []).filter(sn => sn.trim() !== ""),
          notes: item.notes,
          condition: item.condition,
        }));

      const grnData = {
        po_id: parseInt(orderId),
        receipt_date: receivingData.receipt_date,
        received_by: user.id,
        received_by_name: user.full_name || user.username,
        supplier_invoice_number: receivingData.supplier_invoice_number || null,
        delivery_note_number: receivingData.delivery_note_number || null,
        vehicle_number: receivingData.vehicle_number || null,
        driver_name: receivingData.driver_name || null,
        notes: receivingData.receiving_notes || null,
        inspection_notes: receivingData.inspection_notes || null,
        items: itemsToReceive,
      };

      console.log("Sending GRN data:", grnData);

      const response = await authFetch(`${API_BASE_URL}/api/grn`, {
        method: 'POST',
        body: JSON.stringify(grnData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Goods Received Note created successfully!");
        setGeneratedGRN(result.data);
        setSelectedGrnId(result.data.grnId);
        setShowGRNDialog(true);
        fetchOrderDetails();
      } else {
        throw new Error(result.message || "Failed to receive goods");
      }
    } catch (error) {
      console.error("Error receiving goods:", error);
      setError(error instanceof Error ? error.message : "Failed to receive goods");
      toast.error("Failed to receive goods", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReceive = async () => {
    const updatedItems = receivingItems.map(item => ({
      ...item,
      current_receive: item.remaining_quantity,
      serial_numbers: Array(item.remaining_quantity).fill("")
    }));
    setReceivingItems(updatedItems);
    toast.info("All remaining quantities filled. Please enter serial numbers and brands.");
  };

  const copySerialNumbersToClipboard = (serialNumbers: string[]) => {
    const text = serialNumbers.join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Serial numbers copied to clipboard");
  };

  const navigateToGRN = () => {
    if (generatedGRN) {
      setGrnDetailsOpen(true);
    }
  };

  const resetForm = () => {
    setReceivingItems(prev =>
      prev.map(item => ({
        ...item,
        current_receive: 0,
        serial_numbers: [],
        condition: "GOOD" as const,
        brand: "",
        batch_number: `BATCH-${order?.po_number}-${item.po_item_id}`,
        notes: ""
      }))
    );
    toast.info("Receiving form reset");
  };

  // Permission checks
  const canReceive = hasPermission("po.receive");

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <SectionSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    );
  }

  // Show permission denied - fallback if redirect doesn't happen
  if (!canReceive) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/purchases?tab=orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Receive Goods</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Process goods receipt for purchase orders</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to receive goods. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/purchases">Return to Purchases</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-center min-h-screen">
        <div className="text-center px-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-center">Order Not Found</h2>
        <p className="text-muted-foreground mt-2 text-center">{error || "The purchase order could not be found."}</p>
        <Button className="mt-4 w-full sm:w-auto" asChild>
          <Link href="/purchases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchases
          </Link>
        </Button>
      </div>
    );
  }

  const canReceiveOrder = ["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "APPROVED"].includes(order.status);
  const isComplete = order.status === "FULLY_RECEIVED" || order.status === "RECEIVED" || order.status === "CLOSED";
  const totalOrdered = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalPreviouslyReceived = order.items?.reduce((sum, item) => sum + (item.received_quantity || 0), 0) || 0;
  const remainingToReceive = totalOrdered - totalPreviouslyReceived;
  const currentlyReceiving = calculateTotalReceived();
  const progressPercentage = totalOrdered > 0 ? Math.round(((totalPreviouslyReceived + currentlyReceiving) / totalOrdered) * 100) : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/purchases?tab=orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Receive Goods</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              PO: {order.po_number} • {order.supplier_name}
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1">
                Company: {systemSettings.company_name} • Currency: {currencySymbol} ({currency})
              </p>
            )}
          </div>
        </div>
        
        {/* Desktop Status */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace("_", " ")}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Created by: {order.created_by_name || `User ${order.created_by}`}
          </div>
        </div>

        {/* Mobile Status Button */}
        <div className="flex sm:hidden items-center justify-between">
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace("_", " ")}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-4 w-4 mr-2" />
            Menu
          </Button>
        </div>
      </div>

      {/* Order Summary - Mobile Responsive */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Order Summary</CardTitle>
          <CardDescription>Purchase order details and receiving progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Supplier Info */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Supplier Information</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm">{order.supplier_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{order.supplier_type}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Order Dates</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">Order: {formatDate(order.po_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">Expected: {formatDate(order.expected_delivery_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Value */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Order Value</Label>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-bold">{formatCurrency(order.final_amount)}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {order.items?.length || 0} items • {totalOrdered} units total
                  </div>
                  {order.tax_name && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.tax_name} rate: {order.tax_rate || taxRate}%
                    </div>
                  )}
                </div>
              </div>
              {order.notes && (
                <div className="hidden sm:block">
                  <Label className="text-sm font-medium">Order Notes</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Receiving Progress */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Receiving Progress</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">{progressPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="text-center">
                      <div className="font-bold text-sm">{totalPreviouslyReceived}</div>
                      <div className="text-xs text-muted-foreground">Previous</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm text-blue-600 dark:text-blue-400">{currentlyReceiving}</div>
                      <div className="text-xs text-muted-foreground">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-sm">{remainingToReceive - currentlyReceiving}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Order Notes */}
            {order.notes && (
              <div className="sm:hidden">
                <Label className="text-sm font-medium">Order Notes</Label>
                <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Information - Desktop */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Delivery Information
              </CardTitle>
              <CardDescription>Enter delivery details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt_date" className="text-sm">
                  Receipt Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={receivingData.receipt_date}
                  onChange={(e) => updateReceivingData('receipt_date', e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_note_number" className="text-sm">Delivery Note No</Label>
                <Input
                  id="delivery_note_number"
                  value={receivingData.delivery_note_number}
                  onChange={(e) => updateReceivingData('delivery_note_number', e.target.value)}
                  placeholder="e.g., DN-2024-001"
                  disabled={submitting}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_number" className="text-sm">Vehicle Number</Label>
                  <Input
                    id="vehicle_number"
                    value={receivingData.vehicle_number}
                    onChange={(e) => updateReceivingData('vehicle_number', e.target.value)}
                    disabled={submitting}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver_name" className="text-sm">Driver Name</Label>
                  <Input
                    id="driver_name"
                    value={receivingData.driver_name}
                    onChange={(e) => updateReceivingData('driver_name', e.target.value)}
                    disabled={submitting}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiving_notes" className="text-sm">Receiving Notes</Label>
                <Textarea
                  id="receiving_notes"
                  value={receivingData.receiving_notes}
                  onChange={(e) => updateReceivingData('receiving_notes', e.target.value)}
                  placeholder="Any notes about the delivery..."
                  rows={2}
                  disabled={submitting}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspection_notes" className="text-sm">Inspection Notes</Label>
                <Textarea
                  id="inspection_notes"
                  value={receivingData.inspection_notes}
                  onChange={(e) => updateReceivingData('inspection_notes', e.target.value)}
                  placeholder="Quality inspection findings..."
                  rows={2}
                  disabled={submitting}
                  className="w-full"
                />
              </div>

              <div className="text-xs text-muted-foreground border-t pt-4">
                Received by: {user?.full_name || user?.username || "Unknown"}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Receiving Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currentlyReceiving}</div>
                  <div className="text-sm text-muted-foreground">Items to Receive</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(calculateTotalValue())}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Serial Numbers</div>
                <div className="text-sm text-muted-foreground">
                  {receivingItems.reduce((sum, item) => 
                    sum + (item.serial_numbers || []).filter(sn => sn.trim() !== "").length, 0
                  )} / {currentlyReceiving} entered
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Brands Entered</div>
                <div className="text-sm text-muted-foreground">
                  {receivingItems.filter(item => item.current_receive > 0 && item.brand.trim() !== "").length} / {
                    receivingItems.filter(item => item.current_receive > 0).length
                  } items
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Delivery Info Button */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsDeliverySheetOpen(true)}
          >
            <Truck className="mr-2 h-4 w-4" />
            Delivery Information
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
        </div>

        {/* Items to Receive */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    Items to Receive
                  </CardTitle>
                  <CardDescription>
                    Specify quantities, serial numbers, and conditions
                  </CardDescription>
                </div>
                <div className="text-sm font-medium">
                  Total: {currentlyReceiving} units • {formatCurrency(calculateTotalValue())}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!canReceiveOrder ? (
                <div className="text-center py-8 px-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Order Already Completed</h3>
                  <p className="text-muted-foreground mt-2">
                    This purchase order has already been fully received.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Desktop Items Table */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Tire Details</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Ordered</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Previous</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Remaining</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Receive Now</TableHead>
                          <TableHead className="whitespace-nowrap">Condition</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receivingItems.map((item) => {
                          const itemTotal = item.current_receive * item.unit_price;
                          
                          return (
                            <TableRow key={item.po_item_id}>
                              <TableCell className="whitespace-nowrap">
                                <div>
                                  <div className="font-medium">{item.size}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.model} • {item.type}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Unit: {formatCurrency(item.unit_price)}
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    <Input
                                      value={item.batch_number}
                                      onChange={(e) => updateReceivingField(item.po_item_id, 'batch_number', e.target.value)}
                                      placeholder="Batch"
                                      className="w-full text-xs"
                                      disabled={submitting}
                                    />
                                    <Input
                                      value={item.brand}
                                      onChange={(e) => updateReceivingBrand(item.po_item_id, e.target.value)}
                                      placeholder="Brand *"
                                      className="w-full text-xs"
                                      required={item.current_receive > 0}
                                      disabled={submitting}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                {item.ordered_quantity}
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap text-blue-600">
                                {item.previously_received}
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                {item.remaining_quantity}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateReceivingQuantity(item.po_item_id, item.current_receive - 1)}
                                    disabled={item.current_receive <= 0 || submitting}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.remaining_quantity}
                                    value={item.current_receive}
                                    onChange={(e) => updateReceivingQuantity(item.po_item_id, parseInt(e.target.value) || 0)}
                                    className="w-14 text-center h-8"
                                    disabled={submitting}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateReceivingQuantity(item.po_item_id, item.current_receive + 1)}
                                    disabled={item.current_receive >= item.remaining_quantity || submitting}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.condition}
                                  onValueChange={(value: "GOOD" | "DAMAGED" | "DEFECTIVE") => 
                                    updateReceivingCondition(item.po_item_id, value)
                                  }
                                  disabled={submitting}
                                >
                                  <SelectTrigger className="w-24 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GOOD">Good</SelectItem>
                                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                                    <SelectItem value="DEFECTIVE">Defective</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <div className="font-medium">{formatCurrency(itemTotal)}</div>
                                {item.current_receive > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.current_receive} × {formatCurrency(item.unit_price)}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Items Cards */}
                  <div className="md:hidden space-y-3">
                    {receivingItems.map((item) => (
                      <MobileItemCard
                        key={item.po_item_id}
                        item={item}
                        onUpdateQuantity={updateReceivingQuantity}
                        onUpdateBrand={updateReceivingBrand}
                        onUpdateCondition={updateReceivingCondition}
                        onUpdateBatchNumber={(id, batch) => updateReceivingField(id, 'batch_number', batch)}
                        onUpdateNotes={(id, notes) => updateReceivingField(id, 'notes', notes)}
                        submitting={submitting}
                        formatCurrency={formatCurrency}
                        getConditionColor={getConditionColor}
                      />
                    ))}
                  </div>

                  {/* Desktop Serial Numbers Section */}
                  <div className="hidden md:block space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Barcode className="h-4 w-4" />
                        Serial Numbers
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        Enter serial numbers for each tire being received
                      </div>
                    </div>

                    {receivingItems
                      .filter(item => item.current_receive > 0)
                      .map((item) => (
                        <Card key={item.po_item_id} className="overflow-hidden">
                          <CardHeader className="py-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <CardTitle className="text-sm font-medium">
                                  {item.size} • {item.brand || 'No brand'} • Qty: {item.current_receive}
                                </CardTitle>
                                <CardDescription>
                                  Enter unique serial numbers for each tire
                                </CardDescription>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateBatchSerialNumbers(item.po_item_id)}
                                disabled={!item.brand || item.brand.trim() === "" || submitting}
                                className="w-full sm:w-auto"
                              >
                                <Key className="mr-2 h-3 w-3" />
                                Generate Batch
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {Array.from({ length: item.current_receive }).map((_, index) => (
                                <div key={index} className="space-y-1">
                                  <Label className="text-xs">Tire {index + 1}</Label>
                                  <Input
                                    value={(item.serial_numbers?.[index] || "")}
                                    onChange={(e) => updateSerialNumber(item.po_item_id, index, e.target.value)}
                                    placeholder={`SN-${index + 1}`}
                                    className="text-sm"
                                    disabled={submitting}
                                  />
                                </div>
                              ))}
                            </div>
                            {item.current_receive > 0 && (
                              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {(item.serial_numbers || []).filter(sn => sn.trim() !== "").length} / {item.current_receive} entered
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copySerialNumbersToClipboard((item.serial_numbers || []).filter(sn => sn.trim() !== ""))}
                                  disabled={(item.serial_numbers || []).filter(sn => sn.trim() !== "").length === 0 || submitting}
                                >
                                  <Copy className="mr-1 h-3 w-3" />
                                  Copy
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                    {receivingItems.filter(item => item.current_receive > 0).length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                          <Key className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Select quantities to receive above to enter serial numbers
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Mobile Serial Numbers Cards */}
                  <div className="md:hidden space-y-3">
                    {receivingItems
                      .filter(item => item.current_receive > 0)
                      .map((item) => (
                        <MobileSerialCard
                          key={item.po_item_id}
                          item={item}
                          onUpdateSerial={updateSerialNumber}
                          onGenerateBatch={generateBatchSerialNumbers}
                          submitting={submitting}
                        />
                      ))}

                    {receivingItems.filter(item => item.current_receive > 0).length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="py-8 text-center">
                          <Key className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Select quantities to receive above to enter serial numbers
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Item Notes Section */}
                  <div className="hidden md:block space-y-4">
                    <h3 className="font-medium">Item Notes</h3>
                    {receivingItems
                      .filter(item => item.current_receive > 0)
                      .map((item) => (
                        <div key={item.po_item_id} className="flex items-start gap-4">
                          <div className="min-w-[200px]">
                            <Label className="text-sm">
                              {item.size} ({item.brand || 'Brand required'})
                            </Label>
                            <div className="text-xs text-muted-foreground">
                              Receiving {item.current_receive} units
                            </div>
                          </div>
                          <div className="flex-1">
                            <Textarea
                              value={item.notes}
                              onChange={(e) => updateReceivingField(item.po_item_id, 'notes', e.target.value)}
                              placeholder="Add notes for this item"
                              rows={2}
                              disabled={submitting}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Action Buttons */}
            {canReceiveOrder && (
              <CardFooter className="border-t flex flex-col sm:flex-row gap-3 p-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCompleteReceive}
                    disabled={remainingToReceive === 0 || submitting}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Fill All
                  </Button>
                </div>
                
                <Button
                  onClick={handleReceiveGoods}
                  disabled={submitting || calculateTotalReceived() === 0}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 sm:ml-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Receive Goods
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Warning Messages */}
      {!canReceiveOrder && !isComplete && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Cannot Receive Goods</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  This purchase order is in "{order.status}" status and cannot receive goods. 
                  Only orders in ORDERED, PARTIALLY_RECEIVED, DRAFT, or APPROVED status can receive goods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {receivingItems.some(item => item.current_receive > 0 && 
        (item.serial_numbers || []).filter(sn => sn.trim() !== "").length !== item.current_receive) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Serial Numbers Required</h3>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Please enter serial numbers for all tires being received. 
                  You can use the "Generate Batch" button for auto-generation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {receivingItems.some(item => item.current_receive > 0 && (!item.brand || item.brand.trim() === "")) && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Brand Required</h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Please enter the brand for all items being received. Brand is required when receiving goods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Menu Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Order Information</SheetTitle>
            <SheetDescription>
              Purchase order details and status
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Order Status</Label>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created By</Label>
              <div className="text-sm">{order.created_by_name || `User ${order.created_by}`}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Order Dates</Label>
              <div className="text-sm">Order: {formatDate(order.po_date)}</div>
              <div className="text-sm">Expected: {formatDate(order.expected_delivery_date)}</div>
            </div>
            {order.notes && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Order Notes</Label>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
            <Separator />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Delivery Sheet */}
      <Sheet open={isDeliverySheetOpen} onOpenChange={setIsDeliverySheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Information
            </SheetTitle>
            <SheetDescription>
              Enter delivery details for this receipt
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mobile_receipt_date">
                Receipt Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="mobile_receipt_date"
                type="date"
                value={receivingData.receipt_date}
                onChange={(e) => updateReceivingData('receipt_date', e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_delivery_note">Delivery Note No</Label>
              <Input
                id="mobile_delivery_note"
                value={receivingData.delivery_note_number}
                onChange={(e) => updateReceivingData('delivery_note_number', e.target.value)}
                placeholder="e.g., DN-2024-001"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mobile_vehicle">Vehicle Number</Label>
                <Input
                  id="mobile_vehicle"
                  value={receivingData.vehicle_number}
                  onChange={(e) => updateReceivingData('vehicle_number', e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile_driver">Driver Name</Label>
                <Input
                  id="mobile_driver"
                  value={receivingData.driver_name}
                  onChange={(e) => updateReceivingData('driver_name', e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_receiving_notes">Receiving Notes</Label>
              <Textarea
                id="mobile_receiving_notes"
                value={receivingData.receiving_notes}
                onChange={(e) => updateReceivingData('receiving_notes', e.target.value)}
                placeholder="Any notes about the delivery..."
                rows={2}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_inspection_notes">Inspection Notes</Label>
              <Textarea
                id="mobile_inspection_notes"
                value={receivingData.inspection_notes}
                onChange={(e) => updateReceivingData('inspection_notes', e.target.value)}
                placeholder="Quality inspection findings..."
                rows={2}
                disabled={submitting}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1" 
                onClick={() => setIsDeliverySheetOpen(false)}
              >
                Save & Close
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsDeliverySheetOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* GRN Success Dialog */}
      <Dialog open={showGRNDialog} onOpenChange={setShowGRNDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Goods Received Note Created
            </DialogTitle>
            <DialogDescription>
              GRN has been created successfully. The tires have been added to inventory.
            </DialogDescription>
          </DialogHeader>

          {selectedGrnId && (
            <GRNDetails
              grnId={selectedGrnId}
              open={grnDetailsOpen}
              onOpenChange={(open: boolean) => {
                setGrnDetailsOpen(open);
                if (!open) {
                  setSelectedGrnId(null);
                }
              }}
            />
          )}

          {generatedGRN && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>GRN Number</Label>
                  <div className="text-lg font-bold break-all">{generatedGRN.grn_number}</div>
                </div>
                <div>
                  <Label>PO Number</Label>
                  <div className="text-lg font-medium break-all">{order?.po_number}</div>
                </div>
                <div>
                  <Label>Received By</Label>
                  <div className="text-sm">{user?.full_name || user?.username}</div>
                </div>
                <div>
                  <Label>Receipt Date</Label>
                  <div className="text-sm">{formatDate(receivingData.receipt_date)}</div>
                </div>
              </div>

              <div>
                <Label>Received Items Summary</Label>
                <div className="mt-2 rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Item</TableHead>
                        <TableHead className="text-center whitespace-nowrap">Quantity</TableHead>
                        <TableHead className="whitespace-nowrap">Serial Numbers</TableHead>
                        <TableHead className="whitespace-nowrap">Brand</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedGRN.items.map((item) => {
                        const poItem = order?.items?.find(oi => oi.id === item.po_item_id);
                        return (
                          <TableRow key={item.grnItemId}>
                            <TableCell className="whitespace-nowrap">
                              {poItem?.size} • {item.brand}
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              {item.quantity_received}
                            </TableCell>
                            <TableCell>
                              <div className="max-h-20 overflow-y-auto">
                                {item.serial_numbers.map((sn, idx) => (
                                  <div key={idx} className="text-xs font-mono py-0.5 break-all">
                                    {sn}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm font-medium">{item.brand}</div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <Label>Tires Added to Inventory</Label>
                <div className="mt-2 text-sm text-muted-foreground">
                  {generatedGRN.tires.length} tires have been added to inventory with status "IN_STORE".
                  Each tire is associated with the brand entered during receiving.
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGRNDialog(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={navigateToGRN}
              className="w-full sm:w-auto"
            >
              View GRN Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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