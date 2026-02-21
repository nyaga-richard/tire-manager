"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Truck,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Package,
} from "lucide-react";
import Link from "next/link";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// API Base URL constant
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  type: "NEW";
  status: "USED_STORE" | "AWAITING_RETREAD";
  purchase_date: string;
  purchase_cost: number;
  depth_remaining: number;
  tread_depth_new: number;
  installation_count: number;
  total_distance: number;
}

interface Supplier {
  id: number;
  name: string;
  type: "RETREAD";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  average_retread_cost?: number;
}

export default function SendForRetreadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tireIdsParam = searchParams.get("tires");

  const [selectedTires, setSelectedTires] = useState<Tire[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    send_date: new Date(),
    expected_cost: "",
    notes: "",
    user_id: "1", // Get from auth context
  });

  useEffect(() => {
    if (tireIdsParam) {
      fetchSelectedTires();
    }
    fetchSuppliers();
  }, [tireIdsParam]);

  const fetchSelectedTires = async () => {
    try {
      const tireIds = tireIdsParam?.split(",").map(Number);
      const promises = tireIds?.map(id =>
        fetch(`${API_BASE_URL}/api/tires/${id}`).then(res => res.json())
      );
      
      const results = await Promise.all(promises || []);
      setSelectedTires(results.filter(tire => tire && tire.id));
    } catch (error) {
      console.error("Error fetching tires:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/suppliers`);
      const data: Supplier[] = await response.json(); // API returns raw array

      if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
        setFormData(prev => ({
          ...prev,
          supplier_id: data[0].id.toString(), // auto-select first supplier
        }));
      } else {
        console.warn("No suppliers found", data);
        setSuppliers([]);
        setFormData(prev => ({ ...prev, supplier_id: "" }));
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
      setFormData(prev => ({ ...prev, supplier_id: "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTires.length === 0) {
      alert("No tires selected");
      return;
    }

    if (!formData.supplier_id) {
      alert("Please select a retread supplier");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        tire_ids: selectedTires.map(t => t.id),
        supplier_id: parseInt(formData.supplier_id),
        send_date: format(formData.send_date, "yyyy-MM-dd"),
        expected_cost: parseFloat(formData.expected_cost) || 0,
        user_id: parseInt(formData.user_id),
        notes: formData.notes,
      };

      const response = await fetch(`${API_BASE_URL}/api/tires/retread/send-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully sent ${data.sent_tires.length} tires for retreading`);
        router.push("/retreads");
      } else {
        alert("Failed to send tires: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending tires:", error);
      alert("Failed to send tires for retreading");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalCost = () => {
    const perTireCost = parseFloat(formData.expected_cost) || 0;
    return perTireCost * selectedTires.length;
  };

  const getSelectedSupplier = () => {
    return suppliers.find(s => s.id.toString() === formData.supplier_id);
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/retreads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Send Tires for Retreading</h1>
          <p className="text-muted-foreground">
            Send selected tires to retread supplier
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column - Selected Tires */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Tires</CardTitle>
                  <CardDescription>
                    {selectedTires.length} tires selected for retreading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTires.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No tires selected</h3>
                      <p className="text-muted-foreground mt-1">
                        Go back to select tires for retreading
                      </p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/retreads">
                          Select Tires
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serial #</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Brand & Model</TableHead>
                            <TableHead>Depth</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Installations</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTires.map((tire) => (
                            <TableRow key={tire.id}>
                              <TableCell className="font-mono font-medium">
                                {tire.serial_number}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{tire.size}</Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{tire.brand}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {tire.model}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-16 rounded-full bg-gray-200">
                                    <div
                                      className="h-full rounded-full bg-green-500"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          (tire.depth_remaining / tire.tread_depth_new) * 100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {tire.depth_remaining}mm
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {(tire.total_distance || 0).toLocaleString()} km
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{tire.installation_count}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Total tires: {selectedTires.length}
                  </div>
                </CardFooter>
              </Card>

              {/* Notes Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>
                    Add notes or special instructions for the retreader
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes / Instructions</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any special instructions or notes for the retreader..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Retread Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Retread Details</CardTitle>
                  <CardDescription>
                    Configure retreading parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Supplier Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Retread Supplier *</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => handleInputChange("supplier_id", value)}
                    >
                      <SelectTrigger id="supplier">
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
                    
                    {getSelectedSupplier() && (
                      <div className="text-sm text-muted-foreground p-2 border rounded-md bg-gray-50">
                        <div className="font-medium">{getSelectedSupplier()?.contact_person}</div>
                        <div>{getSelectedSupplier()?.phone}</div>
                        <div>{getSelectedSupplier()?.email}</div>
                        <div className="truncate">{getSelectedSupplier()?.address}</div>
                      </div>
                    )}
                  </div>

                  {/* Send Date */}
                  <div className="space-y-2">
                    <Label htmlFor="send_date">Send Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.send_date && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.send_date ? (
                            format(formData.send_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.send_date}
                          onSelect={(date) => date && handleInputChange("send_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Expected Cost */}
                  <div className="space-y-2">
                    <Label htmlFor="expected_cost">Expected Cost per Tire (KSH) *</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="expected_cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.expected_cost}
                        onChange={(e) => handleInputChange("expected_cost", e.target.value)}
                        placeholder="250.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Cost per tire:</span>
                          <span className="font-medium">
                            KSH {parseFloat(formData.expected_cost || "0").toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Number of tires:</span>
                          <span className="font-medium">{selectedTires.length}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-bold">
                            <span>Estimated Total:</span>
                            <span>KSH {calculateTotalCost().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Action Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {selectedTires.length > 0 && (
                      <div className="flex items-start gap-2 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-700">
                          <p className="font-medium">Important Notice</p>
                          <p className="mt-1">
                            Sending {selectedTires.length} tire{selectedTires.length > 1 ? 's' : ''} for retreading will:
                          </p>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>Change tire status to "AT_RETREAD_SUPPLIER"</li>
                            <li>Update supplier ledger</li>
                            <li>Create movement records</li>
                            <li>Tires will be unavailable until returned</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.back()}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={selectedTires.length === 0 || !formData.supplier_id || submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Send for Retreading
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}