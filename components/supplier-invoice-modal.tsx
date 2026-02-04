// components/supplier-invoice-modal.tsx
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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function SupplierInvoiceModal({ isOpen, onClose, grn, onInvoiceCreated }: SupplierInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
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
      const invoiceNumber = `INV-${grn.supplier_code}-${timestamp}`;
      
      // Calculate totals
      const subtotal = grn.total_value;
      const totalAmount = subtotal + formData.tax_amount + formData.shipping_amount + 
                         formData.other_charges - formData.discount_amount;
      
      // Update journal entries
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
        // Update existing tax entry
        setJournalEntries(prev =>
          prev.map(entry =>
            entry.account_name === "Tax Payable"
              ? { ...entry, credit: formData.tax_amount }
              : entry
          )
        );
      }
    } else {
      // Remove tax entry if tax is 0
      setJournalEntries(prev =>
        prev.filter(entry => entry.account_name !== "Tax Payable")
      );
    }
  }, [formData.tax_amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grn) return;

    // Validate journal entries (debits must equal credits)
    const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.credit, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast.error("Journal entries are not balanced! Debits must equal credits.");
      return;
    }

    setLoading(true);
    try {
      // Create accounting transaction
      const transactionData = {
        transaction_date: format(formData.invoice_date, "yyyy-MM-dd"),
        posting_date: format(formData.posting_date, "yyyy-MM-dd"),
        invoice_number: formData.invoice_number,
        reference_number: grn.grn_number,
        supplier_id: grn.supplier_code,
        supplier_name: grn.supplier_name,
        grn_id: grn.id,
        po_id: grn.po_id,
        total_amount: formData.total_amount,
        currency: "USD",
        notes: formData.notes,
        status: formData.status,
        journal_entries: journalEntries,
        metadata: {
          tax_amount: formData.tax_amount,
          shipping_amount: formData.shipping_amount,
          discount_amount: formData.discount_amount,
          other_charges: formData.other_charges,
          payment_terms: formData.payment_terms,
          payment_due_date: format(formData.payment_due_date, "yyyy-MM-dd"),
        }
      };

      // API call to create accounting transaction
      const response = await fetch("http://localhost:5000/api/accounting/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error("Failed to create accounting transaction");
      }

      const data = await response.json();
      
      if (data.success) {
        // Update GRN with invoice number
        await fetch(`http://localhost:5000/api/grn/${grn.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supplier_invoice_number: formData.invoice_number,
            accounting_transaction_id: data.transaction_id,
          }),
        });

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Record Supplier Invoice
          </DialogTitle>
          <DialogDescription>
            Create accounting entries for goods received from {grn.supplier_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
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
          </div>

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Invoice Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => handleFormChange("invoice_number", e.target.value)}
                  required
                  placeholder="Auto-generated"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <DatePicker
                  date={formData.invoice_date}
                  onSelect={(date) => date && handleFormChange("invoice_date", date)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="posting_date">Posting Date *</Label>
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

          <Separator />

          {/* Amount Breakdown */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Amount Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal</Label>
                <div className="p-2 border rounded bg-muted/50">
                  <div className="text-lg font-medium">
                    {formatCurrency(grn.total_value)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Based on GRN value
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_amount">Tax Amount</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tax_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => handleFormChange("tax_amount", parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping_amount">Shipping Amount</Label>
                <Input
                  id="shipping_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping_amount}
                  onChange={(e) => handleFormChange("shipping_amount", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_amount">Discount Amount</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount_amount}
                  onChange={(e) => handleFormChange("discount_amount", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_charges">Other Charges</Label>
              <Input
                id="other_charges"
                type="number"
                min="0"
                step="0.01"
                value={formData.other_charges}
                onChange={(e) => handleFormChange("other_charges", parseFloat(e.target.value) || 0)}
              />
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

          <Separator />

          {/* Journal Entries */}
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
              >
                Add Entry
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="w-[150px]">Debit</TableHead>
                    <TableHead className="w-[150px]">Credit</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={entry.account_code}
                          onChange={(e) => handleJournalEntryChange(index, "account_code", e.target.value)}
                          placeholder="e.g., 5000"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.account_name}
                          onChange={(e) => handleJournalEntryChange(index, "account_name", e.target.value)}
                          placeholder="e.g., Inventory"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.debit}
                          onChange={(e) => handleJournalEntryChange(index, "debit", parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={entry.credit}
                          onChange={(e) => handleJournalEntryChange(index, "credit", parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.description}
                          onChange={(e) => handleJournalEntryChange(index, "description", e.target.value)}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        {index >= 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveJournalEntry(index)}
                            className="h-8 w-8 p-0"
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

            {/* Journal Entry Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Total Debits</div>
                <div className="text-lg font-medium text-green-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {formatCurrency(totalDebits)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Credits</div>
                <div className="text-lg font-medium text-blue-600 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  {formatCurrency(totalCredits)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className={`text-lg font-medium flex items-center gap-2 ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {isBalanced ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Balanced
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      {formatCurrency(difference)}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Journal Entry Explanation */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Standard Accounting Entry:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>1. <strong>Debit</strong> Inventory/Purchases account (Asset/Expense increase)</div>
                <div>2. <strong>Debit</strong> Tax account if applicable</div>
                <div>3. <strong>Credit</strong> Accounts Payable (Liability increase)</div>
                <div className="mt-2 text-xs italic">
                  Note: For a purchase invoice, typically debit the expense/asset accounts 
                  and credit accounts payable to the supplier.
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes & Memo</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleFormChange("notes", e.target.value)}
              placeholder="Add any notes or memo for this transaction..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !isBalanced}
              className={!isBalanced ? "bg-gray-400 hover:bg-gray-400" : ""}
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
        </form>
      </DialogContent>
    </Dialog>
  );
}