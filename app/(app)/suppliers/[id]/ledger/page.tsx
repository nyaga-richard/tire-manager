"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Building,
  Phone,
  Mail,
  User,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SupplierLedgerEntry {
  id: number;
  supplier_id: number;
  date: string;
  description: string;
  transaction_type: "PURCHASE" | "RETREAD_SERVICE" | "PAYMENT";
  amount: number;
  reference_number: string;
  created_by: string;
  created_at: string;
}

interface Supplier {
  id: number;
  name: string;
  type: "TIRE_SUPPLIER" | "RETREAD_SUPPLIER" | "SERVICE_PROVIDER" | "OTHER";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  created_at: string;
  ledger: SupplierLedgerEntry[];
}

// Extended interface for ledger entries with calculated fields
interface LedgerEntryWithBalance extends SupplierLedgerEntry {
  debit: number;
  credit: number;
  runningBalance: number;
}

type SortDirection = "asc" | "desc";

export default function SupplierLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sorting state
  const [dateSortDirection, setDateSortDirection] = useState<SortDirection>("desc");
  
  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const supplierId = params.id;

  useEffect(() => {
    if (supplierId) {
      fetchSupplierDetails();
    }
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch supplier details");
      }
      const data = await response.json();
      setSupplier(data);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      toast.error("Failed to load supplier details");
    } finally {
      setLoading(false);
    }
  };

  const getSupplierTypeLabel = (type: string) => {
    switch (type) {
      case "TIRE_SUPPLIER":
        return "Tire Supplier";
      case "RETREAD_SUPPLIER":
        return "Retread Supplier";
      case "SERVICE_PROVIDER":
        return "Service Provider";
      case "OTHER":
        return "Other";
      default:
        return type;
    }
  };

  const getSupplierTypeColor = (type: string) => {
    switch (type) {
      case "TIRE_SUPPLIER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RETREAD_SUPPLIER":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "SERVICE_PROVIDER":
        return "bg-green-100 text-green-800 border-green-200";
      case "OTHER":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "Purchase";
      case "RETREAD_SERVICE":
        return "Retread Service";
      case "PAYMENT":
        return "Payment";
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
      case "RETREAD_SERVICE":
        return "bg-red-100 text-red-800 border-red-200";
      case "PAYMENT":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to calculate running balances - CHRONOLOGICAL ORDER ONLY
  const calculateRunningBalancesChronological = (ledger: SupplierLedgerEntry[]): LedgerEntryWithBalance[] => {
    // Sort ledger by date (oldest first) to calculate running balance correctly
    const sortedLedger = [...ledger].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let runningBalance = 0;
    
    return sortedLedger.map((entry) => {
      let debit = 0;
      let credit = 0;
      
      if (entry.transaction_type === "PURCHASE" || entry.transaction_type === "RETREAD_SERVICE") {
        debit = entry.amount;
        runningBalance += entry.amount;
      } else if (entry.transaction_type === "PAYMENT") {
        credit = entry.amount;
        runningBalance -= entry.amount;
      }
      
      return {
        ...entry,
        debit,
        credit,
        runningBalance
      };
    });
  };

  // Get ALL calculated ledger entries with balances (in chronological order)
  const getAllCalculatedLedger = (): LedgerEntryWithBalance[] => {
    if (!supplier) return [];
    return calculateRunningBalancesChronological(supplier.ledger);
  };

  // Get data for display (filtered and sorted)
  const getDisplayData = (): LedgerEntryWithBalance[] => {
  if (!supplier) return [];

  // 1️⃣ Start from raw ledger
  let data = [...supplier.ledger];

  // 2️⃣ Apply date filters FIRST
  if (startDate || endDate) {
    data = data.filter((entry) => {
      const entryDate = new Date(entry.date);

      if (startDate && endDate) {
        return entryDate >= startDate && entryDate <= endDate;
      }
      if (startDate) {
        return entryDate >= startDate;
      }
      if (endDate) {
        return entryDate <= endDate;
      }
      return true;
    });
  }

  // 3️⃣ Sort by selected direction (THIS defines balance flow)
  data.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return dateSortDirection === "asc"
      ? aTime - bTime
      : bTime - aTime;
  });

  // 4️⃣ Recalculate running balance IN DISPLAY ORDER
  let runningBalance = 0;

  return data.map((entry) => {
    let debit = 0;
    let credit = 0;

    if (entry.transaction_type === "PURCHASE" || entry.transaction_type === "RETREAD_SERVICE") {
      debit = entry.amount;
      runningBalance += entry.amount;
    } else if (entry.transaction_type === "PAYMENT") {
      credit = entry.amount;
      runningBalance -= entry.amount;
    }

    return {
      ...entry,
      debit,
      credit,
      runningBalance,
    };
  });
};
  // Toggle date sorting direction
  const toggleDateSort = () => {
    setDateSortDirection(dateSortDirection === "asc" ? "desc" : "asc");
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  // Get paginated data for display
  const getPaginatedData = () => {
    const displayData = getDisplayData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return displayData.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const getTotalPages = () => {
    const displayData = getDisplayData();
    return Math.ceil(displayData.length / itemsPerPage);
  };

  // Handle page changes
  const goToPage = (page: number) => {
    const totalPages = getTotalPages();
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(getTotalPages());
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPreviousPage = () => goToPage(currentPage - 1);

  // Check if date filter is active
  const isDateFilterActive = startDate !== undefined || endDate !== undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium">Supplier not found</h3>
          <p className="text-muted-foreground mt-1">
            The supplier you're looking for doesn't exist
          </p>
          <Button className="mt-4" asChild>
            <Link href="/suppliers">Back to Suppliers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const paginatedData = getPaginatedData();
  const totalPages = getTotalPages();
  const displayData = getDisplayData();
  const totalFilteredItems = displayData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {supplier.name} - Transaction Ledger
            </h1>
            <p className="text-muted-foreground">
              Complete transaction history and current balance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${supplier.id}/payment`}>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment
            </Link>
          </Button>
          <Button variant="outline" onClick={fetchSupplierDetails}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
            <CardDescription>Supplier details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Supplier Type: </span>
              <Badge
                variant="outline"
                className={getSupplierTypeColor(supplier.type)}
              >
                {getSupplierTypeLabel(supplier.type)}
              </Badge>
            </div>
            
            {supplier.contact_person && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Contact: </span>
                  {supplier.contact_person}
                </span>
              </div>
            )}
            
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Phone: </span>
                  {supplier.phone}
                </span>
              </div>
            )}
            
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">Email: </span>
                  {supplier.email}
                </span>
              </div>
            )}
            
            {supplier.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                  <span className="font-medium">Address: </span>
                  {supplier.address}
                </span>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="text-center p-4 rounded-lg bg-muted">
                <div className="text-sm font-medium mb-2">Current Balance</div>
                <div className={`text-3xl font-bold ${
                  supplier.balance > 0 
                    ? "text-red-600" 
                    : "text-green-600"
                }`}>
                  {supplier.balance > 0 ? "+" : ""}
                  {formatCurrency(supplier.balance)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {supplier.balance > 0 
                    ? "Amount owed to supplier"
                    : "Credit balance with supplier"}
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Added On:</span>
                  <span>{formatDate(supplier.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transactions:</span>
                  <span>{supplier.ledger.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Ledger Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All transactions with this supplier
              </CardDescription>
            </div>
            
            {/* Date Filter Button */}
            <div className="flex items-center gap-2">
              {isDateFilterActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilters}
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
              <div className="flex gap-2">
                <div className="relative">
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-3 w-3 mr-1" />
                    From:
                    <input
                      type="date"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setStartDate(date);
                        setCurrentPage(1);
                      }}
                      value={startDate ? startDate.toISOString().split('T')[0] : ''}
                    />
                  </Button>
                  {startDate && (
                    <div className="text-xs text-center mt-1">
                      {formatDate(startDate.toISOString())}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-3 w-3 mr-1" />
                    To:
                    <input
                      type="date"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setEndDate(date);
                        setCurrentPage(1);
                      }}
                      value={endDate ? endDate.toISOString().split('T')[0] : ''}
                    />
                  </Button>
                  {endDate && (
                    <div className="text-xs text-center mt-1">
                      {formatDate(endDate.toISOString())}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {supplier.ledger.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-medium">No transactions yet</h4>
                <p className="text-sm text-muted-foreground">
                  Start by making a purchase or recording a payment
                </p>
              </div>
            ) : (
              <>
                {/* Filter summary */}
                {(isDateFilterActive || totalFilteredItems !== supplier.ledger.length) && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        Showing {totalFilteredItems} of {supplier.ledger.length} transactions
                        {isDateFilterActive && " (filtered)"}
                      </div>
                      <div className="text-sm">
                        Page {currentPage} of {totalPages}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-medium hover:bg-transparent"
                            onClick={toggleDateSort}
                          >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                          <div className="text-xs font-normal mt-1">
                            {dateSortDirection === "desc" ? "Newest first" : "Oldest first"}
                          </div>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">
                              No transactions found with the current filters
                            </p>
                            {isDateFilterActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearDateFilters}
                                className="mt-2"
                              >
                                Clear Filters
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div className="font-medium">
                                {formatDateTime(entry.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>{entry.description}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={`h-5 text-xs ${getTransactionTypeColor(entry.transaction_type)}`}
                                >
                                  {getTransactionTypeLabel(entry.transaction_type)}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  By: {entry.created_by}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {entry.reference_number || "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.debit > 0 ? (
                                <div className="font-mono font-medium text-red-600">
                                  {formatCurrency(entry.debit)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.credit > 0 ? (
                                <div className="font-mono font-medium text-green-600">
                                  {formatCurrency(entry.credit)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className={`font-mono font-medium ${
                                entry.runningBalance > 0 
                                  ? "text-red-600" 
                                  : entry.runningBalance < 0 
                                    ? "text-green-600" 
                                    : "text-gray-600"
                              }`}>
                                {entry.runningBalance > 0 ? "+" : ""}
                                {formatCurrency(Math.abs(entry.runningBalance))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, totalFilteredItems)} of {totalFilteredItems} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Calculate which pages to show
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8"
                              onClick={() => goToPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}