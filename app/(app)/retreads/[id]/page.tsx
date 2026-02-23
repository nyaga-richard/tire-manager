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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Menu,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Info,
  ListOrdered,
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
    retread_count: number;
    status: string;
    notes?: string;
    item_status?: string;
    cost?: number;
  }>;
  timeline: Array<{
    id: number;
    status: string;
    created_at: string;
    note?: string;
    user: string;
  }>;
  received_tires?: number;
}

// Loading Skeleton Component
const OrderDetailsSkeleton = () => (
  <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6 max-w-7xl">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 sm:w-64" />
          <Skeleton className="h-4 w-32 sm:w-40" />
        </div>
      </div>
      <div className="hidden sm:flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="sm:hidden">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>

    {/* Mobile Info Button Skeleton */}
    <div className="sm:hidden">
      <Skeleton className="h-10 w-full" />
    </div>

    {/* Desktop Grid Skeleton */}
    <div className="hidden sm:grid gap-6 md:grid-cols-3">
      <Skeleton className="h-64 md:col-span-2" />
      <Skeleton className="h-64" />
    </div>

    {/* Tabs Skeleton */}
    <div>
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-96 w-full" />
    </div>
  </div>
);

// Mobile Tire Card Component (optimized)
const MobileTireCard = ({
  tire,
  formatCurrency,
  getStatusBadge,
}: {
  tire: RetreadOrder['tires'][0];
  formatCurrency: (amount?: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0 overflow-hidden">
      <CardContent className="p-4">
        {/* Header - Touch target optimized */}
        <div 
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
        >
          <div className="flex-1 min-w-0 pr-2">
            <div className="font-mono font-medium text-sm truncate">
              {tire.serial_number}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {tire.size}
              </Badge>
              <span className="text-xs text-muted-foreground">{tire.brand}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {tire.item_status ? (
              <Badge variant="outline" className={
                tire.item_status === "RECEIVED" 
                  ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-xs px-2 py-0.5"
                  : tire.item_status === "REJECTED" 
                  ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 text-xs px-2 py-0.5"
                  : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800 text-xs px-2 py-0.5"
              }>
                {tire.item_status}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 text-xs px-2 py-0.5">
                Pending
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 touch-manipulation"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Basic Info - Touch optimized grid */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-muted/30 rounded-md p-2">
            <div className="text-xs text-muted-foreground mb-1">Depth</div>
            <div className="text-base font-medium">{tire.depth_remaining}mm</div>
          </div>
          <div className="bg-muted/30 rounded-md p-2">
            <div className="text-xs text-muted-foreground mb-1">Retreads</div>
            <div className="text-base font-medium">
              <Badge variant="outline" className="text-xs px-2">
                {tire.retread_count || 0}
              </Badge>
            </div>
          </div>
          <div className="bg-muted/30 rounded-md p-2">
            <div className="text-xs text-muted-foreground mb-1">Cost</div>
            <div className="text-base font-medium">{tire.cost ? formatCurrency(tire.cost) : "-"}</div>
          </div>
        </div>

        {/* Expanded Details - Touch optimized */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {tire.model && (
              <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md">
                <span className="text-xs text-muted-foreground">Model:</span>
                <span className="text-sm font-medium">{tire.model}</span>
              </div>
            )}
            {tire.notes && (
              <div className="bg-muted/20 p-3 rounded-md">
                <span className="text-xs text-muted-foreground block mb-1">Notes:</span>
                <p className="text-sm">{tire.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Timeline Card Component (optimized)
const MobileTimelineCard = ({
  event,
  index,
  total,
  getStatusBadge,
  formatDateTime,
}: {
  event: RetreadOrder['timeline'][0];
  index: number;
  total: number;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDateTime: (date?: string) => string;
}) => {
  return (
    <div className="flex gap-4 pb-5 last:pb-0">
      <div className="relative">
        <div className="w-3 h-3 mt-1.5 rounded-full bg-primary ring-4 ring-background" />
        {index < total - 1 && (
          <div className="absolute top-4 left-1.5 w-0.5 h-full -translate-x-1/2 bg-border" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <div className="shrink-0">
            {getStatusBadge(event.status)}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(event.created_at)}
          </span>
        </div>
        {event.note && (
          <p className="text-sm bg-muted/30 p-3 rounded-md mb-2">{event.note}</p>
        )}
        <p className="text-xs text-muted-foreground">
          by {event.user}
        </p>
      </div>
    </div>
  );
};

export default function RetreadOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<RetreadOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"tires" | "timeline">("tires");
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.error || "Failed to fetch order details");
        toast.error(data.error || "Failed to fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Network error. Please check your connection.");
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
        setIsActionSheetOpen(false);
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
        setIsActionSheetOpen(false);
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
      <Badge variant="outline" className={`${config.color} flex items-center gap-1 text-xs sm:text-sm px-2 py-1`}>
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{status.replace(/_/g, " ")}</span>
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
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReceiveOrder = () => {
    router.push(`/retreads/${params.id}/receive`);
    setIsActionSheetOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsActionSheetOpen(false);
  };

  const handleDownloadPDF = () => {
    toast.info("PDF download feature coming soon");
    setIsActionSheetOpen(false);
  };

  const handleEditOrder = () => {
    router.push(`/retreads/${params.id}/edit`);
    setIsActionSheetOpen(false);
  };

  // Show loading skeleton
  if (loading) {
    return <OrderDetailsSkeleton />;
  }

  // Error state (like benchmark page)
  if (error || !order) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                Order Not Found
              </CardTitle>
              <CardDescription className="text-center">
                {error || "The retread order you're looking for doesn't exist"}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push("/retreads")} className="min-w-[120px]">
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate received tires count
  const receivedTiresCount = order.tires?.filter(t => t.item_status === "RECEIVED").length || 0;
  const rejectedTiresCount = order.tires?.filter(t => t.item_status === "REJECTED").length || 0;
  const pendingTiresCount = order.tires?.filter(t => !t.item_status || t.item_status === "PENDING").length || 0;

  return (
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6 max-w-7xl">
      {/* Header - Optimized for mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/retreads")} 
            className="shrink-0 h-10 w-10 touch-manipulation"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
                Order {order.order_number}
              </h1>
              <div className="shrink-0 self-start sm:self-center">
                {getStatusBadge(order.status)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">
              Created {formatDate(order.created_at)} by {order.created_by}
            </p>
          </div>
        </div>
        
        {/* Desktop Actions - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrint} size="sm" className="h-9">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} size="sm" className="h-9">
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
                className="h-9"
              >
                {sending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Order
              </Button>
              <Button variant="outline" onClick={handleEditOrder} size="sm" className="h-9">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          
          {order.status === "SENT" && (
            <Button onClick={handleReceiveOrder} size="sm" className="h-9">
              <CheckCircle className="mr-2 h-4 w-4" />
              Receive Order
            </Button>
          )}
          
          {order.status === "IN_PROGRESS" && (
            <Button onClick={handleReceiveOrder} size="sm" className="h-9">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Receiving
            </Button>
          )}
          
          {(order.status === "COMPLETED" || order.status === "PARTIALLY_RECEIVED") && (
            <Button onClick={handleReceiveOrder} size="sm" className="h-9">
              <CheckCircle className="mr-2 h-4 w-4" />
              {order.status === "COMPLETED" ? "Receive Order" : "Continue Receiving"}
            </Button>
          )}
        </div>

        {/* Mobile Actions Button - Full width on mobile */}
        <div className="sm:hidden">
          <Button 
            variant="outline" 
            className="w-full h-12 touch-manipulation"
            onClick={() => setIsActionSheetOpen(true)}
          >
            <Menu className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </div>
      </div>

      {/* Mobile Action Sheet - Optimized for touch */}
      <Sheet open={isActionSheetOpen} onOpenChange={setIsActionSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl px-4 pb-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg">Order Actions</SheetTitle>
            <SheetDescription className="text-sm">
              Choose an action for order {order.order_number}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3">
            <Button variant="outline" className="w-full justify-start h-12" onClick={handlePrint}>
              <Printer className="mr-3 h-5 w-5" />
              Print Order
            </Button>
            <Button variant="outline" className="w-full justify-start h-12" onClick={handleDownloadPDF}>
              <Download className="mr-3 h-5 w-5" />
              Download PDF
            </Button>
            
            {order.status === "DRAFT" && (
              <>
                <Button 
                  className="w-full justify-start h-12" 
                  onClick={handleSendOrder} 
                  disabled={sending}
                >
                  {sending ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="mr-3 h-5 w-5" />
                  )}
                  Send Order
                </Button>
                <Button variant="outline" className="w-full justify-start h-12" onClick={handleEditOrder}>
                  <Edit className="mr-3 h-5 w-5" />
                  Edit Order
                </Button>
              </>
            )}
            
            {(order.status === "SENT" || order.status === "IN_PROGRESS" || order.status === "COMPLETED" || order.status === "PARTIALLY_RECEIVED") && (
              <Button className="w-full justify-start h-12" onClick={handleReceiveOrder}>
                <CheckCircle className="mr-3 h-5 w-5" />
                {order.status === "SENT" ? "Receive Order" : 
                 order.status === "IN_PROGRESS" ? "Complete Receiving" : 
                 order.status === "COMPLETED" ? "Receive Order" : "Continue Receiving"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Info Button */}
      <div className="sm:hidden">
        <Button 
          variant="outline" 
          className="w-full h-12 touch-manipulation"
          onClick={() => setIsInfoSheetOpen(true)}
        >
          <Info className="mr-2 h-4 w-4" />
          View Order Summary
        </Button>
      </div>

      {/* Mobile Info Sheet - Optimized for touch */}
      <Sheet open={isInfoSheetOpen} onOpenChange={setIsInfoSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl px-4 pb-6 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Order Summary
            </SheetTitle>
            <SheetDescription className="text-sm">
              Details for order {order.order_number}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            {/* Order Details */}
            <div>
              <h4 className="text-sm font-medium mb-3">Order Details</h4>
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Tires:</span>
                  <span className="text-base font-medium">{order.total_tires}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Received:</span>
                  <span className="text-base font-medium text-green-600">{receivedTiresCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rejected:</span>
                  <span className="text-base font-medium text-red-600">{rejectedTiresCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending:</span>
                  <span className="text-base font-medium text-yellow-600">{pendingTiresCount}</span>
                </div>
                {order.total_cost > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Cost:</span>
                      <span className="text-base font-bold">{formatCurrency(order.total_cost)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Cost per Tire:</span>
                      <span className="text-base font-medium">{formatCurrency(order.total_cost / order.total_tires)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="text-sm font-medium mb-3">Dates</h4>
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-base">{formatDate(order.created_at)}</span>
                </div>
                {order.sent_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sent:</span>
                    <span className="text-base">{formatDate(order.sent_date)}</span>
                  </div>
                )}
                {order.expected_completion_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expected:</span>
                    <span className="text-base">{formatDate(order.expected_completion_date)}</span>
                  </div>
                )}
                {order.received_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Received:</span>
                    <span className="text-base">{formatDate(order.received_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Info */}
            <div>
              <h4 className="text-sm font-medium mb-3">Supplier Information</h4>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-base">{order.supplier.name}</div>
                        {order.supplier.contact_person && (
                          <div className="text-sm text-muted-foreground mt-0.5">{order.supplier.contact_person}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {order.supplier.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span className="text-sm">{order.supplier.phone}</span>
                        </div>
                      )}
                      
                      {order.supplier.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span className="text-sm break-all">{order.supplier.email}</span>
                        </div>
                      )}
                      
                      {order.supplier.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-sm">{order.supplier.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {order.notes && (
              <div>
                <h4 className="text-sm font-medium mb-3">Notes</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Grid Layout - Unchanged but responsive */}
      <div className="hidden sm:grid gap-6 md:grid-cols-3">
        {/* Order Summary */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Order Details</h4>
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
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Dates</h4>
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
                      <dt className="text-sm">Expected:</dt>
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
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Supplier Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="font-medium truncate">{order.supplier.name}</h4>
                  {order.supplier.contact_person && (
                    <p className="text-sm text-muted-foreground truncate">{order.supplier.contact_person}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
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

      {/* Desktop Tabs - Unchanged */}
      <div className="hidden sm:block">
        <Tabs defaultValue="tires" className="space-y-4">
          <TabsList className="h-10">
            <TabsTrigger value="tires" className="px-4">
              <Package className="mr-2 h-4 w-4" />
              Tires ({order.tires.length})
            </TabsTrigger>
            <TabsTrigger value="timeline" className="px-4">
              <Calendar className="mr-2 h-4 w-4" />
              Timeline ({order.timeline.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tires">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tires in this Order</CardTitle>
                <CardDescription>
                  List of tires sent for retreading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Serial Number</TableHead>
                        <TableHead className="whitespace-nowrap">Size</TableHead>
                        <TableHead className="whitespace-nowrap">Brand</TableHead>
                        <TableHead className="whitespace-nowrap">Model</TableHead>
                        <TableHead className="whitespace-nowrap">Depth</TableHead>
                        <TableHead className="whitespace-nowrap">Prev Retreads</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Cost</TableHead>
                        <TableHead className="whitespace-nowrap">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.tires.map((tire) => (
                        <TableRow key={tire.id}>
                          <TableCell className="font-mono font-medium whitespace-nowrap">
                            {tire.serial_number}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{tire.size}</TableCell>
                          <TableCell className="whitespace-nowrap">{tire.brand}</TableCell>
                          <TableCell className="whitespace-nowrap">{tire.model || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">{tire.depth_remaining}mm</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">
                              {tire.retread_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {tire.item_status ? (
                              <Badge variant="outline" className={
                                tire.item_status === "RECEIVED" 
                                  ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-xs"
                                  : tire.item_status === "REJECTED" 
                                  ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 text-xs"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800 text-xs"
                              }>
                                {tire.item_status}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 text-xs">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {tire.cost ? formatCurrency(tire.cost) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={tire.notes || "-"}>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Order Timeline</CardTitle>
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
                          <div className="w-2 h-2 mt-2 rounded-full bg-primary ring-4 ring-background" />
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
      </div>

      {/* Mobile Tabs - Optimized */}
      <div className="sm:hidden">
        <div className="flex border-b mb-4">
          <button
            className={`flex-1 py-3 text-sm font-medium touch-manipulation ${
              activeMobileTab === "tires" 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveMobileTab("tires")}
            role="tab"
            aria-selected={activeMobileTab === "tires"}
          >
            Tires ({order.tires.length})
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium touch-manipulation ${
              activeMobileTab === "timeline" 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveMobileTab("timeline")}
            role="tab"
            aria-selected={activeMobileTab === "timeline"}
          >
            Timeline ({order.timeline.length})
          </button>
        </div>

        {/* Mobile Tires View */}
        {activeMobileTab === "tires" && (
          <div className="space-y-3">
            {order.tires.map((tire) => (
              <MobileTireCard
                key={tire.id}
                tire={tire}
                formatCurrency={formatCurrency}
                getStatusBadge={(status) => {
                  if (status === "RECEIVED") {
                    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 text-xs px-2 py-0.5">Received</Badge>;
                  } else if (status === "REJECTED") {
                    return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 text-xs px-2 py-0.5">Rejected</Badge>;
                  } else {
                    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800 text-xs px-2 py-0.5">Pending</Badge>;
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Mobile Timeline View */}
        {activeMobileTab === "timeline" && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              {order.timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No timeline events yet
                </div>
              ) : (
                <div className="space-y-2">
                  {order.timeline.map((event, index) => (
                    <MobileTimelineCard
                      key={event.id}
                      event={event}
                      index={index}
                      total={order.timeline.length}
                      getStatusBadge={getStatusBadge}
                      formatDateTime={formatDateTime}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Cards for Received/Rejected - Desktop */}
      {(order.status === "RECEIVED" || order.status === "PARTIALLY_RECEIVED") && (
        <div className="hidden sm:grid gap-4 md:grid-cols-3">
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

      {/* Summary Cards for Received/Rejected - Mobile (Optimized touch targets) */}
      {(order.status === "RECEIVED" || order.status === "PARTIALLY_RECEIVED") && (
        <div className="sm:hidden grid gap-2 grid-cols-3">
          <Card className="touch-manipulation">
            <CardContent className="p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Received</div>
              <div className="text-xl font-bold text-green-600">{receivedTiresCount}</div>
            </CardContent>
          </Card>
          <Card className="touch-manipulation">
            <CardContent className="p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Rejected</div>
              <div className="text-xl font-bold text-red-600">{rejectedTiresCount}</div>
            </CardContent>
          </Card>
          <Card className="touch-manipulation">
            <CardContent className="p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Pending</div>
              <div className="text-xl font-bold text-yellow-600">{pendingTiresCount}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}