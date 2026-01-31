"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
  AlertCircle,
  Building,
  User,
  CalendarDays,
  FileText as FileTextIcon,
  Truck as TruckIcon,
  PackageOpen,
  CreditCard,
  Printer as PrinterIcon,
  Download as DownloadIcon,
  ShoppingBag as ShoppingBagIcon,
  X,
  Printer,
  DollarSign,
  Layers,
  Eye,
  FileText,
  ChevronDown,
  Search,
  Filter,
  Wrench,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_contact: string;
  supplier_phone: string;
  supplier_email: string;
  supplier_address: string;
  supplier_type: string;
  po_date: string;
  expected_delivery_date: string | null;
  delivery_date: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED" | "CLOSED";
  total_amount: number;
  tax_amount: number;
  shipping_amount: number;
  final_amount: number;
  notes: string | null;
  terms: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  created_by: number;
  created_by_name: string;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
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
    notes: string;
    created_at: string;
    updated_at: string;
    tires_generated: number;
  }>;
  item_count?: number;
  total_received?: number | null;
}

interface PurchaseOrderModalProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PurchaseOrderDetails({ orderId, isOpen, onClose }: PurchaseOrderModalProps) {
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (orderId && isOpen) {
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [orderId, isOpen]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/purchase-orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        throw new Error("Invalid order data format");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `PO-${order?.po_number || 'Order'}`,
    pageStyle: `
      @media print {
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          -webkit-print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
      }
      @page {
        margin: 20mm;
      }
    `,
    onAfterPrint: () => toast.success("Purchase order printed successfully"),
    onPrintError: () => toast.error("Failed to print purchase order"),
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED":
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING":
      case "DRAFT":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "ORDERED":
        return <Package className="h-4 w-4" />;
      case "PARTIALLY_RECEIVED":
        return <Truck className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getProgress = () => {
    if (!order || !order.items || order.items.length === 0) return 0;
    
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = order.items.reduce((sum, item) => sum + item.received_quantity, 0);
    
    return totalQuantity > 0 ? Math.round((totalReceived / totalQuantity) * 100) : 0;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b no-print">
              <div>
                <h2 className="text-2xl font-bold">Purchase Order Details</h2>
                <p className="text-muted-foreground">
                  {order ? `PO: ${order.po_number}` : "Loading..."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrint}
                  disabled={!order}
                >
                  <PrinterIcon className="mr-2 h-4 w-4" />
                  Print/PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (!order) return;
                    
                    // Export as JSON
                    const dataStr = JSON.stringify(order, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const link = document.createElement('a');
                    link.setAttribute('href', dataUri);
                    link.setAttribute('download', `PO-${order.po_number}.json`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Order data exported as JSON");
                  }}
                  disabled={!order}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Content - Printable Area */}
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading order details...</p>
                  </div>
                </div>
              ) : !order ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Order not found</h3>
                  <p className="text-muted-foreground mt-1">
                    The requested purchase order could not be loaded
                  </p>
                </div>
              ) : (
                <div ref={printRef} className="space-y-8">
                  {/* Printable Header */}
                  <div className="border-b pb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-3xl font-bold">PURCHASE ORDER</h1>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">Order #:</span>
                            <span className="font-mono text-lg font-bold">{order.po_number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">Date:</span>
                            <span>{formatDate(order.po_date)}</span>
                          </div>
                          <div className="mt-2">
                            <Badge className={`${getStatusColor(order.status)}`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {order.status.replace("_", " ")}
                              </div>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold mb-2">Fleet Management System</div>
                        <div className="text-sm text-muted-foreground">
                          123 Fleet Street<br />
                          Industrial Area<br />
                          City, State 12345<br />
                          Phone: (555) 123-4567<br />
                          Email: info@fleetmanagement.com
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supplier and Delivery Information */}
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Supplier Information
                      </h3>
                      <div className="space-y-2">
                        <p className="font-bold text-lg">{order.supplier_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Contact: {order.supplier_contact}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Phone: {order.supplier_phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Email: {order.supplier_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Address: {order.supplier_address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Type: {order.supplier_type}
                        </p>
                        {order.shipping_address && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Shipping Address:</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {order.shipping_address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <TruckIcon className="h-4 w-4" />
                        Delivery Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">Expected Delivery:</p>
                          <p className="text-muted-foreground">
                            {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "Not specified"}
                          </p>
                        </div>
                        {order.delivery_date && (
                          <div>
                            <p className="font-medium text-green-600">Actual Delivery:</p>
                            <p className="text-muted-foreground">
                              {formatDate(order.delivery_date)}
                            </p>
                          </div>
                        )}
                      </div>

                      {order.terms && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Terms
                          </h4>
                          <p className="text-sm font-medium">{order.terms}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <PackageOpen className="h-4 w-4" />
                      Order Items
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-semibold">#</TableHead>
                            <TableHead className="font-semibold">Size</TableHead>
                            <TableHead className="font-semibold">Brand & Model</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold text-right">Quantity</TableHead>
                            <TableHead className="font-semibold text-right">Unit Price</TableHead>
                            <TableHead className="font-semibold text-right">Line Total</TableHead>
                            <TableHead className="font-semibold text-right">Received</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>{item.size}</TableCell>
                              <TableCell>
                                {item.brand} {item.model}
                                {item.notes && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.notes}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{item.type}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(item.line_total)}</TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{item.received_quantity}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.remaining_quantity} remaining
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Summary Rows */}
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={6}></TableCell>
                            <TableCell className="text-right font-semibold">Subtotal:</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={6}></TableCell>
                            <TableCell className="text-right font-semibold">Tax ({Math.round((order.tax_amount / order.total_amount) * 100)}%):</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(order.tax_amount)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={6}></TableCell>
                            <TableCell className="text-right font-semibold">Shipping:</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(order.shipping_amount)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-primary/10 border-t-2 border-primary">
                            <TableCell colSpan={6}></TableCell>
                            <TableCell className="text-right font-bold text-lg">GRAND TOTAL:</TableCell>
                            <TableCell className="text-right font-bold text-lg">{formatCurrency(order.final_amount)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Total Items: {order.items.length} • Received: {order.items.reduce((sum, item) => sum + item.received_quantity, 0)} • 
                      Progress: {getProgress()}%
                    </div>
                  </div>

                  {/* Notes and Additional Information */}
                  {(order.notes || order.billing_address) && (
                    <div className="grid grid-cols-2 gap-8">
                      {order.notes && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Special Instructions</h3>
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm whitespace-pre-line">{order.notes}</p>
                          </div>
                        </div>
                      )}
                      
                      {order.billing_address && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Billing Address</h3>
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm whitespace-pre-line">{order.billing_address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer for Print */}
                  <div className="border-t pt-6">
                    <div className="grid grid-cols-3 gap-8">
                      <div>
                        <p className="font-semibold">Prepared By:</p>
                        <p className="text-sm text-muted-foreground">{order.created_by_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(order.created_at)}</p>
                      </div>
                      
                      {order.approved_by && order.approved_by_name && (
                        <div>
                          <p className="font-semibold">Approved By:</p>
                          <p className="text-sm text-muted-foreground">{order.approved_by_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(order.approved_date)}</p>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="font-semibold">Delivery Status:</p>
                        <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                          {order.status.replace("_", " ")}
                        </Badge>
                        <div className="mt-2">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${getProgress()}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getProgress()}% complete
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      <p>Thank you for your business!</p>
                      <p className="mt-1">This is an automatically generated purchase order from Fleet Management System</p>
                      <p className="mt-4 text-xs">
                        Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Non Printable */}
            <div className="border-t p-6 flex justify-between no-print">
              {order && (
                <>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Created by: {order.created_by_name}</span>
                    </div>
                    {order.approved_by && order.approved_by_name && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Approved by: {order.approved_by_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                    {["ORDERED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING", "APPROVED"].includes(order.status) && (
                      <Button asChild>
                        <Link href={`/purchases/orders/${order.id}/receive`}>
                          <Truck className="mr-2 h-4 w-4" />
                          Receive Goods
                        </Link>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}