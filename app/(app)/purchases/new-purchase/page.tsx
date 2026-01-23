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
}

interface TireFormData {
  serial_number: string;
  size: string;
  brand: string;
  pattern: string;
  type: "NEW" | "RETREADED";
  purchase_cost: number;
  tread_depth_new: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: "",
    purchase_date: new Date(),
    purchase_cost: 0,
    user_id: "1", // In real app, get from auth context
    tires: [
      {
        serial_number: "",
        size: "",
        brand: "",
        pattern: "",
        type: "NEW" as "NEW" | "RETREADED",
        purchase_cost: 0,
        tread_depth_new: 15,
      },
    ],
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/suppliers?type=TIRE&RETREAD");
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    }
  };

  const handleTireChange = (index: number, field: keyof TireFormData, value: any) => {
    const newTires = [...formData.tires];
    newTires[index] = { ...newTires[index], [field]: value };
    setFormData({ ...formData, tires: newTires });
  };

  const addTire = () => {
    setFormData({
      ...formData,
      tires: [
        ...formData.tires,
        {
          serial_number: "",
          size: "",
          brand: "",
          pattern: "",
          type: "NEW",
          purchase_cost: 0,
          tread_depth_new: 15,
        },
      ],
    });
  };

  const removeTire = (index: number) => {
    const newTires = formData.tires.filter((_, i) => i !== index);
    setFormData({ ...formData, tires: newTires });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/tires/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          purchase_date: formData.purchase_date.toISOString().split("T")[0],
          purchase_cost: formData.tires.reduce((sum, tire) => sum + tire.purchase_cost, 0),
        }),
      });

      if (response.ok) {
        toast.success("Tires purchased successfully");
        router.push("/purchases");
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to purchase tires");
      }
    } catch (error) {
      console.error("Error purchasing tires:", error);
      toast.error("Failed to purchase tires");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = formData.tires.reduce((sum, tire) => sum + tire.purchase_cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase New Tires</h1>
          <p className="text-muted-foreground">
            Add new tires to your inventory
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purchase Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Purchase Details</CardTitle>
              <CardDescription>Supplier and purchase information</CardDescription>
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <DatePicker
                  date={formData.purchase_date}
                  onSelect={(date) => date && setFormData({ ...formData, purchase_date: date })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Total Cost</Label>
                <div className="text-2xl font-bold">
                  ${totalCost.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.tires.length} tires @ ${(totalCost / formData.tires.length).toFixed(2)} avg
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addTire}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Tire
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tire Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tire Details</CardTitle>
              <CardDescription>
                Enter details for each tire ({formData.tires.length} tires)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.tires.map((tire, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                  {formData.tires.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeTire(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`serial_${index}`}>Serial Number *</Label>
                      <Input
                        id={`serial_${index}`}
                        value={tire.serial_number}
                        onChange={(e) => handleTireChange(index, "serial_number", e.target.value)}
                        placeholder="e.g., ABC123456"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`size_${index}`}>Size *</Label>
                      <Input
                        id={`size_${index}`}
                        value={tire.size}
                        onChange={(e) => handleTireChange(index, "size", e.target.value)}
                        placeholder="e.g., 295/80R22.5"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`brand_${index}`}>Brand *</Label>
                      <Input
                        id={`brand_${index}`}
                        value={tire.brand}
                        onChange={(e) => handleTireChange(index, "brand", e.target.value)}
                        placeholder="e.g., Michelin"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`pattern_${index}`}>Pattern</Label>
                      <Input
                        id={`pattern_${index}`}
                        value={tire.pattern}
                        onChange={(e) => handleTireChange(index, "pattern", e.target.value)}
                        placeholder="e.g., XDA2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`type_${index}`}>Type *</Label>
                      <Select
                        value={tire.type}
                        onValueChange={(value: "NEW" | "RETREADED") =>
                          handleTireChange(index, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">New</SelectItem>
                          <SelectItem value="RETREADED">Retreaded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`cost_${index}`}>Cost ($) *</Label>
                      <Input
                        id={`cost_${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={tire.purchase_cost}
                        onChange={(e) =>
                          handleTireChange(index, "purchase_cost", parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`depth_${index}`}>New Tread Depth (mm)</Label>
                      <Input
                        id={`depth_${index}`}
                        type="number"
                        min="1"
                        max="30"
                        value={tire.tread_depth_new}
                        onChange={(e) =>
                          handleTireChange(index, "tread_depth_new", parseInt(e.target.value) || 15)
                        }
                        placeholder="15"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline" type="button" asChild>
                <Link href="/purchases">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading || formData.tires.length === 0}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Purchasing...
                  </>
                ) : (
                  "Purchase Tires"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}