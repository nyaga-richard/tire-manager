"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  AlertCircle,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Hash,
  Info,
  User,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Supplier {
  id: number;
  name: string;
  type: string;
  balance: number;
  contact_person?: string;
  email?: string;
  phone?: string;
}

export default function AddPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstructionsSheetOpen, setIsInstructionsSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(),
    amount: 0,
    description: "",
    reference_number: "",
    payment_method: "CASH",
  });

  const supplierId = params.id;

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("accounting.create")) {
        router.push(`/suppliers/${supplierId}/ledger`);
        toast.error("You don't have permission to record payments");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router, supplierId]);

  useEffect(() => {
    if (supplierId && isAuthenticated && hasPermission("accounting.create")) {
      fetchSupplierDetails();
    }
  }, [supplierId, isAuthenticated, hasPermission]);

  const fetchSupplierDetails = async () => {
    try {
      setFetchLoading(true);
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/suppliers/${supplierId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Supplier not found");
        }
        throw new Error("Failed to fetch supplier details");
      }
      
      const data = await response.json();
      setSupplier(data);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      setError(error instanceof Error ? error.message : "Failed to load supplier details");
      toast.error("Failed to load supplier details", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE_URL}/api/suppliers/${supplierId}/payment`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          date: formData.date.toISOString().split("T")[0],
          created_by: user?.id,
          created_by_name: user?.full_name || user?.username || "System",
        }),
      });

      if (response.ok) {
        toast.success("Payment recorded successfully", {
          description: `Payment of ${formatCurrency(formData.amount)} to ${supplier.name} has been recorded`,
        });
        router.push(`/suppliers/${supplierId}/ledger`);
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      setError(error instanceof Error ? error.message : "Failed to record payment");
      toast.error("Failed to record payment", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full lg:col-span-2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied
  if (!hasPermission("accounting.create")) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/suppliers/${supplierId}/ledger`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Payment</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Record a payment to a supplier</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to record payments. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href={`/suppliers/${supplierId}/ledger`}>Return to Ledger</Link>
        </Button>
      </div>
    );
  }

  // Show loading state
  if (fetchLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/suppliers/${supplierId}/ledger`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/suppliers/${supplierId}/ledger`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Payment</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Record a payment to a supplier</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={fetchSupplierDetails} variant="outline" className="w-full sm:w-auto">
            Try Again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/suppliers/${supplierId}/ledger`}>Back to Ledger</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/suppliers/${supplierId}/ledger`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Supplier Not Found</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              The supplier you're looking for doesn't exist
            </p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Supplier ID: {supplierId} not found
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/suppliers">Return to Suppliers</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="accounting.create" action="create">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/suppliers/${supplierId}/ledger`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
                Add Payment to {supplier.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Record a payment made to this supplier
              </p>
            </div>
          </div>
          
          {/* Mobile Instructions Button */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsInstructionsSheetOpen(true)}
            >
              <Info className="mr-2 h-4 w-4" />
              Payment Instructions
            </Button>
          </div>
        </div>

        {/* Mobile Instructions Sheet */}
        <Sheet open={isInstructionsSheetOpen} onOpenChange={setIsInstructionsSheetOpen}>
          <SheetContent side="bottom" className="h-auto rounded-t-xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Instructions
              </SheetTitle>
              <SheetDescription>
                Guidelines for recording supplier payments
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm">Ensure payment amount is correct</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm">Reference number helps with reconciliation</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm">Balance updates immediately after recording</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <p className="text-sm">You can add multiple payments to the same supplier</p>
                </div>
              </div>
              
              {supplier.contact_person && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Contact Information</p>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{supplier.contact_person}</span>
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="break-all">{supplier.email}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <Card className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg sm:text-xl">Payment Details</CardTitle>
                <CardDescription>
                  Enter the payment information below. Fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Payment Date <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      date={formData.date}
                      onSelect={(date) => date && setFormData({ ...formData, date })}
                      className="w-full"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.amount || ""}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      disabled={loading}
                      className="text-right text-base"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method" className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Payment Method
                    </Label>
                    <select
                      id="payment_method"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => handleSelectChange("payment_method", e.target.value)}
                      disabled={loading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CHECK">Check</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Reference Number */}
                  <div className="space-y-2">
                    <Label htmlFor="reference_number" className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Reference Number
                    </Label>
                    <Input
                      id="reference_number"
                      name="reference_number"
                      value={formData.reference_number}
                      onChange={handleChange}
                      placeholder="e.g., CHQ-12345, TRANS-67890"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>

                  {/* Description - Full Width */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Description / Notes
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Optional description (e.g., invoice numbers, purpose)"
                      rows={3}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Recorded By Info - Desktop */}
                <div className="hidden sm:block text-xs text-muted-foreground border-t pt-4">
                  Recording payment as: {user?.full_name || user?.username || "System"} • 
                  Date: {formatDate(formData.date)}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t px-4 sm:px-6 py-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  asChild
                  disabled={loading}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  <Link href={`/suppliers/${supplierId}/ledger`}>Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || formData.amount <= 0}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Recording...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Record Payment
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Balance Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5" />
                Balance Summary
              </CardTitle>
              <CardDescription>Current financial status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 sm:p-6 rounded-lg bg-muted">
                <div className="text-sm font-medium mb-2">Current Balance</div>
                <div className={`text-2xl sm:text-3xl font-bold ${
                  supplier.balance > 0 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-green-600 dark:text-green-400"
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

              {formData.amount > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-medium">
                        {formatCurrency(supplier.balance)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Payment Amount:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -{formatCurrency(formData.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">New Balance:</span>
                      <span className={`font-bold ${
                        (supplier.balance - formData.amount) > 0 
                          ? "text-red-600 dark:text-red-400" 
                          : "text-green-600 dark:text-green-400"
                      }`}>
                        {formatCurrency(supplier.balance - formData.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Desktop Instructions */}
              <div className="hidden sm:block pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2 font-medium text-foreground">Payment Instructions:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Ensure payment amount is correct</li>
                    <li>Reference number helps with reconciliation</li>
                    <li>Balance updates immediately after recording</li>
                    <li>You can add multiple payments to the same supplier</li>
                  </ul>
                </div>
              </div>

              {/* Mobile Contact Info */}
              {supplier.contact_person && (
                <div className="sm:hidden pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Contact Person:</span>
                    <p className="font-medium mt-1">{supplier.contact_person}</p>
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Desktop Contact Info */}
            {supplier.contact_person && (
              <CardFooter className="hidden sm:block border-t px-6 py-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Contact Person:</span>
                  <p className="font-medium mt-1">{supplier.contact_person}</p>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Mobile Recorded By Info */}
        <div className="sm:hidden text-xs text-muted-foreground text-center">
          Recording payment as: {user?.full_name || user?.username || "System"} • 
          Date: {formatDate(formData.date)}
        </div>
      </div>
    </PermissionGuard>
  );
}