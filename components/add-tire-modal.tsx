"use client";

import { useState, useEffect } from "react";
import { X, Plus, Package, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface AddTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TireFormData {
  serial_number: string;
  size: string;
  brand: string;
  pattern: string;
  type: "NEW" | "RETREADED" | "USED";
  status: "IN_STORE" | "USED_STORE" | "AWAITING_RETREAD";
  purchase_date: string;
  purchase_cost: string;
  purchase_supplier: string;
  depth_remaining: string;
  notes?: string;
  isMultiple: boolean;
  quantity: number;
}

export default function AddTireModal({
  isOpen,
  onClose,
  onSuccess
}: AddTireModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TireFormData>({
    serial_number: "",
    size: "",
    brand: "",
    pattern: "",
    type: "NEW",
    status: "IN_STORE",
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: "",
    purchase_supplier: "",
    depth_remaining: "",
    notes: "",
    isMultiple: false,
    quantity: 1
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tireSizes, setTireSizes] = useState<string[]>([]);
  const [tireBrands, setTireBrands] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);

  // Initialize form with common data
  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setFormData({
        serial_number: "",
        size: "",
        brand: "",
        pattern: "",
        type: "NEW",
        status: "IN_STORE",
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_cost: "",
        purchase_supplier: "",
        depth_remaining: "",
        notes: "",
        isMultiple: false,
        quantity: 1
      });
      setErrors({});
      
      // Fetch common data for dropdowns
      fetchCommonData();
    }
  }, [isOpen]);

  const fetchCommonData = async () => {
    try {
      // In a real app, these would be API calls
      // For now, we'll use static data
      setTireSizes([
        "295/75R22.5", "11R22.5", "275/70R22.5", "315/80R22.5",
        "12R22.5", "385/65R22.5", "295/80R22.5", "10.00R20"
      ]);
      
      setTireBrands([
        "Michelin", "Bridgestone", "Goodyear", "Continental",
        "Pirelli", "Yokohama", "Hankook", "Firestone", "Falken"
      ]);
      
      setPatterns([
        "Drive Tire", "Trailer Tire", "Steer Tire", "All Position",
        "Rib Pattern", "Lug Pattern", "Mixed Pattern"
      ]);
      
      setSuppliers([
        "Tire Distributor Inc.", "Commercial Tire Co.", "Fleet Tire Solutions",
        "Direct Manufacturer", "Local Supplier", "Other"
      ]);
    } catch (error) {
      console.error("Error fetching common data:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.serial_number.trim() && !formData.isMultiple) {
      newErrors.serial_number = "Serial number is required";
    }

    if (!formData.size) {
      newErrors.size = "Tire size is required";
    }

    if (!formData.brand) {
      newErrors.brand = "Brand is required";
    }

    if (!formData.pattern) {
      newErrors.pattern = "Pattern is required";
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    }

    if (!formData.purchase_cost) {
      newErrors.purchase_cost = "Purchase cost is required";
    } else if (isNaN(parseFloat(formData.purchase_cost)) || parseFloat(formData.purchase_cost) <= 0) {
      newErrors.purchase_cost = "Please enter a valid cost";
    }

    if (formData.isMultiple && (!formData.quantity || formData.quantity < 1)) {
      newErrors.quantity = "Please enter a valid quantity";
    }

    if (formData.type === "USED" && !formData.depth_remaining) {
      newErrors.depth_remaining = "Remaining depth is required for used tires";
    } else if (formData.depth_remaining && 
               (isNaN(parseFloat(formData.depth_remaining)) || 
                parseFloat(formData.depth_remaining) < 0 || 
                parseFloat(formData.depth_remaining) > 30)) {
      newErrors.depth_remaining = "Depth must be between 0-30 mm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TireFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateSerialNumbers = (baseSerial: string, quantity: number): string[] => {
    const serials: string[] = [];
    
    if (baseSerial.includes('XXXX')) {
      for (let i = 1; i <= quantity; i++) {
        const paddedNum = i.toString().padStart(4, '0');
        serials.push(baseSerial.replace('XXXX', paddedNum));
      }
    } else {
      for (let i = 1; i <= quantity; i++) {
        serials.push(`${baseSerial}-${i.toString().padStart(3, '0')}`);
      }
    }
    
    return serials;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let payload;
      
      if (formData.isMultiple) {
        // Generate serial numbers for multiple tires
        const baseSerial = formData.serial_number || `TIRE-${formData.size.replace(/\//g, '-')}`;
        const serialNumbers = generateSerialNumbers(baseSerial, formData.quantity);
        
        payload = {
          tires: serialNumbers.map((serial, index) => ({
            serial_number: serial,
            size: formData.size,
            brand: formData.brand,
            pattern: formData.pattern,
            type: formData.type,
            status: formData.status,
            purchase_date: formData.purchase_date,
            purchase_cost: parseFloat(formData.purchase_cost),
            purchase_supplier: formData.purchase_supplier,
            depth_remaining: formData.depth_remaining ? parseFloat(formData.depth_remaining) : null,
            notes: formData.notes || `Tire ${index + 1} of ${formData.quantity}`
          })),
          is_bulk: true
        };
      } else {
        // Single tire
        payload = {
          serial_number: formData.serial_number,
          size: formData.size,
          brand: formData.brand,
          pattern: formData.pattern,
          type: formData.type,
          status: formData.status,
          purchase_date: formData.purchase_date,
          purchase_cost: parseFloat(formData.purchase_cost),
          purchase_supplier: formData.purchase_supplier,
          depth_remaining: formData.depth_remaining ? parseFloat(formData.depth_remaining) : null,
          notes: formData.notes
        };
      }

      const response = await fetch("http://localhost:5000/api/inventory/tires", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add tire(s)");
      }

      // Success
      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error("Error adding tire:", error);
      alert("Failed to add tire. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Tire to Inventory
            </h2>
            <p className="text-muted-foreground">
              Add single or multiple tires to your inventory
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Multiple Tires Switch */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <Label className="text-base font-medium">Add Multiple Tires</Label>
              <p className="text-sm text-muted-foreground">
                Add multiple tires of the same specification
              </p>
            </div>
            <Switch
              checked={formData.isMultiple}
              onCheckedChange={(checked) => handleInputChange('isMultiple', checked)}
            />
          </div>

          {formData.isMultiple && (
            <div className="p-4 border rounded-lg bg-blue-50/50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Bulk Add Mode</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                      className={errors.quantity ? "border-red-500" : ""}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500">{errors.quantity}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter number of tires to add
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base-serial">Base Serial Number (Optional)</Label>
                    <Input
                      id="base-serial"
                      placeholder="e.g., TIRE-XXXX or TIRE-001"
                      value={formData.serial_number}
                      onChange={(e) => handleInputChange('serial_number', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use XXXX for auto-numbering (e.g., TIRE-0001, TIRE-0002)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Tire Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tire Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Serial Number (conditional) */}
              {!formData.isMultiple && (
                <div className="space-y-2">
                  <Label htmlFor="serial-number">Serial Number *</Label>
                  <Input
                    id="serial-number"
                    placeholder="e.g., TIRE-001234"
                    value={formData.serial_number}
                    onChange={(e) => handleInputChange('serial_number', e.target.value)}
                    className={errors.serial_number ? "border-red-500" : ""}
                  />
                  {errors.serial_number && (
                    <p className="text-sm text-red-500">{errors.serial_number}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="size">Tire Size *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => handleInputChange('size', value)}
                >
                  <SelectTrigger id="size" className={errors.size ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select tire size" />
                  </SelectTrigger>
                  <SelectContent>
                    {tireSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other size...</SelectItem>
                  </SelectContent>
                </Select>
                {errors.size && (
                  <p className="text-sm text-red-500">{errors.size}</p>
                )}
                {formData.size === "other" && (
                  <Input
                    placeholder="Enter custom size"
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Select
                  value={formData.brand}
                  onValueChange={(value) => handleInputChange('brand', value)}
                >
                  <SelectTrigger id="brand" className={errors.brand ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {tireBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other brand...</SelectItem>
                  </SelectContent>
                </Select>
                {errors.brand && (
                  <p className="text-sm text-red-500">{errors.brand}</p>
                )}
                {formData.brand === "other" && (
                  <Input
                    placeholder="Enter custom brand"
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern *</Label>
                <Select
                  value={formData.pattern}
                  onValueChange={(value) => handleInputChange('pattern', value)}
                >
                  <SelectTrigger id="pattern" className={errors.pattern ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {patterns.map((pattern) => (
                      <SelectItem key={pattern} value={pattern}>
                        {pattern}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other pattern...</SelectItem>
                  </SelectContent>
                </Select>
                {errors.pattern && (
                  <p className="text-sm text-red-500">{errors.pattern}</p>
                )}
                {formData.pattern === "other" && (
                  <Input
                    placeholder="Enter custom pattern"
                    onChange={(e) => handleInputChange('pattern', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tire Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value as TireFormData['type'])}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="RETREADED">Retreaded</SelectItem>
                    <SelectItem value="USED">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Initial Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as TireFormData['status'])}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STORE">In Store (New)</SelectItem>
                    <SelectItem value="USED_STORE">Used Store</SelectItem>
                    <SelectItem value="AWAITING_RETREAD">Awaiting Retread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditionally show depth for used tires */}
            {formData.type === "USED" && (
              <div className="space-y-2">
                <Label htmlFor="depth-remaining">
                  Remaining Tread Depth (mm) *
                  <span className="text-muted-foreground text-xs ml-2">
                    For new tires: ~15mm, For retreaded: ~12mm
                  </span>
                </Label>
                <Input
                  id="depth-remaining"
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  placeholder="e.g., 8.5"
                  value={formData.depth_remaining}
                  onChange={(e) => handleInputChange('depth_remaining', e.target.value)}
                  className={errors.depth_remaining ? "border-red-500" : ""}
                />
                {errors.depth_remaining && (
                  <p className="text-sm text-red-500">{errors.depth_remaining}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Purchase Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-date">Purchase Date *</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                  className={errors.purchase_date ? "border-red-500" : ""}
                />
                {errors.purchase_date && (
                  <p className="text-sm text-red-500">{errors.purchase_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase-cost">Purchase Cost ($) *</Label>
                <Input
                  id="purchase-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 350.00"
                  value={formData.purchase_cost}
                  onChange={(e) => handleInputChange('purchase_cost', e.target.value)}
                  className={errors.purchase_cost ? "border-red-500" : ""}
                />
                {errors.purchase_cost && (
                  <p className="text-sm text-red-500">{errors.purchase_cost}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier *</Label>
                <Select
                  value={formData.purchase_supplier}
                  onValueChange={(value) => handleInputChange('purchase_supplier', value)}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other supplier...</SelectItem>
                  </SelectContent>
                </Select>
                {formData.purchase_supplier === "other" && (
                  <Input
                    placeholder="Enter supplier name"
                    onChange={(e) => handleInputChange('purchase_supplier', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about these tires..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.isMultiple ? "These notes will apply to all tires in this batch." : "Optional notes about this tire."}
            </p>
          </div>

          {/* Summary for Multiple Tires */}
          {formData.isMultiple && formData.quantity > 1 && (
            <div className="p-4 border rounded-lg bg-green-50/50">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Batch Summary</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    {formData.quantity}
                  </div>
                  <div className="text-muted-foreground">Tires</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    {formData.size}
                  </div>
                  <div className="text-muted-foreground">Size</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    {formData.brand}
                  </div>
                  <div className="text-muted-foreground">Brand</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700">
                    ${(parseFloat(formData.purchase_cost || '0') * formData.quantity).toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">Total Cost</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
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
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  {formData.isMultiple ? (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {formData.quantity} Tires
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Add Tire
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}