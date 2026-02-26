"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "tires" | "vehicles";
  onSuccess: () => void;
}

interface UploadResult {
  success: Array<any>;
  errors: Array<{ row: any; error: string }>;
  total: number;
}

export function CSVUploadModal({ isOpen, onClose, type, onSuccess }: CSVUploadModalProps) {
  const { user, authFetch } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload");
  const [previewData, setPreviewData] = useState<any[]>([]);

  const title = type === "tires" ? "Upload Tires" : "Upload Vehicles";
  const description = type === "tires" 
    ? "Upload multiple tires to inventory using a CSV file"
    : "Upload vehicles and their tire assignments using a CSV file";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewCSV(selectedFile);
    }
  };

  const previewCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(0, 5); // Preview first 5 rows
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj: any, header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
          return obj;
        }, {});
      }).filter(row => Object.values(row).some(v => v));
      setPreviewData(data);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = async () => {
    try {
      const endpoint = type === "tires" 
        ? `${API_BASE_URL}/api/inventory/tires-template`
        : `${API_BASE_URL}/api/inventory/vehicles-template`;

      const response = await fetch(endpoint);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === "tires" 
        ? 'tires-upload-template.csv'
        : 'vehicles-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setProgress(0);
    setResults(null);
    setActiveTab("upload");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user?.id?.toString() || '');

    try {
      const endpoint = type === "tires"
        ? `${API_BASE_URL}/api/inventory/upload-tires`
        : `${API_BASE_URL}/api/inventory/upload-vehicles`;

      const response = await authFetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResults(data.results);
      setProgress(100);
      setActiveTab("results");

      if (data.results.errors.length === 0) {
        toast.success(data.message || "Upload completed successfully");
        onSuccess();
      } else {
        toast.warning(`Upload completed with ${data.results.errors.length} errors`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    setActiveTab("upload");
    setPreviewData([]);
    setProgress(0);
    onClose();
  };

  const downloadErrorReport = () => {
    if (!results?.errors.length) return;

    const csvContent = [
      ['Error', ...Object.keys(results.errors[0].row || {})].join(','),
      ...results.errors.map(err => {
        const rowValues = Object.values(err.row || {}).join(',');
        return `"${err.error}",${rowValues}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload-errors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const successRate = results 
    ? Math.round((results.success.length / results.total) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="min-w-[70%] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a CSV file with the required fields
                </p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Preview (first {previewData.length} rows)</h4>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData[0] || {}).map((key) => (
                            <TableHead key={key} className="text-xs">
                              {key}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((value: any, j) => (
                              <TableCell key={j} className="text-xs font-mono">
                                {value || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {results && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {results.success.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Successful</p>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {results.errors.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold">{results.total}</div>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </Card>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span>{successRate}%</span>
                  </div>
                  <Progress value={successRate} className="w-full" />
                </div>

                {results.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-red-600">Errors</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadErrorReport}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Error Report
                      </Button>
                    </div>
                    <ScrollArea className="h-[200px] rounded-md border">
                      <div className="p-4 space-y-2">
                        {results.errors.map((error, i) => (
                          <Alert key={i} variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="ml-2 text-xs">
                              <span className="font-medium">Row {i + 1}:</span> {error.error}
                              {error.row?.serial_number && (
                                <span className="block font-mono text-xs mt-1">
                                  Serial: {error.row.serial_number}
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {results.success.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-green-600">
                      Successfully Imported
                    </h4>
                    <ScrollArea className="h-[150px] rounded-md border">
                      <div className="p-2 space-y-1">
                        {results.success.slice(0, 10).map((item, i) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="font-mono">
                              {item.serial_number || item.vehicle_number}
                            </span>
                          </div>
                        ))}
                        {results.success.length > 10 && (
                          <p className="text-xs text-muted-foreground pt-1">
                            ...and {results.success.length - 10} more
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {activeTab === "upload" && (
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple Card component for results display
function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}