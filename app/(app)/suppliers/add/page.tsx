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
import { ArrowLeft, Building, AlertCircle, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AddSupplierPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
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

  // Check authentication and permission
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!hasPermission("supplier.create")) {
        router.push("/suppliers");
        toast.error("You don't have permission to add suppliers");
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
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 7 }).map((_, i) => (
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

  // Show permission denied
  if (!hasPermission("supplier.create")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Supplier</h1>
            <p className="text-muted-foreground">Enter the supplier details below</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to add suppliers. Please contact your administrator.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/suppliers">Return to Suppliers</Link>
        </Button>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="supplier.create" action="create">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Supplier</h1>
            <p className="text-muted-foreground">
              Enter the supplier details below. Fields marked with * are required.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
              <CardDescription>
                Enter the details of the new supplier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
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
                    className="uppercase"
                  />
                </div>

                {/* Supplier Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Supplier Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                    disabled={loading}
                    required
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                    disabled={loading}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                </div>

                {/* Tax ID / VAT Number */}
                <div className="space-y-2">
                  <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    placeholder="Enter tax ID"
                    disabled={loading}
                  />
                </div>

                {/* Payment Terms */}
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select
                    value={formData.payment_terms}
                    onValueChange={(value) => handleSelectChange("payment_terms", value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="credit_limit">Credit Limit (KES)</Label>
                  <Input
                    id="credit_limit"
                    name="credit_limit"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.credit_limit}
                    onChange={handleChange}
                    placeholder="Enter credit limit"
                    disabled={loading}
                  />
                </div>

                {/* Address - Full Width */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Help Text */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
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

              {/* Created By Info */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                Creating supplier as: {user?.full_name || user?.username || "Unknown"}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button 
                variant="outline" 
                type="button" 
                asChild
                disabled={loading}
              >
                <Link href="/suppliers">Cancel</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.name.trim()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Supplier...
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
      </div>
    </PermissionGuard>
  );
}