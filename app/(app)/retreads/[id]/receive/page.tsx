"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Package,
  Ruler,
  Weight,
  Calendar,
  FileText,
} from "lucide-react";

interface ReceivedTire {
  id: number;
  serial_number: string;
  size: string;
  brand: string;
  model: string;
  received_depth: number;
  quality: "GOOD" | "ACCEPTABLE" | "POOR";
  notes: string;
  status: "PENDING" | "RECEIVED" | "REJECTED";
}

export default function ReceiveRetreadOrderPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [tires, setTires] = useState<ReceivedTire[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/retread-orders/${params.id}/receive`);
      const data = await response.json();
      if (data.success) {
        setOrderNumber(data.data.order_number);
        setTires(data.data.tires.map((tire: any) => ({
          ...tire,
          status: "PENDING",
          quality: "GOOD",
          received_depth: tire.expected_depth || 0,
          notes: "",
        })));
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTireChange = (tireId: number, field: keyof ReceivedTire, value: any) => {
    setTires(prev =>
      prev.map(tire =>
        tire.id === tireId ? { ...tire, [field]: value } : tire
      )
    );
  };

  const handleStatusChange = (tireId: number, status: "RECEIVED" | "REJECTED") => {
    setTires(prev =>
      prev.map(tire =>
        tire.id === tireId ? { ...tire, status } : tire
      )
    );
  };

  const handleSelectAll = (status: "RECEIVED" | "REJECTED") => {
    setTires(prev =>
      prev.map(tire => ({ ...tire, status }))
    );
  };

  const handleSubmit = async () => {
    // Validate all tires have status
    const invalidTires = tires.filter(t => t.status === "PENDING");
    if (invalidTires.length > 0) {
      alert("Please mark all tires as received or rejected");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/retread-orders/${params.id}/receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          received_date: receivedDate,
          notes,
          tires: tires.map(({ id, status, quality, received_depth, notes }) => ({
            tire_id: id,
            status,
            quality,
            received_depth,
            notes,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/retreads/${params.id}`);
      } else {
        alert(data.message || "Error receiving order");
      }
    } catch (error) {
      console.error("Error receiving order:", error);
      alert("Error receiving order");
    } finally {
      setSubmitting(false);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "GOOD": return "bg-green-100 text-green-800";
      case "ACCEPTABLE": return "bg-yellow-100 text-yellow-800";
      case "POOR": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RECEIVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Retread Order</h1>
          <p className="text-muted-foreground">
            Order #{orderNumber} - Record received tires
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receiving Information</CardTitle>
              <CardDescription>
                Enter the receipt date and any notes for this order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="received-date">Received Date *</Label>
                <Input
                  id="received-date"
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Receiving Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about the received order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tires Received</CardTitle>
                  <CardDescription>
                    Record the condition of each received tire
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll("RECEIVED")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark All Received
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll("REJECTED")}
                    className="text-red-600"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Mark All Rejected
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial #</TableHead>
                      <TableHead>Size/Brand</TableHead>
                      <TableHead>Received Depth</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tires.map((tire) => (
                      <TableRow key={tire.id}>
                        <TableCell className="font-mono font-medium">
                          {tire.serial_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{tire.size}</div>
                            <div className="text-xs text-muted-foreground">
                              {tire.brand} {tire.model}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={tire.received_depth}
                            onChange={(e) => handleTireChange(tire.id, "received_depth", parseFloat(e.target.value))}
                            className="w-20 h-8"
                            disabled={tire.status !== "RECEIVED"}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tire.quality}
                            onValueChange={(value: any) => handleTireChange(tire.id, "quality", value)}
                            disabled={tire.status !== "RECEIVED"}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GOOD">Good</SelectItem>
                              <SelectItem value="ACCEPTABLE">Acceptable</SelectItem>
                              <SelectItem value="POOR">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={tire.status}
                            onValueChange={(value: "RECEIVED" | "REJECTED") => handleStatusChange(tire.id, value)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="RECEIVED">Received</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Notes"
                            value={tire.notes}
                            onChange={(e) => handleTireChange(tire.id, "notes", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Tires:</span>
                    <span className="font-medium">{tires.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Received:</span>
                    <span className="font-medium text-green-600">
                      {tires.filter(t => t.status === "RECEIVED").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rejected:</span>
                    <span className="font-medium text-red-600">
                      {tires.filter(t => t.status === "REJECTED").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending:</span>
                    <span className="font-medium text-yellow-600">
                      {tires.filter(t => t.status === "PENDING").length}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Quality Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Good:</span>
                      <span className="font-medium">
                        {tires.filter(t => t.status === "RECEIVED" && t.quality === "GOOD").length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Acceptable:</span>
                      <span className="font-medium">
                        {tires.filter(t => t.status === "RECEIVED" && t.quality === "ACCEPTABLE").length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Poor:</span>
                      <span className="font-medium">
                        {tires.filter(t => t.status === "RECEIVED" && t.quality === "POOR").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || tires.some(t => t.status === "PENDING")}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Receiving
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>All tires must be marked as Received or Rejected</li>
                <li>Record the actual tread depth for received tires</li>
                <li>Rejected tires will be returned to the supplier</li>
                <li>Poor quality tires may require additional review</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}