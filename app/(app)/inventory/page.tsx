"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Search,
  Package,
  RefreshCw,
  Trash2,
  History,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  FileText,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Edit,
  MoreHorizontal,
  XCircle,
  RotateCcw,
  UserCheck,
  Calendar,
  MessageSquare,
  ArrowUpDown,
  Truck,
  Factory,
  BarChart,
  PieChart,
  Undo2,
  FileSpreadsheet,
  Printer,
  Upload,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import AddTireModal from "@/components/add-tire-modal";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, formatDistanceToNow, parseISO, isValid, subMonths } from "date-fns";
import { CSVUploadModal } from "@/components/csv-upload-modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface InventoryBySize {
  size: string;
  new_count: number;
  retreaded_count: number;
  used_count: number;
  retread_candidates_count: number;
  disposed_count: number;
  total_value?: number;
  average_cost?: number;
}

interface Tire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model?: string;
  pattern?: string;
  type: "NEW" | "RETREADED" | "USED";
  status:
    | "IN_STORE"
    | "ON_VEHICLE"
    | "USED_STORE"
    | "AWAITING_RETREAD"
    | "AT_RETREAD_SUPPLIER"
    | "DISPOSED"
    | "SCRAP";
  position?: string;
  purchase_date: string;
  purchase_cost: number;
  purchase_supplier?: string;
  supplier_id?: number;
  supplier_name?: string;
  depth_remaining: number;
  last_movement_date?: string;
  vehicle_id?: number;
  vehicle_number?: string;
  current_odometer?: number;
  retread_count?: number;
  current_location?: string;
  // Disposal fields
  disposal_date?: string;
  disposal_reason?: string;
  disposal_method?: "DISPOSAL" | "SCRAP" | "RECYCLE" | "RETURN_TO_SUPPLIER";
  disposal_authorized_by?: number;
  disposal_authorized_by_name?: string;
  disposal_notes?: string;
}

interface DisposedTire extends Tire {
  disposal_date: string;
  disposal_reason: string;
  disposal_method: "DISPOSAL" | "SCRAP" | "RECYCLE" | "RETURN_TO_SUPPLIER";
  disposal_authorized_by_name?: string;
  disposal_notes?: string;
  authorized_by_name?: string;
  total_assignments?: number;
  last_odometer?: number;
}

interface DisposalHistory {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  disposal_date: string;
  disposal_reason: string;
  disposal_method: string;
  authorized_by_name?: string;
  purchase_cost: number;
  retread_count: number;
}

interface DisposalSummary {
  by_reason: {
    disposal_reason: string;
    count: number;
    total_value: number;
    avg_retread_count: number;
  }[];
  by_method: {
    disposal_method: string;
    count: number;
    total_value: number;
  }[];
  monthly_trend: {
    month: string;
    count: number;
    value: number;
    scrap_count: number;
    disposal_count: number;
  }[];
  top_reasons: {
    disposal_reason: string;
    count: number;
    total_value: number;
    avg_retread_count: number;
  }[];
  total_disposed: number;
  total_value: number;
  stats?: {
    disposed_count: number;
    scrap_count: number;
    total_disposed_value: number;
    avg_retread_count_before_disposal: number;
    last_disposal_date: string;
    disposed_last_30_days: number;
  };
}

interface DashboardStats {
  in_store: number;
  on_vehicle: number;
  used_store: number;
  awaiting_retread: number;
  at_retreader: number;
  disposed: number;
  scrap: number;
  new_tires: number;
  retreaded_tires: number;
  total_value: number;
  average_tire_age?: number;
  utilization_rate?: number;
  retread_rate?: number;
}

interface RetreadMovement {
  id: number;
  movement_date: string;
  movement_type: 'STORE_TO_RETREAD_SUPPLIER' | 'RETREAD_SUPPLIER_TO_STORE';
  supplier_id: number;
  supplier_name: string;
  tire_id: number;
  serial_number: string;
  size: string;
  brand: string;
  type: string;
  status: string;
  notes: string;
  processed_by: string;
}

interface RetreadSummary {
  at_supplier: number;
  returned: number;
  total: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
    current_page: number;
  };
}

// Dispose Tire Modal Component
interface DisposeTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  tire: Tire | null;
  onSuccess: () => void;
}

