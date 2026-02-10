"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

interface Supplier {
  id: number;
  name: string;
  type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

interface TireSize {
  id?: number;
  size: string;
  description?: string;
}

interface PurchaseOrderItem {
  id: number;
  size: string;
  quantity: number;
  vatInclusivePrice: number; // User inputs VAT-inclusive price
  lineTotalIncludingVAT: number; // Calculated line total including VAT
  priceExcludingVAT: number; // Calculated for backend if needed
  lineTotalExcludingVAT: number; // Calculated for backend if needed
}

const VAT_RATE = 0.16; // 16% VAT

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sizes, setSizes] = useState<TireSize[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: "",
    po_date: new Date(),
    expected_delivery_date: undefined as Date | undefined,
    status: "DRAFT",
    notes: "",
    terms: "",
    shipping_address: "",
    billing_address: "",
    tax_amount: 0, // Total VAT amount for the order
    shipping_amount: 0,
    created_by: 1,
    items: [
      {
        id: 1,
        size: "",
        quantity: 1,
        vatInclusivePrice: 0,
        lineTotalIncludingVAT: 0,
        priceExcludingVAT: 0,
        lineTotalExcludingVAT: 0,
      },
    ],
  });

  useEffect(() => {
    fetchSuppliers();
    fetchTireSizes();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await fetch("http://localhost:5000/api/suppliers");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const suppliersArray = Array.isArray(data) 
        ? data 
        : Array.isArray(data.suppliers) 
          ? data.suppliers 
          : [];
          
      setSuppliers(suppliersArray);
      
      if (suppliersArray.length === 0) {
        toast.warning("No suppliers found. Please add suppliers first.");
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setSuppliersLoading(false);
    }
  };

  const fetchTireSizes = async () => {
    try {
      setSizesLoading(true);
      const response = await fetch("http://localhost:5000/api/tires/meta/sizes");

      if (!response.ok) {
        throw new Error("Tire sizes endpoint unavailable");
      }

      const result = await response.json();

      if (!result?.success || !Array.isArray(result.data)) {
        throw new Error("Invalid tire sizes response");
      }

      const normalizedSizes: TireSize[] = result.data.map((size: string) => ({
        size,
        description: ""
      }));

      setSizes(normalizedSizes);

    } catch (error) {
      console.error("Error fetching tire sizes:", error);
      const fallbackSizes: TireSize[] = [
        { size: "295/80R22.5", description: "Steer axle" },
        { size: "11R22.5", description: "Drive axle" },
        { size: "285/75R24.5", description: "Large truck" },
        { size: "275/70R22.5", description: "Medium truck" },
        { size: "245/70R19.5", description: "Light truck" }
      ];
      setSizes(fallbackSizes);
    } finally {
      setSizesLoading(false);
    }
  };

  // Calculate price excluding VAT from VAT-inclusive price
  const calculatePriceExcludingVAT = (vatInclusivePrice: number): number => {
    if (vatInclusivePrice <= 0) return 0;
    return vatInclusivePrice / (1 + VAT_RATE);
  };

  // Calculate VAT amount from VAT-inclusive price
  const calculateVATAmount = (vatInclusivePrice: number): number => {
    if (vatInclusivePrice <= 0) return 0;
    const exclusivePrice = vatInclusivePrice / (1 + VAT_RATE);
    return vatInclusivePrice - exclusivePrice;
  };

  // Update item calculations when price changes
  const updateItemCalculations = (item: PurchaseOrderItem): PurchaseOrderItem => {
    const priceExcludingVAT = calculatePriceExcludingVAT(item.vatInclusivePrice);
    const lineTotalIncludingVAT = item.vatInclusivePrice * item.quantity;
    const lineTotalExcludingVAT = priceExcludingVAT * item.quantity;

    return {
      ...item,
      priceExcludingVAT,
      lineTotalIncludingVAT,
      lineTotalExcludingVAT,
    };
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const newItems = [...formData.items];
    let updatedItem = { ...newItems[index], [field]: value };
    
    // If quantity or VAT-inclusive price changes, recalculate
    if (field === 'quantity' || field === 'vatInclusivePrice') {
      updatedItem = updateItemCalculations(updatedItem);
    }
    
    newItems[index] = updatedItem;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    const newId = formData.items.length > 0 
      ? Math.max(...formData.items.map(item => item.id)) + 1 
      : 1;
    
    const newItem: PurchaseOrderItem = {
      id: newId,
      size: "",
      quantity: 1,
      vatInclusivePrice: 0,
      lineTotalIncludingVAT: 0,
      priceExcludingVAT: 0,
      lineTotalExcludingVAT: 0,
    };
    
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    toast.success("Item removed from order");
  };

  // Calculate order totals - MATCHING BACKEND LOGIC
  const calculateOrderTotals = () => {
    // Calculate subtotal including VAT (sum of all line totals)
    const subtotalIncludingVAT = formData.items.reduce((total, item) => 
      total + item.lineTotalIncludingVAT, 0);
    
    // Calculate VAT by working backwards from the inclusive total
    // Formula: VAT = (subtotalIncludingVAT * VAT_RATE) / (1 + VAT_RATE)
    const totalVAT = (subtotalIncludingVAT * VAT_RATE) / (1 + VAT_RATE);
    
    // Calculate subtotal excluding VAT - THIS IS WHAT BACKEND EXPECTS
    // Backend calculates: total_amount = totalAmount * 0.84
    // But actually should be: total_amount = subtotalIncludingVAT - totalVAT
    const subtotalExcludingVAT = subtotalIncludingVAT - totalVAT;
    
    const shippingAmount = formData.shipping_amount || 0;
    
    // Grand total calculation - match backend logic
    // Backend calculates: final_amount = (total_amount * 1.16) + shipping_amount
    // But we want: final_amount = subtotalIncludingVAT + shippingAmount
    const backendFinalAmount = (subtotalExcludingVAT * 1.16) + shippingAmount;
    
    // Our correct calculation
    const correctFinalAmount = subtotalIncludingVAT + shippingAmount;

    return {
      subtotalExcludingVAT,
      totalVAT,
      subtotalIncludingVAT,
      shippingAmount,
      backendFinalAmount, // What backend will calculate
      correctFinalAmount // What it should be
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }
    
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    
    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.size || item.quantity <= 0 || item.vatInclusivePrice < 0) {
        toast.error(`Please fill all required fields for item #${i + 1}`);
        return;
      }
    }
    
    setLoading(true);

    try {
      const totals = calculateOrderTotals();
      
      // Prepare purchase order data - WORKING WITH CURRENT BACKEND LOGIC
      const orderData = {
        supplier_id: parseInt(formData.supplier_id),
        po_date: formData.po_date.toISOString().split("T")[0],
        expected_delivery_date: formData.expected_delivery_date 
          ? formData.expected_delivery_date.toISOString().split("T")[0]
          : null,
        status: formData.status,
        notes: formData.notes || null,
        terms: formData.terms || null,
        shipping_address: formData.shipping_address || null,
        billing_address: formData.billing_address || null,
        // Don't send tax_amount - let backend calculate it from total_amount
        // tax_amount: totals.totalVAT, // Remove this - backend will calculate
        shipping_amount: formData.shipping_amount,
        created_by: formData.created_by,
        // Send total_amount as subtotal excluding VAT
        total_amount: totals.subtotalExcludingVAT,
        // Don't send final_amount - let backend calculate it
        // final_amount: totals.correctFinalAmount, // Remove this - backend will calculate
        items: formData.items.map(item => ({
          tire_size: item.size,
          quantity: item.quantity,
          unit_price: item.vatInclusivePrice, // Store inclusive price in database
          line_total: item.lineTotalIncludingVAT, // Store inclusive line total
          received_quantity: 0
        }))
      };

      console.log("Sending purchase order data (WORKING WITH BACKEND):", orderData);
      console.log("Calculation breakdown:");
      console.log("- Subtotal including VAT:", totals.subtotalIncludingVAT);
      console.log("- VAT (16%):", totals.totalVAT);
      console.log("- Subtotal excluding VAT (total_amount sent):", totals.subtotalExcludingVAT);
      console.log("- Shipping:", totals.shippingAmount);
      console.log("- Expected final_amount from backend:", totals.backendFinalAmount);
      console.log("- Correct final_amount should be:", totals.correctFinalAmount);

      const response = await fetch("http://localhost:5000/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Purchase order created successfully`);
        // Check if backend calculation is correct
        if (result.data && result.data.final_amount !== totals.correctFinalAmount) {
          console.warn("Backend calculation differs from expected:", {
            expected: totals.correctFinalAmount,
            actual: result.data.final_amount
          });
        }
        router.push("/purchases");
        router.refresh();
      } else {
        toast.error(result.error || result.message || "Failed to create purchase order");
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast.error("Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateOrderTotals();
  const totalQuantity = formData.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
          <p className="text-muted-foreground">
            Create a new tire purchase order for your supplier
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Supplier and order information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                  required
                  disabled={suppliersLoading}
                >
                  <SelectTrigger>
                    {suppliersLoading ? (
                      <SelectValue placeholder="Loading suppliers..." />
                    ) : (
                      <SelectValue placeholder="Select supplier" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {suppliersLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading suppliers...
                      </SelectItem>
                    ) : suppliers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No suppliers available
                      </SelectItem>
                    ) : (
                      suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          <div className="flex flex-col">
                            <span>{supplier.name}</span>
                            {supplier.type && (
                              <span className="text-xs text-muted-foreground">
                                {supplier.type}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {suppliers.length} supplier(s) available
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="po_date">Order Date *</Label>
                <DatePicker
                  date={formData.po_date}
                  onSelect={(date) => date && setFormData({ ...formData, po_date: date })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                <DatePicker
                  date={formData.expected_delivery_date}
                  onSelect={(date) => setFormData({ ...formData, expected_delivery_date: date })}
                  className="w-full"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs mt-1"
                  onClick={() => setFormData({ ...formData, expected_delivery_date: undefined })}
                >
                  Clear date
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Order Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="ORDERED">Ordered</SelectItem>
                    <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                    <SelectItem value="RECEIVED">Fully Received</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Payment Terms</Label>
                <Input
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="e.g., Net 30 days"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping_address">Shipping Address</Label>
                <Textarea
                  id="shipping_address"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  placeholder="Enter shipping address..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_address">Billing Address</Label>
                <Textarea
                  id="billing_address"
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="Enter billing address..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special instructions or notes for this order..."
                  rows={3}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Additional Charges</Label>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="shipping_amount" className="text-sm">
                      Shipping Amount (KSH)
                    </Label>
                    <Input
                      id="shipping_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_amount}
                      onChange={(e) => setFormData({ ...formData, shipping_amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Shipping is added to the grand total
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  Add tires to this purchase order ({formData.items.length} item{formData.items.length !== 1 ? 's' : ''})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="space-y-4 p-4 border rounded-lg relative group">
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <h3 className="font-medium">Item #{index + 1}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`size_${index}`}>Tire Size *</Label>
                        <Select
                          value={item.size}
                          onValueChange={(value) => handleItemChange(index, "size", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            {sizesLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading sizes...
                              </SelectItem>
                            ) : sizes.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No sizes available
                              </SelectItem>
                            ) : (
                              sizes.map((size) => (
                                <SelectItem key={size.size} value={size.size}>
                                  <div className="flex flex-col">
                                    <span>{size.size}</span>
                                    {size.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {size.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {sizes.length} size(s) available
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`quantity_${index}`}>Quantity *</Label>
                        <Input
                          id={`quantity_${index}`}
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                          placeholder="1"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of tires of this size
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`price_${index}`}>
                            Price per Tire (KSH) *
                          </Label>
                        </div>
                        <Input
                          id={`price_${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.vatInclusivePrice || ""}
                          onChange={(e) => handleItemChange(index, "vatInclusivePrice", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          required
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Includes 16% VAT</span>
                          <span className="font-medium">
                            Total: KSH {item.lineTotalIncludingVAT.toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Item
                </Button>
              </CardFooter>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Total costs and amounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Items:</span>
                    <span>{formData.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Quantity:</span>
                    <span>{totalQuantity} tires</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Subtotal (Including VAT):</span>
                        <span>KSH {totals.subtotalIncludingVAT.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">VAT (16%):</span>
                        <span>KSH {totals.totalVAT.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Subtotal (Excluding VAT):</span>
                        <span className="text-sm font-medium">KSH {totals.subtotalExcludingVAT.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Shipping:</span>
                    <span>KSH {totals.shippingAmount.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}</span>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Grand Total:</span>
                      <span className="text-2xl font-bold">
                        KSH {totals.correctFinalAmount.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total includes 16% VAT on items
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/purchases">Cancel</Link>
                </Button>
                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({ ...formData, status: "DRAFT" });
                      handleSubmit(new Event('submit') as any);
                    }}
                    disabled={loading || suppliersLoading || formData.items.length === 0 || !formData.supplier_id}
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || suppliersLoading || formData.items.length === 0 || !formData.supplier_id}
                    className="min-w-[180px]"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Order...
                      </>
                    ) : (
                      "Create Purchase Order"
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}