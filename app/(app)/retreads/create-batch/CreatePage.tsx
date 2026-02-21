"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowRight,
  Package,
  Calendar,
  AlertCircle,
  ChevronDown,
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Loader2,
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
import { toast } from "sonner";

// API Base URL - fix the trailing slash
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/";

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
  retread_count?: number;
}

interface Supplier {
  id: number;
  name: string;
  type: "RETREAD" | "TIRE";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  average_cost_per_tire?: number;
  total_orders?: number;
  total_tires_processed?: number;
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export default function CreateRetreadBatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState("tires");
  const [tires, setTires] = useState<Tire[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  
  // Selection state
  const [selectedTires, setSelectedTires] = useState<number[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierOpen, setSupplierOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  
  // Review tab state
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check for pre-selected tires from URL
  useEffect(() => {
    const tiresParam = searchParams.get("tires");
    if (tiresParam) {
      const tireIds = tiresParam.split(",").map(Number);
      setSelectedTires(tireIds);
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([fetchEligibleTires(), fetchSuppliers()]);
  }, []);

  const fetchEligibleTires = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tires/retread/eligible`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<Tire[]> = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Ensure all tires have required fields
        setTires(data.data.map((tire: any) => ({
          ...tire,
          total_distance: tire.total_distance || 0,
          installation_count: tire.installation_count || 0,
          retread_count: tire.retread_count || 0
        })));
      } else if (Array.isArray(data)) {
        // Handle direct array response
        setTires(data.map((tire: any) => ({
          ...tire,
          total_distance: tire.total_distance || 0,
          installation_count: tire.installation_count || 0,
          retread_count: tire.retread_count || 0
        })));
      } else {
        console.error("Unexpected API response structure:", data);
        setTires([]);
        toast.error(data.error || "Failed to fetch eligible tires");
      }
    } catch (error) {
      console.error("Error fetching tires:", error);
      toast.error("Failed to fetch tires");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different API response structures
      let suppliersData: Supplier[] = [];
      
      if (data.success && Array.isArray(data.data)) {
        suppliersData = data.data;
      } else if (Array.isArray(data)) {
        suppliersData = data;
      } else if (data.data && Array.isArray(data.data)) {
        suppliersData = data.data;
      } else {
        console.error("Unexpected API response structure:", data);
        toast.error("Failed to parse suppliers data");
        setSuppliers([]);
        return;
      }
      
      // Filter to only show RETREAD type suppliers for retread orders
      const retreadSuppliers = suppliersData.filter(
        supplier => supplier.type === "TIRE"
      );
      
      setSuppliers(retreadSuppliers);
      
      // Auto-select first supplier if available and no supplier selected
      if (retreadSuppliers.length > 0 && !selectedSupplier) {
        setSelectedSupplier(retreadSuppliers[0]);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers");
      setSuppliers([]);
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

  const handleNext = async () => {
    if (selectedTires.length === 0) {
        toast.error("Please select at least one tire");
        return;
    }

    if (!selectedSupplier) {
        toast.error("Please select a retread supplier");
        return;
    }

    if (activeTab === "review") {
        // Create the retread order
        try {
            setSubmitting(true);
            
            // Validate expected date
            if (expectedDate && new Date(expectedDate) < new Date()) {
                toast.error("Expected completion date must be in the future");
                setSubmitting(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/retread/retread-orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    supplier_id: selectedSupplier.id,
                    tire_ids: selectedTires,
                    expected_completion_date: expectedDate || undefined,
                    notes: notes || undefined,
                    user_id: 1, // Get from auth context
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Show success message with order number
                toast.success(
                    <div>
                        <strong>Retread order created successfully!</strong>
                        <br />
                        Order Number: <span className="font-mono font-bold">{data.data.order_number}</span>
                    </div>,
                    {
                        duration: 6000,
                        action: {
                            label: "View Order",
                            onClick: () => router.push(`/retreads/${data.data.id}?order_number=${data.data.order_number}`)
                        }
                    }
                );
                
                // Short delay to show the toast before redirecting
                setTimeout(() => {
                    router.push(`/retreads/${data.data.id}?order_number=${data.data.order_number}`);
                }, 1500);
            } else {
                toast.error(data.error || data.message || "Error creating retread order");
            }
        } catch (error) {
            console.error("Error creating retread order:", error);
            toast.error("Failed to create retread order");
        } finally {
            setSubmitting(false);
        }
    } else {
        // Move to next tab
        if (activeTab === "tires") {
            setActiveTab("supplier");
        } else if (activeTab === "supplier") {
            setActiveTab("review");
        }
    }
};

  const handleBack = () => {
    router.push('/retreads');
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name);
    setSupplierOpen(false);
  };

  const handleClearSupplier = () => {
    setSelectedSupplier(null);
    setSupplierSearch("");
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get unique sizes from tires
  const uniqueSizes = useMemo(() => 
    Array.from(new Set(tires.map(t => t.size))).sort(),
    [tires]
  );

  // Filter tires based on search and size filter
  const filteredTires = useMemo(() => 
    tires.filter(tire => {
      const matchesSearch = 
        tire.serial_number.toLowerCase().includes(search.toLowerCase()) ||
        tire.brand.toLowerCase().includes(search.toLowerCase()) ||
        tire.model?.toLowerCase().includes(search.toLowerCase()) ||
        tire.size.toLowerCase().includes(search.toLowerCase());
      
      const matchesSize = sizeFilter === "all" || tire.size === sizeFilter;
      
      return matchesSearch && matchesSize;
    }),
    [tires, search, sizeFilter]
  );

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    
    const searchTerm = supplierSearch.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm) ||
      supplier.phone?.toLowerCase().includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm)
    );
  }, [suppliers, supplierSearch]);

  // Calculate selected tires summary
  const selectedTiresData = useMemo(() => 
    tires.filter(t => selectedTires.includes(t.id)),
    [tires, selectedTires]
  );

  const summaryStats = useMemo(() => ({
    totalTires: selectedTires.length,
    uniqueSizes: new Set(selectedTiresData.map(t => t.size)).size,
    uniqueBrands: new Set(selectedTiresData.map(t => t.brand)).size,
    totalRetreadCount: selectedTiresData.reduce((sum, t) => sum + (t.retread_count || 0), 0),
    avgDepth: selectedTiresData.reduce((sum, t) => sum + t.depth_remaining, 0) / (selectedTires.length || 1),
  }), [selectedTiresData, selectedTires.length]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleBack}
          className="cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Retread Order</h1>
          <p className="text-muted-foreground">
            Select tires and configure retreading parameters
          </p>
        </div>
        {selectedTires.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedTires.length} tire{selectedTires.length !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={handleNext} disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {activeTab === "review" ? "Create Order" : "Continue"}
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="tires" disabled={initializing}>
            <Package className="mr-2 h-4 w-4" />
            Select Tires
          </TabsTrigger>
          <TabsTrigger value="supplier" disabled={selectedTires.length === 0 || initializing}>
            <Building className="mr-2 h-4 w-4" />
            Choose Supplier
          </TabsTrigger>
          <TabsTrigger value="review" disabled={selectedTires.length === 0 || !selectedSupplier || initializing}>
            <Calendar className="mr-2 h-4 w-4" />
            Review & Create
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
              {filteredTires.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No tires found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search ? "Try a different search term" : "No eligible tires available"}
                  </p>
                  {!search && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/inventory')}
                    >
                      View Inventory
                    </Button>
                  )}
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
                              {tire.model && (
                                <div className="text-sm text-muted-foreground">
                                  {tire.model}
                                </div>
                              )}
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
                              {tire.retread_count || 0}
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
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-4">Supplier Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">{selectedSupplier.name}</div>
                            {selectedSupplier.contact_person && (
                              <div className="text-sm text-muted-foreground">
                                {selectedSupplier.contact_person}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedSupplier.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <div className="text-sm">{selectedSupplier.phone}</div>
                            </div>
                          )}
                          
                          {selectedSupplier.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <div className="text-sm truncate">{selectedSupplier.email}</div>
                            </div>
                          )}
                        </div>
                        
                        {selectedSupplier.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-sm">{selectedSupplier.address}</div>
                          </div>
                        )}
                        
                        {selectedSupplier.average_cost_per_tire && (
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Average Cost per Tire:</span>
                              <span className="font-medium">
                                {formatCurrency(selectedSupplier.average_cost_per_tire)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">Selected Tires Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Tires:</span>
                        <span className="font-medium">{summaryStats.totalTires}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unique Sizes:</span>
                        <span className="font-medium">{summaryStats.uniqueSizes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unique Brands:</span>
                        <span className="font-medium">{summaryStats.uniqueBrands}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Previous Retreads:</span>
                        <span className="font-medium">{summaryStats.totalRetreadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Depth:</span>
                        <span className="font-medium">{summaryStats.avgDepth.toFixed(1)}mm</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedSupplier?.average_cost_per_tire && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-2">Estimated Cost</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Cost per Tire:</span>
                          <span className="font-medium">{formatCurrency(selectedSupplier.average_cost_per_tire)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Total Estimated Cost:</span>
                          <span className="font-bold text-lg">
                            {formatCurrency(selectedSupplier.average_cost_per_tire * selectedTires.length)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Create Order</CardTitle>
              <CardDescription>
                Review your selection before creating the retread order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-2 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Ready to Create</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      You are about to create a retread order for {selectedTires.length} tire
                      {selectedTires.length !== 1 ? 's' : ''} with {selectedSupplier?.name}. 
                      This will mark the tires as awaiting retreading.
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
                          <span className="font-medium">{summaryStats.totalTires}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unique Sizes:</span>
                          <span className="font-medium">{summaryStats.uniqueSizes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unique Brands:</span>
                          <span className="font-medium">{summaryStats.uniqueBrands}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Depth:</span>
                          <span className="font-medium">{summaryStats.avgDepth.toFixed(1)}mm</span>
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
                        {selectedSupplier?.contact_person && (
                          <div>Contact: {selectedSupplier.contact_person}</div>
                        )}
                        {selectedSupplier?.phone && (
                          <div>Phone: {selectedSupplier.phone}</div>
                        )}
                        {selectedSupplier?.average_cost_per_tire && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex justify-between">
                              <span>Avg. Cost per Tire:</span>
                              <span className="font-medium">
                                {formatCurrency(selectedSupplier.average_cost_per_tire)}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold mt-1">
                              <span>Total Estimated:</span>
                              <span>
                                {formatCurrency(selectedSupplier.average_cost_per_tire * selectedTires.length)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expected-date">
                      Expected Completion Date <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="expected-date"
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty if not specified
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">
                      Notes <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="notes"
                      placeholder="Add any additional notes or instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("supplier")}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Create Retread Order
                      </>
                    )}
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