"use client";

import { useState, useEffect, useCallback } from "react";
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
  ArrowUpDown
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

type ServiceType = "single" | "bulk" | "remove";
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
  const [serviceType, setServiceType] = useState<ServiceType>("single");
  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Operation type tab
  const [operationType, setOperationType] = useState<OperationType>("install");
  
  // Single operation states
  const [singleSelectedTire, setSingleSelectedTire] = useState<string>("");
  const [singleSelectedPosition, setSingleSelectedPosition] = useState<string>("");
  
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchAvailableTires();
      fetchCurrentOdometer();
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
    setSingleSelectedTire("");
    setSingleSelectedPosition("");
    setSwapData({
      fromPosition: "",
      toPosition: ""
    });
    setInstallationItems([{ id: "1", tireId: "", positionCode: "" }]);
    setSelectedRemovals({});
    setReason("");
    setNotes("");
    setOperationType("install");
    setServiceType("single");
  };

  const fetchAvailableTires = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tires/available");
      if (response.ok) {
        const data = await response.json();
        setAvailableTires(data);
      }
    } catch (error) {
      console.error("Error fetching available tires:", error);
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

  const addInstallationItem = () => {
    if (installationItems.length >= getAvailablePositions().length) {
      return; // Cannot add more items than available positions
    }
    setInstallationItems([
      ...installationItems,
      { id: Date.now().toString(), tireId: "", positionCode: "" }
    ]);
  };

  const removeInstallationItem = (id: string) => {
    if (installationItems.length > 1) {
      setInstallationItems(installationItems.filter(item => item.id !== id));
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
    }
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
      let endpoint = "";
      let payload: any = {
        vehicle_id: vehicleId,
        current_odometer: currentOdometer,
        reason: reason || "Regular service",
        notes: notes,
        performed_by: "user",
        operation_type: serviceType
      };

      if (operationType === "install") {
        if (serviceType === "single") {
          endpoint = "install";
          payload = {
            ...payload,
            tire_id: parseInt(singleSelectedTire),
            position_code: singleSelectedPosition,
            operation_type: "single_install"
          };
        } else if (serviceType === "bulk") {
          endpoint = "install/bulk";
          const validItems = installationItems.filter(item => 
            item.tireId && item.positionCode
          );
          
          if (validItems.length === 0) {
            throw new Error("No valid installation items");
          }

          payload = {
            ...payload,
            installations: validItems.map(item => ({
              tire_id: parseInt(item.tireId),
              position_code: item.positionCode
            })),
            operation_type: "bulk_install"
          };
        }
      } else if (operationType === "remove") {
        const positionsToRemove = Object.keys(selectedRemovals).filter(
          position => selectedRemovals[position]
        );

        if (positionsToRemove.length === 0) {
          throw new Error("No tires selected for removal");
        }

        if (serviceType === "single") {
          // Single removal - find the position from selected removals
          const positionToRemove = positionsToRemove[0];
          const tireToRemove = currentTires.find(t => t.position_code === positionToRemove);
          if (!tireToRemove) throw new Error("No tire found at selected position");
          
          endpoint = "remove";
          payload = {
            ...payload,
            installation_id: tireToRemove.id,
            operation_type: "single_remove"
          };
        } else if (serviceType === "bulk") {
          endpoint = "remove/bulk";
          const installationsToRemove = positionsToRemove.map(position => {
            const tire = currentTires.find(t => t.position_code === position);
            if (!tire) throw new Error(`No tire found at position ${position}`);
            return tire.id;
          });

          payload = {
            ...payload,
            installation_ids: installationsToRemove,
            operation_type: "bulk_remove"
          };
        }
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

        endpoint = "swap";
        const fromTire = currentTires.find(t => t.position_code === swapData.fromPosition);
        if (!fromTire) throw new Error("No tire found at selected 'from' position");
        
        const toTire = currentTires.find(t => t.position_code === swapData.toPosition);
        
        payload = {
          ...payload,
          from_installation_id: fromTire.id,
          to_position_code: swapData.toPosition,
          ...(toTire && { to_installation_id: toTire.id }),
          operation_type: "swap"
        };
      }

      const response = await fetch(`http://localhost:5000/api/tire-service/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Service operation failed");
      }

      // Success
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

          {/* Service Type Selection - Only show for install/remove */}
          {(operationType === "install" || operationType === "remove") && (
            <div className="space-y-3 mb-6">
              <Label>Service Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={serviceType === "single" ? "default" : "outline"}
                  onClick={() => setServiceType("single")}
                  className="h-10"
                >
                  Single Operation
                </Button>
                <Button
                  type="button"
                  variant={serviceType === "bulk" ? "default" : "outline"}
                  onClick={() => setServiceType("bulk")}
                  className="h-10"
                >
                  Bulk Operation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRemoveList(!showRemoveList)}
                  className="h-10"
                >
                  {showRemoveList ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide Tire List
                    </>
                  ) : (
                    <>
                      <Grid className="mr-2 h-4 w-4" />
                      View All Tires
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

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

          {/* Dynamic Form Based on Operation and Service Type */}
          {operationType === "install" && (
            <div className="space-y-6">
              {serviceType === "single" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tire-select">Select Tire</Label>
                    <Select 
                      value={singleSelectedTire} 
                      onValueChange={setSingleSelectedTire} 
                      required
                    >
                      <SelectTrigger id="tire-select">
                        <SelectValue placeholder="Choose a tire to install" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTires.map((tire) => (
                          <SelectItem key={tire.id} value={tire.id.toString()}>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="font-mono font-medium">{tire.serial_number}</span>
                                <span className="text-xs text-muted-foreground">
                                  {tire.brand} • {tire.size} • {tire.type}
                                </span>
                              </div>
                              <Badge variant="outline" className="ml-2 capitalize">
                                {tire.type.toLowerCase()}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position-select">Install Position</Label>
                    <Select 
                      value={singleSelectedPosition} 
                      onValueChange={setSingleSelectedPosition} 
                      required
                    >
                      <SelectTrigger id="position-select">
                        <SelectValue placeholder="Select wheel position" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePositionsForInstall.map((position) => (
                          <SelectItem key={position.position_code} value={position.position_code}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {position.position_code}
                              </Badge>
                              <span>{position.position_name}</span>
                              {position.is_trailer === 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  Trailer
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {availablePositionsForInstall.length} positions available
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Installation Items</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addInstallationItem}
                        disabled={installationItems.length >= availablePositionsForInstall.length}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Another
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[250px] rounded-md border p-4">
                      {installationItems.map((item, index) => (
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
                              <Select 
                                value={item.tireId} 
                                onValueChange={(value) => handleSelectTire(value, index)}
                                required
                              >
                                <SelectTrigger id={`tire-${item.id}`}>
                                  <SelectValue placeholder="Select tire" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTires.map((tire) => (
                                    <SelectItem key={tire.id} value={tire.id.toString()}>
                                      <div className="flex flex-col">
                                        <span className="font-mono text-sm">{tire.serial_number}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {tire.brand} • {tire.size}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {item.serialNumber && (
                                <p className="text-xs text-muted-foreground">
                                  Selected: {item.serialNumber} • {item.size} • {item.type}
                                </p>
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
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {index < installationItems.length - 1 && <Separator className="mt-2" />}
                        </div>
                      ))}
                    </ScrollArea>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {installationItems.filter(item => item.tireId && item.positionCode).length} of {installationItems.length} items complete
                      </span>
                      <span className="text-muted-foreground">
                        {availablePositionsForInstall.length - installationItems.length} positions available
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {operationType === "remove" && (
            <div className="space-y-6">
              {serviceType === "single" ? (
                <div className="space-y-2">
                  <Label htmlFor="remove-position">Position to Remove</Label>
                  <Select 
                    value={Object.keys(selectedRemovals).find(pos => selectedRemovals[pos]) || ""} 
                    onValueChange={(value) => setSelectedRemovals({ [value]: true })}
                    required
                  >
                    <SelectTrigger id="remove-position">
                      <SelectValue placeholder="Select position to remove" />
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
              ) : (
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
              )}
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
                  {operationType === "install" && serviceType === "single" ? (singleSelectedTire && singleSelectedPosition ? 1 : 0) :
                   operationType === "install" && serviceType === "bulk" ? installationItems.filter(item => item.tireId && item.positionCode).length :
                   operationType === "remove" && serviceType === "single" ? (Object.keys(selectedRemovals).find(pos => selectedRemovals[pos]) ? 1 : 0) :
                   operationType === "remove" && serviceType === "bulk" ? Object.values(selectedRemovals).filter(Boolean).length :
                   operationType === "swap" ? (swapData.fromPosition && swapData.toPosition ? 1 : 0) : 0}
                </div>
                <div className="text-muted-foreground">
                  {operationType === "swap" ? "Tires to Swap" : "Selected"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {availableTires.length}
                </div>
                <div className="text-muted-foreground">Available Tires</div>
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
                (operationType === "install" && serviceType === "single" && (!singleSelectedTire || !singleSelectedPosition)) ||
                (operationType === "install" && serviceType === "bulk" && installationItems.filter(item => item.tireId && item.positionCode).length === 0) ||
                (operationType === "remove" && serviceType === "single" && !Object.keys(selectedRemovals).find(pos => selectedRemovals[pos])) ||
                (operationType === "remove" && serviceType === "bulk" && Object.values(selectedRemovals).filter(Boolean).length === 0) ||
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