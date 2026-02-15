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
} from "lucide-react";
import Link from "next/link";

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
  status: "DRAFT" | "SENT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "RECEIVED";
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
    previous_retread_count: number;
    status: string;
    notes?: string;
  }>;
  timeline: Array<{
    id: number;
    status: string;
    date: string;
    note?: string;
    user: string;
  }>;
}

export default function RetreadOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<RetreadOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/retread-orders/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return "KSH 0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace("KSH", "KSH");
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
    // Implement PDF download
    console.log("Download PDF");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          {order.status === "COMPLETED" && (
            <Button onClick={handleReceiveOrder}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Receive Order
            </Button>
          )}
          {order.status === "DRAFT" && (
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Order
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
                    <dt className="text-sm">Total Cost:</dt>
                    <dd className="text-sm font-medium">{formatCurrency(order.total_cost)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm">Cost per Tire:</dt>
                    <dd className="text-sm font-medium">
                      {formatCurrency(order.total_cost / order.total_tires)}
                    </dd>
                  </div>
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
                  <p className="text-sm text-muted-foreground">{order.supplier.contact_person}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{order.supplier.phone}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{order.supplier.email}</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{order.supplier.address}</span>
                </div>
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
            Timeline
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
                      <TableHead>Depth Remaining</TableHead>
                      <TableHead>Prev Retreads</TableHead>
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
                        <TableCell>{tire.model}</TableCell>
                        <TableCell>{tire.depth_remaining}mm</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tire.previous_retread_count}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
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
                {order.timeline.map((event, index) => (
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
                          {formatDateTime(event.date)}
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}