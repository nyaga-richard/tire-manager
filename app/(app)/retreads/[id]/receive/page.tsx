"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Package,
  Loader2,
  DollarSign,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const RETREAD_API = `${API_BASE_URL}/api/retread`;
const GRN_API = `${API_BASE_URL}/api/grn`;

interface ReceivedTire {
  tire_id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  received_depth: number;
  quality: "GOOD" | "ACCEPTABLE" | "POOR";
  notes: string;
  status: "PENDING" | "RECEIVED" | "REJECTED";
  cost?: number;
  previous_retread_count?: number;
}

export default function ReceiveRetreadOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState<number>();
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [tires, setTires] = useState<ReceivedTire[]>([]);
  const [costs, setCosts] = useState<Record<number, number>>({});

  // GRN specific fields
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [grnNotes, setGrnNotes] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${RETREAD_API}/retread-orders/${params.id}/receive`);
      const data = await response.json();
      
      if (data.success) {
        setOrderNumber(data.data.order_number);
        setSupplierName(data.data.supplier_name || "");
        setSupplierId(data.data.supplier_id);
        
        interface ApiTireData {
          tire_id: number;
          serial_number: string;
          size: string;
          brand: string;
          model: string | null;
          previous_retread_count: number;
          tread_depth_new: number;
          estimated_cost?: number;
        }
        
        const initialTires: ReceivedTire[] = data.data.tires.map((tire: ApiTireData) => ({
          tire_id: tire.tire_id,
          serial_number: tire.serial_number,
          size: tire.size,
          brand: tire.brand,
          model: tire.model || "",
          received_depth: tire.tread_depth_new || 16,
          quality: "GOOD",
          notes: "",
          status: "PENDING",
          cost: tire.estimated_cost || 0,
          previous_retread_count: tire.previous_retread_count || 0
        }));
        
        setTires(initialTires);
        
        const initialCosts: Record<number, number> = {};
        initialTires.forEach(tire => {
          initialCosts[tire.tire_id] = tire.cost || 0;
        });
        setCosts(initialCosts);
      } else {
        toast.error(data.error || "Failed to fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const handleTireChange = (tireId: number, field: keyof ReceivedTire, value: any) => {
    setTires(prev =>
      prev.map(tire =>
        tire.tire_id === tireId ? { ...tire, [field]: value } : tire
      )
    );
  };

  const handleCostChange = (tireId: number, value: string) => {
    const cost = parseFloat(value) || 0;
    setCosts(prev => ({ ...prev, [tireId]: cost }));
  };

  const handleStatusChange = (tireId: number, status: "RECEIVED" | "REJECTED") => {
    setTires(prev =>
      prev.map(tire =>
        tire.tire_id === tireId ? { ...tire, status } : tire
      )
    );
  };

  const handleSelectAll = (status: "RECEIVED" | "REJECTED") => {
    setTires(prev =>
      prev.map(tire => ({ ...tire, status }))
    );
  };

  const validateForm = () => {
    const pendingTires = tires.filter(t => t.status === "PENDING");
    if (pendingTires.length > 0) {
      toast.error(`Please mark all tires as received or rejected (${pendingTires.length} pending)`);
      return false;
    }

    const receivedTires = tires.filter(t => t.status === "RECEIVED");
    const invalidDepth = receivedTires.some(t => !t.received_depth || t.received_depth <= 0);
    if (invalidDepth) {
      toast.error("Please enter valid received depth for all received tires");
      return false;
    }

    const invalidCost = receivedTires.some(t => {
      const cost = costs[t.tire_id];
      return !cost || cost <= 0;
    });
    if (invalidCost) {
      toast.error("Please enter valid cost for all received tires");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const receivedTires = tires.filter(t => t.status === "RECEIVED");
      const rejectedTires = tires.filter(t => t.status === "REJECTED");

      // Prepare data for retread order
      const receivedTiresForOrder = receivedTires.map(t => ({
        tire_id: t.tire_id,
        status: t.status,
        quality: t.quality,
        received_depth: t.received_depth,
        cost: costs[t.tire_id],
        notes: t.notes || "",
      }));

      const rejectedTiresForOrder = rejectedTires.map(t => ({
        tire_id: t.tire_id,
        status: t.status,
        quality: t.quality,
        received_depth: 0,
        cost: 0,
        notes: t.notes || "",
      }));

      // Step 1: Submit to retread endpoint
      const receiveResponse = await fetch(`${RETREAD_API}/retread-orders/${params.id}/receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          received_date: receivedDate,
          notes: notes || "",
          tires: [...receivedTiresForOrder, ...rejectedTiresForOrder],
          user_id: user?.id || 1,
        }),
      });

      const receiveData = await receiveResponse.json();
      
      if (!receiveData.success) {
        throw new Error(receiveData.error || receiveData.message || "Error receiving order");
      }

      // Step 2: If there are received tires, create a GRN
      if (receivedTires.length > 0) {
        // First, generate a GRN number
        const numberResponse = await fetch(`${GRN_API}/generate-number`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const numberData = await numberResponse.json();
        const grnNumber = numberData.success ? numberData.data : `GRN-${Date.now()}`;

        // Prepare GRN items in the format expected by your backend
        const grnItems = receivedTires.map(t => ({
          item_id: t.tire_id,
          item_type: "TIRE",
          item_code: t.serial_number,
          item_name: `${t.brand} ${t.model}`,
          description: `Retread tire - Size: ${t.size}, Quality: ${t.quality}, Depth: ${t.received_depth}mm`,
          quantity: 1,
          unit_price: costs[t.tire_id],
          total_price: costs[t.tire_id],
          received_quantity: 1,
          accepted_quantity: 1,
          rejected_quantity: 0,
          condition: t.quality,
          notes: t.notes || "",
          batch_number: `RT-${orderNumber}-${t.serial_number}`,
          manufacturing_date: new Date().toISOString().split('T')[0],
          expiry_date: null
        }));

        // Create GRN
        const grnPayload = {
          grn_number: grnNumber,
          po_id: parseInt(params.id as string),
          po_number: orderNumber,
          receipt_date: receivedDate,
          received_by: user?.id || 1,
          supplier_id: supplierId,
          supplier_name: supplierName,
          delivery_note_number: deliveryNoteNumber || null,
          vehicle_number: vehicleNumber || null,
          driver_name: driverName || null,
          notes: grnNotes || notes || `Retread tires received from order #${orderNumber}`,
          items: grnItems,
          total_value: receivedTires.reduce((sum, t) => sum + (costs[t.tire_id] || 0), 0),
          item_count: receivedTires.length,
          total_quantity: receivedTires.length,
          status: "COMPLETED"
        };

        console.log("Sending GRN payload:", grnPayload);

        const grnResponse = await fetch(`${GRN_API}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "credentials": "include",
          },
          body: JSON.stringify(grnPayload),
        });

        const grnData = await grnResponse.json();
        console.log("GRN Response:", grnData);
        
        if (grnData.success) {
          toast.success(`GRN #${grnData.data?.grn_number || grnNumber} created successfully`);
        } else {
          console.error("GRN creation failed:", grnData);
          toast.warning(`Order received but GRN creation failed: ${grnData.message || 'Unknown error'}`);
        }
      }

      toast.success(receiveData.message || "Order received successfully");
      router.push(`/retreads/${params.id}`);
      
    } catch (error: any) {
      console.error("Error processing receipt:", error);
      toast.error(error.message || "Failed to process receipt");
    } finally {
      setSubmitting(false);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "GOOD": return "bg-green-100 text-green-800";
      case "ACCEPTABLE": return "bg-yellow-100 text-yellow-800";
      case "POOR": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "KSH 0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace("KSH", "KSH");
  };

  const calculateTotalCost = () => {
    return Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  const receivedCount = tires.filter(t => t.status === "RECEIVED").length;
  const rejectedCount = tires.filter(t => t.status === "REJECTED").length;
  const pendingCount = tires.filter(t => t.status === "PENDING").length;
  const totalCost = calculateTotalCost();

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Retread Order</h1>
          <p className="text-muted-foreground">
            Order #{orderNumber} {supplierName && `- ${supplierName}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receiving Information</CardTitle>
              <CardDescription>
                Enter the receipt date and any notes for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="received-date">Received Date *</Label>
                  <Input
                    id="received-date"
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Order Status</Label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted">
                    <Badge variant="outline" className={
                      pendingCount === 0 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }>
                      {pendingCount === 0 ? "Ready to complete" : `${pendingCount} pending`}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* GRN Delivery Information */}
              {receivedCount > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-blue-600">
                    <FileText className="h-4 w-4" />
                    Delivery Information (for GRN)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery-note">Delivery Note #</Label>
                      <Input
                        id="delivery-note"
                        placeholder="e.g., DN-001"
                        value={deliveryNoteNumber}
                        onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle">Vehicle Number</Label>
                      <Input
                        id="vehicle"
                        placeholder="e.g., Kxx 123A"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver">Driver Name</Label>
                      <Input
                        id="driver"
                        placeholder="Driver's name"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="grn-notes">GRN Notes (Optional)</Label>
                    <Textarea
                      id="grn-notes"
                      placeholder="Additional notes for the GRN..."
                      value={grnNotes}
                      onChange={(e) => setGrnNotes(e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">Receiving Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about the received order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tires Received</CardTitle>
                  <CardDescription>
                    Record the condition and cost of each received tire
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll("RECEIVED")}
                    disabled={submitting}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    All Received
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll("REJECTED")}
                    className="text-red-600"
                    disabled={submitting}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    All Rejected
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Serial #</TableHead>
                      <TableHead className="min-w-[150px]">Tire Details</TableHead>
                      <TableHead className="min-w-[100px]">Depth (mm)</TableHead>
                      <TableHead className="min-w-[100px]">Quality</TableHead>
                      <TableHead className="min-w-[100px]">Cost (KSH)</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tires.map((tire) => (
                      <TableRow key={`${tire.tire_id}-${tire.serial_number}`} className={
                        tire.status === "REJECTED" ? "bg-red-50" :
                        tire.status === "RECEIVED" ? "bg-green-50" : ""
                      }>
                        <TableCell className="font-mono font-medium">
                          {tire.serial_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{tire.size}</div>
                            <div className="text-xs text-muted-foreground">
                              {tire.brand} {tire.model}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Prev retreads: {tire.previous_retread_count || 0}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="20"
                            value={tire.received_depth}
                            onChange={(e) => handleTireChange(tire.tire_id, "received_depth", parseFloat(e.target.value) || 0)}
                            className="w-20 h-8"
                            disabled={tire.status !== "RECEIVED" || submitting}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tire.quality}
                            onValueChange={(value: any) => handleTireChange(tire.tire_id, "quality", value)}
                            disabled={tire.status !== "RECEIVED" || submitting}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GOOD">Good</SelectItem>
                              <SelectItem value="ACCEPTABLE">Acceptable</SelectItem>
                              <SelectItem value="POOR">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          {tire.status === "RECEIVED" && (
                            <Badge variant="outline" className={`mt-1 ${getQualityColor(tire.quality)}`}>
                              {tire.quality}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">KSH</span>
                            <Input
                              type="number"
                              min="0"
                              step="100"
                              value={costs[tire.tire_id] || 0}
                              onChange={(e) => handleCostChange(tire.tire_id, e.target.value)}
                              className="w-24 h-8"
                              disabled={tire.status !== "RECEIVED" || submitting}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tire.status}
                            onValueChange={(value: "RECEIVED" | "REJECTED") => handleStatusChange(tire.tire_id, value)}
                            disabled={submitting}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="RECEIVED">Received</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Notes"
                            value={tire.notes}
                            onChange={(e) => handleTireChange(tire.tire_id, "notes", e.target.value)}
                            className="h-8"
                            disabled={submitting}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receiving Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Tires:</span>
                    <span className="font-medium">{tires.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Received:</span>
                    <span className="font-medium text-green-600">
                      {receivedCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rejected:</span>
                    <span className="font-medium text-red-600">
                      {rejectedCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="font-medium text-yellow-600">
                      {pendingCount}
                    </span>
                  </div>
                </div>

                {receivedCount > 0 && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Cost Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Cost:</span>
                          <span className="font-bold">{formatCurrency(totalCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg per Tire:</span>
                          <span className="font-medium">
                            {formatCurrency(totalCost / receivedCount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Quality Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Good:</span>
                          <span className="font-medium">
                            {tires.filter(t => t.status === "RECEIVED" && t.quality === "GOOD").length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Acceptable:</span>
                          <span className="font-medium">
                            {tires.filter(t => t.status === "RECEIVED" && t.quality === "ACCEPTABLE").length}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Poor:</span>
                          <span className="font-medium">
                            {tires.filter(t => t.status === "RECEIVED" && t.quality === "POOR").length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || pendingCount > 0}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Receiving {receivedCount > 0 && "(GRN will be created)"}
                  </>
                )}
              </Button>
              
              {pendingCount > 0 && (
                <p className="text-xs text-yellow-600">
                  {pendingCount} tire{pendingCount !== 1 ? 's' : ''} still pending
                </p>
              )}

              {receivedCount > 0 && pendingCount === 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  GRN will be created for {receivedCount} tire(s)
                </p>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>All tires must be marked as Received or Rejected</li>
                <li>Record the actual tread depth for received tires (mm)</li>
                <li>Enter the actual cost for each received tire</li>
                <li>Rejected tires will be marked as DISPOSED</li>
                <li>Poor quality tires may require additional review</li>
                <li className="text-green-600">✓ A GRN will be created automatically for received tires</li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {receivedCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Depth:</span>
                    <span className="font-medium">
                      {(tires.filter(t => t.status === "RECEIVED")
                        .reduce((sum, t) => sum + t.received_depth, 0) / receivedCount || 0).toFixed(1)}mm
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-medium">
                      {((receivedCount / tires.length) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}