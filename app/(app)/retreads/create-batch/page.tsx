"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Filter,
  ArrowRight,
  Package,
  Users,
  Calendar,
  AlertCircle,
  ChevronDown,
  X,
  Building,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  status: "USED_STORE" | "AWAITING_RETREAD";
  depth_remaining: number;
  tread_depth_new: number;
  installation_count: number;
  total_distance: number;
  previous_retread_count?: number;
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

export default function CreateRetreadBatchPage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("tires");
  const [tires, setTires] = useState<Tire[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedTires, setSelectedTires] = useState<number[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierOpen, setSupplierOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");

  useEffect(() => {
    fetchEligibleTires();
    fetchSuppliers();
  }, []);

  const fetchEligibleTires = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tires/retread/eligible");
      const data = await response.json();
      if (data.success) {
        // Ensure all tires have required fields
        setTires(data.data.map((tire: any) => ({
          ...tire,
          total_distance: tire.total_distance || 0,
          installation_count: tire.installation_count || 0,
          previous_retread_count: tire.previous_retread_count || 0
        })));
      }
    } catch (error) {
      console.error("Error fetching tires:", error);
    } finally {
      setLoading(false);
    }
  };
    const fetchSuppliers = async () => {
    try {
        const response = await fetch("http://localhost:5000/api/suppliers");
        const data: Supplier[] = await response.json(); // raw array from API

        if (Array.isArray(data) && data.length > 0) {
        setSuppliers(data);
        setSelectedSupplier(data[0]); // auto-select first supplier
        } else {
        console.warn("No suppliers found", data);
        setSuppliers([]);
        setSelectedSupplier(null);
        }
    } catch (error) {
        console.error("Error fetching suppliers:", error);
    }
    };


  const handleSelectTire = (tireId: number) => {
    setSelectedTires(prev =>
      prev.includes(tireId)
        ? prev.filter(id => id !== tireId)
        : [...prev, tireId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTires.length === filteredTires.length) {
      setSelectedTires([]);
    } else {
      setSelectedTires(filteredTires.map(t => t.id));
    }
  };

  const handleNext = () => {
    if (selectedTires.length === 0) {
      alert("Please select at least one tire");
      return;
    }

    if (!selectedSupplier) {
      alert("Please select a retread supplier");
      return;
    }

    router.push(`/retreads/send?tires=${selectedTires.join(",")}&supplier=${selectedSupplier.id}`);
  };

  const formatDistance = (distance?: number) => {
    if (!distance && distance !== 0) return "N/A";
    return distance.toLocaleString() + " km";
  };

  const formatCurrency = (amount?: number) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
    }).format(amount);
  };

  // Get unique sizes from tires
  const uniqueSizes = Array.from(new Set(tires.map(t => t.size)));

  // Filter tires based on search and size filter
  const filteredTires = tires.filter(tire => {
    const matchesSearch = 
      tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      tire.brand.toLowerCase().includes(search.toLowerCase()) ||
      tire.size.toLowerCase().includes(search.toLowerCase());
    
    const matchesSize = sizeFilter === "all" || tire.size === sizeFilter;
    
    return matchesSearch && matchesSize;
  });

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    
    const searchTerm = supplierSearch.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.contact_person.toLowerCase().includes(searchTerm) ||
      supplier.phone.toLowerCase().includes(searchTerm) ||
      supplier.email.toLowerCase().includes(searchTerm)
    );
  }, [suppliers, supplierSearch]);

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name);
    setSupplierOpen(false);
  };

  const handleClearSupplier = () => {
    setSelectedSupplier(null);
    setSupplierSearch("");
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Retread Batch</h1>
          <p className="text-muted-foreground">
            Select tires and configure retreading parameters
          </p>
        </div>
        {selectedTires.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedTires.length} tires selected
            </span>
            <Button onClick={handleNext}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tires">
            <Package className="mr-2 h-4 w-4" />
            Select Tires
          </TabsTrigger>
          <TabsTrigger value="supplier" disabled={selectedTires.length === 0}>
            <Users className="mr-2 h-4 w-4" />
            Choose Supplier
          </TabsTrigger>
          <TabsTrigger value="review" disabled={selectedTires.length === 0 || !selectedSupplier}>
            <Calendar className="mr-2 h-4 w-4" />
            Review & Send
          </TabsTrigger>
        </TabsList>

        {/* Select Tires Tab */}
        <TabsContent value="tires">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Tires for Retreading</CardTitle>
                  <CardDescription>
                    Choose tires from USED_STORE status to send for retreading
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search tires..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={sizeFilter} onValueChange={setSizeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      {uniqueSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading tires...</p>
                  </div>
                </div>
              ) : filteredTires.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No tires found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search ? "Try a different search term" : "No eligible tires available"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTires.length === filteredTires.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Serial #</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Brand & Model</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Depth</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Installations</TableHead>
                        <TableHead>Prev Retreads</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTires.map((tire) => (
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
                            <Badge variant="outline" className={
                              tire.status === "USED_STORE"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-orange-100 text-orange-800 border-orange-200"
                            }>
                              {tire.status.replace("_", " ")}
                            </Badge>
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
                          <TableCell>{formatDistance(tire.total_distance)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tire.installation_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tire.previous_retread_count}
                            </Badge>
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
                Showing {filteredTires.length} of {tires.length} eligible tires
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Choose Supplier Tab */}
        <TabsContent value="supplier">
          <Card>
            <CardHeader>
              <CardTitle>Choose Retread Supplier</CardTitle>
              <CardDescription>
                Select a supplier for the retreading job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="supplier-search">Search Supplier *</Label>
                  <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={supplierOpen}
                        className="w-full justify-between"
                      >
                        {selectedSupplier ? (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>{selectedSupplier.name}</span>
                          </div>
                        ) : (
                          "Select supplier..."
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search suppliers..."
                          value={supplierSearch}
                          onValueChange={setSupplierSearch}
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No suppliers found.</CommandEmpty>
                          <CommandGroup>
                            {filteredSuppliers.map((supplier) => (
                              <CommandItem
                                key={supplier.id}
                                value={supplier.name}
                                onSelect={() => handleSupplierSelect(supplier)}
                              >
                                <div className="flex flex-col">
                                  <div className="font-medium">{supplier.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {supplier.contact_person} • {supplier.phone}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {selectedSupplier && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-muted-foreground">
                        Selected: <span className="font-medium">{selectedSupplier.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSupplier}
                        className="h-6 px-2"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                {selectedSupplier && (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-4">Supplier Details</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="font-medium">{selectedSupplier.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {selectedSupplier.contact_person}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <div className="text-sm">{selectedSupplier.phone}</div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <div className="text-sm truncate">{selectedSupplier.email}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm">{selectedSupplier.address}</div>
                          </div>
                          
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Average Retread Cost:</span>
                              <span className="font-medium">
                                {formatCurrency(selectedSupplier.average_retread_cost)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Cost Estimate</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Average cost per tire:</span>
                            <span className="font-medium">
                              {formatCurrency(selectedSupplier.average_retread_cost)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Number of tires:</span>
                            <span className="font-medium">{selectedTires.length}</span>
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between font-bold">
                              <span>Estimated Total:</span>
                              <span>
                                {formatCurrency((selectedSupplier.average_retread_cost || 0) * selectedTires.length)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">Selected Tires Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Tires:</span>
                        <span className="font-medium">{selectedTires.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unique Sizes:</span>
                        <span className="font-medium">
                          {Array.from(new Set(
                            tires.filter(t => selectedTires.includes(t.id)).map(t => t.size)
                          )).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unique Brands:</span>
                        <span className="font-medium">
                          {Array.from(new Set(
                            tires.filter(t => selectedTires.includes(t.id)).map(t => t.brand)
                          )).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Send</CardTitle>
              <CardDescription>
                Review your selection before sending for retreading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-2 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Ready to Send</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You are about to send {selectedTires.length} tires for retreading to {
                        selectedSupplier?.name
                      }. This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tire Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Tires:</span>
                          <span className="font-medium">{selectedTires.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Cost:</span>
                          <span className="font-medium">
                            {formatCurrency((selectedSupplier?.average_retread_cost || 0) * selectedTires.length)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Supplier Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{selectedSupplier?.name}</div>
                        <div>Contact: {selectedSupplier?.contact_person}</div>
                        <div>Phone: {selectedSupplier?.phone}</div>
                        <div>Avg. Cost: {formatCurrency(selectedSupplier?.average_retread_cost)}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("supplier")}
                  >
                    Back
                  </Button>
                  <Button onClick={handleNext}>
                    Continue to Send Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}