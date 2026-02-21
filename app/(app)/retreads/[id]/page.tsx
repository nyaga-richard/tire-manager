"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Package,
  Building,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Download,
  Printer,
  Edit,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RetreadOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier: {
    id: number;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
  };
  status: "DRAFT" | "SENT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RECEIVED" | "PARTIALLY_RECEIVED";
  total_tires: number;
  total_cost: number;
  expected_completion_date?: string;
  sent_date?: string;
  received_date?: string;
  notes?: string;
  created_at: string;
  created_by: string;
  tires: Array<{
    id: number;
    serial_number: string;
    size: string;
    brand: string;
    model: string;
    depth_remaining: number;
    retread_count: number; // Changed from previous_retread_count
    status: string;
    notes?: string;
    item_status?: string; // Status in the order (PENDING, RECEIVED, REJECTED)
    cost?: number; // Added cost field
  }>;
  timeline: Array<{
    id: number;
    status: string;
    created_at: string; // Changed from date to match DB
    note?: string;
    user: string;
  }>;
  received_tires?: number; // Added for summary
}

export default function RetreadOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<RetreadOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
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

  const handleSendOrder = async () => {
    if (!confirm("Are you sure you want to mark this order as sent? This will update tire statuses to 'At Retread Supplier'.")) {
      return;
    }

    try {
      setSending(true);
      const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders/${params.id}/send`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: 1, // Get from auth context
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Order marked as sent successfully");
        fetchOrderDetails(); // Refresh data
      } else {
        toast.error(data.error || "Failed to send order");
      }
    } catch (error) {
      console.error("Error sending order:", error);
      toast.error("Failed to send order");
    } finally {
      setSending(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/retread-orders/${params.id}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: 1, // Get from auth context
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Order cancelled successfully");
        fetchOrderDetails();
      } else {
        toast.error(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock },
      SENT: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Truck },
      IN_PROGRESS: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Package },
      COMPLETED: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      CANCELLED: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      RECEIVED: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: CheckCircle },
      PARTIALLY_RECEIVED: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertCircle },
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return "KSH 0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReceiveOrder = () => {
    router.push(`/retreads/${params.id}/receive`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // You can implement PDF download here
    toast.info("PDF download feature coming soon");
  };

  const handleEditOrder = () => {
    router.push(`/retreads/${params.id}/edit`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Order not found</h3>
          <p className="text-muted-foreground mt-1">
            The retread order you're looking for doesn't exist
          </p>
          <Button onClick={() => router.push("/retreads")} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  // Calculate received tires count
  const receivedTiresCount = order.tires?.filter(t => t.item_status === "RECEIVED").length || 0;
  const rejectedTiresCount = order.tires?.filter(t => t.item_status === "REJECTED").length || 0;
  const pendingTiresCount = order.tires?.filter(t => !t.item_status || t.item_status === "PENDING").length || 0;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/retreads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Order {order.order_number}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-muted-foreground">
              Created on {formatDate(order.created_at)} by {order.created_by}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} size="sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          
          {/* Status-based actions */}
          {order.status === "DRAFT" && (
            <>
              <Button 
                onClick={handleSendOrder} 
                disabled={sending}
                size="sm"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Order
              </Button>
              <Button variant="outline" onClick={handleEditOrder} size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          
          {order.status === "SENT" && (
            <Button onClick={handleReceiveOrder} size="sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              Receive Order
            </Button>
          )}
          
          {order.status === "IN_PROGRESS" && (
            <Button onClick={handleReceiveOrder} size="sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Receiving
            </Button>
          )}
          
          {(order.status === "COMPLETED" || order.status === "PARTIALLY_RECEIVED") && (
            <Button onClick={handleReceiveOrder} size="sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              {order.status === "COMPLETED" ? "Receive Order" : "Continue Receiving"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Order Details</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm">Total Tires:</dt>
                    <dd className="text-sm font-medium">{order.total_tires}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm">Received:</dt>
                    <dd className="text-sm font-medium text-green-600">{receivedTiresCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm">Rejected:</dt>
                    <dd className="text-sm font-medium text-red-600">{rejectedTiresCount}</dd>
                  </div>
                  <div className="flex justify-between">
                        <dt className="text-sm">Pending:</dt>
                    <dd className="text-sm font-medium text-yellow-600">{pendingTiresCount}</dd>
                  </div>
                  {order.total_cost > 0 && (
                    <>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <dt className="text-sm font-medium">Total Cost:</dt>
                        <dd className="text-sm font-bold">{formatCurrency(order.total_cost)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Cost per Tire:</dt>
                        <dd className="text-sm font-medium">
                          {formatCurrency(order.total_cost / order.total_tires)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Dates</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm">Created:</dt>
                    <dd className="text-sm">{formatDate(order.created_at)}</dd>
                  </div>
                  {order.sent_date && (
                    <div className="flex justify-between">
                      <dt className="text-sm">Sent:</dt>
                      <dd className="text-sm">{formatDate(order.sent_date)}</dd>
                    </div>
                  )}
                  {order.expected_completion_date && (
                    <div className="flex justify-between">
                      <dt className="text-sm">Expected Completion:</dt>
                      <dd className="text-sm">{formatDate(order.expected_completion_date)}</dd>
                    </div>
                  )}
                  {order.received_date && (
                    <div className="flex justify-between">
                      <dt className="text-sm">Received:</dt>
                      <dd className="text-sm">{formatDate(order.received_date)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">{order.supplier.name}</h4>
                  {order.supplier.contact_person && (
                    <p className="text-sm text-muted-foreground">{order.supplier.contact_person}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {order.supplier.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{order.supplier.phone}</span>
                  </div>
                )}
                
                {order.supplier.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{order.supplier.email}</span>
                  </div>
                )}
                
                {order.supplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm">{order.supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tires and Timeline */}
      <Tabs defaultValue="tires" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tires">
            <Package className="mr-2 h-4 w-4" />
            Tires ({order.tires.length})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="mr-2 h-4 w-4" />
            Timeline ({order.timeline.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tires">
          <Card>
            <CardHeader>
              <CardTitle>Tires in this Order</CardTitle>
              <CardDescription>
                List of tires sent for retreading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Depth</TableHead>
                      <TableHead>Prev Retreads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.tires.map((tire) => (
                      <TableRow key={tire.id}>
                        <TableCell className="font-mono font-medium">
                          {tire.serial_number}
                        </TableCell>
                        <TableCell>{tire.size}</TableCell>
                        <TableCell>{tire.brand}</TableCell>
                        <TableCell>{tire.model || "-"}</TableCell>
                        <TableCell>{tire.depth_remaining}mm</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tire.retread_count || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          {tire.item_status ? (
                            <Badge variant="outline" className={
                              tire.item_status === "RECEIVED" ? "bg-green-100 text-green-800" :
                              tire.item_status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {tire.item_status}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tire.cost ? formatCurrency(tire.cost) : "-"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {tire.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
              <CardDescription>
                Track the progress of this retread order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.timeline.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No timeline events yet
                  </div>
                ) : (
                  order.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="relative">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                        {index < order.timeline.length - 1 && (
                          <div className="absolute top-4 left-1 w-0.5 h-full -translate-x-1/2 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(event.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(event.created_at)}
                          </span>
                        </div>
                        {event.note && (
                          <p className="text-sm text-muted-foreground mt-1">{event.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          by {event.user}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Cards for Received/Rejected */}
      {(order.status === "RECEIVED" || order.status === "PARTIALLY_RECEIVED") && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Received Tires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{receivedTiresCount}</div>
              <p className="text-xs text-muted-foreground">
                {((receivedTiresCount / order.total_tires) * 100).toFixed(0)}% of order
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejected Tires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedTiresCount}</div>
              <p className="text-xs text-muted-foreground">
                {((rejectedTiresCount / order.total_tires) * 100).toFixed(0)}% of order
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Tires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingTiresCount}</div>
              <p className="text-xs text-muted-foreground">
                {((pendingTiresCount / order.total_tires) * 100).toFixed(0)}% of order
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}