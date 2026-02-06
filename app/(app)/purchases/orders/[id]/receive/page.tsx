// app/purchases/orders/[id]/receive/page.tsx

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
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import Link from "next/link";

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
  }>;
  tires: Array<{
    id: number;
    serial_number: string;
    po_item_id: number;
  }>;
}

export default function ReceiveGoodsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [grnDetailsOpen, setGrnDetailsOpen] = useState(false);
  const [selectedGrnId, setSelectedGrnId] = useState<number | null>(null);


  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [generatedGRN, setGeneratedGRN] = useState<GRNDocument | null>(null);
  const [showGRNDialog, setShowGRNDialog] = useState(false);
  const [receivingData, setReceivingData] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    supplier_invoice_number: "",
    delivery_note_number: "",
    vehicle_number: "",
    driver_name: "",
    receiving_notes: "",
    inspection_notes: "",
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/purchase-orders/${orderId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const orderData = data.data;
        setOrder(orderData);
        
        // Initialize receiving items from order items
        if (orderData.items && Array.isArray(orderData.items)) {
          const items = orderData.items.map((item: PurchaseOrderItem) => ({
            po_item_id: item.id,
            size: item.size,
            brand: item.brand,
            model: item.model,
            type: item.type,
            ordered_quantity: item.quantity,
            previously_received: item.received_quantity || 0,
            remaining_quantity: item.remaining_quantity || item.quantity - (item.received_quantity || 0),
            current_receive: Math.max(0, item.quantity - (item.received_quantity || 0)),
            unit_price: item.unit_price,
            serial_numbers: Array(item.quantity - (item.received_quantity || 0)).fill(""),
            batch_number: `BATCH-${orderData.po_number}-${item.id}`,
            location: "WAREHOUSE-A",
            condition: "GOOD" as const,
            notes: "",
          }));
          setReceivingItems(items);
        }
      } else {
        toast.error("Failed to load purchase order");
        router.push("/purchases");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load purchase order");
      router.push("/purchases");
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
          
          // Adjust serial numbers array
          const currentSerials = item.serial_numbers || [];
          let newSerials = [...currentSerials];
          
          if (newQuantity > currentSerials.length) {
            // Add empty serial numbers
            const additional = Array(newQuantity - currentSerials.length).fill("");
            newSerials = [...currentSerials, ...additional];
          } else if (newQuantity < currentSerials.length) {
            // Remove excess serial numbers
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
          const newSerials = [...item.serial_numbers];
          newSerials[index] = value.toUpperCase();
          return { ...item, serial_numbers: newSerials };
        }
        return item;
      })
    );
  };

  const generateBatchSerialNumbers = (poItemId: number) => {
    setReceivingItems(prev =>
      prev.map(item => {
        if (item.po_item_id === poItemId) {
          const batchPrefix = `${item.brand?.slice(0, 3) || 'TIR'}-${item.size.replace('/', '-')}-${Date.now().toString().slice(-6)}`;
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
      case "CLOSED":
        return "bg-green-100 text-green-800 border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ORDERED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "PARTIALLY_RECEIVED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "GOOD":
        return "bg-green-100 text-green-800 border-green-200";
      case "DAMAGED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DEFECTIVE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
    // Check if at least one item has quantity > 0
    const hasItemsToReceive = receivingItems.some(item => item.current_receive > 0);
    if (!hasItemsToReceive) {
      toast.error("Please specify quantities to receive");
      return false;
    }

    // Check if any quantity exceeds remaining
    const hasInvalidQuantities = receivingItems.some(item => 
      item.current_receive > item.remaining_quantity
    );
    if (hasInvalidQuantities) {
      toast.error("Cannot receive more than remaining quantity");
      return false;
    }

    // Validate required fields
    if (!receivingData.receipt_date) {
      toast.error("Receipt date is required");
      return false;
    }

    // Validate serial numbers if entered
    for (const item of receivingItems) {
      if (item.current_receive > 0) {
        const enteredSerials = item.serial_numbers.filter(sn => sn.trim() !== "");
        if (enteredSerials.length !== item.current_receive) {
          toast.error(`Please enter all ${item.current_receive} serial numbers for ${item.size} ${item.brand}`);
          return false;
        }
        
        // Check for duplicate serial numbers within this item
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
    if (!validateReceiving()) return;

    setSubmitting(true);
    try {
      // Filter items with positive quantity
      const itemsToReceive = receivingItems
        .filter(item => item.current_receive > 0)
        .map(item => ({
          po_item_id: item.po_item_id,
          quantity_received: item.current_receive,
          unit_cost: item.unit_price,
          batch_number: item.batch_number,
          serial_numbers: item.serial_numbers.filter(sn => sn.trim() !== ""),
          notes: item.notes,
        }));

      const grnData = {
        po_id: parseInt(orderId),
        receipt_date: receivingData.receipt_date,
        received_by: 1, // TODO: Get from authentication
        supplier_invoice_number: receivingData.supplier_invoice_number,
        delivery_note_number: receivingData.delivery_note_number,
        vehicle_number: receivingData.vehicle_number,
        driver_name: receivingData.driver_name,
        notes: receivingData.receiving_notes,
        items: itemsToReceive,
      };

      const response = await fetch('http://localhost:5000/api/grn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grnData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Goods Received Note created successfully!");
        setGeneratedGRN(result.data);
        setShowGRNDialog(true);
        
        // Refresh order data
        fetchOrderDetails();
      } else {
        toast.error(result.message || "Failed to receive goods");
      }
    } catch (error) {
      console.error("Error receiving goods:", error);
      toast.error("Failed to receive goods");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReceive = async () => {
    // Auto-fill all remaining quantities
    const updatedItems = receivingItems.map(item => ({
      ...item,
      current_receive: item.remaining_quantity,
      serial_numbers: Array(item.remaining_quantity).fill("")
    }));
    
    setReceivingItems(updatedItems);
    
    toast.info("All remaining quantities filled. Please enter serial numbers.");
  };

  const copySerialNumbersToClipboard = (serialNumbers: string[]) => {
    const text = serialNumbers.join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Serial numbers copied to clipboard");
  };

  const printGRN = () => {
    // TODO: Implement GRN printing
    toast.info("GRN printing coming soon");
  };

  const downloadGRN = () => {
    // TODO: Implement GRN download
    toast.info("GRN download coming soon");
  };

  const navigateToGRN = () => {
    if (generatedGRN) {
      setSelectedGrnId(generatedGRN.grnId);
      setGrnDetailsOpen(true);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground mt-2">The purchase order could not be found.</p>
        <Button className="mt-4" asChild>
          <Link href="/purchases">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchases
          </Link>
        </Button>
      </div>
    );
  }

  const canReceive = ["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "APPROVED"].includes(order.status);
  const isComplete = order.status === "FULLY_RECEIVED" || order.status === "CLOSED";
  const totalOrdered = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalPreviouslyReceived = order.items?.reduce((sum, item) => sum + (item.received_quantity || 0), 0) || 0;
  const remainingToReceive = totalOrdered - totalPreviouslyReceived;
  const currentlyReceiving = calculateTotalReceived();
  const progressPercentage = totalOrdered > 0 ? Math.round(((totalPreviouslyReceived + currentlyReceiving) / totalOrdered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/purchases?tab=orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receive Goods</h1>
            <p className="text-muted-foreground">
              PO: {order.po_number} • {order.supplier_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Purchase order details and receiving progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Supplier Information</Label>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.supplier_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.supplier_type}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Order Dates</Label>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Order Date: {formatDate(order.po_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>Expected: {formatDate(order.expected_delivery_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Order Value</Label>
                <div className="mt-2 space-y-1">
                  <div className="text-2xl font-bold">{formatCurrency(order.final_amount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.items?.length || 0} items • {totalOrdered} units total
                  </div>
                </div>
              </div>
              {order.notes && (
                <div>
                  <Label className="text-sm font-medium">Order Notes</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Receiving Progress</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">{progressPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div className="text-center">
                      <div className="font-bold">{totalPreviouslyReceived}</div>
                      <div className="text-xs text-muted-foreground">Previously Received</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{currentlyReceiving}</div>
                      <div className="text-xs text-muted-foreground">Currently Receiving</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{remainingToReceive - currentlyReceiving}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receiving Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Information
              </CardTitle>
              <CardDescription>Enter delivery details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt_date">Receipt Date *</Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={receivingData.receipt_date}
                  onChange={(e) => updateReceivingData('receipt_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_invoice_number">Supplier Invoice No</Label>
                <Input
                  id="supplier_invoice_number"
                  value={receivingData.supplier_invoice_number}
                  onChange={(e) => updateReceivingData('supplier_invoice_number', e.target.value)}
                  placeholder="e.g., INV-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_note_number">Delivery Note No</Label>
                <Input
                  id="delivery_note_number"
                  value={receivingData.delivery_note_number}
                  onChange={(e) => updateReceivingData('delivery_note_number', e.target.value)}
                  placeholder="e.g., DN-2024-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_number">Vehicle Number</Label>
                  <Input
                    id="vehicle_number"
                    value={receivingData.vehicle_number}
                    onChange={(e) => updateReceivingData('vehicle_number', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver_name">Driver Name</Label>
                  <Input
                    id="driver_name"
                    value={receivingData.driver_name}
                    onChange={(e) => updateReceivingData('driver_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiving_notes">Receiving Notes</Label>
                <Textarea
                  id="receiving_notes"
                  value={receivingData.receiving_notes}
                  onChange={(e) => updateReceivingData('receiving_notes', e.target.value)}
                  placeholder="Any notes about the delivery..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspection_notes">Inspection Notes</Label>
                <Textarea
                  id="inspection_notes"
                  value={receivingData.inspection_notes}
                  onChange={(e) => updateReceivingData('inspection_notes', e.target.value)}
                  placeholder="Quality inspection findings..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Receiving Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">{currentlyReceiving}</div>
                  <div className="text-sm text-muted-foreground">Items to Receive</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateTotalValue())}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Serial Numbers</div>
                <div className="text-sm text-muted-foreground">
                  {receivingItems.reduce((sum, item) => 
                    sum + item.serial_numbers.filter(sn => sn.trim() !== "").length, 0
                  )} / {currentlyReceiving} entered
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items to Receive */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Items to Receive
                  </CardTitle>
                  <CardDescription>
                    Specify quantities, serial numbers, and conditions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Total: {currentlyReceiving} units • {formatCurrency(calculateTotalValue())}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!canReceive ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Order Already Completed</h3>
                  <p className="text-muted-foreground mt-2">
                    This purchase order has already been fully received.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Items Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Tire Details</TableHead>
                          <TableHead className="text-center">Ordered</TableHead>
                          <TableHead className="text-center">Previously Received</TableHead>
                          <TableHead className="text-center">Remaining</TableHead>
                          <TableHead className="text-center">Receive Now</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receivingItems.map((item) => {
                          const itemTotal = item.current_receive * item.unit_price;
                          const hasSerials = item.serial_numbers.some(sn => sn.trim() !== "");
                          
                          return (
                            <TableRow key={item.po_item_id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.size}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.brand} • {item.model} • {item.type}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Unit: {formatCurrency(item.unit_price)}
                                  </div>
                                  <div className="mt-1">
                                    <Input
                                      value={item.batch_number}
                                      onChange={(e) => updateReceivingField(item.po_item_id, 'batch_number', e.target.value)}
                                      placeholder="Batch number"
                                      className="w-full text-xs"
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="font-medium">{item.ordered_quantity}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="font-medium text-blue-600">
                                  {item.previously_received}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="font-medium">
                                  {item.remaining_quantity}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateReceivingQuantity(item.po_item_id, item.current_receive - 1)}
                                    disabled={item.current_receive <= 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <div className="w-16">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={item.remaining_quantity}
                                      value={item.current_receive}
                                      onChange={(e) => updateReceivingQuantity(item.po_item_id, parseInt(e.target.value) || 0)}
                                      className="text-center"
                                    />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateReceivingQuantity(item.po_item_id, item.current_receive + 1)}
                                    disabled={item.current_receive >= item.remaining_quantity}
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
                                >
                                  <SelectTrigger className="w-28">
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
                              </TableCell>
                              <TableCell className="text-right">
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

                  {/* Serial Numbers Section */}
                  <div className="space-y-4">
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
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-sm font-medium">
                                  {item.size} • {item.brand} • Qty: {item.current_receive}
                                </CardTitle>
                                <CardDescription>
                                  Enter unique serial numbers for each tire
                                </CardDescription>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateBatchSerialNumbers(item.po_item_id)}
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
                                    value={item.serial_numbers[index] || ""}
                                    onChange={(e) => updateSerialNumber(item.po_item_id, index, e.target.value)}
                                    placeholder={`SN-${item.size}-${index + 1}`}
                                    className="text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                            {item.current_receive > 0 && (
                              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {item.serial_numbers.filter(sn => sn.trim() !== "").length} / {item.current_receive} entered
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copySerialNumbersToClipboard(item.serial_numbers.filter(sn => sn.trim() !== ""))}
                                  disabled={item.serial_numbers.filter(sn => sn.trim() !== "").length === 0}
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

                  {/* Item Notes Section */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Item Notes</h3>
                    {receivingItems
                      .filter(item => item.current_receive > 0)
                      .map((item) => (
                        <div key={item.po_item_id} className="flex items-start gap-4">
                          <div className="min-w-[200px]">
                            <Label className="text-sm">
                              {item.size} ({item.brand})
                            </Label>
                            <div className="text-xs text-muted-foreground">
                              Receiving {item.current_receive} units
                            </div>
                          </div>
                          <div className="flex-1">
                            <Textarea
                              value={item.notes}
                              onChange={(e) => updateReceivingField(item.po_item_id, 'notes', e.target.value)}
                              placeholder="Add notes for this item (condition, defects, etc.)"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
            {canReceive && (
              <CardFooter className="border-t flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReceivingItems(prev =>
                        prev.map(item => ({
                          ...item,
                          current_receive: 0,
                          serial_numbers: Array(item.remaining_quantity).fill(""),
                          condition: "GOOD",
                          batch_number: `BATCH-${order?.po_number}-${item.po_item_id}`,
                          notes: ""
                        }))
                      );
                      toast.info("Receiving form reset");
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCompleteReceive}
                    disabled={remainingToReceive === 0}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Fill All Remaining
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleReceiveGoods}
                    disabled={submitting || calculateTotalReceived() === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? "Processing..." : "Receive Goods"}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Warning Messages */}
      {!canReceive && !isComplete && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium">Cannot Receive Goods</h3>
                <p className="text-sm text-yellow-700">
                  This purchase order is in "{order.status}" status and cannot receive goods. 
                  Only orders in ORDERED, PARTIALLY_RECEIVED, DRAFT, or APPROVED status can receive goods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {receivingItems.some(item => item.current_receive > 0 && 
        item.serial_numbers.filter(sn => sn.trim() !== "").length !== item.current_receive) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-medium">Serial Numbers Required</h3>
                <p className="text-sm text-orange-700">
                  Please enter serial numbers for all tires being received. 
                  You can use the "Generate Batch" button for auto-generation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRN Success Dialog */}
      <Dialog open={showGRNDialog} onOpenChange={setShowGRNDialog}>
        <DialogContent className="sm:max-w-4xl">
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
            onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
              setGrnDetailsOpen(open);
              if (!open) {
                setSelectedGrnId(null);
              }
            }}
          />
        )}

                  
          {generatedGRN && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GRN Number</Label>
                  <div className="text-lg font-bold">{generatedGRN.grn_number}</div>
                </div>
                <div>
                  <Label>PO Number</Label>
                  <div className="text-lg font-medium">{order?.po_number}</div>
                </div>
              </div>

              <div>
                <Label>Received Items Summary</Label>
                <div className="mt-2 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead>Serial Numbers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedGRN.items.map((item) => {
                        const poItem = order?.items?.find(oi => oi.id === item.po_item_id);
                        return (
                          <TableRow key={item.grnItemId}>
                            <TableCell>
                              {poItem?.size} • {poItem?.brand}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantity_received}
                            </TableCell>
                            <TableCell>
                              <div className="max-h-20 overflow-y-auto">
                                {item.serial_numbers.map((sn, idx) => (
                                  <div key={idx} className="text-xs font-mono py-0.5">
                                    {sn}
                                  </div>
                                ))}
                              </div>
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
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowGRNDialog(false)}
            >
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={printGRN}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print GRN
              </Button>
              <Button
                variant="outline"
                onClick={downloadGRN}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={navigateToGRN}
              >
                View GRN Details
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    
  );

  
}