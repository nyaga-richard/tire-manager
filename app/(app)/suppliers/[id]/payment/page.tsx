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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

interface Supplier {
  id: number;
  name: string;
  balance: number;
}

export default function AddPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(),
    amount: 0,
    description: "",
    reference_number: "",
    created_by: "Admin",
  });

  const supplierId = params.id;

  useEffect(() => {
    if (supplierId) {
      fetchSupplierDetails();
    }
  }, [supplierId]);

  const fetchSupplierDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch supplier details");
      }
      const data = await response.json();
      setSupplier(data);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      toast.error("Failed to load supplier details");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          date: formData.date.toISOString().split("T")[0],
        }),
      });

      if (response.ok) {
        toast.success("Payment recorded successfully");
        router.push(`/suppliers/${supplierId}/ledger`);
        router.refresh();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KSH",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!supplier) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/suppliers/${supplierId}/ledger`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Add Payment to {supplier.name}
          </h1>
          <p className="text-muted-foreground">
            Record a payment made to this supplier
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter the payment information below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Payment Date *</Label>
                  <DatePicker
                    date={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter payment amount"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleChange}
                    placeholder="e.g., CHQ-12345, TRANS-67890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="created_by">Recorded By</Label>
                  <Input
                    id="created_by"
                    name="created_by"
                    value={formData.created_by}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Optional description of the payment"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline" type="button" asChild>
                <Link href={`/suppliers/${supplierId}/ledger`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading || formData.amount <= 0}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording Payment...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Balance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Balance Summary</CardTitle>
            <CardDescription>Current financial status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-lg bg-muted">
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
                    <span className="font-medium text-green-600">
                      -{formatCurrency(formData.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">New Balance:</span>
                    <span className={`font-bold ${
                      (supplier.balance - formData.amount) > 0 
                        ? "text-red-600" 
                        : "text-green-600"
                    }`}>
                      {formatCurrency(supplier.balance - formData.amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Payment Instructions:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Ensure payment details are accurate</li>
                  <li>Reference number helps with reconciliation</li>
                  <li>Balance updates immediately after recording</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}