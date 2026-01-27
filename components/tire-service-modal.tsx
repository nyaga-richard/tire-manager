"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  Plus, 
  Minus,
  Package,
  ChevronDown,
  ChevronUp,
  Grid,
  Replace,
  ArrowUpDown,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  type: "NEW" | "RETREAD" | "USED";
  status: string;
  current_position?: string;
}

interface VehiclePosition {
  id: number;
  position_code: string;
  position_name: string;
  axle_number: number;
  is_trailer: number;
}

interface TireInstallation {
  id: number;
  tire_id: number;
  position_code: string;
  position_name: string;
  serial_number: string;
  size: string;
  brand: string;
  type: string;
  install_date: string;
  install_odometer: number;
}

interface TireServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: number;
  vehicleNumber: string;
  currentTires: TireInstallation[];
  availablePositions: VehiclePosition[];
  onSuccess?: () => void;
}

type ServiceType = "bulk" | "remove";
type OperationType = "install" | "remove" | "swap";

interface InstallationItem {
  id: string;
  tireId: string;
  positionCode: string;
  serialNumber?: string;
  size?: string;
  brand?: string;
  type?: string;
}

interface RemovalItem {
  id: string;
  positionCode: string;
  tireId: number;
  serialNumber: string;
  size: string;
  brand: string;
}

interface SwapData {
  fromPosition: string;
  toPosition: string;
  fromTire?: TireInstallation;
  toTire?: TireInstallation;
}

interface TireSize {
  size: string;
  count: number;
}

