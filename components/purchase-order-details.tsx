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
  X,
  DollarSign,
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
  total_amount: number; // Subtotal EXCLUDING VAT
  tax_amount: number; // Total VAT amount
  shipping_amount: number;
  final_amount: number; // Total INCLUDING VAT + shipping
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
    unit_price: number; // This is price INCLUDING VAT from database
    line_total: number; // This is line total INCLUDING VAT from database
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

const VAT_RATE = 0.16; // 16% VAT

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
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
          color: black;
          font-size: 12pt;
          line-height: 1.4;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .print-content {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
        }
        
        .no-print {
          display: none !important;
        }
        
        /* Ensure tables don't break across pages */
        table {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Text styling for print */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        /* Ensure proper spacing */
        .print-section {
          page-break-inside: avoid;
          margin-bottom: 12pt;
        }
        
        /* Reduce font sizes for better fit */
        .print-content {
          font-size: 10pt !important;
        }
        
        .print-table {
          font-size: 9pt !important;
        }
        
        /* Remove background colors that don't print well */
        .bg-opacity-10,
        .bg-primary/10,
        .bg-gray-50,
        .bg-yellow-50,
        .bg-blue-50 {
          background-color: #f9f9f9 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* Ensure borders print properly */
        table, th, td {
          border: 0.5pt solid #ddd !important;
        }
        
        /* Remove unnecessary padding in print */
        .print-padding {
          padding: 4pt !important;
        }
      }
    `,
    onAfterPrint: () => toast.success("Purchase order printed successfully"),
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Failed to print purchase order");
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
      currency: "KSH",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate exclusive price from inclusive price
  const calculateExclusivePrice = (inclusivePrice: number): number => {
    return inclusivePrice / (1 + VAT_RATE);
  };

  // Calculate VAT amount from inclusive price
  const calculateVATAmount = (inclusivePrice: number): number => {
    const exclusivePrice = calculateExclusivePrice(inclusivePrice);
    return inclusivePrice - exclusivePrice;
  };

  // Calculate line total excluding VAT
  const calculateLineTotalExcludingVAT = (lineTotalInclusive: number): number => {
    return lineTotalInclusive / (1 + VAT_RATE);
  };

  // Calculate line VAT amount
  const calculateLineVAT = (lineTotalInclusive: number): number => {
    return lineTotalInclusive - calculateLineTotalExcludingVAT(lineTotalInclusive);
  };

  // Calculate subtotal from items (VAT inclusive)
  const calculateSubtotalInclusive = (): number => {
    if (!order || !order.items) return 0;
    return order.items.reduce((sum, item) => sum + item.line_total, 0);
  };

  // Calculate VAT from subtotal (working backwards)
  const calculateVATFromSubtotal = (): number => {
    const subtotalInclusive = calculateSubtotalInclusive();
    if (subtotalInclusive === 0) return 0;
    
    // Working backwards: VAT = (subtotalInclusive * VAT_RATE) / (1 + VAT_RATE)
    return (subtotalInclusive * VAT_RATE) / (1 + VAT_RATE);
  };

  // Calculate subtotal excluding VAT
  const calculateSubtotalExcludingVAT = (): number => {
    const subtotalInclusive = calculateSubtotalInclusive();
    const vatAmount = calculateVATFromSubtotal();
    return subtotalInclusive - vatAmount;
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
                <div ref={printRef} className="print-content space-y-8">
                  {/* Printable Header */}
                  <div className="print-section border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div className="w-1/2">
                        <div className="mb-4">
                          <h1 className="text-2xl font-bold uppercase tracking-wide">PURCHASE ORDER</h1>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileTextIcon className="h-3 w-3" />
                              <span className="font-semibold text-sm">Order #:</span>
                              <span className="font-mono text-base font-bold">{order.po_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3" />
                              <span className="font-semibold text-sm">Date:</span>
                              <span className="text-sm">{formatDate(order.po_date)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-bold mb-1">Fleet Management System</p>
                          <p className="text-xs">123 Fleet Street</p>
                          <p className="text-xs">Industrial Area</p>
                          <p className="text-xs">City, State 12345</p>
                          <p className="text-xs">Phone: (555) 123-4567</p>
                          <p className="text-xs">Email: info@fleetmanagement.com</p>
                        </div>
                      </div>
                      
                      <div className="w-1/2 text-right">
                        <div className="mb-4">
                          <Badge className={`${getStatusColor(order.status)} text-xs py-1`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.replace("_", " ")}
                            </div>
                          </Badge>
                        </div>
                        
                        <div className="text-sm">
                          <p className="font-bold mb-1">Delivery Information</p>
                          <p className="text-xs">
                            <span className="font-medium">Expected:</span>{" "}
                            {order.expected_delivery_date ? formatDate(order.expected_delivery_date) : "Not specified"}
                          </p>
                          {order.delivery_date && (
                            <p className="text-xs">
                              <span className="font-medium text-green-600">Delivered:</span>{" "}
                              {formatDate(order.delivery_date)}
                            </p>
                          )}
                          <div className="mt-2">
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden inline-block">
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
                    </div>
                  </div>

                  {/* Supplier Information */}
                  <div className="print-section">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          Supplier Information
                        </h3>
                        <div className="text-sm space-y-1 border p-3 rounded">
                          <p className="font-bold">{order.supplier_name}</p>
                          <p>Contact: {order.supplier_contact}</p>
                          <p>Phone: {order.supplier_phone}</p>
                          <p>Email: {order.supplier_email}</p>
                          <p>Type: {order.supplier_type}</p>
                          <p className="text-xs">{order.supplier_address}</p>
                          
                          {order.shipping_address && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium text-xs">Shipping Address:</p>
                              <p className="text-xs">{order.shipping_address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <TruckIcon className="h-3 w-3" />
                          Order Details
                        </h3>
                        <div className="text-sm space-y-2 border p-3 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">Prepared By:</span>
                            <span>{order.created_by_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Date Prepared:</span>
                            <span>{formatDateTime(order.created_at)}</span>
                          </div>
                          
                          {order.approved_by && order.approved_by_name && (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium">Approved By:</span>
                                <span>{order.approved_by_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Date Approved:</span>
                                <span>{formatDateTime(order.approved_date)}</span>
                              </div>
                            </>
                          )}
                          
                          {order.terms && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium">Payment Terms:</p>
                              <p className="text-xs">{order.terms}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items - Simplified Table */}
                  <div className="print-section">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <PackageOpen className="h-3 w-3" />
                      Order Items
                    </h3>
                    
                    <div className="border rounded overflow-hidden">
                      <Table className="print-table">
                        <TableHeader className="bg-gray-50 print-padding">
                          <TableRow>
                            <TableHead className="font-semibold text-xs w-8 p-2">#</TableHead>
                            <TableHead className="font-semibold text-xs p-2">Size</TableHead>
                            <TableHead className="font-semibold text-xs p-2">Description</TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">Qty</TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">
                              <div>Unit Price</div>
                              <div className="text-xs text-muted-foreground font-normal">(Inc. VAT)</div>
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">
                              <div>Total</div>
                              <div className="text-xs text-muted-foreground font-normal">(Inc. VAT)</div>
                            </TableHead>
                            <TableHead className="font-semibold text-xs text-right p-2">Received</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => {
                            const lineVAT = calculateLineVAT(item.line_total);
                            const lineExcludingVAT = calculateLineTotalExcludingVAT(item.line_total);
                            
                            return (
                              <TableRow key={item.id} className="print-padding">
                                <TableCell className="text-xs font-medium p-2">{index + 1}</TableCell>
                                <TableCell className="text-xs p-2">{item.size}</TableCell>
                                <TableCell className="text-xs p-2">
                                  {item.brand} {item.model}
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {item.type} {item.notes ? `• ${item.notes}` : ''}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-right p-2">{item.quantity}</TableCell>
                                {/* Unit price is already VAT-inclusive */}
                                <TableCell className="text-xs text-right p-2">
                                  {formatCurrency(item.unit_price)}
                                </TableCell>
                                {/* Line total is already VAT-inclusive */}
                                <TableCell className="text-xs text-right font-medium p-2">
                                  {formatCurrency(item.line_total)}
                                </TableCell>
                                <TableCell className="text-xs text-right p-2">
                                  <div>{item.received_quantity}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {item.remaining_quantity} pending
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {/* Summary Rows */}
                          {/* First show the calculated subtotal from items (VAT inclusive) */}
                          <TableRow className="bg-gray-50 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">Subtotal:</TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(calculateSubtotalInclusive())}
                            </TableCell>
                          </TableRow>
                          
                          {/* Calculate and show VAT (16%) */}
                          <TableRow className="bg-gray-50 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">
                              <div>VAT (16%):</div>
                              <div className="text-[10px] text-muted-foreground font-normal">
                                Calculated on {formatCurrency(calculateSubtotalExcludingVAT())}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(calculateVATFromSubtotal())}
                            </TableCell>
                          </TableRow>
                          
                          {/* Show subtotal excluding VAT */}
                          <TableRow className="bg-gray-50 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">Subtotal (Ex VAT):</TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(calculateSubtotalExcludingVAT())}
                            </TableCell>
                          </TableRow>
                          
                          {/* Show shipping */}
                          <TableRow className="bg-gray-50 print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2">Shipping:</TableCell>
                            <TableCell className="text-xs font-semibold text-right p-2" colSpan={2}>
                              {formatCurrency(order.shipping_amount)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Show grand total */}
                          <TableRow className="bg-primary/10 border-t-2 border-primary print-padding">
                            <TableCell colSpan={4} className="p-2"></TableCell>
                            <TableCell className="text-sm font-bold text-right p-2">GRAND TOTAL:</TableCell>
                            <TableCell className="text-sm font-bold text-right p-2" colSpan={2}>
                              {formatCurrency(
                                calculateSubtotalInclusive() + order.shipping_amount
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Total Items: {order.items.length} • Total Quantity: {order.items.reduce((sum, item) => sum + item.quantity, 0)} • 
                      Received: {order.items.reduce((sum, item) => sum + item.received_quantity, 0)} ({getProgress()}%)
                    </div>
                    
                    {/* VAT Calculation Summary */}
                    <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                      <p className="font-semibold mb-1">VAT Calculation Summary:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Subtotal (Inc VAT):</span> {formatCurrency(calculateSubtotalInclusive())}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Subtotal (Ex VAT):</span> {formatCurrency(calculateSubtotalExcludingVAT())}
                        </div>
                        <div>
                          <span className="text-muted-foreground">VAT Amount (16%):</span> {formatCurrency(calculateVATFromSubtotal())}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Shipping:</span> {formatCurrency(order.shipping_amount)}
                        </div>
                        <div className="col-span-2 mt-1 pt-1 border-t">
                          <span className="text-muted-foreground">Total Payable:</span>{" "}
                          <span className="font-semibold">
                            {formatCurrency(calculateSubtotalInclusive() + order.shipping_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes and Billing Address */}
                  {(order.notes || order.billing_address) && (
                    <div className="print-section">
                      <div className="grid grid-cols-2 gap-4">
                        {order.notes && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1">Special Instructions</h4>
                            <div className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="whitespace-pre-line">{order.notes}</p>
                            </div>
                          </div>
                        )}
                        
                        {order.billing_address && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1 flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Billing Address
                            </h4>
                            <div className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="whitespace-pre-line">{order.billing_address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer for Print */}
                  <div className="print-section border-t pt-4">
                    <div className="text-center text-xs text-muted-foreground">
                      <p>Thank you for your business!</p>
                      <p className="mt-0.5">This is an automatically generated purchase order from Fleet Management System</p>
                      <div className="mt-2 flex justify-between items-center text-xs">
                        <div className="text-left">
                          <p>Page 1 of 1</p>
                          <p>Confidential</p>
                        </div>
                        <div className="text-right">
                          <p>Generated on {formatDateTime(new Date().toISOString())}</p>
                          <p>Document ID: PO-{order.po_number}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t text-[10px]">
                        <p>For inquiries, please contact: procurement@fleetmanagement.com | Phone: (555) 123-4567</p>
                      </div>
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