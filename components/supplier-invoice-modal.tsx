"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  FileText,
  Building,
  Package,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Hash,
  Percent,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
}

interface JournalEntry {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
}

interface SupplierInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  grn: GRN | null;
  onInvoiceCreated?: () => void;
}

// Mobile Journal Entry Card Component
const MobileJournalEntryCard = ({
  entry,
  index,
  onChange,
  onRemove,
  canRemove,
  loading,
}: {
  entry: JournalEntry;
  index: number;
  onChange: (index: number, field: keyof JournalEntry, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  loading: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
              {index + 1}
            </div>
            <span className="font-medium truncate">{entry.account_name || "New Entry"}</span>
          </div>
          <div className="flex gap-1">
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-8 w-8 p-0"
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="mt-3 flex justify-between items-center">
          <div className="space-y-1">
            {entry.debit > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-muted-foreground">Debit:</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(entry.debit)}
                </span>
              </div>
            )}
            {entry.credit > 0 && (
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-muted-foreground">Credit:</span>
                <span className="text-sm font-medium text-blue-600">
                  {formatCurrency(entry.credit)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Account Code */}
            <div className="space-y-1">
              <Label className="text-xs">Account Code</Label>
              <Input
                value={entry.account_code}
                onChange={(e) => onChange(index, "account_code", e.target.value)}
                placeholder="e.g., 5000"
                className="text-xs font-mono w-full"
                disabled={loading}
              />
            </div>

            {/* Account Name */}
            <div className="space-y-1">
              <Label className="text-xs">Account Name</Label>
              <Input
                value={entry.account_name}
                onChange={(e) => onChange(index, "account_name", e.target.value)}
                placeholder="e.g., Inventory"
                className="text-xs w-full"
                disabled={loading}
              />
            </div>

            {/* Debit */}
            <div className="space-y-1">
              <Label className="text-xs">Debit Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={entry.debit || ""}
                onChange={(e) => onChange(index, "debit", parseFloat(e.target.value) || 0)}
                className="text-right font-mono w-full"
                disabled={loading}
              />
            </div>

            {/* Credit */}
            <div className="space-y-1">
              <Label className="text-xs">Credit Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={entry.credit || ""}
                onChange={(e) => onChange(index, "credit", parseFloat(e.target.value) || 0)}
                className="text-right font-mono w-full"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={entry.description}
                onChange={(e) => onChange(index, "description", e.target.value)}
                placeholder="Description"
                className="text-xs w-full"
                disabled={loading}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function for currency formatting (to be used inside component)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function SupplierInvoiceModal({ isOpen, onClose, grn, onInvoiceCreated }: SupplierInvoiceModalProps) {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"details" | "breakdown" | "journal">("details");
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    {
      account_code: "2000",
      account_name: "Accounts Payable",
      debit: 0,
      credit: 0,
      description: "Supplier liability for goods received",
    },
    {
      account_code: "5000",
      account_name: "Inventory / Purchases",
      debit: 0,
      credit: 0,
      description: "Cost of goods received",
    },
  ]);
  
  const [formData, setFormData] = useState({
    invoice_number: "",
    invoice_date: new Date(),
    posting_date: new Date(),
    payment_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    payment_terms: "NET30",
    tax_amount: 0,
    shipping_amount: 0,
    discount_amount: 0,
    other_charges: 0,
    total_amount: 0,
    notes: "",
    transaction_type: "PURCHASE_INVOICE",
    status: "UNPAID",
  });

  // Generate invoice number and calculate totals
  useEffect(() => {
    if (isOpen && grn) {
      const timestamp = new Date().getTime().toString().slice(-6);
      const invoiceNumber = `INV-${grn.supplier_code || 'SUP'}-${timestamp}`;
      
      const subtotal = grn.total_value;
      const totalAmount = subtotal + formData.tax_amount + formData.shipping_amount + 
                         formData.other_charges - formData.discount_amount;
      
      const updatedEntries = journalEntries.map(entry => {
        if (entry.account_name === "Accounts Payable") {
          return { ...entry, credit: totalAmount };
        }
        if (entry.account_name === "Inventory / Purchases") {
          return { ...entry, debit: subtotal };
        }
        return entry;
      });
      
      setJournalEntries(updatedEntries);
      
      setFormData(prev => ({
        ...prev,
        invoice_number: invoiceNumber,
        total_amount: parseFloat(totalAmount.toFixed(2)),
      }));
    }
  }, [isOpen, grn, formData.tax_amount, formData.shipping_amount, 
      formData.discount_amount, formData.other_charges]);

  // Add tax entry if tax amount > 0
  useEffect(() => {
    if (formData.tax_amount > 0) {
      const taxEntryExists = journalEntries.some(
        entry => entry.account_name === "Tax Payable"
      );
      
      if (!taxEntryExists) {
        setJournalEntries(prev => [
          ...prev,
          {
            account_code: "2200",
            account_name: "Tax Payable",
            debit: 0,
            credit: formData.tax_amount,
            description: "Tax on purchased goods",
          }
        ]);
      } else {
        setJournalEntries(prev =>
          prev.map(entry =>
            entry.account_name === "Tax Payable"
              ? { ...entry, credit: formData.tax_amount }
              : entry
          )
        );
      }
    } else {
      setJournalEntries(prev =>
        prev.filter(entry => entry.account_name !== "Tax Payable")
      );
    }
  }, [formData.tax_amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grn) return;
    if (!user) {
      toast.error("You must be logged in to record invoices");
      return;
    }

    const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast.error("Journal entries are not balanced! Debits must equal credits.");
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        transaction_date: format(formData.invoice_date, "yyyy-MM-dd"),
        posting_date: format(formData.posting_date, "yyyy-MM-dd"),
        transaction_number: formData.invoice_number,
        reference_number: grn.grn_number,
        description: `Invoice for GRN ${grn.grn_number} - ${grn.supplier_name}`,
        transaction_type: "PURCHASE_INVOICE",
        total_amount: formData.total_amount,
        currency: "KES",
        notes: formData.notes || null,
        status: "POSTED",
        supplier_id: grn.supplier_code,
        supplier_name: grn.supplier_name,
        grn_id: grn.id,
        po_id: grn.po_id,
        created_by: user.id,
        created_by_name: user.full_name || user.username,
        journal_entries: journalEntries,
        metadata: {
          tax_amount: formData.tax_amount,
          shipping_amount: formData.shipping_amount,
          discount_amount: formData.discount_amount,
          other_charges: formData.other_charges,
          payment_terms: formData.payment_terms,
          payment_due_date: format(formData.payment_due_date, "yyyy-MM-dd"),
          invoice_status: formData.status,
        }
      };

      console.log("Creating accounting transaction:", transactionData);

      const response = await authFetch(`${API_BASE_URL}/api/accounting/transactions`, {
        method: "POST",
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create accounting transaction");
      }

      const data = await response.json();
      
      if (data.success) {
        // Update GRN with invoice number and accounting transaction ID
        const grnUpdateResponse = await authFetch(`${API_BASE_URL}/api/grn/${grn.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            supplier_invoice_number: formData.invoice_number,
            accounting_transaction_id: data.transaction_id,
            updated_by: user.id,
          }),
        });

        if (!grnUpdateResponse.ok) {
          console.warn("GRN updated but failed to save invoice number");
        }

        toast.success("Supplier invoice recorded in accounting system!");
        onInvoiceCreated?.();
        onClose();
      } else {
        throw new Error(data.message || "Failed to create transaction");
      }
    } catch (error: any) {
      console.error("Error recording invoice:", error);
      toast.error(error.message || "Failed to record invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleAddJournalEntry = () => {
    setJournalEntries(prev => [
      ...prev,
      {
        account_code: "",
        account_name: "",
        debit: 0,
        credit: 0,
        description: "",
      }
    ]);
  };

  const handleRemoveJournalEntry = (index: number) => {
    if (journalEntries.length <= 2) {
      toast.error("Cannot remove required journal entries");
      return;
    }
    setJournalEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleJournalEntryChange = (index: number, field: keyof JournalEntry, value: any) => {
    setJournalEntries(prev =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateTotals = () => {
    const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const difference = totalDebits - totalCredits;
    
    return { totalDebits, totalCredits, difference };
  };

  const { totalDebits, totalCredits, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  if (!grn) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] p-0 flex flex-col">
        {/* Desktop Header */}
        <DialogHeader className="hidden sm:block p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Record Supplier Invoice
          </DialogTitle>
          <DialogDescription>
            Create accounting entries for goods received from {grn.supplier_name}
          </DialogDescription>
        </DialogHeader>

        {/* Mobile Header */}
        <div className="sm:hidden sticky top-0 bg-white dark:bg-gray-900 z-10 border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-base font-semibold">
                Supplier Invoice
              </DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInfoSheetOpen(true)}
              className="h-8"
            >
              <Info className="h-4 w-4 mr-1" />
              Info
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {grn.supplier_name} • {grn.grn_number}
          </div>
        </div>

        {/* Mobile Info Sheet */}
        <Sheet open={isInfoSheetOpen} onOpenChange={setIsInfoSheetOpen}>
          <SheetContent side="bottom" className="h-auto rounded-t-xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GRN Information
              </SheetTitle>
              <SheetDescription>
                Details for invoice creation
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">GRN Number</Label>
                  <div className="font-medium">{grn.grn_number}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">PO Number</Label>
                  <div className="font-medium">{grn.po_number}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Supplier</Label>
                  <div className="font-medium">{grn.supplier_name}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">GRN Value</Label>
                  <div className="font-medium text-primary">{formatCurrency(grn.total_value)}</div>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Items</Label>
                <div className="font-medium">{grn.item_count} items • {grn.total_quantity} units</div>
              </div>
              {grn.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <div className="text-sm">{grn.notes}</div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Tabs */}
        <div className="sm:hidden flex border-b">
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeMobileTab === "details" 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveMobileTab("details")}
          >
            Invoice
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeMobileTab === "breakdown" 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveMobileTab("breakdown")}
          >
            Amounts
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeMobileTab === "journal" 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveMobileTab("journal")}
          >
            Journal
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Desktop GRN Summary */}
            <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">GRN Number</Label>
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  {grn.grn_number}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Supplier</Label>
                <div className="flex items-center gap-2 font-medium">
                  <Building className="h-4 w-4" />
                  {grn.supplier_name}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">PO Number</Label>
                <div className="font-medium">{grn.po_number}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">GRN Value</Label>
                <div className="font-medium">{formatCurrency(grn.total_value)}</div>
              </div>
            </div>

            {/* Mobile - Details Tab */}
            {activeMobileTab === "details" && (
              <div className="sm:hidden space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Invoice Number *</Label>
                      <Input
                        value={formData.invoice_number}
                        onChange={(e) => handleFormChange("invoice_number", e.target.value)}
                        required
                        placeholder="Auto-generated"
                        disabled={loading}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Invoice Date *</Label>
                      <DatePicker
                        date={formData.invoice_date}
                        onSelect={(date) => date && handleFormChange("invoice_date", date)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Posting Date *</Label>
                      <DatePicker
                        date={formData.posting_date}
                        onSelect={(date) => date && handleFormChange("posting_date", date)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleFormChange("status", value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNPAID">Unpaid</SelectItem>
                          <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                          <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Payment Terms</Label>
                      <Select
                        value={formData.payment_terms}
                        onValueChange={(value) => handleFormChange("payment_terms", value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                          <SelectItem value="NET15">Net 15</SelectItem>
                          <SelectItem value="NET30">Net 30</SelectItem>
                          <SelectItem value="NET45">Net 45</SelectItem>
                          <SelectItem value="NET60">Net 60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Payment Due Date</Label>
                      <DatePicker
                        date={formData.payment_due_date}
                        onSelect={(date) => date && handleFormChange("payment_due_date", date)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => handleFormChange("notes", e.target.value)}
                        placeholder="Add any notes..."
                        rows={2}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Mobile - Breakdown Tab */}
            {activeMobileTab === "breakdown" && (
              <div className="sm:hidden space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Amount Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Subtotal (from GRN)</Label>
                      <div className="p-2 border rounded bg-muted/50 mt-1">
                        <div className="text-lg font-medium">
                          {formatCurrency(grn.total_value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Based on received goods value
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Tax Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tax_amount || ""}
                        onChange={(e) => handleFormChange("tax_amount", parseFloat(e.target.value) || 0)}
                        disabled={loading}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Shipping Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.shipping_amount || ""}
                        onChange={(e) => handleFormChange("shipping_amount", parseFloat(e.target.value) || 0)}
                        disabled={loading}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Discount Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount_amount || ""}
                        onChange={(e) => handleFormChange("discount_amount", parseFloat(e.target.value) || 0)}
                        disabled={loading}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Other Charges</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.other_charges || ""}
                        onChange={(e) => handleFormChange("other_charges", parseFloat(e.target.value) || 0)}
                        disabled={loading}
                        className="w-full"
                      />
                    </div>

                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg mt-2">
                      <div className="text-xs text-muted-foreground">Total Invoice Amount</div>
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(formData.total_amount)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Desktop - Invoice Details */}
            <div className="hidden sm:block space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Invoice Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">
                    Invoice Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => handleFormChange("invoice_number", e.target.value)}
                    required
                    placeholder="Auto-generated"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_date">
                    Invoice Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    date={formData.invoice_date}
                    onSelect={(date) => date && handleFormChange("invoice_date", date)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="posting_date">
                    Posting Date <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    date={formData.posting_date}
                    onSelect={(date) => date && handleFormChange("posting_date", date)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleFormChange("status", value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select
                    value={formData.payment_terms}
                    onValueChange={(value) => handleFormChange("payment_terms", value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                      <SelectItem value="NET15">Net 15</SelectItem>
                      <SelectItem value="NET30">Net 30</SelectItem>
                      <SelectItem value="NET45">Net 45</SelectItem>
                      <SelectItem value="NET60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_due_date">Payment Due Date</Label>
                  <DatePicker
                    date={formData.payment_due_date}
                    onSelect={(date) => date && handleFormChange("payment_due_date", date)}
                  />
                </div>
              </div>
            </div>

            {/* Desktop - Amount Breakdown */}
            <div className="hidden sm:block">
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount Breakdown
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subtotal">Subtotal (from GRN)</Label>
                    <div className="p-2 border rounded bg-muted/50">
                      <div className="text-lg font-medium">
                        {formatCurrency(grn.total_value)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Based on received goods value
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_amount">Tax Amount</Label>
                    <Input
                      id="tax_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax_amount || ""}
                      onChange={(e) => handleFormChange("tax_amount", parseFloat(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shipping_amount">Shipping Amount</Label>
                    <Input
                      id="shipping_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_amount || ""}
                      onChange={(e) => handleFormChange("shipping_amount", parseFloat(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_amount">Discount Amount</Label>
                    <Input
                      id="discount_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_amount || ""}
                      onChange={(e) => handleFormChange("discount_amount", parseFloat(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="other_charges">Other Charges</Label>
                    <Input
                      id="other_charges"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.other_charges || ""}
                      onChange={(e) => handleFormChange("other_charges", parseFloat(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Total Amount Display */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Invoice Amount</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(formData.total_amount)}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {formatCurrency(formData.total_amount)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile - Journal Tab */}
            {activeMobileTab === "journal" && (
              <div className="sm:hidden space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Journal Entries
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddJournalEntry}
                    disabled={loading}
                  >
                    Add Entry
                  </Button>
                </div>

                <div className="space-y-3">
                  {journalEntries.map((entry, index) => (
                    <MobileJournalEntryCard
                      key={index}
                      entry={entry}
                      index={index}
                      onChange={handleJournalEntryChange}
                      onRemove={handleRemoveJournalEntry}
                      canRemove={index >= 2}
                      loading={loading}
                    />
                  ))}
                </div>

                {/* Mobile Journal Summary */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Debits:</span>
                        <span className="font-medium text-green-600">{formatCurrency(totalDebits)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Credits:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(totalCredits)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status:</span>
                        <div className={`flex items-center gap-1 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                          {isBalanced ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Balanced</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Difference: {formatCurrency(difference)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Desktop - Journal Entries */}
            <div className="hidden sm:block">
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Journal Entries
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddJournalEntry}
                    disabled={loading}
                  >
                    Add Entry
                  </Button>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Account Code</TableHead>
                        <TableHead className="whitespace-nowrap">Account Name</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Debit</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Credit</TableHead>
                        <TableHead className="whitespace-nowrap min-w-[200px]">Description</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              value={entry.account_code}
                              onChange={(e) => handleJournalEntryChange(index, "account_code", e.target.value)}
                              placeholder="e.g., 5000"
                              className="text-xs font-mono w-24"
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              value={entry.account_name}
                              onChange={(e) => handleJournalEntryChange(index, "account_name", e.target.value)}
                              placeholder="e.g., Inventory"
                              className="text-xs w-32"
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={entry.debit || ""}
                              onChange={(e) => handleJournalEntryChange(index, "debit", parseFloat(e.target.value) || 0)}
                              className="text-right font-mono w-24"
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={entry.credit || ""}
                              onChange={(e) => handleJournalEntryChange(index, "credit", parseFloat(e.target.value) || 0)}
                              className="text-right font-mono w-24"
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Input
                              value={entry.description}
                              onChange={(e) => handleJournalEntryChange(index, "description", e.target.value)}
                              placeholder="Description"
                              className="text-xs w-48"
                              disabled={loading}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {index >= 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveJournalEntry(index)}
                                className="h-8 w-8 p-0"
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Desktop Journal Entry Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Debits</div>
                    <div className="text-lg font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {formatCurrency(totalDebits)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Credits</div>
                    <div className="text-lg font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      {formatCurrency(totalCredits)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className={`text-lg font-medium flex items-center gap-2 ${isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isBalanced ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Journal is Balanced
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          Difference: {formatCurrency(difference)}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Journal Entry Explanation */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Standard Purchase Invoice Accounting:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• <strong>Debit</strong> Inventory/Purchases account (Asset/Expense increase)</div>
                    <div>• <strong>Debit</strong> Tax Payable (if applicable) - Tax asset/expense</div>
                    <div>• <strong>Credit</strong> Accounts Payable (Liability increase to supplier)</div>
                    <div className="mt-2 text-xs italic">
                      Total Debits must equal Total Credits. Use the "Add Entry" button for additional accounts.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop - Notes */}
            <div className="hidden sm:block space-y-2">
              <Label htmlFor="notes">Notes & Memo</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
                placeholder="Add any notes or memo for this transaction..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Mobile - Notes (only in details tab) */}
            {activeMobileTab === "details" && (
              <div className="sm:hidden space-y-2">
                <Label htmlFor="mobile_notes">Notes & Memo</Label>
                <Textarea
                  id="mobile_notes"
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  placeholder="Add any notes or memo..."
                  rows={2}
                  disabled={loading}
                />
              </div>
            )}

            {/* Created By Info - Desktop */}
            <div className="hidden sm:block text-xs text-muted-foreground border-t pt-4">
              Recording invoice as: {user?.full_name || user?.username || "Unknown"}
            </div>
          </form>
        </div>

        {/* Desktop Footer */}
        <DialogFooter className="hidden sm:flex border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading || !isBalanced || !formData.invoice_number}
            className={!isBalanced ? "bg-gray-400 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-600" : ""}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Record Invoice
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Mobile Footer */}
        <div className="sm:hidden border-t p-4">
          <div className="text-xs text-muted-foreground text-center mb-2">
            Recording as: {user?.full_name || user?.username || "Unknown"}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !isBalanced || !formData.invoice_number}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Record"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}