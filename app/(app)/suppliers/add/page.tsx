"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building, AlertCircle, Save, Info, Phone, Mail, User, MapPin, CreditCard, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddSupplierPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [loading, setLoading] = useState(false);
  const [isHelpSheetOpen, setIsHelpSheetOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "TIRE_SUPPLIER" as "TIRE_SUPPLIER" | "RETREAD_SUPPLIER" | "SERVICE_PROVIDER" | "OTHER",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_id: "",
    payment_terms: "",
    credit_limit: "",
  });

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("supplier.create")) {
        toast.error("You don't have permission to add suppliers");
        router.push("/suppliers");
      }
    }
  }, [authLoading, isAuthenticated, hasPermission, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
    
    // Double-check permission before submission
    if (!hasPermission("supplier.create")) {
      toast.error("You don't have permission to add suppliers");
      router.push("/suppliers");
      return;
    }
    
    setLoading(true);

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/suppliers`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
          created_by: user?.id,
        }),
      });

      if (response.ok) {
        toast.success("Supplier added successfully", {
          description: `${formData.name} has been added to your suppliers list`,
        });
        router.push("/suppliers");
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add supplier");
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast.error("Failed to add supplier", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <div className="flex justify-between w-full">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show authentication error
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Show permission denied - fallback if redirect doesn't happen
  if (!hasPermission("supplier.create")) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add New Supplier</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Enter the supplier details below</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to add suppliers. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/suppliers">Return to Suppliers</Link>
        </Button>
      </div>
    );
  }

  // If user has permission, render the form
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add New Supplier</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Enter the supplier details below. Fields marked with * are required.
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1">
                {systemSettings.company_name} • {currencySymbol} ({currency})
              </p>
            )}
          </div>
        </div>
        
        {/* Mobile Help Button */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsHelpSheetOpen(true)}
          >
            <Info className="mr-2 h-4 w-4" />
            Registration Tips
          </Button>
        </div>
      </div>

      {/* Mobile Help Sheet */}
      <Sheet open={isHelpSheetOpen} onOpenChange={setIsHelpSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Supplier Registration Tips
            </SheetTitle>
            <SheetDescription>
              Helpful information when adding a new supplier
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-sm">Supplier names should be unique in the system</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p className="text-sm">Add at least one contact method (phone or email)</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p className="text-sm">Credit limit can be set later if not determined now</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <p className="text-sm">Payment terms default to Net 30 days</p>
            </div>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">
              Creating supplier as: {user?.full_name || user?.username || "Unknown"}
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl">Supplier Information</CardTitle>
            <CardDescription>
              Enter the details of the new supplier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Supplier Name - Full width on mobile */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Supplier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  required
                  disabled={loading}
                  className="uppercase w-full"
                />
              </div>

              {/* Supplier Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Supplier Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TIRE_SUPPLIER">Tire Supplier</SelectItem>
                    <SelectItem value="RETREAD_SUPPLIER">Retread Supplier</SelectItem>
                    <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact Person */}
              <div className="space-y-2">
                <Label htmlFor="contact_person" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Contact Person
                </Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="Enter contact person name"
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Tax ID / VAT Number */}
              <div className="space-y-2">
                <Label htmlFor="tax_id" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Tax ID / VAT Number
                </Label>
                <Input
                  id="tax_id"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  placeholder="Enter tax ID"
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="payment_terms" className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Payment Terms
                </Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => handleSelectChange("payment_terms", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net_15">Net 15 Days</SelectItem>
                    <SelectItem value="net_30">Net 30 Days</SelectItem>
                    <SelectItem value="net_45">Net 45 Days</SelectItem>
                    <SelectItem value="net_60">Net 60 Days</SelectItem>
                    <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credit Limit */}
              <div className="space-y-2">
                <Label htmlFor="credit_limit" className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Credit Limit ({currencySymbol})
                </Label>
                <Input
                  id="credit_limit"
                  name="credit_limit"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  placeholder={`Enter credit limit in ${currencySymbol}`}
                  disabled={loading}
                  className="w-full"
                />
              </div>

              {/* Address - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                  rows={3}
                  disabled={loading}
                  className="w-full"
                />
              </div>
            </div>

            {/* Desktop Help Text - Hidden on Mobile */}
            <div className="hidden sm:block rounded-lg bg-muted p-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Supplier Registration Tips</p>
                  <p className="text-sm text-muted-foreground">
                    • Supplier names should be unique in the system<br />
                    • Add at least one contact method (phone or email)<br />
                    • Credit limit can be set later if not determined now<br />
                    • Payment terms default to Net 30 days
                  </p>
                </div>
              </div>
            </div>

            {/* Created By Info - Desktop */}
            <div className="hidden sm:block text-xs text-muted-foreground border-t pt-4">
              Creating supplier as: {user?.full_name || user?.username || "Unknown"}
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
              <Link href="/suppliers">Cancel</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Supplier
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Mobile Created By Info */}
      <div className="sm:hidden text-xs text-muted-foreground text-center">
        Creating supplier as: {user?.full_name || user?.username || "Unknown"}
      </div>

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
    </div>
  );
}