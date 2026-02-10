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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  CheckCircle,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
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

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  type: "NEW";
  status: "AT_RETREAD_SUPPLIER";
  purchase_date: string;
  purchase_cost: number;
  current_location: string;
  supplier_id: number;
  supplier_name: string;
  depth_remaining: number;
}

export default function ReturnFromRetreadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tireIdsParam = searchParams.get("tires");

  const [tiresAtRetreader, setTiresAtRetreader] = useState<Tire[]>([]);
  const [selectedTires, setSelectedTires] = useState<number[]>([]);
  const [newSerialNumbers, setNewSerialNumbers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    return_date: new Date(),
    actual_cost: "",
    user_id: "1", // Get from auth context
    notes: "",
  });

  useEffect(() => {
    fetchTiresAtRetreader();
    if (tireIdsParam) {
      const ids = tireIdsParam.split(",").map(Number);
      setSelectedTires(ids);
    }
  }, [tireIdsParam]);

  const fetchTiresAtRetreader = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tires/retread/status?status=AT_RETREAD_SUPPLIER");
      const data = await response.json();
      if (data.success) {
        setTiresAtRetreader(data.data.filter((t: any) => t.status === "AT_RETREAD_SUPPLIER"));
      }
    } catch (error) {
      console.error("Error fetching tires at retreader:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewSerialChange = (tireId: number, serial: string) => {
    setNewSerialNumbers(prev => ({ ...prev, [tireId]: serial }));
  };

  const handleSelectTire = (tireId: number) => {
    setSelectedTires(prev =>
      prev.includes(tireId)
        ? prev.filter(id => id !== tireId)
        : [...prev, tireId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTires.length === tiresAtRetreader.length) {
      setSelectedTires([]);
    } else {
      setSelectedTires(tiresAtRetreader.map(t => t.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTires.length === 0) {
      alert("Please select at least one tire to return");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        tire_ids: selectedTires,
        return_date: format(formData.return_date, "yyyy-MM-dd"),
        actual_cost: parseFloat(formData.actual_cost) || 0,
        user_id: parseInt(formData.user_id),
        notes: formData.notes,
        new_serial_numbers: selectedTires.map(id => newSerialNumbers[id] || "")
      };

      const response = await fetch("http://localhost:5000/api/tires/retread/return-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully returned ${data.returned_tires.length} retreaded tires`);
        router.push("/retreads");
      } else {
        alert("Failed to return tires: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error returning tires:", error);
      alert("Failed to return tires from retreading");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalCost = () => {
    const perTireCost = parseFloat(formData.actual_cost) || 0;
    return perTireCost * selectedTires.length;
  };

  const getSelectedTires = () => {
    return tiresAtRetreader.filter(t => selectedTires.includes(t.id));
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
          <h1 className="text-3xl font-bold tracking-tight">Return from Retreading</h1>
          <p className="text-muted-foreground">
            Mark tires as returned from retread supplier
          </p>
        </div>
        <Button variant="outline" onClick={fetchTiresAtRetreader} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
            {/* Left Column - Tires at Retreader */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tires at Retreader</CardTitle>
                      <CardDescription>
                        Select tires to mark as returned
                      </CardDescription>
                    </div>
                    {selectedTires.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {selectedTires.length} selected
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tiresAtRetreader.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No tires at retreader</h3>
                      <p className="text-muted-foreground mt-1">
                        All tires have been returned or no tires are currently at retread suppliers
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedTires.length === tiresAtRetreader.length}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Serial #</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Brand & Model</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>New Serial #</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tiresAtRetreader.map((tire) => (
                            <TableRow key={tire.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedTires.includes(tire.id)}
                                  onCheckedChange={() => handleSelectTire(tire.id)}
                                />
                              </TableCell>
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
                                <div className="text-sm">{tire.supplier_name}</div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  placeholder="Optional new serial"
                                  value={newSerialNumbers[tire.id] || ""}
                                  onChange={(e) => handleNewSerialChange(tire.id, e.target.value)}
                                  className="w-32"
                                />
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
                    {tiresAtRetreader.length} tires at retreader
                  </div>
                </CardFooter>
              </Card>

              {/* Notes Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>
                    Add notes about the retreading process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes / Quality Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about the retreading quality, issues encountered, or other relevant information..."
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Return Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Return Details</CardTitle>
                  <CardDescription>
                    Configure return parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Return Date */}
                  <div className="space-y-2">
                    <Label htmlFor="return_date">Return Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.return_date && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.return_date ? (
                            format(formData.return_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.return_date}
                          onSelect={(date) => date && handleInputChange("return_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Actual Cost */}
                  <div className="space-y-2">
                    <Label htmlFor="actual_cost">Actual Cost per Tire (KSH) *</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="actual_cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.actual_cost}
                        onChange={(e) => handleInputChange("actual_cost", e.target.value)}
                        placeholder="250.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Return Summary */}
                  {selectedTires.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Tires to return:</span>
                            <span className="font-medium">{selectedTires.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Cost per tire:</span>
                            <span className="font-medium">
                              KSH {parseFloat(formData.actual_cost || "0").toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between font-bold">
                              <span>Total Cost:</span>
                              <span>KSH {calculateTotalCost().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Supplier Info */}
                  {getSelectedTires().length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Selected Tires by Supplier</h4>
                        <div className="space-y-2">
                          {Object.entries(
                            getSelectedTires().reduce((acc, tire) => {
                              acc[tire.supplier_name] = (acc[tire.supplier_name] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([supplier, count]) => (
                            <div key={supplier} className="flex justify-between text-sm">
                              <span>{supplier}</span>
                              <span className="font-medium">{count} tires</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Action Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {selectedTires.length > 0 && (
                      <div className="flex items-start gap-2 p-3 border border-blue-200 bg-blue-50 rounded-md">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium">Important Changes</p>
                          <p className="mt-1">
                            Returning {selectedTires.length} tire{selectedTires.length > 1 ? 's' : ''} will:
                          </p>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>Change tire type to "RETREADED"</li>
                            <li>Update status to "IN_STORE"</li>
                            <li>Update inventory catalog</li>
                            <li>Tires will be available for installation</li>
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
                        disabled={selectedTires.length === 0 || !formData.actual_cost || submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Returned
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