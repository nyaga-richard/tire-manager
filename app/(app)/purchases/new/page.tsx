"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Save,
  X,
  ShoppingCart,
  Building,
  Calendar,
  DollarSign,
  Package,
  Truck,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Search,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Supplier {
  id: number;
  name: string;
  type: "TIRE" | "RETREAD";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
}

interface InventoryItem {
  id: number;
  size: string;
  brand: string;
  model: string;
  type: "NEW" | "RETREADED";
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  last_purchase_price: number;
  average_cost: number;
  supplier_id: number;
  supplier_name: string;
}

interface PurchaseOrderItem {
  size: string;
  brand: string;
  model: string;
  type: "NEW" | "RETREADED";
  quantity: number;
  unit_price: number;
  line_total: number;
  notes?: string;
  inventory_id?: number;
}

interface PurchaseOrderForm {
  supplier_id: number | null;
  po_date: string;
  expected_delivery_date: string;
  status: "DRAFT";
  notes: string;
  terms: string;
  shipping_address: string;
  billing_address: string;
  tax_amount: number;
  shipping_amount: number;
  items: PurchaseOrderItem[];
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<PurchaseOrderForm>({
    supplier_id: null,
    po_date: format(new Date(), "yyyy-MM-dd"),
    expected_delivery_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    status: "DRAFT",
    notes: "",
    terms: "Net 30",
    shipping_address: "",
    billing_address: "",
    tax_amount: 0,
    shipping_amount: 0,
    items: [],
  });

