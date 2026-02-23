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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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
  Building,
  ChevronDown,
  Info,
  Truck,
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
  status: "AT_RETREAD_SUPPLIER";
  purchase_date: string;
  purchase_cost: number;
  current_location: string;
  supplier_id: number;
  supplier_name: string;
  depth_remaining: number;
}

// Mobile Tire Card Component
const MobileTireCard = ({
  tire,
  selected,
  onSelect,
  newSerialNumber,
  onNewSerialChange,
}: {
  tire: Tire;
  selected: boolean;
  onSelect: (id: number) => void;
  newSerialNumber: string;
  onNewSerialChange: (id: number, value: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mb-3 last:mb-0">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(tire.id)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono font-medium text-sm">
                  {tire.serial_number}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {tire.size}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">{tire.brand}</span>
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

            {/* Supplier */}
            <div className="mt-2 flex items-center gap-1 text-sm">
              <Building className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{tire.supplier_name}</span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Model:</span>
            <span>{tire.model || "N/A"}</span>
          </div>
        </div>

        {/* New Serial Input */}
        {selected && (
          <div className="mt-3">
            <Label className="text-xs">New Serial Number (Optional)</Label>
            <Input
              type="text"
              placeholder="Enter new serial..."
              value={newSerialNumber}
              onChange={(e) => onNewSerialChange(tire.id, e.target.value)}
              className="mt-1 h-8"
            />
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-2 border-t pt-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Purchase Date:</span>
              <span className="text-sm">{new Date(tire.purchase_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Purchase Cost:</span>
              <span className="text-sm">KSH {tire.purchase_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Depth:</span>
              <span className="text-sm">{tire.depth_remaining}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Location:</span>
              <span className="text-sm">{tire.current_location}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mobile Supplier Summary Card
const MobileSupplierSummary = ({ selectedTires }: { selectedTires: Tire[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const supplierCounts = selectedTires.reduce((acc, tire) => {
    acc[tire.supplier_name] = (acc[tire.supplier_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Selected Tires by Supplier</h3>
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

        <div className="mt-2 space-y-1">
          {Object.entries(supplierCounts).slice(0, isExpanded ? undefined : 2).map(([supplier, count]) => (
            <div key={supplier} className="flex justify-between text-sm">
              <span className="truncate flex-1">{supplier}</span>
              <span className="font-medium ml-2">{count} tire{count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>

        {!isExpanded && Object.keys(supplierCounts).length > 2 && (
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="h-auto p-0 mt-2"
          >
            Show {Object.keys(supplierCounts).length - 2} more
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default function ReturnFromRetreadingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tireIdsParam = searchParams.get("tires");

  const [tiresAtRetreader, setTiresAtRetreader] = useState<Tire[]>([]);
  const [selectedTires, setSelectedTires] = useState<number[]>([]);
  const [newSerialNumbers, setNewSerialNumbers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mobile state
  const [isNoticeSheetOpen, setIsNoticeSheetOpen] = useState(false);

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
      const response = await fetch(`${API_BASE_URL}/api/tires/retread/status?status=AT_RETREAD_SUPPLIER`);
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

      const response = await fetch(`${API_BASE_URL}/api/tires/retread/return-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
    <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link href="/retreads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
              Return from Retreading
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              Mark tires as returned from retread supplier
            </p>
          </div>
        </div>
        
        {/* Desktop Refresh Button */}
        <div className="hidden sm:block">
          <Button variant="outline" onClick={fetchTiresAtRetreader} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Mobile Refresh Button */}
      <div className="sm:hidden">
        <Button 
          variant="outline" 
          onClick={fetchTiresAtRetreader} 
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh List
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Tires at Retreader */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mobile Selection Count */}
              <div className="sm:hidden">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tires at Retreader</span>
                      {selectedTires.length > 0 && (
                        <Badge variant="outline" className="bg-primary/10">
                          {selectedTires.length} selected
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Tires at Retreader</CardTitle>
                      <CardDescription>
                        Select tires to mark as returned
                      </CardDescription>
                    </div>
                    {/* Desktop Selection Count */}
                    <div className="hidden sm:block">
                      {selectedTires.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {selectedTires.length} selected
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tiresAtRetreader.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No tires at retreader</h3>
                      <p className="text-muted-foreground mt-1">
                        All tires have been returned or no tires are currently at retread suppliers
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden sm:block rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedTires.length === tiresAtRetreader.length}
                                  onCheckedChange={handleSelectAll}
                                />
                              </TableHead>
                              <TableHead className="whitespace-nowrap">Serial #</TableHead>
                              <TableHead className="whitespace-nowrap">Size</TableHead>
                              <TableHead className="whitespace-nowrap">Brand & Model</TableHead>
                              <TableHead className="whitespace-nowrap">Supplier</TableHead>
                              <TableHead className="whitespace-nowrap">New Serial #</TableHead>
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
                                <TableCell className="font-mono font-medium whitespace-nowrap">
                                  {tire.serial_number}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Badge variant="outline">{tire.size}</Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div>
                                    <div className="font-medium">{tire.brand}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {tire.model}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="text-sm">{tire.supplier_name}</div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Input
                                    type="text"
                                    placeholder="Optional"
                                    value={newSerialNumbers[tire.id] || ""}
                                    onChange={(e) => handleNewSerialChange(tire.id, e.target.value)}
                                    className="w-32 h-8"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Tire Cards */}
                      <div className="sm:hidden space-y-3">
                        {tiresAtRetreader.map((tire) => (
                          <MobileTireCard
                            key={tire.id}
                            tire={tire}
                            selected={selectedTires.includes(tire.id)}
                            onSelect={handleSelectTire}
                            newSerialNumber={newSerialNumbers[tire.id] || ""}
                            onNewSerialChange={handleNewSerialChange}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="border-t px-4 sm:px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    {tiresAtRetreader.length} tire{tiresAtRetreader.length !== 1 ? 's' : ''} at retreader
                  </div>
                </CardFooter>
              </Card>

              {/* Notes Card - Desktop */}
              <Card className="hidden sm:block">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Additional Information</CardTitle>
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
              {/* Mobile Notice Button */}
              {selectedTires.length > 0 && (
                <div className="sm:hidden">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setIsNoticeSheetOpen(true)}
                  >
                    <span className="flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      Important Changes
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Mobile Notice Sheet */}
              <Sheet open={isNoticeSheetOpen} onOpenChange={setIsNoticeSheetOpen}>
                <SheetContent side="bottom" className="h-auto rounded-t-xl">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      Important Changes
                    </SheetTitle>
                    <SheetDescription>
                      What happens when you return tires
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        Returning {selectedTires.length} tire{selectedTires.length > 1 ? 's' : ''} will:
                      </p>
                      <ul className="space-y-2 text-sm text-blue-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Change tire type to "RETREADED"</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Update status to "IN_STORE"</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Update inventory catalog</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>Tires will be available for installation</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Return Details</CardTitle>
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
                          <Calendar className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {formData.return_date ? (
                              format(formData.return_date, "PPP")
                            ) : (
                              "Pick a date"
                            )}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        id="actual_cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.actual_cost}
                        onChange={(e) => handleInputChange("actual_cost", e.target.value)}
                        placeholder="250.00"
                        required
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Return Summary */}
                  {selectedTires.length > 0 && (
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tires to return:</span>
                            <span className="font-medium">{selectedTires.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cost per tire:</span>
                            <span className="font-medium">
                              KSH {parseFloat(formData.actual_cost || "0").toFixed(2)}
                            </span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold">
                            <span>Total Cost:</span>
                            <span className="text-primary">KSH {calculateTotalCost().toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Supplier Info - Desktop */}
                  <div className="hidden sm:block">
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
                                <span className="truncate flex-1">{supplier}</span>
                                <span className="font-medium ml-2">{count} tire{count !== 1 ? 's' : ''}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Mobile Notes */}
                  <div className="sm:hidden space-y-2">
                    <Label htmlFor="mobile-notes">Notes / Quality Notes</Label>
                    <Textarea
                      id="mobile-notes"
                      placeholder="Add notes about retreading quality..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Supplier Summary */}
              <div className="sm:hidden">
                {getSelectedTires().length > 0 && (
                  <MobileSupplierSummary selectedTires={getSelectedTires()} />
                )}
              </div>

              {/* Desktop Notice Card */}
              {selectedTires.length > 0 && (
                <Card className="hidden sm:block">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2 p-3 border border-blue-200 bg-blue-50 rounded-md">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
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
                  </CardContent>
                </Card>
              )}

              {/* Action Card */}
              <Card>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 order-2 sm:order-1"
                        onClick={() => router.back()}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 order-1 sm:order-2"
                        disabled={selectedTires.length === 0 || !formData.actual_cost || submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Truck className="mr-2 h-4 w-4" />
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