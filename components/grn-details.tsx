"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FileText,
  Building,
  User,
  Package,
  Truck,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Download,
  Copy,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface GRNItem {
  id: number;
  grn_id: number;
  po_item_id: number;
  quantity_received: number;
  unit_cost: number;
  batch_number: string | null;
  serial_numbers: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  size?: string;
  brand?: string;
  model?: string;
  type?: string;
}

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  type: string;
  purchase_cost: number;
  supplier_id: number;
  purchase_date: string;
  po_item_id: number;
  grn_id: number;
  grn_item_id: number;
  status: string;
  current_location: string;
}

interface GRN {
  id: number;
  grn_number: string;
  po_id: number;
  po_number: string;
  receipt_date: string;
  received_by: number;
  received_by_name: string;
  supplier_name: string;
  supplier_code: string;
  supplier_invoice_number: string | null;
  delivery_note_number: string | null;
  vehicle_number: string | null;
  driver_name: string | null;
  item_count: number;
  total_quantity: number;
  total_value: number;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: GRNItem[];
  tires: Tire[];
}

interface GRNDetailsProps {
  grnId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GRNDetails({ grnId, open, onOpenChange }: GRNDetailsProps) {
  const [grn, setGrn] = useState<GRN | null>(null);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (open && grnId) {
      fetchGRNDetails();
    }
  }, [open, grnId]);

  const fetchGRNDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/grn/${grnId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGrn(data.data);
      } else {
        toast.error("Failed to load GRN details");
      }
    } catch (error: any) {
      console.error("Error fetching GRN details:", error);
      toast.error(`Failed to load GRN details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      minimumFractionDigits: 0,
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate summary values from actual data
  const calculateSummary = () => {
    if (!grn) return { totalItems: 0, totalQuantity: 0, totalValue: 0 };

    const totalItems = grn.items?.length || 0;
    
    // Calculate total quantity from items
    const totalQuantity = grn.items?.reduce((sum, item) => 
      sum + (item.quantity_received || 0), 0) || 0;
    
    // Calculate total value from tires' purchase_cost
    const totalValue = grn.tires?.reduce((sum, tire) => 
      sum + (tire.purchase_cost || 0), 0) || 0;

    return { totalItems, totalQuantity, totalValue };
  };

  const handlePrint = async () => {
    if (!grn) return;

    try {
      setPrintLoading(true);
      
      // Calculate summary values
      const { totalItems, totalQuantity, totalValue } = calculateSummary();
      
      // Create a print-friendly HTML
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>GRN: ${grn.grn_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #1a1a1a;
              font-size: 28px;
            }
            .header .subtitle {
              color: #666;
              margin-top: 5px;
              font-size: 16px;
            }
            .header .grn-number {
              font-size: 18px;
              font-weight: bold;
              margin-top: 10px;
              color: #2c5282;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-weight: bold;
              color: #2c5282;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .info-item {
              margin-bottom: 8px;
              display: flex;
              justify-content: space-between;
            }
            .info-label {
              font-weight: 600;
              color: #4a5568;
            }
            .info-value {
              color: #2d3748;
              text-align: right;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 600;
              margin-top: 5px;
            }
            .status-completed {
              background-color: #c6f6d5;
              color: #22543d;
            }
            .status-pending {
              background-color: #feebc8;
              color: #744210;
            }
            .status-cancelled {
              background-color: #fed7d7;
              color: #742a2a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            th {
              background-color: #f7fafc;
              text-align: left;
              padding: 8px;
              border: 1px solid #e2e8f0;
              font-weight: 600;
              color: #4a5568;
            }
            td {
              padding: 8px;
              border: 1px solid #e2e8f0;
              vertical-align: top;
            }
            .total-row {
              font-weight: bold;
              background-color: #f7fafc;
            }
            .print-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              color: #718096;
              font-size: 12px;
            }
            .company-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .company-info {
              text-align: left;
            }
            .company-name {
              font-size: 20px;
              font-weight: bold;
              color: #2c5282;
            }
            .company-address {
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
                margin: 0.5in;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="company-header">
            <div class="company-info">
              <div class="company-name">Tire Management System</div>
              <div class="company-address">Goods Received Note</div>
            </div>
            <div class="company-info" style="text-align: right;">
              <div class="grn-number">GRN: ${grn.grn_number}</div>
              <div style="font-size: 12px; color: #666;">
                Date: ${formatDate(grn.receipt_date)}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="grid-2">
              <div>
                <div class="section-title">GRN Information</div>
                <div class="info-item">
                  <span class="info-label">GRN Number:</span>
                  <span class="info-value">${grn.grn_number}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">PO Number:</span>
                  <span class="info-value">${grn.po_number}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Receipt Date:</span>
                  <span class="info-value">${formatDate(grn.receipt_date)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value">
                    <span class="status-badge status-${grn.status.toLowerCase()}">${grn.status}</span>
                  </span>
                </div>
              </div>
              
              <div>
                <div class="section-title">Supplier Information</div>
                <div class="info-item">
                  <span class="info-label">Supplier:</span>
                  <span class="info-value">${grn.supplier_name}</span>
                </div>
                ${grn.supplier_code ? `<div class="info-item">
                  <span class="info-label">Code:</span>
                  <span class="info-value">${grn.supplier_code}</span>
                </div>` : ''}
                ${grn.supplier_invoice_number ? `<div class="info-item">
                  <span class="info-label">Invoice No:</span>
                  <span class="info-value">${grn.supplier_invoice_number}</span>
                </div>` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="grid-2">
              <div>
                <div class="section-title">Delivery Information</div>
                ${grn.delivery_note_number ? `<div class="info-item">
                  <span class="info-label">Delivery Note:</span>
                  <span class="info-value">${grn.delivery_note_number}</span>
                </div>` : ''}
                ${grn.vehicle_number ? `<div class="info-item">
                  <span class="info-label">Vehicle:</span>
                  <span class="info-value">${grn.vehicle_number}</span>
                </div>` : ''}
                ${grn.driver_name ? `<div class="info-item">
                  <span class="info-label">Driver:</span>
                  <span class="info-value">${grn.driver_name}</span>
                </div>` : ''}
              </div>
              
              <div>
                <div class="section-title">Summary</div>
                <div class="info-item">
                  <span class="info-label">Total Items:</span>
                  <span class="info-value">${totalItems}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Quantity:</span>
                  <span class="info-value">${totalQuantity}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Value:</span>
                  <span class="info-value">${formatCurrency(totalValue)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Received By:</span>
                  <span class="info-value">${grn.received_by_name || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Received Items</div>
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Brand/Model</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${grn.items?.map(item => `
                  <tr>
                    <td>${item.size || 'N/A'}</td>
                    <td>${item.brand || 'N/A'} ${item.model ? '/' + item.model : ''}</td>
                    <td>${item.type?.toLowerCase() || 'standard'}</td>
                    <td>${item.quantity_received}</td>
                    <td>${formatCurrency(item.unit_cost)}</td>
                    <td>${formatCurrency(item.quantity_received * item.unit_cost)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="5" style="text-align: right"><strong>Grand Total:</strong></td>
                  <td><strong>${formatCurrency(totalValue)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          ${grn.tires && grn.tires.length > 0 ? `
          <div class="section">
            <div class="section-title">Tires Added to Inventory (${grn.tires.length} tires)</div>
            <table>
              <thead>
                <tr>
                  <th>Serial Number</th>
                  <th>Size</th>
                  <th>Brand</th>
                  <th>Type</th>
                  <th>Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${grn.tires.map(tire => `
                  <tr>
                    <td>${tire.serial_number}</td>
                    <td>${tire.size}</td>
                    <td>${tire.brand}</td>
                    <td>${tire.type}</td>
                    <td>${formatCurrency(tire.purchase_cost)}</td>
                    <td>${tire.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${grn.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <div style="padding: 10px; background-color: #f7fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
              ${grn.notes}
            </div>
          </div>
          ` : ''}

          <div class="print-footer">
            <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            <div>This is a computer-generated document. No signature required.</div>
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups to print.');
      }

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        toast.success("GRN sent to printer");
      };

    } catch (error: any) {
      console.error("Error printing GRN:", error);
      toast.error(error.message || "Failed to print GRN");
    } finally {
      setPrintLoading(false);
    }
  };

  const handleCopyDetails = async () => {
    if (!grn) return;

    try {
      const { totalItems, totalQuantity, totalValue } = calculateSummary();
      
      const details = `
GRN Number: ${grn.grn_number}
PO Number: ${grn.po_number}
Receipt Date: ${formatDate(grn.receipt_date)}
Supplier: ${grn.supplier_name}
Status: ${grn.status}
Total Items: ${totalItems}
Total Quantity: ${totalQuantity}
Total Value: ${formatCurrency(totalValue)}
Received By: ${grn.received_by_name || "N/A"}
      `.trim();

      await navigator.clipboard.writeText(details);
      toast.success("GRN details copied to clipboard");
    } catch (error) {
      console.error("Error copying details:", error);
      toast.error("Failed to copy details");
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>GRN Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading GRN details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!grn) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>GRN Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">GRN Not Found</h3>
            <p className="text-muted-foreground mt-2">
              Unable to load GRN details. The GRN may have been deleted or you don't have permission to view it.
            </p>
            <Button className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { totalItems, totalQuantity, totalValue } = calculateSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  GRN: {grn.grn_number}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  PO: {grn.po_number} • {formatDate(grn.receipt_date)}
                </p>
              </div>
            </div>
            <Badge className={`flex items-center gap-1 ${getStatusColor(grn.status)}`}>
              {getStatusIcon(grn.status)}
              {grn.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  GRN Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GRN Number:</span>
                    <span className="font-medium">{grn.grn_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PO Number:</span>
                    <Link
                      href={`/purchases/orders/${grn.po_id}`}
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                      target="_blank"
                    >
                      {grn.po_number}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt Date:</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">{formatDate(grn.receipt_date)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{formatDateTime(grn.created_at)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Supplier Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span className="font-medium">{grn.supplier_name}</span>
                  </div>
                  {grn.supplier_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Code:</span>
                      <span className="font-medium">{grn.supplier_code}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice No:</span>
                    <span className="font-medium">{grn.supplier_invoice_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Note:</span>
                    <span className="font-medium">{grn.delivery_note_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-medium">{grn.vehicle_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver:</span>
                    <span className="font-medium">{grn.driver_name || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Quantity:</span>
                    <span className="font-medium">{totalQuantity} tires</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-medium">{formatCurrency(totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Received By:</span>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="font-medium">{grn.received_by_name || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Received Items Table */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Received Items ({grn.items?.length || 0})</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Brand/Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Serial Numbers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grn.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.size || "N/A"}</TableCell>
                      <TableCell>
                        <div>{item.brand || "N/A"}</div>
                        {item.model && (
                          <div className="text-sm text-muted-foreground">{item.model}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.type?.toLowerCase() || "standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.quantity_received}</TableCell>
                      <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.quantity_received * item.unit_cost)}
                      </TableCell>
                      <TableCell>
                        <div className="max-h-20 overflow-y-auto">
                          {item.serial_numbers?.map((sn, idx) => (
                            <div key={idx} className="text-xs font-mono py-0.5">
                              {sn}
                            </div>
                          )) || "N/A"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="text-right font-medium">
                      Grand Total:
                    </TableCell>
                    <TableCell colSpan={2} className="font-bold text-lg">
                      {formatCurrency(totalValue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Tires Table - Show ALL tires */}
          {grn.tires && grn.tires.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">
                Tires Added to Inventory ({grn.tires.length} tires)
              </h3>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grn.tires.map((tire) => (
                      <TableRow key={tire.id}>
                        <TableCell className="font-mono text-xs">{tire.serial_number}</TableCell>
                        <TableCell>{tire.size}</TableCell>
                        <TableCell>{tire.brand}</TableCell>
                        <TableCell>{tire.type}</TableCell>
                        <TableCell>{formatCurrency(tire.purchase_cost)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{tire.status}</Badge>
                        </TableCell>
                        <TableCell>{tire.current_location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Notes */}
          {grn.notes && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Notes</h3>
              <div className="p-3 bg-muted/30 rounded-md border">
                <p className="text-sm">{grn.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            GRN ID: {grn.id} • Created: {formatDate(grn.created_at)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyDetails}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Details
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              disabled={printLoading}
            >
              {printLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {printLoading ? "Printing..." : "Print GRN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}