"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Database, Server } from "lucide-react";

export default function GRNDebugPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [grnId, setGrnId] = useState("");

  const testAPI = async (endpoint: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/${endpoint}`);
      const data = await response.json();
      
      setTestResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          success: response.ok,
          status: response.status,
          data: data,
          timestamp: new Date().toISOString()
        }
      }));

      if (response.ok) {
        toast.success(`✅ ${endpoint} API working`);
      } else {
        toast.error(`❌ ${endpoint} API error: ${response.status}`);
      }
    } catch (error: any) {
      setTestResults((prev: any) => ({
        ...prev,
        [endpoint]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
      toast.error(`❌ ${endpoint} API error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAllAPIs = () => {
    testAPI("grn");
    testAPI("grn/generate-number");
    testAPI("purchase-orders?limit=5");
  };

  const testSpecificGRN = async () => {
    if (!grnId) {
      toast.error("Please enter a GRN ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/grn/${grnId}`);
      const data = await response.json();
      
      setTestResults((prev: any) => ({
        ...prev,
        [`grn/${grnId}`]: {
          success: response.ok,
          status: response.status,
          data: data,
          timestamp: new Date().toISOString()
        }
      }));

      if (response.ok) {
        toast.success(`GRN ${grnId} found`);
      } else {
        toast.error(`GRN ${grnId} not found: ${response.status}`);
      }
    } catch (error: any) {
      toast.error(`Error testing GRN ${grnId}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">GRN Debug Page</h1>
        <p className="text-muted-foreground">Test GRN API endpoints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Testing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              API Testing
            </CardTitle>
            <CardDescription>Test GRN API endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Test Specific GRN</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter GRN ID"
                  value={grnId}
                  onChange={(e) => setGrnId(e.target.value)}
                />
                <Button onClick={testSpecificGRN} disabled={loading || !grnId}>
                  Test GRN
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => testAPI("grn")} disabled={loading}>
                Test /api/grn
              </Button>
              <Button onClick={() => testAPI("grn/generate-number")} disabled={loading}>
                Test Generate Number
              </Button>
              <Button onClick={() => testAPI("purchase-orders")} disabled={loading}>
                Test Purchase Orders
              </Button>
              <Button onClick={testAllAPIs} disabled={loading}>
                Test All APIs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
            <CardDescription>Check database tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>goods_received_notes table</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testAPI("grn?limit=1")}
                >
                  Check
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>tires table</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const response = await fetch("http://localhost:5000/api/inventory/store?limit=1");
                    const data = await response.json();
                    console.log("Tires table sample:", data);
                    toast.info(`Tires table has ${Array.isArray(data) ? data.length : 'unknown'} entries`);
                  }}
                >
                  Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>API response details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : Object.keys(testResults).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tests run yet
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(testResults).map(([endpoint, result]: [string, any]) => (
                <div key={endpoint} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <strong className="font-mono">/{endpoint}</strong>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {result.status && (
                    <div className="text-sm">
                      Status: <code>{result.status}</code>
                    </div>
                  )}
                  {result.error && (
                    <div className="text-sm text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        View response data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. First, test if the API endpoints are working</p>
          <p>2. Check if the database tables exist and have data</p>
          <p>3. Create a GRN from a purchase order first</p>
          <p>4. Then check if it appears in the GRNs list</p>
          <p className="text-muted-foreground mt-4">
            Common issues:
            - API not running (check localhost:5000)
            - CORS issues
            - Database connection problems
            - Table permissions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}