const DisposeTireModal = ({ isOpen, onClose, tire, onSuccess }: DisposeTireModalProps) => {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [disposalReason, setDisposalReason] = useState("");
  const [disposalMethod, setDisposalMethod] = useState<"DISPOSAL" | "SCRAP" | "RECYCLE" | "RETURN_TO_SUPPLIER">("DISPOSAL");
  const [notes, setNotes] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showCustomReason, setShowCustomReason] = useState(false);

  const disposalReasons = [
    "END_OF_LIFE",
    "DAMAGED_BEYOND_REPAIR",
    "SIDE_WALL_DAMAGE",
    "TREAD_WEAR_LIMIT",
    "BLOWOUT",
    "IRREPARABLE_PUNCTURE",
    "SEPARATION",
    "MANUFACTURING_DEFECT",
    "ACCIDENT_DAMAGE",
    "OBSOLETE",
    "RECALL",
    "OTHER"
  ];

  const handleSubmit = async () => {
    if (!tire) return;

    const reason = showCustomReason ? customReason : disposalReason;
    if (!reason) {
      toast.error("Please select or enter a disposal reason");
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tires/${tire.id}/dispose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disposal_reason: reason,
          disposal_method: disposalMethod,
          disposal_notes: notes,
          authorized_by: user?.id,
          user_id: user?.id,
          disposal_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dispose tire");
      }

      toast.success("Tire disposed successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error disposing tire:", error);
      toast.error(error instanceof Error ? error.message : "Failed to dispose tire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dispose Tire</DialogTitle>
          <DialogDescription>
            {tire && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-mono">{tire.serial_number}</p>
                <p className="text-sm">{tire.size} - {tire.brand}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Disposal Reason *</Label>
            {!showCustomReason ? (
              <Select value={disposalReason} onValueChange={setDisposalReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {disposalReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Enter custom reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0"
              onClick={() => {
                setShowCustomReason(!showCustomReason);
                setDisposalReason("");
                setCustomReason("");
              }}
            >
              {showCustomReason ? "Select from list" : "Or enter custom reason"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Disposal Method</Label>
            <RadioGroup
              value={disposalMethod}
              onValueChange={(value) => setDisposalMethod(value as typeof disposalMethod)}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DISPOSAL" id="disposal" />
                <Label htmlFor="disposal">Disposal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SCRAP" id="scrap" />
                <Label htmlFor="scrap">Scrap</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RECYCLE" id="recycle" />
                <Label htmlFor="recycle">Recycle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RETURN_TO_SUPPLIER" id="return" />
                <Label htmlFor="return">Return to Supplier</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about disposal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {tire?.retread_count && tire.retread_count > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/50 p-3 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                This tire has been retreaded {tire.retread_count} time(s).
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || (!disposalReason && !customReason)}
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Disposing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Dispose Tire
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Bulk Disposal Modal
interface BulkDisposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tires: Tire[];
  onSuccess: () => void;
}

const BulkDisposeModal = ({ isOpen, onClose, tires, onSuccess }: BulkDisposeModalProps) => {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTires, setSelectedTires] = useState<Set<number>>(new Set());
  const [disposalReason, setDisposalReason] = useState("");
  const [disposalMethod, setDisposalMethod] = useState<"DISPOSAL" | "SCRAP" | "RECYCLE" | "RETURN_TO_SUPPLIER">("DISPOSAL");
  const [notes, setNotes] = useState("");

  const disposalReasons = [
    "END_OF_LIFE",
    "DAMAGED_BEYOND_REPAIR",
    "RECALL",
    "OBSOLETE",
    "OTHER"
  ];

  const toggleTire = (tireId: number) => {
    const newSelected = new Set(selectedTires);
    if (newSelected.has(tireId)) {
      newSelected.delete(tireId);
    } else {
      newSelected.add(tireId);
    }
    setSelectedTires(newSelected);
  };

  const selectAll = () => {
    setSelectedTires(new Set(tires.map(t => t.id)));
  };

  const clearAll = () => {
    setSelectedTires(new Set());
  };

  const handleSubmit = async () => {
    if (selectedTires.size === 0) {
      toast.error("Please select at least one tire to dispose");
      return;
    }

    if (!disposalReason) {
      toast.error("Please select a disposal reason");
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tires/bulk-dispose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tire_ids: Array.from(selectedTires),
          disposal_reason: disposalReason,
          disposal_method: disposalMethod,
          disposal_notes: notes,
          authorized_by: user?.id,
          user_id: user?.id,
          disposal_date: new Date().toISOString().split('T')[0],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to dispose tires");
      }

      toast.success(result.message || "Tires disposed successfully");
      
      if (result.results?.failed?.length > 0) {
        console.warn("Failed disposals:", result.results.failed);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error bulk disposing tires:", error);
      toast.error(error instanceof Error ? error.message : "Failed to dispose tires");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Dispose Tires</DialogTitle>
          <DialogDescription>
            Select tires to dispose. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedTires.size} of {tires.length} selected
            </p>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            {tires.map((tire) => (
              <div
                key={tire.id}
                className={cn(
                  "flex items-center p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50",
                  selectedTires.has(tire.id) && "bg-primary/5"
                )}
                onClick={() => toggleTire(tire.id)}
              >
                <Checkbox
                  checked={selectedTires.has(tire.id)}
                  onCheckedChange={() => toggleTire(tire.id)}
                  className="mr-3"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{tire.serial_number}</span>
                    <Badge variant="outline" className="text-xs">
                      {tire.size}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {tire.brand} • Retreads: {tire.retread_count || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Disposal Reason *</Label>
            <Select value={disposalReason} onValueChange={setDisposalReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {disposalReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Disposal Method</Label>
            <Select
              value={disposalMethod}
              onValueChange={(value) => setDisposalMethod(value as typeof disposalMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISPOSAL">Disposal</SelectItem>
                <SelectItem value="SCRAP">Scrap</SelectItem>
                <SelectItem value="RECYCLE">Recycle</SelectItem>
                <SelectItem value="RETURN_TO_SUPPLIER">Return to Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-notes">Notes (Optional)</Label>
            <Textarea
              id="bulk-notes"
              placeholder="Additional notes about disposal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || selectedTires.size === 0 || !disposalReason}
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Dispose {selectedTires.size} Tire(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Reverse Disposal Modal
interface ReverseDisposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tire: DisposedTire | null;
  onSuccess: () => void;
}

const ReverseDisposalModal = ({ isOpen, onClose, tire, onSuccess }: ReverseDisposalModalProps) => {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!tire) return;

    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tires/${tire.id}/reverse-disposal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id,
          reason: reason || "Disposal reversed by user",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reverse disposal");
      }

      toast.success("Disposal reversed successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error reversing disposal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reverse disposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reverse Disposal</DialogTitle>
          <DialogDescription>
            {tire && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-mono">{tire.serial_number}</p>
                <p className="text-sm">{tire.size} - {tire.brand}</p>
                <p className="text-xs text-muted-foreground">
                  Disposed: {formatDate(tire.disposal_date)} • Reason: {tire.disposal_reason}
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reverse-reason">Reason for reversal (Optional)</Label>
            <Textarea
              id="reverse-reason"
              placeholder="Enter reason for reversing this disposal..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will mark the tire as used store and restore it to inventory.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Undo2 className="mr-2 h-4 w-4" />
                Reverse Disposal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Disposal Certificate Modal
interface DisposalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tire: DisposedTire | null;
}

const DisposalCertificateModal = ({ isOpen, onClose, tire }: DisposalCertificateModalProps) => {
  const { settings } = useSettings();
  
  if (!tire) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Disposal Certificate</DialogTitle>
          <DialogDescription>
            Certificate of tire disposal
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6" id="disposal-certificate">
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-bold">{settings?.company_name || "Tire Management System"}</h2>
            <p className="text-sm text-muted-foreground">Disposal Certificate</p>
            <p className="text-xs text-muted-foreground">Certificate No: DIS-{tire.id}-{format(new Date(tire.disposal_date), 'yyyyMM')}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Tire Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Serial Number</p>
                <p className="font-mono font-medium">{tire.serial_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium">{tire.size}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Brand</p>
                <p className="font-medium">{tire.brand}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Model</p>
                <p className="font-medium">{tire.model || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{tire.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Retread Count</p>
                <p className="font-medium">{tire.retread_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Disposal Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Disposal Date</p>
                <p className="font-medium">{formatDate(tire.disposal_date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Disposal Method</p>
                <p className="font-medium">{tire.disposal_method}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Disposal Reason</p>
                <p className="font-medium">{tire.disposal_reason}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Authorized By</p>
                <p className="font-medium">{tire.authorized_by_name || tire.disposal_authorized_by_name || "System"}</p>
              </div>
              {tire.disposal_notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-medium">{tire.disposal_notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 mt-6 text-center text-sm text-muted-foreground">
            <p>This certificate confirms that the above tire has been properly disposed of.</p>
            <p className="text-xs mt-2">Generated on {format(new Date(), "PPP")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Certificate
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Skeleton Components
const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <div className="border-b p-3 sm:p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  </div>
);

// Helper functions
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Not set";
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Invalid date";
    return format(date, "MMM dd, yyyy");
  } catch {
    return "Invalid date";
  }
};

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return "Not set";
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Invalid date";
    return format(date, "MMM dd, yyyy HH:mm");
  } catch {
    return "Invalid date";
  }
};

const formatCurrency = (amount: number, currencySymbol: string = 'KSH') => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace("KES", currencySymbol);
};

export default function InventoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [inventoryBySize, setInventoryBySize] = useState<InventoryBySize[]>([]);
  const [storeTires, setStoreTires] = useState<Tire[]>([]);
  const [retreadCandidates, setRetreadCandidates] = useState<Tire[]>([]);
  const [atRetreadSupplier, setAtRetreadSupplier] = useState<Tire[]>([]);
  const [retreadHistory, setRetreadHistory] = useState<Tire[]>([]);
  const [pendingDisposal, setPendingDisposal] = useState<Tire[]>([]);
  const [disposalHistory, setDisposalHistory] = useState<DisposalHistory[]>([]);
  const [disposalSummary, setDisposalSummary] = useState<DisposalSummary | null>(null);
  const [disposedTires, setDisposedTires] = useState<DisposedTire[]>([]);
  const [disposedPagination, setDisposedPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [retreadFilter, setRetreadFilter] = useState<string>("all");
  const [disposalFilter, setDisposalFilter] = useState({
    reason: "all",
    method: "all",
    search: "",
  });
  const [sortBy, setSortBy] = useState<string>("size");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Modal states
  const [isAddTireModalOpen, setIsAddTireModalOpen] = useState(false);
  const [isSendRetreadModalOpen, setIsSendRetreadModalOpen] = useState(false);
  const [isReturnRetreadModalOpen, setIsReturnRetreadModalOpen] = useState(false);
  const [isRetreadStatusModalOpen, setIsRetreadStatusModalOpen] = useState(false);
  const [isRetreadCostModalOpen, setIsRetreadCostModalOpen] = useState(false);
  const [disposeModalOpen, setDisposeModalOpen] = useState(false);
  const [bulkDisposeModalOpen, setBulkDisposeModalOpen] = useState(false);
  const [reverseDisposalModalOpen, setReverseDisposalModalOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
  const [selectedDisposedTire, setSelectedDisposedTire] = useState<DisposedTire | null>(null);

  const [isTireUploadModalOpen, setIsTireUploadModalOpen] = useState(false);
  const [isVehicleUploadModalOpen, setIsVehicleUploadModalOpen] = useState(false);
  
  // Date range for disposal
  const [disposalDateRange, setDisposalDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // Mobile collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    filters: true,
    inventoryList: true,
    disposalFilters: true,
  });

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("inventory.view")) {
        toast.error("You don't have permission to view inventory");
        router.push("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("inventory.view")) {
      refreshAll();
    }
  }, [isAuthenticated, hasPermission]);

  useEffect(() => {
    if (isAuthenticated && hasPermission("inventory.view")) {
      if (activeTab === "store") {
        fetchStoreTires(storeFilter);
      } else if (activeTab === "retread") {
        fetchRetreadData(retreadFilter);
      } else if (activeTab === "disposed") {
        fetchDisposedTires();
      }
    }
  }, [activeTab, storeFilter, retreadFilter, disposalDateRange, disposedPagination.page, disposalFilter, isAuthenticated, hasPermission]);

  const fetchDashboardStats = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/inventory/dashboard-stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDisposedTires = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: disposalDateRange.start,
        end_date: disposalDateRange.end,
        limit: disposedPagination.limit.toString(),
        offset: ((disposedPagination.page - 1) * disposedPagination.limit).toString(),
      });

      if (disposalFilter.reason && disposalFilter.reason !== "all") {
        params.append("reason", disposalFilter.reason);
      }
      if (disposalFilter.method && disposalFilter.method !== "all") {
        params.append("method", disposalFilter.method);
      }
      if (disposalFilter.search) {
        params.append("search", disposalFilter.search);
      }

      const response = await authFetch(`${API_BASE_URL}/api/tires/disposed?${params.toString()}`);
      const result: PaginatedResponse<DisposedTire> = await response.json();
      
      if (result.success) {
        setDisposedTires(result.data);
        setDisposedPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          pages: result.pagination.pages,
        }));
      } else {
        setDisposedTires([]);
      }
    } catch (error) {
      console.error("Error fetching disposed tires:", error);
      toast.error("Failed to load disposed tires");
      setDisposedTires([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisposalSummary = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tire/disposal-summary`);
      const data = await response.json();
      setDisposalSummary(data.summary || data);
    } catch (error) {
      console.error("Error fetching disposal summary:", error);
    }
  };

  const fetchInventoryBySize = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/inventory/by-size`);
      const data = await response.json();
      setInventoryBySize(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching inventory by size:", error);
      setInventoryBySize([]);
    }
  };

  const fetchStoreTires = async (status?: string) => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/inventory/store`;
      if (status && status !== "all") {
        url += `/${status}`;
      }
      const response = await authFetch(url);
      const data = await response.json();
      setStoreTires(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching store tires:", error);
      setStoreTires([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRetreadData = async (filter: string = "all") => {
    try {
      setLoading(true);
      
      const candidatesResponse = await authFetch(`${API_BASE_URL}/api/inventory/retread-eligible`);
      const candidatesData = await candidatesResponse.json();
      setRetreadCandidates(Array.isArray(candidatesData.data) ? candidatesData.data : []);
      
      const atSupplierResponse = await authFetch(`${API_BASE_URL}/api/inventory?status=AT_RETREAD_SUPPLIER`);
      const atSupplierData = await atSupplierResponse.json();
      setAtRetreadSupplier(Array.isArray(atSupplierData) ? atSupplierData : []);
      
      const historyResponse = await authFetch(`${API_BASE_URL}/api/inventory?type=RETREADED&limit=50`);
      const historyData = await historyResponse.json();
      setRetreadHistory(Array.isArray(historyData) ? historyData : []);
      
    } catch (error) {
      console.error("Error fetching retread data:", error);
      setRetreadCandidates([]);
      setAtRetreadSupplier([]);
      setRetreadHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDisposal = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tire/eligible-for-disposal`);
      const data = await response.json();
      setPendingDisposal(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error fetching pending disposal:", error);
      setPendingDisposal([]);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchInventoryBySize(),
        fetchPendingDisposal(),
        fetchDisposalSummary(),
      ]);
      
      if (activeTab === "store") {
        await fetchStoreTires(storeFilter);
      } else if (activeTab === "retread") {
        await fetchRetreadData(retreadFilter);
      } else if (activeTab === "disposed") {
        await fetchDisposedTires();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError(error instanceof Error ? error.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const handleTireAdded = () => {
    toast.success("Tire added successfully");
    refreshAll();
  };

  const handleDisposeClick = (tire: Tire) => {
    setSelectedTire(tire);
    setDisposeModalOpen(true);
  };

  const handleDisposeSuccess = () => {
    refreshAll();
  };

  const handleReverseDisposal = (tire: DisposedTire) => {
    setSelectedDisposedTire(tire);
    setReverseDisposalModalOpen(true);
  };

  const handleReverseSuccess = () => {
    refreshAll();
    setReverseDisposalModalOpen(false);
    setSelectedDisposedTire(null);
  };

  const handleViewCertificate = (tire: DisposedTire) => {
    setSelectedDisposedTire(tire);
    setCertificateModalOpen(true);
  };

  const handleMarkForRetreading = async (tireId: number) => {
    if (!hasPermission("tire.retread")) {
      toast.error("You don't have permission to mark tires for retreading");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/inventory/${tireId}/mark-retread`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id,
          notes: "Marked for retreading",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark tire for retreading");
      }

      toast.success("Tire marked for retreading");
      refreshAll();
    } catch (error) {
      console.error("Error marking tire for retreading:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mark tire for retreading");
    }
  };

  const exportDisposedTires = async () => {
    try {
      const params = new URLSearchParams({
        start_date: disposalDateRange.start,
        end_date: disposalDateRange.end,
      });

      if (disposalFilter.reason && disposalFilter.reason !== "all") {
        params.append("reason", disposalFilter.reason);
      }
      if (disposalFilter.method && disposalFilter.method !== "all") {
        params.append("method", disposalFilter.method);
      }

      const response = await authFetch(`${API_BASE_URL}/api/tires/disposed/export?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Convert to CSV
        const headers = [
          "Serial Number",
          "Size",
          "Brand",
          "Model",
          "Type",
          "Status",
          "Purchase Date",
          "Purchase Cost",
          "Retread Count",
          "Disposal Date",
          "Disposal Reason",
          "Disposal Method",
          "Disposal Notes",
          "Authorized By",
          "Supplier",
          "Total Assignments",
          "Last Odometer"
        ];

        const rows = result.data.map((item: any) => [
          item.serial_number,
          item.size,
          item.brand,
          item.model || "",
          item.type,
          item.status,
          formatDate(item.purchase_date),
          item.purchase_cost,
          item.retread_count || 0,
          formatDate(item.disposal_date),
          item.disposal_reason,
          item.disposal_method,
          item.disposal_notes || "",
          item.authorized_by_name || "",
          item.supplier_name || "",
          item.total_assignments || 0,
          item.last_odometer || ""
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `disposed-tires-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Disposed tires exported successfully");
      }
    } catch (error) {
      console.error("Error exporting disposed tires:", error);
      toast.error("Failed to export disposed tires");
    }
  };

  const exportInventory = () => {
    try {
      const headers = [
        "Size",
        "New",
        "Retreaded",
        "Used",
        "Retread Candidates",
        "Disposed",
        "Total",
        "Estimated Value"
      ];

      const rows = inventoryBySize.map(item => [
        item.size,
        item.new_count,
        item.retreaded_count,
        item.used_count,
        item.retread_candidates_count,
        item.disposed_count || 0,
        item.new_count + item.retreaded_count + item.used_count,
        `${currencySymbol} ${((item.new_count + item.retreaded_count + item.used_count) * (item.average_cost || 10000)).toLocaleString()}`
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Inventory exported successfully");
    } catch (error) {
      console.error("Error exporting inventory:", error);
      toast.error("Failed to export inventory");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_STORE":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "ON_VEHICLE":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "USED_STORE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "AWAITING_RETREAD":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
      case "AT_RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      case "DISPOSED":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      case "SCRAP":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "NEW":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "RETREADED":
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800";
      case "USED":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getDisposalMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case "SCRAP":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "RECYCLE":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
      case "RETURN_TO_SUPPLIER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
      default:
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    }
  };

  const getDisposalReasonColor = (reason: string) => {
    const severeReasons = ["DAMAGED_BEYOND_REPAIR", "BLOWOUT", "SEPARATION", "ACCIDENT_DAMAGE"];
    const moderateReasons = ["SIDE_WALL_DAMAGE", "IRREPARABLE_PUNCTURE", "MANUFACTURING_DEFECT"];
    const normalReasons = ["END_OF_LIFE", "TREAD_WEAR_LIMIT", "OBSOLETE", "RECALL"];
    
    if (severeReasons.includes(reason)) {
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
    } else if (moderateReasons.includes(reason)) {
      return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
    } else if (normalReasons.includes(reason)) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(currency, currencySymbol);
  };

  const filteredInventory = inventoryBySize
    .filter(
      (item) =>
        item.size.toLowerCase().includes(search.toLowerCase()) ||
        item.new_count.toString().includes(search) ||
        item.retreaded_count.toString().includes(search)
    )
    .sort((a, b) => {
      if (sortBy === "size") {
        return sortOrder === "asc" 
          ? a.size.localeCompare(b.size) 
          : b.size.localeCompare(a.size);
      } else if (sortBy === "total") {
        const totalA = a.new_count + a.retreaded_count + a.used_count;
        const totalB = b.new_count + b.retreaded_count + b.used_count;
        return sortOrder === "asc" ? totalA - totalB : totalB - totalA;
      }
      return 0;
    });

  const totalTires = (stats?.in_store || 0) +
    (stats?.on_vehicle || 0) +
    (stats?.used_store || 0) +
    (stats?.awaiting_retread || 0) +
    (stats?.at_retreader || 0) +
    (stats?.disposed || 0) +
    (stats?.scrap || 0);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get retread data based on filter
  const getFilteredRetreadData = () => {
    switch (retreadFilter) {
      case "candidates":
        return retreadCandidates;
      case "at_supplier":
        return atRetreadSupplier;
      case "history":
        return retreadHistory;
      default:
        return [...retreadCandidates, ...atRetreadSupplier, ...retreadHistory].slice(0, 50);
    }
  };

  const filteredRetreadData = getFilteredRetreadData();

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-96 w-full" />
      </div>
    );
  }

  // Show permission denied - fallback if redirect doesn't happen
  if (!hasPermission("inventory.view")) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage tire inventory</p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            You don't have permission to view inventory. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // If user has permission, render the page
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Modals */}
      {hasPermission("tire.create") && (
        <AddTireModal
          isOpen={isAddTireModalOpen}
          onClose={() => setIsAddTireModalOpen(false)}
          onSuccess={handleTireAdded}
        />
      )}

      {hasPermission("tire.dispose") && (
        <>
          <DisposeTireModal
            isOpen={disposeModalOpen}
            onClose={() => {
              setDisposeModalOpen(false);
              setSelectedTire(null);
            }}
            tire={selectedTire}
            onSuccess={handleDisposeSuccess}
          />

          <BulkDisposeModal
            isOpen={bulkDisposeModalOpen}
            onClose={() => setBulkDisposeModalOpen(false)}
            tires={pendingDisposal}
            onSuccess={handleDisposeSuccess}
          />

          <ReverseDisposalModal
            isOpen={reverseDisposalModalOpen}
            onClose={() => {
              setReverseDisposalModalOpen(false);
              setSelectedDisposedTire(null);
            }}
            tire={selectedDisposedTire}
            onSuccess={handleReverseSuccess}
          />

          <DisposalCertificateModal
            isOpen={certificateModalOpen}
            onClose={() => {
              setCertificateModalOpen(false);
              setSelectedDisposedTire(null);
            }}
            tire={selectedDisposedTire}
          />
        </>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Inventory</h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            Manage tire inventory, track retreads, and monitor disposals
          </p>
          {systemSettings?.company_name && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {systemSettings.company_name} • {currencySymbol} ({currency})
            </p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          <Button variant="outline" size="sm" onClick={exportInventory} disabled={inventoryBySize.length === 0} className="whitespace-nowrap">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export Inventory</span>
          </Button>
          
          {activeTab === "disposed" && disposedTires.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportDisposedTires} className="whitespace-nowrap">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export Disposed</span>
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading} className="whitespace-nowrap">
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Upload CSV</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Upload Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsTireUploadModalOpen(true)}>
                  <Package className="mr-2 h-4 w-4" />
                  Upload Tires
                </DropdownMenuItem>
                {/* <DropdownMenuItem onSelect={() => setIsVehicleUploadModalOpen(true)}>
                  <Truck className="mr-2 h-4 w-4" />
                  Upload Vehicles
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
                    
          {hasPermission("grn.view") && (
            <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
              <Link href="/grns">
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View GRNs</span>
              </Link>
            </Button>
          )}
          
          {hasPermission("tire.create") && (
            <Button size="sm" onClick={() => setIsAddTireModalOpen(true)} className="whitespace-nowrap">
              <Package className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Tire</span>
            </Button>
          )}

          {hasPermission("tire.dispose") && pendingDisposal.length > 0 && activeTab === "store" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkDisposeModalOpen(true)}
              className="whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Bulk Dispose</span>
              <Badge variant="outline" className="ml-2 bg-white text-red-600">
                {pendingDisposal.length}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      <Collapsible
        open={expandedSections.stats}
        onOpenChange={() => toggleSection('stats')}
        className="border rounded-lg sm:border-0 sm:rounded-none"
      >
        <div className="flex items-center justify-between p-4 sm:hidden">
          <h2 className="text-sm font-semibold">Inventory Overview</h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {expandedSections.stats ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="sm:block">
          <div className="p-4 sm:p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Tires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{totalTires}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.new_tires || 0} new • {stats?.retreaded_tires || 0} retreaded
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">In Store</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stats?.in_store || 0}</div>
                  <p className="text-xs text-muted-foreground">Available for installation</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {stats?.utilization_rate ? `${stats.utilization_rate}%` : '0%'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.on_vehicle || 0} on vehicles
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Disposed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    {(stats?.disposed || 0) + (stats?.scrap || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.disposed || 0} disposed • {stats?.scrap || 0} scrap
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-1 -mb-1">
          <TabsList className="inline-flex w-auto sm:grid sm:grid-cols-4 sm:w-[400px]">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 sm:px-4">Overview</TabsTrigger>
            <TabsTrigger value="store" className="text-xs sm:text-sm px-3 sm:px-4">Store</TabsTrigger>
            <TabsTrigger value="retread" className="text-xs sm:text-sm px-3 sm:px-4">Retread</TabsTrigger>
            <TabsTrigger value="disposed" className="text-xs sm:text-sm px-3 sm:px-4">Disposed</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab - Inventory by Size */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Inventory by Size</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    View tire inventory grouped by size
                  </CardDescription>
                </div>
                
                {/* Filters - Collapsible on mobile */}
                <Collapsible
                  open={expandedSections.filters}
                  onOpenChange={() => toggleSection('filters')}
                  className="sm:hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Filter & Sort</span>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        {expandedSections.filters ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="size">Size</SelectItem>
                          <SelectItem value="total">Total Count</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="shrink-0"
                      >
                        {sortOrder === "asc" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search sizes..."
                        className="pl-8 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Desktop filters */}
                <div className="hidden sm:flex items-center gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="total">Total Count</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </Button>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search sizes..."
                      className="pl-8"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading && activeTab === "overview" ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium">No inventory found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {search ? "Try adjusting your search criteria" : "No tires in inventory"}
                  </p>
                </div>
              ) : (
                <div className="sm:rounded-md border m-5">
                  {/* Desktop Table */}
                  <div className="hidden sm:block ml-5 mr-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tire Size</TableHead>
                          <TableHead className="text-center">New</TableHead>
                          <TableHead className="text-center">Retreaded</TableHead>
                          <TableHead className="text-center">Used</TableHead>
                          <TableHead className="text-center">Disposed</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const total = item.new_count + item.retreaded_count + item.used_count;
                          return (
                            <TableRow key={item.size}>
                              <TableCell className="font-medium">{item.size}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950">
                                  {item.new_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950">
                                  {item.retreaded_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950">
                                  {item.used_count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={item.disposed_count > 0 ? "bg-red-50 dark:bg-red-950" : ""}
                                >
                                  {item.disposed_count || 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{total}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/inventory/size/${encodeURIComponent(item.size)}`}>
                                            <Eye className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View all tires</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" asChild>
                                          <Link href={`/inventory/movement?size=${encodeURIComponent(item.size)}`}>
                                            <History className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Movement history</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3 p-3">
                    {filteredInventory.map((item) => {
                      const total = item.new_count + item.retreaded_count + item.used_count;
                      return (
                        <Card key={item.size} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-medium text-base">{item.size}</h3>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Total: {total}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-2 mb-4">
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">New</div>
                                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 mt-1">
                                  {item.new_count}
                                </Badge>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">Retread</div>
                                <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950 mt-1">
                                  {item.retreaded_count}
                                </Badge>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">Used</div>
                                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 mt-1">
                                  {item.used_count}
                                </Badge>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">Disposed</div>
                                <Badge variant="outline" className={item.disposed_count > 0 ? "bg-red-50 dark:bg-red-950" : ""}>
                                  {item.disposed_count || 0}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href={`/inventory/size/${encodeURIComponent(item.size)}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View All
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link href={`/inventory/movement?size=${encodeURIComponent(item.size)}`}>
                                  <History className="h-4 w-4 mr-2" />
                                  History
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            
            {filteredInventory.length > 0 && (
              <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Showing {filteredInventory.length} tire size{filteredInventory.length !== 1 ? 's' : ''}
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Store Tires Tab */}
        <TabsContent value="store" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Tires in Store</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Tires currently in storage ({storeTires.length} total)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={storeFilter} onValueChange={setStoreFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tires</SelectItem>
                      <SelectItem value="IN_STORE">New Store</SelectItem>
                      <SelectItem value="USED_STORE">Used Store</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading && activeTab === "store" ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </div>
              ) : storeTires.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium">No tires in store</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Add tires to your inventory
                  </p>
                  {hasPermission("tire.create") && (
                    <Button className="mt-4" size="sm" onClick={() => setIsAddTireModalOpen(true)}>
                      <Package className="mr-2 h-4 w-4" />
                      Add Tire
                    </Button>
                  )}
                </div>
              ) : (
                <div className="sm:rounded-md border m-5">
                  {/* Desktop Table */}
                  <div className="hidden sm:block ml-5 mr-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Cost ({currencySymbol})</TableHead>
                          <TableHead>Retreads</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {storeTires.map((tire) => (
                          <TableRow key={tire.id}>
                            <TableCell className="font-mono text-xs">{tire.serial_number}</TableCell>
                            <TableCell>{tire.size}</TableCell>
                            <TableCell>{tire.brand}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getTypeColor(tire.type)}>
                                {tire.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(tire.status)}>
                                {tire.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(tire.purchase_date)}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(tire.purchase_cost)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                
                                {/* View Movement */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/inventory/movement?tire=${tire.id}`}>
                                          <History className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Movement</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* Dispose Tire */}
                                {hasPermission("tire.dispose") && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDisposeClick(tire)}
                                          className="text-red-600 hover:text-red-700 "
                                        >
                                          <Trash2 className=" h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Dispose Tire</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                              </div>
                            </TableCell>

                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3 p-3">
                    {storeTires.map((tire) => (
                      <Card key={tire.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3 ">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                  {tire.serial_number}
                                </span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                  <Badge variant="outline" className={getTypeColor(tire.type)}>
                                    {tire.type}
                                  </Badge>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/movement?tire=${tire.id}`}>
                                      <History className="mr-2 h-4 w-4" />
                                      History
                                    </Link>
                                  </DropdownMenuItem>
                                  {hasPermission("tire.dispose") && (
                                    <DropdownMenuItem onSelect={() => handleDisposeClick(tire)}>
                                      <Trash2 className="mr-2 h-4 w-4 text-red-600" />  
                                      Dispose Tire
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                              <h3 className="font-medium text-base truncate">{tire.size} - {tire.brand}</h3>
                            </div>

                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Status</div>
                              <Badge variant="outline" className={getStatusColor(tire.status)}>
                                {tire.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Retreads</div>
                              <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Purchase Date</div>
                              <div className="text-sm">{formatDate(tire.purchase_date)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Cost</div>
                              <div className="font-mono">{formatCurrency(tire.purchase_cost)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retread Tab */}
        <TabsContent value="retread" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Retread Management</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage tires for retreading and track retread history
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={retreadFilter} onValueChange={setRetreadFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Retread Data</SelectItem>
                      <SelectItem value="candidates">Retread Candidates</SelectItem>
                      <SelectItem value="at_supplier">At Supplier</SelectItem>
                      <SelectItem value="history">Retread History</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading && activeTab === "retread" ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </div>
              ) : filteredRetreadData.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <RotateCcw className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium">No retread data found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {retreadFilter === "candidates" ? "No tires eligible for retreading" : 
                     retreadFilter === "at_supplier" ? "No tires at retread suppliers" :
                     retreadFilter === "history" ? "No retread history available" :
                     "No retread data available"}
                  </p>
                </div>
              ) : (
                <div className="sm:rounded-md border m-5">
                  {/* Desktop Table */}
                  <div className="hidden sm:block ml-5 mr-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Retreads</TableHead>
                          {retreadFilter === "history" && (
                            <>
                              <TableHead>Last Retread</TableHead>
                              <TableHead>Retread Cost</TableHead>
                            </>
                          )}
                          {retreadFilter === "at_supplier" && (
                            <TableHead>Supplier</TableHead>
                          )}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRetreadData.map((tire) => (
                          <TableRow key={tire.id}>
                            <TableCell className="font-mono text-xs">{tire.serial_number}</TableCell>
                            <TableCell>{tire.size}</TableCell>
                            <TableCell>{tire.brand}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(tire.status)}>
                                {tire.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                            </TableCell>
                            {retreadFilter === "history" && (
                              <>
                                <TableCell>{formatDate(tire.last_movement_date)}</TableCell>
                                <TableCell className="font-mono">{formatCurrency(tire.purchase_cost)}</TableCell>
                              </>
                            )}
                            {retreadFilter === "at_supplier" && (
                              <TableCell>{tire.supplier_name || "N/A"}</TableCell>
                            )}
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/inventory/movement?tire=${tire.id}`}>
                                  <History className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3 p-3">
                    {filteredRetreadData.map((tire) => (
                      <Card key={tire.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                  {tire.serial_number}
                                </span>
                              </div>
                              <h3 className="font-medium text-base">{tire.size} - {tire.brand}</h3>
                            </div>
                            <Badge variant="outline" className={getStatusColor(tire.status)}>
                              {tire.status.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Retreads</div>
                              <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                            </div>
                            {retreadFilter === "at_supplier" && tire.supplier_name && (
                              <div>
                                <div className="text-xs text-muted-foreground">Supplier</div>
                                <div>{tire.supplier_name}</div>
                              </div>
                            )}
                          </div>

                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link href={`/inventory/movement?tire=${tire.id}`}>
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disposed Tires Tab */}
        <TabsContent value="disposed" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Disposed Tires</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Tires that have been disposed ({disposedPagination.total} total)
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasPermission("tire.dispose") && disposedTires.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={exportDisposedTires}
                      >
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Disposal Filters */}
                <Collapsible
                  open={expandedSections.disposalFilters}
                  onOpenChange={() => toggleSection('disposalFilters')}
                  className="sm:hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Filter Disposed Tires</span>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        {expandedSections.disposalFilters ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-3 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search serial, size, brand..."
                        className="pl-8 w-full"
                        value={disposalFilter.search}
                        onChange={(e) => setDisposalFilter(prev => ({ ...prev, search: e.target.value }))}
                      />
                    </div>
                    
                    <Select
                      value={disposalFilter.reason}
                      onValueChange={(value) => setDisposalFilter(prev => ({ ...prev, reason: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Reasons" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reasons</SelectItem>
                        <SelectItem value="END_OF_LIFE">End of Life</SelectItem>
                        <SelectItem value="DAMAGED_BEYOND_REPAIR">Damaged</SelectItem>
                        <SelectItem value="SIDE_WALL_DAMAGE">Side Wall Damage</SelectItem>
                        <SelectItem value="TREAD_WEAR_LIMIT">Tread Wear</SelectItem>
                        <SelectItem value="BLOWOUT">Blowout</SelectItem>
                        <SelectItem value="RECALL">Recall</SelectItem>
                        <SelectItem value="OBSOLETE">Obsolete</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={disposalFilter.method}
                      onValueChange={(value) => setDisposalFilter(prev => ({ ...prev, method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="DISPOSAL">Disposal</SelectItem>
                        <SelectItem value="SCRAP">Scrap</SelectItem>
                        <SelectItem value="RECYCLE">Recycle</SelectItem>
                        <SelectItem value="RETURN_TO_SUPPLIER">Return to Supplier</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={disposalDateRange.start}
                        onChange={(e) => setDisposalDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="flex-1"
                      />
                      <Input
                        type="date"
                        value={disposalDateRange.end}
                        onChange={(e) => setDisposalDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Desktop filters */}
                <div className="hidden sm:flex flex-wrap items-center gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search serial, size, brand..."
                      className="pl-8"
                      value={disposalFilter.search}
                      onChange={(e) => setDisposalFilter(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  
                  <Select
                    value={disposalFilter.reason}
                    onValueChange={(value) => setDisposalFilter(prev => ({ ...prev, reason: value }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Reasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      <SelectItem value="END_OF_LIFE">End of Life</SelectItem>
                      <SelectItem value="DAMAGED_BEYOND_REPAIR">Damaged</SelectItem>
                      <SelectItem value="SIDE_WALL_DAMAGE">Side Wall Damage</SelectItem>
                      <SelectItem value="TREAD_WEAR_LIMIT">Tread Wear</SelectItem>
                      <SelectItem value="BLOWOUT">Blowout</SelectItem>
                      <SelectItem value="RECALL">Recall</SelectItem>
                      <SelectItem value="OBSOLETE">Obsolete</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={disposalFilter.method}
                    onValueChange={(value) => setDisposalFilter(prev => ({ ...prev, method: value }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="DISPOSAL">Disposal</SelectItem>
                      <SelectItem value="SCRAP">Scrap</SelectItem>
                      <SelectItem value="RECYCLE">Recycle</SelectItem>
                      <SelectItem value="RETURN_TO_SUPPLIER">Return to Supplier</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={disposalDateRange.start}
                      onChange={(e) => setDisposalDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-36"
                    />
                    <Input
                      type="date"
                      value={disposalDateRange.end}
                      onChange={(e) => setDisposalDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-36"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading && activeTab === "disposed" ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </div>
              ) : disposedTires.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Trash2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium">No disposed tires</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    No tires have been disposed in the selected date range
                  </p>
                </div>
              ) : (
                <div className="sm:rounded-md border m-5">
                  {/* Desktop Table */}
                  <div className="hidden sm:block ml-5 mr-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Disposal Date</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Authorized By</TableHead>
                          <TableHead>Original Cost</TableHead>
                          <TableHead>Retreads</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disposedTires.map((tire) => (
                          <TableRow key={tire.id}>
                            <TableCell className="font-mono text-xs">{tire.serial_number}</TableCell>
                            <TableCell>{tire.size}</TableCell>
                            <TableCell>{tire.brand}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getTypeColor(tire.type)}>
                                {tire.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(tire.disposal_date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getDisposalReasonColor(tire.disposal_reason)}>
                                {tire.disposal_reason.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getDisposalMethodColor(tire.disposal_method)}>
                                {tire.disposal_method}
                              </Badge>
                            </TableCell>
                            <TableCell>{tire.authorized_by_name || tire.disposal_authorized_by_name || "System"}</TableCell>
                            <TableCell className="font-mono">{formatCurrency(tire.purchase_cost)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {/* View Movement */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/inventory/movement?tire=${tire.id}`}>
                                          <History className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Movement</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* View Certificate */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewCertificate(tire)}
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Certificate</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                {/* Reverse Disposal (Admin only) */}
                                {hasPermission("tire.dispose") && user?.role === "admin" && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleReverseDisposal(tire)}
                                          className="text-amber-600 hover:text-amber-700"
                                        >
                                          <Undo2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Reverse Disposal</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3 p-3">
                    {disposedTires.map((tire) => (
                      <Card key={tire.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                  {tire.serial_number}
                                </span>
                                <Badge variant="outline" className={getTypeColor(tire.type)}>
                                  {tire.type}
                                </Badge>
                              </div>
                              <h3 className="font-medium text-base truncate">{tire.size} - {tire.brand}</h3>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/inventory/movement?tire=${tire.id}`}>
                                    <History className="mr-2 h-4 w-4" />
                                    Movement History
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleViewCertificate(tire)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Certificate
                                </DropdownMenuItem>
                                {hasPermission("tire.dispose") && user?.role === "admin" && (
                                  <DropdownMenuItem onSelect={() => handleReverseDisposal(tire)}>
                                    <Undo2 className="mr-2 h-4 w-4 text-amber-600" />
                                    Reverse Disposal
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Disposal Date</div>
                              <div>{formatDate(tire.disposal_date)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Method</div>
                              <Badge variant="outline" className={getDisposalMethodColor(tire.disposal_method)}>
                                {tire.disposal_method}
                              </Badge>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs text-muted-foreground">Reason</div>
                              <Badge variant="outline" className={getDisposalReasonColor(tire.disposal_reason)}>
                                {tire.disposal_reason.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Original Cost</div>
                              <div className="font-mono">{formatCurrency(tire.purchase_cost)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Retreads</div>
                              <Badge variant="secondary">{tire.retread_count || 0}</Badge>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs text-muted-foreground">Authorized By</div>
                              <div>{tire.authorized_by_name || tire.disposal_authorized_by_name || "System"}</div>
                            </div>
                            {tire.disposal_notes && (
                              <div className="col-span-2">
                                <div className="text-xs text-muted-foreground">Notes</div>
                                <div className="text-sm">{tire.disposal_notes}</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Pagination */}
            {disposedPagination.pages > 1 && (
              <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Showing {((disposedPagination.page - 1) * disposedPagination.limit) + 1} to {Math.min(disposedPagination.page * disposedPagination.limit, disposedPagination.total)} of {disposedPagination.total} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDisposedPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={disposedPagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-xs sm:text-sm">
                      Page {disposedPagination.page} of {disposedPagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDisposedPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={disposedPagination.page >= disposedPagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <div className="truncate">
          Logged in as: {user?.full_name || user?.username}
        </div>
        <div className="flex flex-wrap gap-1">
          <span>Role: {user?.role}</span>
          {systemSettings?.company_name && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="block sm:inline text-xs">
                {systemSettings.company_name}
              </span>
            </>
          )}
        </div>
      </div>

        {/* CSV Upload Modals */}
        <CSVUploadModal
          isOpen={isTireUploadModalOpen}
          onClose={() => setIsTireUploadModalOpen(false)}
          type="tires"
          onSuccess={refreshAll}
        />

        <CSVUploadModal
          isOpen={isVehicleUploadModalOpen}
          onClose={() => setIsVehicleUploadModalOpen(false)}
          type="vehicles"
          onSuccess={refreshAll}
        />
    </div>
  );
}