  const [newItem, setNewItem] = useState<PurchaseOrderItem>({
    size: "",
    brand: "",
    model: "",
    type: "NEW",
    quantity: 1,
    unit_price: 0,
    line_total: 0,
    notes: "",
  });

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + item.line_total, 0);
  const tax = formData.tax_amount;
  const shipping = formData.shipping_amount;
  const total = subtotal + tax + shipping;

  useEffect(() => {
    fetchSuppliers();
    fetchInventory();
  }, []);

  useEffect(() => {
    // Recalculate line total when quantity or unit price changes
    const line_total = newItem.quantity * newItem.unit_price;
    setNewItem(prev => ({ ...prev, line_total }));
  }, [newItem.quantity, newItem.unit_price]);

  useEffect(() => {
    // When supplier is selected, populate shipping/billing addresses
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        shipping_address: selectedSupplier.address,
        billing_address: selectedSupplier.address,
      }));
    }
  }, [selectedSupplier]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        // Filter to only show TIRE suppliers for purchase orders
        const tireSuppliers = Array.isArray(data) ? data.filter((s: Supplier) => s.type === "TIRE") : [];
        setSuppliers(tireSuppliers);
      } else {
        throw new Error('Failed to fetch suppliers');
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    }
  };

  const fetchInventory = async () => {
    try {
      // Using the inventory catalog endpoint from your routes
      const response = await fetch('http://localhost:5000/api/inventory/by-size');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInventory(data.data);
        } else {
          // Try direct database query fallback
          await fetchInventoryFallback();
        }
      } else {
        // Fallback if the endpoint doesn't exist
        await fetchInventoryFallback();
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      await fetchInventoryFallback();
    }
  };

  const fetchInventoryFallback = async () => {
    try {
      // Alternative: Get inventory from recent purchase orders
      const response = await fetch('http://localhost:5000/api/purchase-orders?limit=50');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Extract unique items from recent purchase orders
          const items: InventoryItem[] = [];
          const seen = new Set();
          
          data.data.forEach((po: any) => {
            // We'll need to fetch items for each PO to get inventory
            // This is a simplified version
          });
          
          setInventory(items);
        }
      }
    } catch (error) {
      console.error("Error in fallback inventory fetch:", error);
      toast.error("Could not load inventory");
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const id = parseInt(supplierId);
    const supplier = suppliers.find(s => s.id === id) || null;
    setSelectedSupplier(supplier);
    setFormData(prev => ({ ...prev, supplier_id: id }));
  };

  const handleAddItemFromInventory = (item: InventoryItem) => {
    setNewItem({
      size: item.size,
      brand: item.brand || "",
      model: item.model || "",
      type: item.type,
      quantity: 1,
      unit_price: item.last_purchase_price || item.average_cost || 0,
      line_total: item.last_purchase_price || item.average_cost || 0,
      notes: `From inventory catalog. Current stock: ${item.current_stock}`,
      inventory_id: item.id,
    });
    setShowAddItemDialog(true);
  };

  const handleAddItem = () => {
    if (!newItem.size) {
      toast.error("Size is required");
      return;
    }
    if (newItem.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (newItem.unit_price < 0) {
      toast.error("Unit price cannot be negative");
      return;
    }

    const item: PurchaseOrderItem = {
      ...newItem,
      line_total: newItem.quantity * newItem.unit_price,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));

    // Reset new item form
    setNewItem({
      size: "",
      brand: "",
      model: "",
      type: "NEW",
      quantity: 1,
      unit_price: 0,
      line_total: 0,
      notes: "",
    });

    setShowAddItemDialog(false);
    toast.success("Item added to purchase order");
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    toast.success("Item removed");
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Recalculate line total if quantity or unit price changes
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].line_total = newItems[index].quantity * newItems[index].unit_price;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (status: "DRAFT" | "PENDING_APPROVAL") => {
    // Validate form
    if (!formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Please add at least one item to the purchase order");
      return;
    }

    // Validate all items
    for (const item of formData.items) {
      if (!item.size) {
        toast.error("All items must have a size");
        return;
      }
      if (item.quantity <= 0) {
        toast.error("All items must have a quantity greater than 0");
        return;
      }
      if (item.unit_price < 0) {
        toast.error("All items must have a valid unit price");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        status,
        total_amount: subtotal,
        final_amount: total,
      };

      const response = await fetch('http://localhost:5000/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const action = status === "DRAFT" ? "saved as draft" : "submitted for approval";
        toast.success(`Purchase order ${action} successfully`);
        
        // Redirect based on action
        if (status === "DRAFT") {
          router.push(`/purchases/${data.id || data.data?.id}`);
        } else {
          router.push("/purchases");
        }
      } else {
        throw new Error(data.error || data.message || "Failed to create purchase order");
      }
    } catch (error: any) {
      console.error("Error creating purchase order:", error);
      toast.error(error.message || "Failed to create purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (formData.items.length > 0) {
      setShowCancelDialog(true);
    } else {
      router.back();
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.size.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.model || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTireTypeColor = (type: string) => {
    return type === "NEW" 
      ? "bg-blue-100 text-blue-800 border-blue-200" 
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Quick add for testing - add sample items
  const addSampleItem = () => {
    const sampleItems = [
      { size: "295/75R22.5", brand: "Michelin", model: "X Line Energy D2", type: "NEW" as const, quantity: 4, unit_price: 450 },
      { size: "11R22.5", brand: "Bridgestone", model: "M710", type: "NEW" as const, quantity: 2, unit_price: 420 },
      { size: "285/75R24.5", brand: "Goodyear", model: "G302", type: "RETREADED" as const, quantity: 6, unit_price: 280 },
    ];

    sampleItems.forEach(item => {
      const newItem: PurchaseOrderItem = {
        ...item,
        line_total: item.quantity * item.unit_price,
        notes: "Sample item for testing",
      };
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    });
    
    toast.success("Added sample items for testing");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Purchase Order</h1>
            <p className="text-muted-foreground">
              Create a new purchase order for tires
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          {formData.items.length === 0 && (
            <Button
              variant="outline"
              onClick={addSampleItem}
              disabled={submitting}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Sample Items
            </Button>
          )}
          <Button
            onClick={() => handleSubmit("DRAFT")}
            disabled={submitting || formData.items.length === 0}
            variant="outline"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit("PENDING_APPROVAL")}
            disabled={submitting || formData.items.length === 0}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Submit for Approval
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Supplier & Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Supplier & Details
              </CardTitle>
              <CardDescription>
                Select supplier and enter purchase order details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select 
                    value={formData.supplier_id?.toString() || ""} 
                    onValueChange={handleSupplierChange}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          <div className="flex items-center justify-between">
                            <span>{supplier.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {supplier.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                      {suppliers.length === 0 && (
                        <SelectItem value="none" disabled>
                          No suppliers found. Please add suppliers first.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {suppliers.length === 0 && (
                    <p className="text-sm text-red-500">
                      No suppliers available. Please add tire suppliers in the suppliers section first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="po_date">PO Date *</Label>
                  <Input
                    id="po_date"
                    type="date"
                    value={formData.po_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, po_date: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                  <Input
                    id="expected_delivery_date"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Payment Terms</Label>
                  <Select 
                    value={formData.terms} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, terms: value }))}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Addresses */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shipping_address">Shipping Address</Label>
                    <Textarea
                      id="shipping_address"
                      value={formData.shipping_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_address: e.target.value }))}
                      placeholder="Enter shipping address"
                      disabled={submitting}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing_address">Billing Address</Label>
                    <Textarea
                      id="billing_address"
                      value={formData.billing_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
                      placeholder="Enter billing address"
                      disabled={submitting}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Additional Charges</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tax_amount">Tax Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tax_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.tax_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                        className="pl-9"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_amount">Shipping Amount</Label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="shipping_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.shipping_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_amount: parseFloat(e.target.value) || 0 }))}
                        className="pl-9"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes or special instructions..."
                  disabled={submitting}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Items ({formData.items.length})
                  {formData.items.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      Total: {formatCurrency(subtotal)}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddItemDialog(true)}
                    size="sm"
                    disabled={submitting}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>
              <CardDescription>
                Add tires to this purchase order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No items added yet</h3>
                  <p className="text-muted-foreground mt-1 mb-4">
                    Add items manually or use sample items to test
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAddItemDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item Manually
                    </Button>
                    <Button variant="outline" onClick={addSampleItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Sample Items
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Size</TableHead>
                        <TableHead>Brand/Model</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[100px]">Quantity</TableHead>
                        <TableHead className="w-[120px]">Unit Price</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="font-mono">{item.size}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.brand}</div>
                              <div className="text-sm text-muted-foreground">{item.model}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getTireTypeColor(item.type)}>
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20"
                              disabled={submitting}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="pl-6"
                                disabled={submitting}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.line_total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            {formData.items.length > 0 && (
              <CardFooter className="border-t pt-4">
                <div className="flex justify-between items-center w-full">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Items:</span>{" "}
                    <span className="font-medium">{formData.items.length}</span>
                    <span className="mx-2">•</span>
                    <span className="text-muted-foreground">Units:</span>{" "}
                    <span className="font-medium">
                      {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      Subtotal: {formatCurrency(subtotal)}
                    </div>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Right Column - Summary & Inventory */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shipping</span>
                  <span className="font-medium">{formatCurrency(shipping)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formData.items.length} item{formData.items.length !== 1 ? 's' : ''} • {formData.items.reduce((sum, item) => sum + item.quantity, 0)} units
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="w-full">
                <div className="text-sm text-muted-foreground mb-2">
                  Order will be created as: <Badge variant="outline">{formData.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSubmit("DRAFT")}
                    disabled={submitting || formData.items.length === 0 || !formData.supplier_id}
                    variant="outline"
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit("PENDING_APPROVAL")}
                    disabled={submitting || formData.items.length === 0 || !formData.supplier_id}
                    className="flex-1"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Submit
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Quick Add from Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Quick Add from Inventory
              </CardTitle>
              <CardDescription>
                Select from existing inventory items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search inventory..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleAddItemFromInventory(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium font-mono">{item.size}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.brand} {item.model}
                          </div>
                        </div>
                        <Badge variant="outline" className={getTireTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stock:</span>{" "}
                          <span className={item.current_stock <= item.reorder_point ? "text-red-500 font-medium" : ""}>
                            {item.current_stock}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Price:</span>{" "}
                          <span className="font-medium">
                            {formatCurrency(item.last_purchase_price || item.average_cost || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No matching items found" : "No inventory items available"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add items manually using the "Add Item" button
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={fetchInventory} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh Inventory
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Add Item Dialog */}
      <AlertDialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Item</AlertDialogTitle>
            <AlertDialogDescription>
              Enter item details for the purchase order
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size *</Label>
                <Input
                  id="size"
                  value={newItem.size}
                  onChange={(e) => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g., 295/75R22.5"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={newItem.type} 
                  onValueChange={(value: "NEW" | "RETREADED") => setNewItem(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="RETREADED">Retreaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={newItem.brand}
                  onChange={(e) => setNewItem(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g., Michelin"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={newItem.model}
                  onChange={(e) => setNewItem(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g., X Line Energy D2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newItem.notes}
                onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this item..."
                rows={2}
              />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Line Total:</span>
                <span className="font-bold">{formatCurrency(newItem.line_total)}</span>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to cancel? All changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.back()} className="bg-red-600 hover:bg-red-700">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}