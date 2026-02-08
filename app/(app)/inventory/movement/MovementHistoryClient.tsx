"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  History,
  Eye,
  ArrowLeft,
  TrendingUp,
  Package,
  Car,
  RefreshCw as RetreadIcon,
  Trash2,
  Warehouse,
  Building,
  ChevronUp,
  ChevronDown,
  Minus,
  Plus,
  User,
  DollarSign,
  ShoppingCart,
  Wrench,
  Truck,
  FileText,
  Receipt,
  Hash,
  Building2,
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
import { MoreHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface Movement {
  id: number;
  tire_id: number;
  serial_number: string;
  size: string;
  brand: string;
  pattern: string;
  from_location: string;
  to_location: string;
  movement_type:
    | "PURCHASE_TO_STORE"
    | "STORE_TO_VEHICLE"
    | "VEHICLE_TO_STORE"
    | "STORE_TO_RETREAD_SUPPLIER"
    | "RETREAD_SUPPLIER_TO_STORE"
    | "STORE_TO_DISPOSAL";
  movement_date: string;
  user_id: number;
  user_name: string;
  notes: string;
  reference_id?: number;
  reference_type?: string;
  vehicle_number?: string;
  vehicle_id?: number;
  supplier_name?: string;
  supplier_id?: number;
  purchase_cost?: number;
  retread_cost?: number;
  disposal_reason?: string;
  position?: string;
  install_odometer?: number;
  removal_odometer?: number;
  document_number?: string;
  reference_number?: string;
}

interface StockLedgerEntry {
  id: number;
  date: string;
  user_name: string;
  location: string;
  opening_stock: number;
  quantity_in: number;
  quantity_out: number;
  closing_stock: number;
  price?: number;
  reference: string;
  document_no: string;
  type: string;
  movement: Movement;
}

interface MovementStats {
  movement_type: string;
  count: number;
  unique_tires: number;
}

export default function MovementHistoryClient() {
  const searchParams = useSearchParams();
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [filteredLedger, setFilteredLedger] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ledger");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalEntries, setTotalEntries] = useState(0);

  const tireId = searchParams.get("tire");
  const size = searchParams.get("size");

  useEffect(() => {
    fetchMovements();
  }, [startDate, endDate, currentPage]);

  useEffect(() => {
    if (search) {
      const filtered = ledgerEntries.filter(
        (entry) =>
          entry.user_name.toLowerCase().includes(search.toLowerCase()) ||
          entry.reference.toLowerCase().includes(search.toLowerCase()) ||
          entry.document_no.toLowerCase().includes(search.toLowerCase()) ||
          entry.type.toLowerCase().includes(search.toLowerCase()) ||
          entry.movement.serial_number.toLowerCase().includes(search.toLowerCase()) ||
          entry.movement.size.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredLedger(filtered);
    } else {
      setFilteredLedger(ledgerEntries);
    }
  }, [search, ledgerEntries]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: startDate?.toISOString().split("T")[0] || "",
        endDate: endDate?.toISOString().split("T")[0] || "",
        details: "true",
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      let url;
      if (tireId) {
        url = `http://localhost:5000/api/movements/tire/${tireId}?${params}`;
      } else if (size) {
        url = `http://localhost:5000/api/movements/size/${encodeURIComponent(
          size
        )}?${params}`;
      } else {
        url = `http://localhost:5000/api/movements?${params}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      // Calculate ledger entries from movements
      const ledger = calculateStockLedger(data.movements || data);
      setLedgerEntries(ledger);
      setFilteredLedger(ledger);
      setTotalEntries(data.total || ledger.length);
      setTotalPages(data.totalPages || Math.ceil(ledger.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching movements:", error);
      setLedgerEntries([]);
      setFilteredLedger([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStockLedger = (movements: Movement[]): StockLedgerEntry[] => {
    if (!movements.length) return [];

    // Sort movements by date
    const sortedMovements = [...movements].sort(
      (a, b) => new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime()
    );

    const ledger: StockLedgerEntry[] = [];
    let runningStock = 0;

    // Group movements by transaction (same date, same reference, same type)
    const groupedMovements = sortedMovements.reduce((acc, movement) => {
      const key = `${movement.movement_date}-${movement.reference_number || movement.reference_type}-${movement.movement_type}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(movement);
      return acc;
    }, {} as Record<string, Movement[]>);

    // Process each transaction group
    Object.entries(groupedMovements).forEach(([key, transactionMovements]) => {
      const firstMovement = transactionMovements[0];
      let openingStock = runningStock;
      let quantityIn = 0;
      let quantityOut = 0;

      transactionMovements.forEach(movement => {
        if (movement.movement_type === "PURCHASE_TO_STORE" || 
            movement.movement_type === "RETREAD_SUPPLIER_TO_STORE") {
          quantityIn += 1;
        } else if (movement.movement_type === "VEHICLE_TO_STORE") {
          // Return from vehicle counts as quantity in
          quantityIn += 1;
        } else if (movement.movement_type === "STORE_TO_VEHICLE" || 
                  movement.movement_type === "STORE_TO_RETREAD_SUPPLIER" ||
                  movement.movement_type === "STORE_TO_DISPOSAL") {
          quantityOut += 1;
        }
      });

      const closingStock = openingStock + quantityIn - quantityOut;
      runningStock = closingStock;

      // Determine transaction type and details
      const { type, documentNo, reference } = getTransactionDetails(firstMovement, transactionMovements.length);
      const price = getTransactionPrice(firstMovement);

      ledger.push({
        id: firstMovement.id,
        date: firstMovement.movement_date,
        user_name: firstMovement.user_name || "System",
        location: "MAIN_WAREHOUSE", // Could be dynamic based on location
        opening_stock: openingStock,
        quantity_in: quantityIn,
        quantity_out: quantityOut,
        closing_stock: closingStock,
        price: price,
        reference: reference,
        document_no: documentNo,
        type: type,
        movement: firstMovement
      });
    });

    return ledger;
  };

  const getTransactionDetails = (movement: Movement, quantity: number) => {
    let type = "";
    let documentNo = "";
    let reference = "";

    switch (movement.movement_type) {
      case "PURCHASE_TO_STORE":
        type = "Purchase";
        documentNo = movement.document_number || `PUR-${movement.id}`;
        reference = `${movement.supplier_name || 'Supplier'}${movement.reference_number ? `/${movement.reference_number}` : ''}`;
        break;
      
      case "STORE_TO_VEHICLE":
        type = "Installation";
        documentNo = movement.document_number || `INST-${movement.id}`;
        reference = `${movement.vehicle_number || 'Vehicle'}${movement.position ? `/${movement.position}` : ''}`;
        break;
      
      case "VEHICLE_TO_STORE":
        type = "Return from Vehicle";
        documentNo = movement.document_number || `RET-${movement.id}`;
        reference = `${movement.vehicle_number || 'Vehicle'}${movement.notes ? ` - ${movement.notes}` : ''}`;
        break;
      
      case "STORE_TO_RETREAD_SUPPLIER":
        type = "Send for Retreading";
        documentNo = movement.document_number || `RETREAD-SEND-${movement.id}`;
        reference = `${movement.supplier_name || 'Retreader'}`;
        break;
      
      case "RETREAD_SUPPLIER_TO_STORE":
        type = "Return from Retreading";
        documentNo = movement.document_number || `RETREAD-RET-${movement.id}`;
        reference = `${movement.supplier_name || 'Retreader'}`;
        break;
      
      case "STORE_TO_DISPOSAL":
        type = "Disposal";
        documentNo = movement.document_number || `DISP-${movement.id}`;
        reference = `${movement.disposal_reason || 'Disposed'}`;
        break;
      
      default:
        type = (movement.movement_type as string).replace(/_/g, " ");
        documentNo = `TRX-${movement.id}`;
        reference = movement.notes || "";
    }

    return { type, documentNo, reference };
  };

  const getTransactionPrice = (movement: Movement) => {
    switch (movement.movement_type) {
      case "PURCHASE_TO_STORE":
        return movement.purchase_cost;
      case "STORE_TO_RETREAD_SUPPLIER":
        return movement.retread_cost;
      default:
        return undefined;
    }
  };

  const refreshData = () => {
    setCurrentPage(1);
    fetchMovements();
  };

  const getTransactionTypeColor = (type: string) => {
    if (type.includes("Purchase") || type.includes("Return from Retreading")) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (type.includes("Installation") || type.includes("Send for Retreading") || type.includes("Disposal")) {
      return "bg-red-100 text-red-800 border-red-200";
    } else if (type.includes("Return from Vehicle")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes("Purchase")) {
      return <ShoppingCart className="h-3 w-3" />;
    } else if (type.includes("Installation")) {
      return <Car className="h-3 w-3" />;
    } else if (type.includes("Return from Vehicle")) {
      return <Truck className="h-3 w-3" />;
    } else if (type.includes("Retreading")) {
      return <Wrench className="h-3 w-3" />;
    } else if (type.includes("Disposal")) {
      return <Trash2 className="h-3 w-3" />;
    } else {
      return <Package className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(",", "");
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "User Name",
      "Store Location",
      "Opening Stock",
      "Qty In",
      "Qty Out",
      "Closing Stock",
      "Price",
      "Reference",
      "Document No",
      "Type",
      "Serial Number",
      "Size",
      "Brand",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredLedger.map((entry) =>
        [
          formatDate(entry.date),
          entry.user_name,
          entry.location,
          formatNumber(entry.opening_stock),
          formatNumber(entry.quantity_in),
          formatNumber(entry.quantity_out),
          formatNumber(entry.closing_stock),
          entry.price ? formatCurrency(entry.price) : "",
          `"${entry.reference}"`,
          entry.document_no,
          entry.type,
          entry.movement.serial_number,
          entry.movement.size,
          entry.movement.brand,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tire-stock-ledger-${startDate?.toISOString().split("T")[0] || "start"}-to-${endDate?.toISOString().split("T")[0] || "end"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Tire Stock Ledger
            </h1>
            <p className="text-muted-foreground">
              {tireId
                ? "Viewing stock movements for specific tire"
                : size
                ? `Viewing stock movements for size: ${size}`
                : "Complete stock movement ledger"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  className="w-full"
                />
              </div>
            </div>
            <Button onClick={refreshData} disabled={loading}>
              <Calendar className="mr-2 h-4 w-4" />
              Apply Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="ledger">Stock Ledger</TabsTrigger>
            <TabsTrigger value="summary">Summary View</TabsTrigger>
          </TabsList>
          
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search transactions..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stock Ledger Tab */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Movement Ledger</CardTitle>
                  <CardDescription>
                    Complete transaction history with running stock totals
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-sm">
                  {formatNumber(totalEntries)} total entries
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">
                      Loading ledger entries...
                    </p>
                  </div>
                </div>
              ) : filteredLedger.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No ledger entries found</h3>
                  <p className="text-muted-foreground mt-1">
                    {search
                      ? "Try a different search term"
                      : "No transactions recorded in this date range"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="relative overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-[180px]">Date</TableHead>
                          <TableHead className="w-[140px]">User Name</TableHead>
                          <TableHead className="w-[140px]">Store Location</TableHead>
                          <TableHead className="w-[120px] text-right">Opening Stock</TableHead>
                          <TableHead className="w-[100px] text-right">Qty In</TableHead>
                          <TableHead className="w-[100px] text-right">Qty Out</TableHead>
                          <TableHead className="w-[120px] text-right">Closing Stock</TableHead>
                          <TableHead className="w-[100px] text-right">Price</TableHead>
                          <TableHead className="w-[200px]">Reference</TableHead>
                          <TableHead className="w-[120px]">Document No</TableHead>
                          <TableHead className="w-[140px]">Type</TableHead>
                          <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLedger.map((entry) => (
                          <TableRow key={entry.id} className="hover:bg-accent/50">
                            <TableCell className="font-medium text-xs">
                              {formatDate(entry.date)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate">{entry.user_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span>{entry.location}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              <span className="text-muted-foreground">
                                {formatNumber(entry.opening_stock)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.quantity_in > 0 ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <Plus className="mr-1 h-3 w-3" />
                                  {formatNumber(entry.quantity_in)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.quantity_out > 0 ? (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <Minus className="mr-1 h-3 w-3" />
                                  {formatNumber(entry.quantity_out)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {formatNumber(entry.closing_stock)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.price ? formatCurrency(entry.price) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTransactionIcon(entry.type)}
                                <span className="truncate">{entry.reference}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono text-xs">{entry.document_no}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getTransactionTypeColor(entry.type)}
                              >
                                {entry.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/${entry.movement.tire_id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Tire Details
                                    </Link>
                                  </DropdownMenuItem>
                                  {entry.movement.vehicle_id && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/vehicles/${entry.movement.vehicle_id}`}>
                                        <Car className="mr-2 h-4 w-4" />
                                        View Vehicle
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {entry.movement.supplier_id && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/suppliers/${entry.movement.supplier_id}`}>
                                        <Building className="mr-2 h-4 w-4" />
                                        View Supplier
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/inventory/movement?tire=${entry.movement.tire_id}`}>
                                      <History className="mr-2 h-4 w-4" />
                                      View All Movements
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
            {filteredLedger.length > 0 && (
              <CardFooter className="border-t px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredLedger.length} of {totalEntries} entries
                    {size && ` for size: ${size}`}
                  </div>
                  
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) setCurrentPage(currentPage - 1);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pageNum);
                                }}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalEntries)}</div>
                <p className="text-xs text-muted-foreground">
                  In selected date range
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Qty In</CardTitle>
                <Plus className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(filteredLedger.reduce((sum, entry) => sum + entry.quantity_in, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tires added to stock
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Qty Out</CardTitle>
                <Minus className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatNumber(filteredLedger.reduce((sum, entry) => sum + entry.quantity_out, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tires removed from stock
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredLedger.length > 0 
                    ? formatNumber(filteredLedger[filteredLedger.length - 1].closing_stock)
                    : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Latest closing stock
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of transaction types in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(new Set(filteredLedger.map(e => e.type))).map((type) => {
                  const count = filteredLedger.filter(e => e.type === type).length;
                  const percentage = (count / filteredLedger.length) * 100;
                  const totalQty = filteredLedger
                    .filter(e => e.type === type)
                    .reduce((sum, e) => sum + e.quantity_in + e.quantity_out, 0);
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(type)}
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                        <div className="text-sm font-medium">
                          {count} transactions • {totalQty} tires
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getTransactionTypeColor(type).includes("green") 
                              ? "#10b981" 
                              : getTransactionTypeColor(type).includes("red")
                              ? "#ef4444"
                              : "#3b82f6",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}