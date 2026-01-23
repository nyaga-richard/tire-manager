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

export default function SupplierLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

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
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              All transactions with this supplier
            </CardDescription>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplier.ledger.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">
                            {formatDateTime(entry.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{entry.description}</div>
                          <div className="text-xs text-muted-foreground">
                            By: {entry.created_by}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getTransactionTypeColor(entry.transaction_type)}
                          >
                            {getTransactionTypeLabel(entry.transaction_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.reference_number || "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`font-mono font-medium ${
                            entry.transaction_type === "PAYMENT"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}>
                            {entry.transaction_type === "PAYMENT" ? "-" : "+"}
                            {formatCurrency(entry.amount)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}