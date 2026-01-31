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
} from "lucide-react";
import Link from "next/link";

interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  tire_id: number | null;
  tire_size: string;
  tire_brand: string;
  tire_model: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
  item_count: number;
  total_received: number | null;
  items: PurchaseOrderItem[];
}

interface ReceivingItem {
  item_id: number;
  tire_id: number | null;
  tire_size: string;
  tire_brand: string;
  tire_model: string;
  ordered_quantity: number;
  previously_received: number;
  current_receive: number;
  unit_price: number;
  location: string;
  condition: "GOOD" | "DAMAGED" | "DEFECTIVE";
  notes: string;
}

export default function ReceiveGoodsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [receivingData, setReceivingData] = useState({
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    carrier_name: "",
    tracking_number: "",
    bill_of_lading: "",
    driver_name: "",
    vehicle_plate: "",
    receiving_notes: "",
    inspection_notes: "",
    received_by: "",
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
            item_id: item.id,
            tire_id: item.tire_id,
            tire_size: item.tire_size,
            tire_brand: item.tire_brand,
            tire_model: item.tire_model,
            ordered_quantity: item.quantity,
            previously_received: item.received_quantity || 0,
            current_receive: Math.max(0, item.quantity - (item.received_quantity || 0)),
            unit_price: item.unit_price,
            location: "WAREHOUSE-A", // Default location
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

  const updateReceivingQuantity = (itemId: number, quantity: number) => {
    setReceivingItems(prev =>
      prev.map(item => {
        if (item.item_id === itemId) {
          const newQuantity = Math.max(0, Math.min(
            quantity,
            item.ordered_quantity - item.previously_received
          ));
          return { ...item, current_receive: newQuantity };
        }
        return item;
      })
    );
  };

  const updateReceivingCondition = (itemId: number, condition: "GOOD" | "DAMAGED" | "DEFECTIVE") => {
    setReceivingItems(prev =>
      prev.map(item =>
        item.item_id === itemId ? { ...item, condition } : item
      )
    );
  };

  const updateReceivingField = (itemId: number, field: keyof ReceivingItem, value: string) => {
    setReceivingItems(prev =>
      prev.map(item =>
        item.item_id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const updateReceivingData = (field: keyof typeof receivingData, value: string) => {
    setReceivingData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
      case "CLOSED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
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
      item.current_receive > (item.ordered_quantity - item.previously_received)
    );
    if (hasInvalidQuantities) {
      toast.error("Cannot receive more than ordered quantity");
      return false;
    }

    // Validate required fields
    if (!receivingData.delivery_date) {
      toast.error("Delivery date is required");
      return false;
    }

    return true;
  };

  const handlePartialReceive = async () => {
    if (!validateReceiving()) return;

    setSubmitting(true);
    try {
      const receiveData = {
        purchase_order_id: orderId,
        delivery_date: `${receivingData.delivery_date}T${receivingData.delivery_time}:00`,
        carrier_name: receivingData.carrier_name,
        tracking_number: receivingData.tracking_number,
        bill_of_lading: receivingData.bill_of_lading,
        driver_name: receivingData.driver_name,
        vehicle_plate: receivingData.vehicle_plate,
        receiving_notes: receivingData.receiving_notes,
        inspection_notes: receivingData.inspection_notes,
        received_by: receivingData.received_by,
        items: receivingItems
          .filter(item => item.current_receive > 0)
          .map(item => ({
            order_item_id: item.item_id,
            tire_id: item.tire_id,
            quantity: item.current_receive,
            unit_price: item.unit_price,
            location: item.location,
            condition: item.condition,
            notes: item.notes,
          })),
      };

      const response = await fetch('http://localhost:5000/api/purchase-orders/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiveData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Goods received successfully!");
        router.push(`/purchases?tab=orders`);
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
    if (!validateReceiving()) return;

    // Auto-fill remaining quantities if not already specified
    const updatedItems = receivingItems.map(item => ({
      ...item,
      current_receive: item.current_receive > 0 
        ? item.current_receive 
        : (item.ordered_quantity - item.previously_received)
    }));

    setReceivingItems(updatedItems);
    
    // Submit after a brief delay to show the update
    setTimeout(() => {
      handlePartialReceive();
    }, 100);
  };

  const handleReturnToSupplier = async () => {
    // This would typically open a modal for return details
    toast.info("Return to supplier functionality coming soon");
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

  const canReceive = ["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING", "APPROVED"].includes(order.status);
  const isComplete = order.status === "RECEIVED" || order.status === "CLOSED";
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
                    {order.item_count} items • {totalOrdered} units total
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={receivingData.delivery_date}
                    onChange={(e) => updateReceivingData('delivery_date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Time</Label>
                  <Input
                    id="delivery_time"
                    type="time"
                    value={receivingData.delivery_time}
                    onChange={(e) => updateReceivingData('delivery_time', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier_name">Carrier Name</Label>
                <Input
                  id="carrier_name"
                  value={receivingData.carrier_name}
                  onChange={(e) => updateReceivingData('carrier_name', e.target.value)}
                  placeholder="e.g., UPS, FedEx, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking_number">Tracking #</Label>
                  <Input
                    id="tracking_number"
                    value={receivingData.tracking_number}
                    onChange={(e) => updateReceivingData('tracking_number', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bill_of_lading">Bill of Lading</Label>
                  <Input
                    id="bill_of_lading"
                    value={receivingData.bill_of_lading}
                    onChange={(e) => updateReceivingData('bill_of_lading', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver_name">Driver Name</Label>
                <Input
                  id="driver_name"
                  value={receivingData.driver_name}
                  onChange={(e) => updateReceivingData('driver_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_plate">Vehicle Plate</Label>
                <Input
                  id="vehicle_plate"
                  value={receivingData.vehicle_plate}
                  onChange={(e) => updateReceivingData('vehicle_plate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_by">Received By *</Label>
                <Input
                  id="received_by"
                  value={receivingData.received_by}
                  onChange={(e) => updateReceivingData('received_by', e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Inspection Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    Specify quantities, conditions, and locations for each item
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
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tire Details</TableHead>
                        <TableHead className="text-center">Ordered</TableHead>
                        <TableHead className="text-center">Previously Received</TableHead>
                        <TableHead className="text-center">Receive Now</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivingItems.map((item) => {
                        const remaining = item.ordered_quantity - item.previously_received;
                        const itemTotal = item.current_receive * item.unit_price;
                        
                        return (
                          <TableRow key={item.item_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.tire_size}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.tire_brand} • {item.tire_model}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Unit: {formatCurrency(item.unit_price)}
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
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateReceivingQuantity(item.item_id, item.current_receive - 1)}
                                  disabled={item.current_receive <= 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="w-16">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={remaining}
                                    value={item.current_receive}
                                    onChange={(e) => updateReceivingQuantity(item.item_id, parseInt(e.target.value) || 0)}
                                    className="text-center"
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateReceivingQuantity(item.item_id, item.current_receive + 1)}
                                  disabled={item.current_receive >= remaining}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-center text-muted-foreground mt-1">
                                Max: {remaining}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.location}
                                onChange={(e) => updateReceivingField(item.item_id, 'location', e.target.value)}
                                placeholder="Location"
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.condition}
                                onValueChange={(value: "GOOD" | "DAMAGED" | "DEFECTIVE") => 
                                  updateReceivingCondition(item.item_id, value)
                                }
                              >
                                <SelectTrigger className="w-32">
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
                      
                      {/* Summary Row */}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={6} className="text-right font-semibold">
                          Total Receiving Value:
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          {formatCurrency(calculateTotalValue())}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Item Notes Section */}
              {receivingItems.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium">Item-Specific Notes</h3>
                  {receivingItems.map((item) => (
                    <div key={item.item_id} className="flex items-start gap-4">
                      <div className="min-w-[200px]">
                        <Label className="text-sm">
                          {item.tire_size} ({item.tire_brand})
                        </Label>
                      </div>
                      <div className="flex-1">
                        <Textarea
                          value={item.notes}
                          onChange={(e) => updateReceivingField(item.item_id, 'notes', e.target.value)}
                          placeholder="Add notes for this item (condition, defects, etc.)"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
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
                          condition: "GOOD",
                          location: "WAREHOUSE-A",
                          notes: ""
                        }))
                      );
                      toast.info("Receiving form reset");
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={handleReturnToSupplier}
                          disabled={!receivingItems.some(item => item.condition !== "GOOD")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Return Damaged
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark damaged/defective items for return to supplier</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePartialReceive}
                    disabled={submitting || calculateTotalReceived() === 0}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? "Processing..." : "Partial Receive"}
                  </Button>
                  
                  <Button
                    onClick={handleCompleteReceive}
                    disabled={submitting || remainingToReceive === 0}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {submitting ? "Processing..." : "Complete Receive"}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>

          {/* Quick Actions */}
          {canReceive && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{currentlyReceiving}</div>
                    <div className="text-sm text-muted-foreground">Items to Receive</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {remainingToReceive - currentlyReceiving}
                    </div>
                    <div className="text-sm text-muted-foreground">Will Remain</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{progressPercentage}%</div>
                    <div className="text-sm text-muted-foreground">Progress After</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
                  Only orders in ORDERED, PARTIALLY_RECEIVED, DRAFT, PENDING, or APPROVED status can receive goods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {receivingItems.some(item => item.condition !== "GOOD") && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-medium">Non-Good Condition Items</h3>
                <p className="text-sm text-orange-700">
                  Some items are marked as damaged or defective. Consider using the "Return Damaged" 
                  button to initiate a return to the supplier.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}