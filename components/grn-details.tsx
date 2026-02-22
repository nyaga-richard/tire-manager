"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  ChevronDown,
  ChevronRight,
  Info,
  MapPin,
  Phone,
  Mail,
  Barcode,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

// Mobile GRN Item Card
const MobileGRNItemCard = ({ 
  item, 
  formatCurrency 
}: { 
  item: GRNItem; 
  formatCurrency: (amount: number) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemTotal = item.quantity_received * item.unit_cost;

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium">{item.size || "N/A"}</div>
            <div className="text-sm text-muted-foreground">
              {item.brand || "N/A"} {item.model ? `/ ${item.model}` : ''}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Basic Info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-muted-foreground">Type</div>
            <Badge variant="outline" className="capitalize text-xs">
              {item.type?.toLowerCase() || "standard"}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Quantity</div>
            <div className="text-sm font-medium">{item.quantity_received}</div>
          </div>
        </div>

        <div className="mt-2 flex justify-between items-center">
          <div>
            <div className="text-xs text-muted-foreground">Unit Cost</div>
            <div className="text-sm">{formatCurrency(item.unit_cost)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Line Total</div>
            <div className="text-sm font-bold text-primary">{formatCurrency(itemTotal)}</div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {item.batch_number && (
              <div>
                <div className="text-xs text-muted-foreground">Batch Number</div>
                <div className="text-sm font-mono">{item.batch_number}</div>
              </div>
            )}

            {item.serial_numbers && item.serial_numbers.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Barcode className="h-3 w-3" />
                  Serial Numbers ({item.serial_numbers.length})
                </div>
                <div className="max-h-24 overflow-y-auto bg-muted/30 rounded p-2">
                  {item.serial_numbers.map((sn, idx) => (
                    <div key={idx} className="text-xs font-mono py-0.5 border-b last:border-0">
                      {sn}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.notes && (
              <div>
                <div className="text-xs text-muted-foreground">Notes</div>
                <div className="text-sm bg-muted/30 p-2 rounded mt-1">{item.notes}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Tire Card
const MobileTireCard = ({ 
  tire, 
  formatCurrency 
}: { 
  tire: Tire; 
  formatCurrency: (amount: number) => string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-2 last:mb-0">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs font-medium truncate">{tire.serial_number}</div>
            <div className="text-sm mt-1">{tire.size} • {tire.brand}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{tire.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium">{formatCurrency(tire.purchase_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline" className="text-[10px]">{tire.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span>{tire.current_location}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function GRNDetails({ grnId, open, onOpenChange }: GRNDetailsProps) {
  const { user, hasPermission, authFetch } = useAuth();
  const [grn, setGrn] = useState<GRN | null>(null);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"items" | "tires">("items");

  useEffect(() => {
    if (open && grnId) {
      fetchGRNDetails();
    }
  }, [open, grnId]);

  const fetchGRNDetails = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE_URL}/api/grn/${grnId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GRN: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGrn(data.data);
      } else {
        throw new Error(data.message || "Failed to load GRN details");
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
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
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
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Calculate summary values from actual data
  const calculateSummary = () => {
    if (!grn) return { totalItems: 0, totalQuantity: 0, totalValue: 0 };

    const totalItems = grn.items?.length || 0;
    const totalQuantity = grn.items?.reduce((sum, item) => 
      sum + (item.quantity_received || 0), 0) || 0;
    const totalValue = grn.tires?.reduce((sum, tire) => 
      sum + (tire.purchase_cost || 0), 0) || 0;

    return { totalItems, totalQuantity, totalValue };
  };

  const handlePrint = async () => {
    if (!grn) return;

    try {
      setPrintLoading(true);
      
      const { totalItems, totalQuantity, totalValue } = calculateSummary();
      
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
            .generated-by {
              margin-top: 10px;
              font-size: 11px;
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
          <div class="generated-by">
            Generated by: ${user?.full_name || user?.username || 'System'} on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
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
            <div>Report ID: GRN-${grn.id}-${Date.now().toString().slice(-6)}</div>
            <div>This is a computer-generated document. No signature required.</div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups to print.');
      }

      printWindow.document.write(printContent);
      printWindow.document.close();
      
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
Generated By: ${user?.full_name || user?.username || "System"}
      `.trim();

      await navigator.clipboard.writeText(details);
      toast.success("GRN details copied to clipboard");
    } catch (error) {
      console.error("Error copying details:", error);
      toast.error("Failed to copy details");
    }
  };

  const handleExport = async () => {
    if (!grn || !hasPermission("grn.export")) return;

    try {
      setExportLoading(true);
      
      // Create CSV content
      const headers = [
        "GRN Number",
        "PO Number",
        "Receipt Date",
        "Supplier",
        "Item Size",
        "Brand",
        "Quantity",
        "Unit Cost",
        "Total Cost",
        "Serial Numbers"
      ];

      const rows = grn.items?.flatMap(item => 
        item.serial_numbers?.map((sn, idx) => [
          grn.grn_number,
          grn.po_number,
          formatDate(grn.receipt_date),
          grn.supplier_name,
          item.size || "N/A",
          item.brand || "N/A",
          idx === 0 ? item.quantity_received.toString() : "", // Show quantity only on first row
          idx === 0 ? formatCurrency(item.unit_cost).replace(/[^0-9,-]/g, '') : "",
          idx === 0 ? formatCurrency(item.quantity_received * item.unit_cost).replace(/[^0-9,-]/g, '') : "",
          sn
        ].map(cell => `"${cell}"`).join(","))
      ) || [];

      const csvContent = [
        headers.join(","),
        ...rows
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GRN-${grn.grn_number}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("GRN exported successfully");
    } catch (error) {
      console.error("Error exporting GRN:", error);
      toast.error("Failed to export GRN");
    } finally {
      setExportLoading(false);
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
          <div className="text-center py-8 px-4">
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
      <DialogContent className="sm:max-w-6xl max-h-[90vh] p-0 flex flex-col">
        {/* Mobile Header */}
        <div className="sm:hidden sticky top-0 bg-white dark:bg-gray-900 z-10 border-b p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">GRN: {grn.grn_number}</h2>
              <p className="text-xs text-muted-foreground truncate">
                PO: {grn.po_number} • {formatDate(grn.receipt_date)}
              </p>
            </div>
            <Badge className={`flex items-center gap-1 text-xs ${getStatusColor(grn.status)}`}>
              {getStatusIcon(grn.status)}
              <span className="hidden xs:inline">{grn.status}</span>
            </Badge>
          </div>
          
          {/* Mobile Action Buttons - At the top */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopyDetails}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>

            <PermissionGuard permissionCode="grn.view" fallback={null}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {exportLoading ? "..." : "Export"}
              </Button>
            </PermissionGuard>

            <Button
              size="sm"
              className="flex-1"
              onClick={handlePrint}
              disabled={printLoading}
            >
              {printLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {printLoading ? "..." : "Print"}
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block border-b">
          <DialogHeader className="px-6 pt-6 pb-4">
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
              <div className="flex items-center gap-2">
                <Badge className={`flex items-center gap-1 ${getStatusColor(grn.status)}`}>
                  {getStatusIcon(grn.status)}
                  {grn.status}
                </Badge>
                
                {/* Desktop Action Buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDetails}
                  className="ml-2"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>

                <PermissionGuard permissionCode="grn.view" fallback={null}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={exportLoading}
                  >
                    {exportLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {exportLoading ? "Exporting..." : "Export"}
                  </Button>
                </PermissionGuard>

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
                  {printLoading ? "Printing..." : "Print"}
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Desktop Grid Layout */}
          <div className="hidden sm:block">
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
                      <PermissionGuard permissionCode="po.view" action="view" fallback={
                        <span className="font-medium">{grn.po_number}</span>
                      }>
                        <Link
                          href={`/purchases/orders/${grn.po_id}`}
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          {grn.po_number}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </PermissionGuard>
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
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Size</TableHead>
                      <TableHead className="whitespace-nowrap">Brand/Model</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="whitespace-nowrap">Unit Cost</TableHead>
                      <TableHead className="whitespace-nowrap">Total</TableHead>
                      <TableHead className="whitespace-nowrap">Serial Numbers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grn.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium whitespace-nowrap">{item.size || "N/A"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div>{item.brand || "N/A"}</div>
                          {item.model && (
                            <div className="text-sm text-muted-foreground">{item.model}</div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="capitalize">
                            {item.type?.toLowerCase() || "standard"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{item.quantity_received}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatCurrency(item.quantity_received * item.unit_cost)}
                        </TableCell>
                        <TableCell>
                          <div className="max-h-20 overflow-y-auto min-w-[150px]">
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
                      <TableCell colSpan={5} className="text-right font-medium whitespace-nowrap">
                        Grand Total:
                      </TableCell>
                      <TableCell colSpan={2} className="font-bold text-lg whitespace-nowrap">
                        {formatCurrency(totalValue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Tires Table */}
            {grn.tires && grn.tires.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">
                  Tires Added to Inventory ({grn.tires.length} tires)
                </h3>
                <div className="rounded-md border max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Serial Number</TableHead>
                        <TableHead className="whitespace-nowrap">Size</TableHead>
                        <TableHead className="whitespace-nowrap">Brand</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Cost</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grn.tires.map((tire) => (
                        <TableRow key={tire.id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{tire.serial_number}</TableCell>
                          <TableCell className="whitespace-nowrap">{tire.size}</TableCell>
                          <TableCell className="whitespace-nowrap">{tire.brand}</TableCell>
                          <TableCell className="whitespace-nowrap">{tire.type}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatCurrency(tire.purchase_cost)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">{tire.status}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{tire.current_location}</TableCell>
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

          {/* Mobile Layout */}
          <div className="sm:hidden space-y-4">
            {/* Mobile Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Items</div>
                  <div className="text-lg font-bold">{totalItems}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Quantity</div>
                  <div className="text-lg font-bold">{totalQuantity}</div>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total Value</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(totalValue)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Info Cards */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">GRN Information</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GRN:</span>
                    <span className="font-medium">{grn.grn_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PO:</span>
                    <button
                      onClick={() => {
                        window.open(`/purchases/orders/${grn.po_id}`, '_blank');
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      {grn.po_number}
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt Date:</span>
                    <span>{formatDate(grn.receipt_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-xs">{formatDateTime(grn.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Supplier Information</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{grn.supplier_name}</span>
                  </div>
                  {grn.supplier_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Code:</span>
                      <span>{grn.supplier_code}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Delivery Information</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice:</span>
                    <span>{grn.supplier_invoice_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Note:</span>
                    <span>{grn.delivery_note_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span>{grn.vehicle_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver:</span>
                    <span>{grn.driver_name || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Received By</span>
                </div>
                <div className="text-sm">{grn.received_by_name || "N/A"}</div>
              </CardContent>
            </Card>

            {/* Mobile Tabs for Items and Tires */}
            <div className="flex border-b">
              <button
                className={`flex-1 py-2 text-sm font-medium ${
                  activeMobileTab === "items" 
                    ? "border-b-2 border-primary text-primary" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveMobileTab("items")}
              >
                Items ({grn.items?.length || 0})
              </button>
              {grn.tires && grn.tires.length > 0 && (
                <button
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeMobileTab === "tires" 
                      ? "border-b-2 border-primary text-primary" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setActiveMobileTab("tires")}
                >
                  Tires ({grn.tires.length})
                </button>
              )}
            </div>

            {/* Mobile Items View */}
            {activeMobileTab === "items" && (
              <div className="space-y-3">
                {grn.items?.map((item) => (
                  <MobileGRNItemCard
                    key={item.id}
                    item={item}
                    formatCurrency={formatCurrency}
                  />
                ))}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Grand Total:</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(totalValue)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mobile Tires View */}
            {activeMobileTab === "tires" && grn.tires && grn.tires.length > 0 && (
              <div className="space-y-2">
                {grn.tires.map((tire) => (
                  <MobileTireCard
                    key={tire.id}
                    tire={tire}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </div>
            )}

            {/* Mobile Notes */}
            {grn.notes && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Notes</span>
                  </div>
                  <p className="text-sm">{grn.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Desktop Footer with ID */}
        <div className="hidden sm:block border-t px-6 py-3">
          <div className="text-sm text-muted-foreground">
            GRN ID: {grn.id} • Created: {formatDate(grn.created_at)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}