export default function TireServiceModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleNumber,
  currentTires,
  availablePositions,
  onSuccess
}: TireServiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("bulk");
  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [tireSizes, setTireSizes] = useState<TireSize[]>([]);
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Operation type tab
  const [operationType, setOperationType] = useState<OperationType>("install");
  
  // Swap operation states
  const [swapData, setSwapData] = useState<SwapData>({
    fromPosition: "",
    toPosition: ""
  });
  
  // Bulk installation states
  const [installationItems, setInstallationItems] = useState<InstallationItem[]>([
    { id: "1", tireId: "", positionCode: "" }
  ]);
  
  // Bulk removal states
  const [selectedRemovals, setSelectedRemovals] = useState<Record<string, boolean>>({});
  const [showRemoveList, setShowRemoveList] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [loadingSizes, setLoadingSizes] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchAvailableTires();
      fetchCurrentOdometer();
      fetchTireSizes();
    }
  }, [isOpen]);

  useEffect(() => {
    // When swap from position changes, update the tire info
    if (swapData.fromPosition && operationType === "swap") {
      const fromTire = currentTires.find(t => t.position_code === swapData.fromPosition);
      setSwapData(prev => ({
        ...prev,
        fromTire
      }));
    }
  }, [swapData.fromPosition, currentTires, operationType]);

  useEffect(() => {
    // When swap to position changes, update the tire info
    if (swapData.toPosition && operationType === "swap") {
      const toTire = currentTires.find(t => t.position_code === swapData.toPosition);
      setSwapData(prev => ({
        ...prev,
        toTire
      }));
    }
  }, [swapData.toPosition, currentTires, operationType]);

  const resetForm = () => {
    setSwapData({
      fromPosition: "",
      toPosition: ""
    });
    setInstallationItems([{ id: "1", tireId: "", positionCode: "" }]);
    setSelectedRemovals({});
    setReason("");
    setNotes("");
    setOperationType("install");
    setServiceType("bulk");
    setSearchQuery("");
    setSelectedSize("all");
    setSearchInputs({});
  };

  const fetchAvailableTires = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tires/");
      if (response.ok) {
        const data = await response.json();
        setAvailableTires(data);
      }
    } catch (error) {
      console.error("Error fetching available tires:", error);
    }
  };

  const fetchTireSizes = async () => {
    try {
      setLoadingSizes(true);
      const response = await fetch("http://localhost:5000/api/inventory/by-size");
      if (response.ok) {
        const data = await response.json();
        // Assuming the API returns an array of objects with size and count properties
        setTireSizes(data);
      } else {
        // Fallback: extract unique sizes from available tires
        const sizes = new Set(availableTires.map(tire => tire.size));
        const sizeArray = Array.from(sizes).map(size => ({ size, count: 0 }));
        setTireSizes(sizeArray);
      }
    } catch (error) {
      console.error("Error fetching tire sizes:", error);
      // Fallback: extract unique sizes from available tires
      const sizes = new Set(availableTires.map(tire => tire.size));
      const sizeArray = Array.from(sizes).map(size => ({ size, count: 0 }));
      setTireSizes(sizeArray);
    } finally {
      setLoadingSizes(false);
    }
  };

  const fetchCurrentOdometer = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/vehicles/${vehicleId}/odometer`);
      if (response.ok) {
        const data = await response.json();
        setCurrentOdometer(data.current_odometer || 0);
      }
    } catch (error) {
      console.error("Error fetching odometer:", error);
    }
  };

  // Get positions that are available for installation
  const getAvailablePositions = useCallback(() => {
    const occupiedPositions = currentTires.map(t => t.position_code);
    return availablePositions.filter(pos => 
      !occupiedPositions.includes(pos.position_code)
    );
  }, [currentTires, availablePositions]);

  // Get positions that have tires installed (for removal and swap)
  const getOccupiedPositions = () => {
    return currentTires.map(tire => ({
      position_code: tire.position_code,
      position_name: tire.position_name,
      tire_id: tire.tire_id,
      serial_number: tire.serial_number,
      size: tire.size,
      brand: tire.brand,
      type: tire.type
    }));
  };

  // Get all positions for swap (both occupied and available)
  const getAllPositionsForSwap = () => {
    return availablePositions;
  };

  // Get unique tire sizes from the fetched data
  const getAvailableSizes = useMemo(() => {
    return tireSizes.map(item => item.size).sort();
  }, [tireSizes]);

  // Filter tires based on search query and selected size
  const getFilteredTires = useMemo(() => {
    let filtered = availableTires;
    
    // Apply size filter
    if (selectedSize !== "all") {
      filtered = filtered.filter(tire => tire.size === selectedSize);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tire => 
        tire.serial_number.toLowerCase().includes(query) ||
        tire.brand.toLowerCase().includes(query) ||
        tire.size.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [availableTires, selectedSize, searchQuery]);

  const addInstallationItem = () => {
    if (installationItems.length >= getAvailablePositions().length) {
      return; // Cannot add more items than available positions
    }
    const newId = Date.now().toString();
    setInstallationItems([
      ...installationItems,
      { id: newId, tireId: "", positionCode: "" }
    ]);
    setSearchInputs(prev => ({ ...prev, [newId]: "" }));
  };

  const removeInstallationItem = (id: string) => {
    if (installationItems.length > 1) {
      setInstallationItems(installationItems.filter(item => item.id !== id));
      setSearchInputs(prev => {
        const newSearchInputs = { ...prev };
        delete newSearchInputs[id];
        return newSearchInputs;
      });
    }
  };

  const updateInstallationItem = (id: string, field: keyof InstallationItem, value: string) => {
    setInstallationItems(
      installationItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSelectTire = (tireId: string, index: number) => {
    const selectedTire = availableTires.find(t => t.id.toString() === tireId);
    if (selectedTire) {
      const updatedItems = [...installationItems];
      updatedItems[index] = {
        ...updatedItems[index],
        tireId,
        serialNumber: selectedTire.serial_number,
        size: selectedTire.size,
        brand: selectedTire.brand,
        type: selectedTire.type
      };
      setInstallationItems(updatedItems);
      // Clear the search input for this item
      setSearchInputs(prev => ({ ...prev, [installationItems[index].id]: selectedTire.serial_number }));
    }
  };

  const handleSearchInputChange = (itemId: string, value: string) => {
    setSearchInputs(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSelectAllRemovals = (checked: boolean) => {
    const newSelections: Record<string, boolean> = {};
    currentTires.forEach(tire => {
      newSelections[tire.position_code] = checked;
    });
    setSelectedRemovals(newSelections);
  };

  const handleSwapPositions = () => {
    if (swapData.fromPosition && swapData.toPosition) {
      setSwapData({
        fromPosition: swapData.toPosition,
        toPosition: swapData.fromPosition,
        fromTire: swapData.toTire,
        toTire: swapData.fromTire
      });
    }
  };
 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Debug: Check what positions we have
      console.log("Available positions with IDs:", availablePositions);
      
      // Helper function to get position_id from position_code
      const getPositionId = (positionCode: string): number => {
        const position = availablePositions.find(p => p.position_code === positionCode);
        if (!position) {
          throw new Error(`Position code ${positionCode} not found in available positions`);
        }
        
        if (!position.id) {
          console.error("Position object missing id field:", position);
          throw new Error(`Position ${positionCode} is missing ID field.`);
        }
        
        return position.id;
      };

      if (operationType === "install") {
        const validItems = installationItems.filter(item => 
          item.tireId && item.positionCode
        );
        
        if (validItems.length === 0) {
          throw new Error("No valid installation items");
        }

        // Check for duplicate tire installations
        const tireIds = validItems.map(item => item.tireId);
        const uniqueTireIds = [...new Set(tireIds)];
        
        if (tireIds.length !== uniqueTireIds.length) {
          throw new Error("Cannot install the same tire in multiple positions. Each tire can only be installed in one position at a time.");
        }

        // Check for duplicate position selections
        const positionCodes = validItems.map(item => item.positionCode);
        const uniquePositionCodes = [...new Set(positionCodes)];
        
        if (positionCodes.length !== uniquePositionCodes.length) {
          throw new Error("Cannot install multiple tires in the same position. Each position can only have one tire.");
        }

        const installationPromises = validItems.map(async (item) => {
          try {
            const positionId = getPositionId(item.positionCode);
            
            const installPayload = {
              tire_id: parseInt(item.tireId),
              vehicle_id: vehicleId,
              position_id: positionId,
              install_date: new Date().toISOString().split('T')[0],
              install_odometer: currentOdometer,
              reason: reason || "Regular service",
              user_id: 1
            };

            console.log("Sending install payload:", installPayload);

            const response = await fetch(`http://localhost:5000/api/tires/install`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(installPayload),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error("Install error response:", errorData);
              
              // More specific error messages
              if (errorData.error && errorData.error.includes('Invalid wheel position')) {
                throw new Error(`Invalid position ${item.positionCode} for this vehicle. Please select a valid position.`);
              } else if (errorData.error && errorData.error.includes('not available')) {
                throw new Error(`Tire ${item.serialNumber} is not available for installation. It may already be installed elsewhere.`);
              } else {
                throw new Error(`Failed to install tire ${item.serialNumber}: ${errorData.error || errorData.message}`);
              }
            }

            return response.json();
          } catch (error) {
            console.error(`Error installing tire ${item.serialNumber}:`, error);
            throw error;
          }
        });

        await Promise.all(installationPromises);

      } else if (operationType === "remove") {
        const positionsToRemove = Object.keys(selectedRemovals).filter(
          position => selectedRemovals[position]
        );

        if (positionsToRemove.length === 0) {
          throw new Error("No tires selected for removal");
        }

        const removalPromises = positionsToRemove.map(async (positionCode) => {
          const tire = currentTires.find(t => t.position_code === positionCode);
          if (!tire) throw new Error(`No tire found at position ${positionCode}`);
          
          const removePayload = {
            assignment_id: tire.id,
            removal_date: new Date().toISOString().split('T')[0],
            removal_odometer: currentOdometer,
            user_id: 1,
            reason: reason || "Regular service",
            next_status: "USED_STORE"
          };

          console.log("Sending remove payload:", removePayload);

          const response = await fetch(`http://localhost:5000/api/tires/remove`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(removePayload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Remove error response:", errorData);
            throw new Error(`Failed to remove tire from ${positionCode}: ${errorData.error || errorData.message}`);
          }

          return response.json();
        });

        await Promise.all(removalPromises);

      } else if (operationType === "swap") {
        if (!swapData.fromPosition) {
          throw new Error("Please select a tire to swap from");
        }
        if (!swapData.toPosition) {
          throw new Error("Please select a position to swap to");
        }
        if (swapData.fromPosition === swapData.toPosition) {
          throw new Error("Cannot swap to the same position");
        }

        const fromTire = currentTires.find(t => t.position_code === swapData.fromPosition);
        if (!fromTire) throw new Error("No tire found at selected 'from' position");
        
        const toTire = currentTires.find(t => t.position_code === swapData.toPosition);
        
        // Get position IDs
        const fromPositionId = getPositionId(swapData.fromPosition);
        const toPositionId = getPositionId(swapData.toPosition);
        
        console.log("Swap details:", {
          fromTire,
          toTire,
          fromPositionId,
          toPositionId
        });
        
        const swapOperations = [];
        
        // Remove from position tire
        swapOperations.push(
          fetch(`http://localhost:5000/api/tires/remove`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assignment_id: fromTire.id,
              removal_date: new Date().toISOString().split('T')[0],
              removal_odometer: currentOdometer,
              user_id: 1,
              reason: reason || "Position swap",
              next_status: "IN_STORE"
            }),
          })
        );
        
        if (toTire) {
          swapOperations.push(
            fetch(`http://localhost:5000/api/tires/remove`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                assignment_id: toTire.id,
                removal_date: new Date().toISOString().split('T')[0],
                removal_odometer: currentOdometer,
                user_id: 1,
                reason: reason || "Position swap",
                next_status: "IN_STORE"
              }),
            })
          );
        }
        
        const removeResults = await Promise.all(swapOperations);
        
        for (const result of removeResults) {
          if (!result.ok) {
            const errorData = await result.json();
            throw new Error(`Swap failed during removal: ${errorData.error || errorData.message}`);
          }
        }
        
        const installOperations = [];
        
        // Install 'from' tire to 'to' position
        installOperations.push(
          fetch(`http://localhost:5000/api/tires/install`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tire_id: fromTire.tire_id,
              vehicle_id: vehicleId,
              position_id: toPositionId,
              install_date: new Date().toISOString().split('T')[0],
              install_odometer: currentOdometer,
              reason: reason || "Position swap",
              user_id: 1
            }),
          })
        );
        
        if (toTire) {
          installOperations.push(
            fetch(`http://localhost:5000/api/tires/install`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tire_id: toTire.tire_id,
                vehicle_id: vehicleId,
                position_id: fromPositionId,
                install_date: new Date().toISOString().split('T')[0],
                install_odometer: currentOdometer,
                reason: reason || "Position swap",
                user_id: 1
              }),
            })
          );
        }
        
        const installResults = await Promise.all(installOperations);
        
        for (const result of installResults) {
          if (!result.ok) {
            const errorData = await result.json();
            throw new Error(`Swap failed during installation: ${errorData.error || errorData.message}`);
          }
        }
      }

      if (onSuccess) onSuccess();
      onClose();
      resetForm();

    } catch (error) {
      console.error("Error performing tire service:", error);
      alert(error instanceof Error ? error.message : "Failed to perform service operation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const occupiedPositions = getOccupiedPositions();
  const availablePositionsForInstall = getAvailablePositions();
  const allPositionsForSwap = getAllPositionsForSwap();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Tire Service</h2>
            <p className="text-muted-foreground">
              Vehicle: <span className="font-semibold">{vehicleNumber}</span>
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

        <form onSubmit={handleSubmit} className="p-6">
          {/* Operation Type Tabs */}
          <div className="mb-6">
            <Tabs 
              value={operationType} 
              onValueChange={(value) => setOperationType(value as OperationType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="install">
                  <Package className="mr-2 h-4 w-4" />
                  Install
                </TabsTrigger>
                <TabsTrigger value="remove">
                  <Minus className="mr-2 h-4 w-4" />
                  Remove
                </TabsTrigger>
                <TabsTrigger value="swap">
                  <Replace className="mr-2 h-4 w-4" />
                  Swap
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Current Odometer */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="odometer">Current Odometer (km)</Label>
            <Input
              id="odometer"
              type="number"
              value={currentOdometer}
              onChange={(e) => setCurrentOdometer(parseInt(e.target.value) || 0)}
              required
              min="0"
            />
          </div>

          {/* Dynamic Form Based on Operation Type */}
          {operationType === "install" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <Label>Installation Items</Label>
                  <div className="flex flex-wrap gap-2">
                    {/* Size Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select 
                        value={selectedSize} 
                        onValueChange={setSelectedSize}
                        disabled={loadingSizes}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          {loadingSizes ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Loading...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Size" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sizes ({availableTires.length})</SelectItem>
                          {getAvailableSizes.map((size) => {
                            const sizeCount = tireSizes.find(s => s.size === size)?.count || 0;
                            return (
                              <SelectItem key={size} value={size}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{size}</span>
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {sizeCount}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tires..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 w-[200px]"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInstallationItem}
                      disabled={installationItems.length >= availablePositionsForInstall.length}
                      className="h-8"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add Another
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[250px] rounded-md border p-4">
                  {installationItems.map((item, index) => {
                    // Filter tires for this specific installation item based on its search input
                    const itemSearchQuery = searchInputs[item.id] || "";
                    const filteredTiresForItem = itemSearchQuery 
                      ? availableTires.filter(tire => 
                          tire.serial_number.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                          tire.brand.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                          tire.size.toLowerCase().includes(itemSearchQuery.toLowerCase())
                        )
                      : getFilteredTires;

                    return (
                      <div key={item.id} className="space-y-3 mb-4 last:mb-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Installation #{index + 1}</h4>
                          {installationItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInstallationItem(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`tire-${item.id}`} className="text-xs">
                              Tire
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between h-9"
                                >
                                  {item.serialNumber ? (
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="font-mono">{item.serialNumber}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {item.size}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">Select or search tire...</span>
                                  )}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0">
                                <Command>
                                  <CommandInput 
                                    placeholder="Search by serial, brand, or size..."
                                    value={searchInputs[item.id] || ""}
                                    onValueChange={(value) => handleSearchInputChange(item.id, value)}
                                  />
                                  <CommandEmpty>No tires found.</CommandEmpty>
                                  <CommandGroup className="max-h-[300px] overflow-auto">
                                    {filteredTiresForItem.map((tire) => (
                                      <CommandItem
                                        key={tire.id}
                                        value={tire.serial_number}
                                        onSelect={() => handleSelectTire(tire.id.toString(), index)}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex flex-col">
                                            <span className="font-mono font-medium">{tire.serial_number}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {tire.brand} • {tire.size}
                                            </span>
                                          </div>
                                          <Badge 
                                            variant={tire.type === "NEW" ? "default" : "secondary"}
                                            className="text-xs capitalize"
                                          >
                                            {tire.type.toLowerCase()}
                                          </Badge>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {item.serialNumber && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="capitalize">
                                  {item.type?.toLowerCase()}
                                </Badge>
                                <span>•</span>
                                <span>{item.brand}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`position-${item.id}`} className="text-xs">
                              Position
                            </Label>
                            <Select 
                              value={item.positionCode} 
                              onValueChange={(value) => updateInstallationItem(item.id, 'positionCode', value)}
                              required
                            >
                              <SelectTrigger id={`position-${item.id}`}>
                                <SelectValue placeholder="Select position" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePositionsForInstall.map((position) => (
                                  <SelectItem key={position.position_code} value={position.position_code}>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono text-xs">
                                        {position.position_code}
                                      </Badge>
                                      <span className="text-xs">{position.position_name}</span>
                                      {position.is_trailer === 1 && (
                                        <Badge variant="secondary" className="text-xs ml-auto">
                                          Trailer
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {index < installationItems.length - 1 && <Separator className="mt-2" />}
                      </div>
                    );
                  })}
                </ScrollArea>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">
                      {installationItems.filter(item => item.tireId && item.positionCode).length} of {installationItems.length} items complete
                    </div>
                    <div className="text-muted-foreground">
                      Showing {getFilteredTires.length} of {availableTires.length} available tires
                      {selectedSize !== "all" && ` • Filtered by size: ${selectedSize}`}
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {availablePositionsForInstall.length - installationItems.length} positions available
                  </div>
                </div>
              </div>
            </div>
          )}

          {operationType === "remove" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Select Tires to Remove</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllRemovals(true)}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllRemovals(false)}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[250px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {occupiedPositions.map((tire) => (
                      <div 
                        key={tire.position_code} 
                        className={`flex items-center justify-between p-3 rounded-md border ${
                          selectedRemovals[tire.position_code] 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!selectedRemovals[tire.position_code]}
                            onCheckedChange={(checked) => 
                              setSelectedRemovals({
                                ...selectedRemovals,
                                [tire.position_code]: !!checked
                              })
                            }
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {tire.position_code}
                              </Badge>
                              <span className="font-medium">{tire.position_name}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="font-mono">{tire.serial_number}</span>
                              <span>•</span>
                              <span>{tire.brand}</span>
                              <span>•</span>
                              <span>{tire.size}</span>
                              <span>•</span>
                              <Badge variant="outline" className="capitalize text-xs">
                                {tire.type.toLowerCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="text-sm text-muted-foreground">
                  {Object.values(selectedRemovals).filter(Boolean).length} of {occupiedPositions.length} tires selected for removal
                </div>
              </div>
            </div>
          )}

          {operationType === "swap" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Swap Tire Positions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSwapPositions}
                    disabled={!swapData.fromPosition || !swapData.toPosition}
                  >
                    <ArrowUpDown className="mr-2 h-3 w-3" />
                    Swap Directions
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* From Position */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-position">From Position</Label>
                      <Select 
                        value={swapData.fromPosition} 
                        onValueChange={(value) => setSwapData(prev => ({ ...prev, fromPosition: value }))}
                        required
                      >
                        <SelectTrigger id="from-position">
                          <SelectValue placeholder="Select tire to move" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupiedPositions.map((tire) => (
                            <SelectItem key={tire.position_code} value={tire.position_code}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">
                                    {tire.position_code}
                                  </Badge>
                                  <span className="font-mono text-sm">{tire.serial_number}</span>
                                </div>
                                <Badge variant="secondary" className="capitalize">
                                  {tire.type.toLowerCase()}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {swapData.fromTire && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Current Tire</h4>
                              <Badge variant="outline" className="font-mono text-xs">
                                {swapData.fromPosition}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{swapData.fromTire.serial_number}</span>
                                <Badge variant="secondary" className="capitalize">
                                  {swapData.fromTire.type.toLowerCase()}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground">
                                {swapData.fromTire.brand} • {swapData.fromTire.size}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Installed: {new Date(swapData.fromTire.install_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* To Position */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="to-position">To Position</Label>
                      <Select 
                        value={swapData.toPosition} 
                        onValueChange={(value) => setSwapData(prev => ({ ...prev, toPosition: value }))}
                        required
                      >
                        <SelectTrigger id="to-position">
                          <SelectValue placeholder="Select target position" />
                        </SelectTrigger>
                        <SelectContent>
                          {allPositionsForSwap
                            .filter(pos => pos.position_code !== swapData.fromPosition)
                            .map((position) => {
                              const existingTire = currentTires.find(t => t.position_code === position.position_code);
                              return (
                                <SelectItem key={position.position_code} value={position.position_code}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono">
                                        {position.position_code}
                                      </Badge>
                                      <span>{position.position_name}</span>
                                    </div>
                                    {existingTire ? (
                                      <Badge variant="secondary" className="text-xs">
                                        Has Tire
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs">
                                        Empty
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {swapData.toTire && (
                      <Card className="border-amber/20 bg-amber/5">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Target Tire</h4>
                              <Badge variant="outline" className="font-mono text-xs">
                                {swapData.toPosition}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{swapData.toTire.serial_number}</span>
                                <Badge variant="secondary" className="capitalize">
                                  {swapData.toTire.type.toLowerCase()}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground">
                                {swapData.toTire.brand} • {swapData.toTire.size}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Installed: {new Date(swapData.toTire.install_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {swapData.toPosition && !swapData.toTire && (
                      <Card className="border-green/20 bg-green/5">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">Target Position</h4>
                              <Badge variant="outline" className="font-mono text-xs">
                                {swapData.toPosition}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="text-green-600 font-medium">
                                <Package className="inline-block h-3 w-3 mr-1" />
                                Position is empty
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Tire will be moved to this empty position
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                
                {/* Swap Preview */}
                {(swapData.fromPosition && swapData.toPosition) && (
                  <Card className="mt-4 border border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className="font-mono">
                              {swapData.fromPosition}
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-1">From</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-4" />
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className="font-mono">
                              {swapData.toPosition}
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-1">To</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {swapData.toTire ? "Two tires will swap positions" : "One tire will be moved to empty position"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Tire List Preview */}
          {showRemoveList && (
            <div className="mt-6 p-4 border rounded-md">
              <h4 className="text-sm font-medium mb-3">Currently Installed Tires</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentTires.map((tire) => (
                  <div key={tire.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {tire.position_code}
                      </Badge>
                      <div className="flex flex-col">
                        <span className="text-sm font-mono">{tire.serial_number}</span>
                        <span className="text-xs text-muted-foreground">{tire.brand} • {tire.size}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {tire.type.toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
              {currentTires.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>No tires installed on this vehicle</p>
                </div>
              )}
            </div>
          )}

          {/* Reason and Notes */}
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Service</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular maintenance">Regular maintenance</SelectItem>
                  <SelectItem value="Tire wear">Tire wear</SelectItem>
                  <SelectItem value="Damage">Damage</SelectItem>
                  <SelectItem value="Puncture">Puncture</SelectItem>
                  <SelectItem value="Rotation schedule">Rotation schedule</SelectItem>
                  <SelectItem value="Position optimization">Position optimization</SelectItem>
                  <SelectItem value="Seasonal change">Seasonal change</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this service..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-muted/30 rounded-md">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  operationType === "install" ? "text-green-600" : 
                  operationType === "remove" ? "text-blue-600" : 
                  "text-amber-600"
                }`}>
                  {operationType === "install" ? availablePositionsForInstall.length :
                   operationType === "remove" ? occupiedPositions.length :
                   allPositionsForSwap.length}
                </div>
                <div className="text-muted-foreground">
                  {operationType === "install" ? "Positions Available" :
                   operationType === "remove" ? "Installed Tires" :
                   "Total Positions"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {operationType === "install" ? installationItems.filter(item => item.tireId && item.positionCode).length :
                   operationType === "remove" ? Object.values(selectedRemovals).filter(Boolean).length :
                   operationType === "swap" ? (swapData.fromPosition && swapData.toPosition ? 1 : 0) : 0}
                </div>
                <div className="text-muted-foreground">
                  {operationType === "swap" ? "Tires to Swap" : "Selected"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {operationType === "install" ? getFilteredTires.length : availableTires.length}
                </div>
                <div className="text-muted-foreground">
                  {operationType === "install" ? "Filtered Tires" : "Available Tires"}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t mt-6">
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
              disabled={loading || 
                (operationType === "install" && installationItems.filter(item => item.tireId && item.positionCode).length === 0) ||
                (operationType === "remove" && Object.values(selectedRemovals).filter(Boolean).length === 0) ||
                (operationType === "swap" && (!swapData.fromPosition || !swapData.toPosition))
              }
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {operationType === "install" ? "Install Tires" : 
                   operationType === "remove" ? "Remove Tires" : 
                   "Swap Positions"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}