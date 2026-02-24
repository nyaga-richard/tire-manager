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
  Filter,
  Info
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { format, parseISO, isValid } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Tire {
  current_location: string;
  vehicle_id: null;
  id: number;
  serial_number: string;
  size?: string;
  brand?: string;
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

// Interface for the vehicle API response
interface VehicleData {
  id: number;
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  wheel_config: string;
  current_odometer: number;
  status: string;
  positions: VehiclePosition[];
  current_tires: TireInstallation[];
  history: any[];
}

export default function TireServiceModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleNumber,
  currentTires,
  onSuccess
}: TireServiceModalProps) {
  const { user, isAuthenticated, authFetch, hasPermission } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("bulk");
  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [tireSizes, setTireSizes] = useState<TireSize[]>([]);
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  
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
  
  // Vehicle positions state
  const [availablePositions, setAvailablePositions] = useState<VehiclePosition[]>([]);
  const [loadingVehicle, setLoadingVehicle] = useState(false);

  // Mobile collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    tireList: true,
    summary: true,
  });

  // Permission checks
  const canInstall = hasPermission("tire.assign");
  const canRemove = hasPermission("tire.assign");
  const canSwap = hasPermission("tire.assign");

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (canInstall || canRemove || canSwap) {
        fetchAvailableTires();
        fetchVehicleData();
        fetchTireSizes();
      } else {
        setApiError("You don't have permission to perform tire services");
      }
    }
  }, [isOpen, vehicleId, canInstall, canRemove, canSwap]);

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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
    setApiError(null);
  };

  // Fetch vehicle data including positions
  const fetchVehicleData = async () => {
    try {
      setLoadingVehicle(true);
      setApiError(null);
      const response = await authFetch(`${API_BASE_URL}/api/vehicles/${vehicleId}`);
      if (response.ok) {
        const data: VehicleData = await response.json();
        setAvailablePositions(data.positions || []);
        setCurrentOdometer(data.current_odometer || 0);
        console.log("Fetched positions from backend:", data.positions);
      } else {
        console.error("Failed to fetch vehicle data");
        setApiError("Failed to load vehicle data");
        // Set default positions based on common configurations
        setAvailablePositions(getDefaultPositions());
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      setApiError("Error loading vehicle data");
      setAvailablePositions(getDefaultPositions());
    } finally {
      setLoadingVehicle(false);
    }
  };

  // Default positions as fallback - Updated to match your backend structure
  const getDefaultPositions = (): VehiclePosition[] => {
    // Common positions for a 6x4 configuration - matching your backend API
    return [
      { id: 1, position_code: "FL", position_name: "Front Left", axle_number: 1, is_trailer: 0 },
      { id: 2, position_code: "FR", position_name: "Front Right", axle_number: 1, is_trailer: 0 },
      { id: 3, position_code: "RL1", position_name: "Rear Left Inner", axle_number: 2, is_trailer: 0 },
      { id: 4, position_code: "RL2", position_name: "Rear Left Outer", axle_number: 2, is_trailer: 0 },
      { id: 5, position_code: "RR1", position_name: "Rear Right Inner", axle_number: 2, is_trailer: 0 },
      { id: 6, position_code: "RR2", position_name: "Rear Right Outer", axle_number: 2, is_trailer: 0 },
    ];
  };

const fetchAvailableTires = async () => {
  try {
    setLoading(true);
    setApiError(null);
    
    const response = await authFetch(`${API_BASE_URL}/api/tires/`);
    if (response.ok) {
      const data = await response.json();
      console.log("Fetched tires data:", data);
      
      // COMPLETELY FILTER OUT:
      // 1. Tires installed on vehicles (any status indicating they're in use)
      // 2. Tires in USED_STORE
      const availableTiresOnly = data.filter((tire: Tire) => {
        // Statuses that indicate tire is NOT available for installation
        const unavailableStatuses = [
          'IN_USE', 
          'ON_VEHICLE', 
          'INSTALLED', 
          'FITTED', 
          'MOUNTED',
          'USED_STORE',
          'USED',
          'DISPOSED',
          'SCRAP',
          'DAMAGED',
          'AWAITING_RETREAD',
          'AT_RETREADER'
        ];
        
        const status = tire.status?.toUpperCase() || '';
        const isUnavailable = unavailableStatuses.includes(status);
        
        // Check if tire has a current vehicle assignment
        const hasVehicleAssignment = tire.vehicle_id !== null && 
                                    tire.vehicle_id !== undefined && 
                                    tire.vehicle_id > 0;
        
        // Check if tire is currently assigned to a position
        const hasPositionAssignment = tire.current_position !== null && 
                                     tire.current_position !== undefined && 
                                     tire.current_position !== '';
        
        // Check location
        const isInUsedStore = tire.current_location === 'USED_STORE';
        const isOnVehicle = tire.current_location === 'ON_VEHICLE';
        
        // Return true ONLY for tires that are truly available
        return !isUnavailable && 
               !hasVehicleAssignment && 
               !hasPositionAssignment && 
               !isInUsedStore && 
               !isOnVehicle;
      });
      
      console.log("Available tires for installation (filtered):", 
        availableTiresOnly.map((t: { id: any; serial_number: any; status: any; current_location: any; }) => ({
          id: t.id,
          serial: t.serial_number,
          status: t.status,
          location: t.current_location
        }))
      );
      
      // Ensure all string fields have values
      const sanitizedData = availableTiresOnly.map((tire: any) => ({
        ...tire,
        brand: tire.brand || 'Unknown',
        size: tire.size || 'N/A',
        serial_number: tire.serial_number || 'N/A'
      }));
      
      setAvailableTires(sanitizedData);
      
      // Update tire sizes based on filtered tires
      const sizeMap = new Map<string, number>();
      sanitizedData.forEach((tire: { size: string; }) => {
        const size = tire.size || 'N/A';
        sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
      });
      
      const sizes = Array.from(sizeMap.entries()).map(([size, count]) => ({
        size,
        count
      }));
      
      setTireSizes(sizes);
      
      // If no tires available, show a helpful message
      if (sanitizedData.length === 0) {
        toast.info("No tires available for installation. All tires are either installed on vehicles or in used store.");
      }
      
    } else {
      const errorData = await response.text();
      console.error("Failed to fetch tires:", errorData);
      setApiError("Failed to fetch available tires");
    }
  } catch (error) {
    console.error("Error fetching available tires:", error);
    setApiError("Error loading available tires");
  } finally {
    setLoading(false);
  }
};
  const fetchTireSizes = async () => {
    try {
      setLoadingSizes(true);
      const response = await authFetch(`${API_BASE_URL}/api/inventory/by-size`);
      if (response.ok) {
        const data = await response.json();
        setTireSizes(data);
      } else {
        // Fallback: extract unique sizes from available tires
        const sizes = new Set(availableTires.map(tire => tire.size || ''));
        const sizeArray = Array.from(sizes)
          .filter(size => size)
          .map(size => ({ size, count: 0 }));
        setTireSizes(sizeArray);
      }
    } catch (error) {
      console.error("Error fetching tire sizes:", error);
      // Fallback: extract unique sizes from available tires
      const sizes = new Set(availableTires.map(tire => tire.size || ''));
      const sizeArray = Array.from(sizes)
        .filter(size => size)
        .map(size => ({ size, count: 0 }));
      setTireSizes(sizeArray);
    } finally {
      setLoadingSizes(false);
    }
  };

  // Get positions that are available for installation
  const getAvailablePositions = useCallback(() => {
    const occupiedPositions = currentTires.map(t => t.position_code);
    console.log("Occupied positions:", occupiedPositions);
    console.log("All available positions:", availablePositions);
    
    const available = availablePositions.filter(pos => 
      !occupiedPositions.includes(pos.position_code)
    );
    
    console.log("Available positions for install:", available);
    return available;
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
      filtered = filtered.filter(tire => {
        // Handle null/undefined values by converting to empty strings
        const serialNum = (tire.serial_number || '').toLowerCase();
        const brand = (tire.brand || '').toLowerCase();
        const size = (tire.size || '').toLowerCase();
        
        return (
          serialNum.includes(query) ||
          brand.includes(query) ||
          size.includes(query)
        );
      });
    }
    
    return filtered;
  }, [availableTires, selectedSize, searchQuery]);

  const addInstallationItem = () => {
    const availablePositionsForInstall = getAvailablePositions();
    if (installationItems.length >= availablePositionsForInstall.length) {
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
    
    if (!user) {
      toast.error("You must be logged in to perform tire service");
      return;
    }

    if (!canInstall && !canRemove && !canSwap) {
      toast.error("You don't have permission to perform tire services");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      if (operationType === "install") {
        if (!canInstall) {
          throw new Error("You don't have permission to install tires");
        }

        const validItems = installationItems.filter(item => 
          item.tireId && item.positionCode
        );
        
        if (validItems.length === 0) {
          throw new Error("No valid installation items");
        }

        // Validate that all selected position codes exist in availablePositions
        const invalidPositions = validItems.filter(item => {
          const positionExists = availablePositions.some(p => p.position_code === item.positionCode);
          return !positionExists;
        });
        
        if (invalidPositions.length > 0) {
          const invalidCodes = invalidPositions.map(item => item.positionCode).join(", ");
          const validCodes = availablePositions.map(p => p.position_code).join(", ");
          throw new Error(`Invalid position(s): ${invalidCodes}. Valid positions are: ${validCodes}`);
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
            const installPayload = {
              tire_id: parseInt(item.tireId),
              vehicle_id: vehicleId,
              position_code: item.positionCode, // 👈 Send position_code, not position_id
              install_date: format(new Date(), "yyyy-MM-dd"),
              install_odometer: currentOdometer,
              reason: reason || "Regular service",
              user_id: user.id,
              user_name: user.full_name || user.username || "System"
            };

            console.log("Sending install payload:", installPayload);

            const response = await authFetch(`${API_BASE_URL}/api/tires/install`, {
              method: "POST",
              body: JSON.stringify(installPayload),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error("Install error response:", errorData);
              
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
        toast.success("Tires installed successfully");

      } else if (operationType === "remove") {
        if (!canRemove) {
          throw new Error("You don't have permission to remove tires");
        }

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
            removal_date: format(new Date(), "yyyy-MM-dd"),
            removal_odometer: currentOdometer,
            user_id: user.id,
            user_name: user.full_name || user.username || "System",
            reason: reason || "Regular service",
            next_status: "USED_STORE"
          };

          console.log("Sending remove payload:", removePayload);

          const response = await authFetch(`${API_BASE_URL}/api/tires/remove`, {
            method: "POST",
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
        toast.success("Tires removed successfully");

      } else if (operationType === "swap") {
        if (!canSwap) {
          throw new Error("You don't have permission to swap tires");
        }

        if (!swapData.fromPosition) {
          throw new Error("Please select a tire to swap from");
        }
        if (!swapData.toPosition) {
          throw new Error("Please select a position to swap to");
        }
        if (swapData.fromPosition === swapData.toPosition) {
          throw new Error("Cannot swap to the same position");
        }

        // Validate positions exist in availablePositions
        const validPositionCodes = availablePositions.map(p => p.position_code);
        if (!validPositionCodes.includes(swapData.fromPosition)) {
          throw new Error(`Invalid 'from' position: ${swapData.fromPosition}. Valid positions are: ${validPositionCodes.join(", ")}`);
        }
        if (!validPositionCodes.includes(swapData.toPosition)) {
          throw new Error(`Invalid 'to' position: ${swapData.toPosition}. Valid positions are: ${validPositionCodes.join(", ")}`);
        }

        const fromTire = currentTires.find(t => t.position_code === swapData.fromPosition);
        if (!fromTire) throw new Error("No tire found at selected 'from' position");
        
        const toTire = currentTires.find(t => t.position_code === swapData.toPosition);
        
        const swapOperations = [];
        
        // Remove from position tire
        swapOperations.push(
          authFetch(`${API_BASE_URL}/api/tires/remove`, {
            method: "POST",
            body: JSON.stringify({
              assignment_id: fromTire.id,
              removal_date: format(new Date(), "yyyy-MM-dd"),
              removal_odometer: currentOdometer,
              user_id: user.id,
              user_name: user.full_name || user.username || "System",
              reason: reason || "Position swap",
              next_status: "IN_STORE"
            }),
          })
        );
        
        if (toTire) {
          swapOperations.push(
            authFetch(`${API_BASE_URL}/api/tires/remove`, {
              method: "POST",
              body: JSON.stringify({
                assignment_id: toTire.id,
                removal_date: format(new Date(), "yyyy-MM-dd"),
                removal_odometer: currentOdometer,
                user_id: user.id,
                user_name: user.full_name || user.username || "System",
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
        
        // Install 'from' tire to 'to' position - use position_code
        installOperations.push(
          authFetch(`${API_BASE_URL}/api/tires/install`, {
            method: "POST",
            body: JSON.stringify({
              tire_id: fromTire.tire_id,
              vehicle_id: vehicleId,
              position_code: swapData.toPosition,
              install_date: format(new Date(), "yyyy-MM-dd"),
              install_odometer: currentOdometer,
              reason: reason || "Position swap",
              user_id: user.id,
              user_name: user.full_name || user.username || "System"
            }),
          })
        );
        
        if (toTire) {
          installOperations.push(
            authFetch(`${API_BASE_URL}/api/tires/install`, {
              method: "POST",
              body: JSON.stringify({
                tire_id: toTire.tire_id,
                vehicle_id: vehicleId,
                position_code: swapData.fromPosition,
                install_date: format(new Date(), "yyyy-MM-dd"),
                install_odometer: currentOdometer,
                reason: reason || "Position swap",
                user_id: user.id,
                user_name: user.full_name || user.username || "System"
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
        toast.success("Tire positions swapped successfully");
      }

      if (onSuccess) onSuccess();
      onClose();
      resetForm();

    } catch (error) {
      console.error("Error performing tire service:", error);
      setApiError(error instanceof Error ? error.message : "Failed to perform service operation. Please try again.");
      toast.error(error instanceof Error ? error.message : "Failed to perform service operation");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const occupiedPositions = getOccupiedPositions();
  const availablePositionsForInstall = getAvailablePositions();
  const allPositionsForSwap = getAllPositionsForSwap();

  console.log("Current tires:", currentTires);
  console.log("Available positions:", availablePositions);
  console.log("Available positions for install:", availablePositionsForInstall);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-t-lg sm:rounded-lg shadow-lg">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold truncate">Tire Service</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Vehicle: <span className="font-semibold">{vehicleNumber}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {loadingVehicle && (
            <div className="flex items-center justify-center p-4 mb-4 bg-muted/30 rounded-lg">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm">Loading vehicle positions...</span>
            </div>
          )}

          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* Operation Type Tabs - Scrollable on mobile */}
          <div className="mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 px-1">
            <Tabs 
              value={operationType} 
              onValueChange={(value) => setOperationType(value as OperationType)}
              className="w-full"
            >
              <TabsList className="inline-flex w-auto sm:w-full">
                <TabsTrigger 
                  value="install" 
                  className="text-xs sm:text-sm px-3 sm:px-4"
                  disabled={!canInstall}
                >
                  <Package className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Install
                </TabsTrigger>
                <TabsTrigger 
                  value="remove" 
                  className="text-xs sm:text-sm px-3 sm:px-4"
                  disabled={!canRemove}
                >
                  <Minus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Remove
                </TabsTrigger>
                <TabsTrigger 
                  value="swap" 
                  className="text-xs sm:text-sm px-3 sm:px-4"
                  disabled={!canSwap}
                >
                  <Replace className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Swap
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Current Odometer */}
          <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
            <Label htmlFor="odometer" className="text-xs sm:text-sm">Current Odometer (km)</Label>
            <Input
              id="odometer"
              type="number"
              value={currentOdometer}
              onChange={(e) => setCurrentOdometer(parseInt(e.target.value) || 0)}
              required
              min="0"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          {/* Dynamic Form Based on Operation Type */}
          {operationType === "install" && canInstall && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Label className="text-xs sm:text-sm">Installation Items</Label>
                  <div className="flex flex-wrap gap-2">
                    {/* Size Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Select 
                        value={selectedSize} 
                        onValueChange={setSelectedSize}
                        disabled={loadingSizes}
                      >
                        <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-xs">
                          {loadingSizes ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span className="truncate">Loading...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Size" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">All Sizes ({availableTires.length})</SelectItem>
                          {getAvailableSizes.map((size) => {
                            const sizeCount = tireSizes.find(s => s.size === size)?.count || 0;
                            return (
                              <SelectItem key={size} value={size} className="text-xs">
                                <div className="flex items-center justify-between w-full">
                                  <span>{size}</span>
                                  <Badge variant="outline" className="ml-2 text-[10px]">
                                    {sizeCount}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInstallationItem}
                      disabled={installationItems.length >= availablePositionsForInstall.length}
                      className="h-8 text-xs"
                    >
                      <Plus className="mr-1 sm:mr-2 h-3 w-3" />
                      Add Another
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[300px] sm:h-[250px] rounded-md border p-3 sm:p-4">
                  <div className="space-y-4 sm:space-y-3">
                    {installationItems.map((item, index) => {
                      const itemSearchQuery = searchInputs[item.id] || "";
                      const filteredTiresForItem = itemSearchQuery 
                        ? availableTires.filter(tire => {
                            // Handle null/undefined values
                            const serialNum = (tire.serial_number || '').toLowerCase();
                            const brand = (tire.brand || '').toLowerCase();
                            const size = (tire.size || '').toLowerCase();
                            const query = itemSearchQuery.toLowerCase();
                            
                            return (
                              serialNum.includes(query) ||
                              brand.includes(query) ||
                              size.includes(query)
                            );
                          })
                        : getFilteredTires;

                      return (
                        <div key={item.id} className="space-y-3 pb-3 border-b last:border-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-medium">Installation #{index + 1}</h4>
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
                          
                          <div className="grid grid-cols-1 gap-3">
                            {/* Tire Selection */}
                            <div className="space-y-1.5">
                              <Label htmlFor={`tire-${item.id}`} className="text-xs">
                                Tire
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between h-9 text-xs"
                                  >
                                    {item.serialNumber ? (
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="font-mono text-xs">{item.serialNumber}</span>
                                        <Badge variant="outline" className="text-[10px]">
                                          {item.size}
                                        </Badge>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Select or search tire...</span>
                                    )}
                                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[280px] sm:w-[300px] p-0" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Search by serial, brand, or size..."
                                      value={searchInputs[item.id] || ""}
                                      onValueChange={(value) => handleSearchInputChange(item.id, value)}
                                      className="h-8 text-xs"
                                    />
                                    <CommandEmpty className="text-xs p-2">No tires found.</CommandEmpty>
                                    <CommandGroup className="max-h-[200px] sm:max-h-[300px] overflow-auto">
                                      {filteredTiresForItem.map((tire) => (
                                        <CommandItem
                                          key={tire.id}
                                          value={tire.serial_number}
                                          onSelect={() => handleSelectTire(tire.id.toString(), index)}
                                          className="text-xs"
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex flex-col min-w-0">
                                              <span className="font-mono font-medium text-xs truncate">
                                                {tire.serial_number}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground truncate">
                                                {tire.brand} • {tire.size}
                                              </span>
                                            </div>
                                            <Badge 
                                              variant={tire.type === "NEW" ? "default" : "secondary"}
                                              className="text-[10px] ml-2 shrink-0"
                                            >
                                              {tire.type?.toLowerCase()}
                                            </Badge>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {item.serialNumber && (
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                  <Badge variant="outline" className="capitalize text-[10px]">
                                    {item.type?.toLowerCase()}
                                  </Badge>
                                  <span>•</span>
                                  <span className="truncate">{item.brand}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Position Selection */}
                            <div className="space-y-1.5">
                              <Label htmlFor={`position-${item.id}`} className="text-xs">
                                Position
                              </Label>
                              <Select 
                                value={item.positionCode} 
                                onValueChange={(value) => updateInstallationItem(item.id, 'positionCode', value)}
                                required
                              >
                                <SelectTrigger id={`position-${item.id}`} className="h-9 text-xs">
                                  <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availablePositionsForInstall.map((position) => (
                                    <SelectItem key={position.position_code} value={position.position_code} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                          {position.position_code}
                                        </Badge>
                                        <span className="truncate">{position.position_name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {item.positionCode && (
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {availablePositions.find(p => p.position_code === item.positionCode)?.position_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">
                      {installationItems.filter(item => item.tireId && item.positionCode).length} of {installationItems.length} items complete
                    </div>
                    <div className="text-muted-foreground truncate">
                      Showing {getFilteredTires.length} of {availableTires.length} tires
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    {availablePositionsForInstall.length - installationItems.length} positions left
                  </div>
                </div>
              </div>
            </div>
          )}

          {operationType === "remove" && canRemove && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Label className="text-xs sm:text-sm">Select Tires to Remove</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllRemovals(true)}
                      className="h-8 text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllRemovals(false)}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[300px] sm:h-[250px] rounded-md border">
                  <div className="p-3 sm:p-4 space-y-2">
                    {occupiedPositions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tires installed</p>
                      </div>
                    ) : (
                      occupiedPositions.map((tire) => (
                        <div 
                          key={tire.position_code} 
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border gap-2",
                            selectedRemovals[tire.position_code] 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={!!selectedRemovals[tire.position_code]}
                              onCheckedChange={(checked) => 
                                setSelectedRemovals({
                                  ...selectedRemovals,
                                  [tire.position_code]: !!checked
                                })
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {tire.position_code}
                                </Badge>
                                <span className="text-sm font-medium truncate">{tire.position_name}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-mono truncate max-w-[120px]" title={tire.serial_number}>
                                  {tire.serial_number}
                                </span>
                                <span>•</span>
                                <span className="truncate">{tire.brand}</span>
                                <span>•</span>
                                <span>{tire.size}</span>
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {tire.type.toLowerCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {Object.values(selectedRemovals).filter(Boolean).length} of {occupiedPositions.length} tires selected
                </div>
              </div>
            </div>
          )}

          {operationType === "swap" && canSwap && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Label className="text-xs sm:text-sm">Swap Tire Positions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSwapPositions}
                    disabled={!swapData.fromPosition || !swapData.toPosition}
                    className="h-8 text-xs"
                  >
                    <ArrowUpDown className="mr-1 sm:mr-2 h-3 w-3" />
                    Swap Directions
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* From Position */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="from-position" className="text-xs">From Position</Label>
                      <Select 
                        value={swapData.fromPosition} 
                        onValueChange={(value) => setSwapData(prev => ({ ...prev, fromPosition: value }))}
                        required
                      >
                        <SelectTrigger id="from-position" className="h-9 text-xs">
                          <SelectValue placeholder="Select tire to move" />
                        </SelectTrigger>
                        <SelectContent>
                          {occupiedPositions.length === 0 ? (
                            <SelectItem value="none" disabled>No tires installed</SelectItem>
                          ) : (
                            occupiedPositions.map((tire) => (
                              <SelectItem key={tire.position_code} value={tire.position_code} className="text-xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                      {tire.position_code}
                                    </Badge>
                                    <span className="font-mono text-xs truncate max-w-[100px]">
                                      {tire.serial_number}
                                    </span>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] capitalize ml-2">
                                    {tire.type.toLowerCase()}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {swapData.fromTire && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium">Current Tire</h4>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {swapData.fromPosition}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-medium">{swapData.fromTire.serial_number}</span>
                                <Badge variant="secondary" className="text-[10px] capitalize">
                                  {swapData.fromTire.type.toLowerCase()}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground text-[10px]">
                                {swapData.fromTire.brand} • {swapData.fromTire.size}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* To Position */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="to-position" className="text-xs">To Position</Label>
                      <Select 
                        value={swapData.toPosition} 
                        onValueChange={(value) => setSwapData(prev => ({ ...prev, toPosition: value }))}
                        required
                      >
                        <SelectTrigger id="to-position" className="h-9 text-xs">
                          <SelectValue placeholder="Select target position" />
                        </SelectTrigger>
                        <SelectContent>
                          {allPositionsForSwap
                            .filter(pos => pos.position_code !== swapData.fromPosition)
                            .map((position) => {
                              const existingTire = currentTires.find(t => t.position_code === position.position_code);
                              return (
                                <SelectItem key={position.position_code} value={position.position_code} className="text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono text-[10px]">
                                        {position.position_code}
                                      </Badge>
                                      <span className="truncate max-w-[80px]">{position.position_name}</span>
                                    </div>
                                    {existingTire ? (
                                      <Badge variant="secondary" className="text-[10px] ml-2">
                                        Has Tire
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] ml-2">
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
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium">Target Tire</h4>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {swapData.toPosition}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-medium">{swapData.toTire.serial_number}</span>
                                <Badge variant="secondary" className="text-[10px] capitalize">
                                  {swapData.toTire.type.toLowerCase()}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground text-[10px]">
                                {swapData.toTire.brand} • {swapData.toTire.size}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {swapData.toPosition && !swapData.toTire && (
                      <Card className="border-green/20 bg-green/5">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium">Target Position</h4>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {swapData.toPosition}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="text-green-600 font-medium flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span>Position is empty</span>
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
                  <Card className="mt-2 sm:mt-4 border border-dashed">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className="font-mono text-xs">
                              {swapData.fromPosition}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground mt-1">From</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className="font-mono text-xs">
                              {swapData.toPosition}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground mt-1">To</span>
                          </div>
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          {swapData.toTire ? "Two tires will swap positions" : "Tire moves to empty position"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* No Permission Message */}
          {(!canInstall && !canRemove && !canSwap) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to perform any tire services. Please contact your administrator.
              </AlertDescription>
            </Alert>
          )}

          {/* Tire List Preview - Collapsible on mobile */}
          {currentTires.length > 0 && (
            <Collapsible
              open={expandedSections.tireList}
              onOpenChange={() => toggleSection('tireList')}
              className="mt-4 sm:mt-6 border rounded-md"
            >
              <div className="flex items-center justify-between p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-medium">Currently Installed Tires</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {expandedSections.tireList ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2">
                  {currentTires.map((tire) => (
                    <div key={tire.id} className="flex items-center justify-between p-2 border rounded text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                          {tire.position_code}
                        </Badge>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs truncate">{tire.serial_number}</span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {tire.brand} • {tire.size}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0 ml-2">
                        {tire.type.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Reason and Notes */}
          <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs">Reason for Service</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason" className="h-9 text-xs">
                  <SelectValue placeholder="Select reason (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Regular maintenance" className="text-xs">Regular maintenance</SelectItem>
                  <SelectItem value="Tire wear" className="text-xs">Tire wear</SelectItem>
                  <SelectItem value="Damage" className="text-xs">Damage</SelectItem>
                  <SelectItem value="Puncture" className="text-xs">Puncture</SelectItem>
                  <SelectItem value="Rotation schedule" className="text-xs">Rotation schedule</SelectItem>
                  <SelectItem value="Position optimization" className="text-xs">Position optimization</SelectItem>
                  <SelectItem value="Seasonal change" className="text-xs">Seasonal change</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this service..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          {/* Summary Stats - Collapsible on mobile */}
          <Collapsible
            open={expandedSections.summary}
            onOpenChange={() => toggleSection('summary')}
            className="mt-4 sm:mt-6 border rounded-md"
          >
            <div className="flex items-center justify-between p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium">Summary</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {expandedSections.summary ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className={cn(
                      "text-base sm:text-lg font-bold",
                      operationType === "install" ? "text-green-600" : 
                      operationType === "remove" ? "text-blue-600" : 
                      "text-amber-600"
                    )}>
                      {operationType === "install" ? availablePositionsForInstall.length :
                       operationType === "remove" ? occupiedPositions.length :
                       allPositionsForSwap.length}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {operationType === "install" ? "Positions" :
                       operationType === "remove" ? "Installed" :
                       "Positions"}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-base sm:text-lg font-bold text-purple-600">
                      {operationType === "install" ? installationItems.filter(item => item.tireId && item.positionCode).length :
                       operationType === "remove" ? Object.values(selectedRemovals).filter(Boolean).length :
                       operationType === "swap" ? (swapData.fromPosition && swapData.toPosition ? 1 : 0) : 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      Selected
                    </div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-base sm:text-lg font-bold text-gray-600">
                      {operationType === "install" ? getFilteredTires.length : availableTires.length}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {operationType === "install" ? "Filtered" : "Available"}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto h-9 text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || 
                !canInstall && !canRemove && !canSwap ||
                (operationType === "install" && (!canInstall || installationItems.filter(item => item.tireId && item.positionCode).length === 0)) ||
                (operationType === "remove" && (!canRemove || Object.values(selectedRemovals).filter(Boolean).length === 0)) ||
                (operationType === "swap" && (!canSwap || !swapData.fromPosition || !swapData.toPosition))
              }
              className="w-full sm:w-auto h-9 text-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  {operationType === "install" ? "Install Tires" : 
                   operationType === "remove" ? "Remove Tires" : 
                   "Swap Positions"}
                </>
              )}
            </Button>
          </div>

          {/* User Info */}
          <div className="text-xs text-muted-foreground text-center mt-4">
            Performing service as: {user?.full_name || user?.username || "Unknown"}
          </div>
        </form>
      </div>
    </div>
  );
}