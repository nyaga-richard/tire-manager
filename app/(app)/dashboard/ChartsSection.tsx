"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
} from "recharts";

interface TireStatus {
  status: string;
  count: number;
  color: string;
}

interface TireType {
  type: string;
  count: number;
  color: string;
}

interface MovementTrend {
  date: string;
  installations: number;
  removals: number;
}

interface PurchaseTrend {
  month: string;
  total: number;
  count: number;
}

interface ChartsSectionProps {
  charts?: {
    tire_status_distribution: TireStatus[];
    tire_type_distribution: TireType[];
    movement_trends: MovementTrend[];
    purchase_trends: PurchaseTrend[];
  };
  loading?: boolean;
}

export default function ChartsSection({ 
  charts, 
  loading = false 
}: ChartsSectionProps) {
  const statusData = charts?.tire_status_distribution ?? [];
  const typeData = charts?.tire_type_distribution ?? [];
  const movementData = charts?.movement_trends ?? [];
  const purchaseData = charts?.purchase_trends ?? [];

  // Calculate summary metrics from existing data
  const totalTires = statusData.reduce((sum, item) => sum + item.count, 0);
  const criticalTires = statusData.find(h => h.status.toLowerCase().includes('critical') || h.status.toLowerCase().includes('bad'))?.count || 0;
  const installedTires = statusData.find(h => h.status.toLowerCase().includes('installed') || h.status.toLowerCase().includes('active'))?.count || 0;
  const inStockTires = statusData.find(h => h.status.toLowerCase().includes('stock') || h.status.toLowerCase().includes('available'))?.count || 0;
  
  // Calculate totals from movements
  const totalInstallations = movementData.reduce((sum, item) => sum + item.installations, 0);
  const totalRemovals = movementData.reduce((sum, item) => sum + item.removals, 0);
  const netChange = totalInstallations - totalRemovals;
  
  // Calculate purchase totals
  const totalPurchaseAmount = purchaseData.reduce((sum, item) => sum + item.total, 0);
  const totalPurchaseCount = purchaseData.reduce((sum, item) => sum + item.count, 0);

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tire Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  const isEmpty = 
    statusData.length === 0 && 
    typeData.length === 0 && 
    movementData.length === 0 && 
    purchaseData.length === 0;

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tire Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex flex-col items-center justify-center text-center p-6">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data Available</h3>
            <p className="text-muted-foreground">
              Select a date range or generate reports to view analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tire Analytics
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Overview of tire status, movements, and purchases
            </p>
          </div>
          
          {/* Quick Stats Summary */}
          <div className="flex items-center gap-4 text-sm">
            {criticalTires > 0 && (
              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium">{criticalTires}</span>
                <span className="text-muted-foreground">Critical</span>
              </div>
            )}
            {totalPurchaseAmount > 0 && (
              <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-md">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">KSH {(totalPurchaseAmount/1000).toFixed(0)}K</span>
                <span className="text-muted-foreground">Spent</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Movements</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Purchases</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Combined view */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tire Status Distribution */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Tire Status</h3>
                  <span className="text-sm text-muted-foreground">{totalTires} total</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        // Removed the label prop entirely - no labels on the pie itself
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [value, name]}
                        labelFormatter={(label) => `Status: ${label}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Status Summary */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {statusData.slice(0, 4).map((status, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm truncate">{status.status}</span>
                      </div>
                      <span className="text-sm font-medium">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tire Types Distribution */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Tire Types</h3>
                  <span className="text-sm text-muted-foreground">{typeData.length} types</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="type" 
                        angle={-45}
                        textAnchor="end"
                        height={40}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value) => [value, "Count"]} />
                      <Bar 
                        dataKey="count" 
                        name="Count" 
                        radius={[2, 2, 0, 0]}
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Type Highlights */}
                {typeData.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Most Common Type</span>
                      <span className="text-sm">
                        {typeData.reduce((max, current) => current.count > max.count ? current : max).type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="mt-4">
            <div className="space-y-6">
              {/* Movement Trends Chart */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Movement Trends</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Installations: {totalInstallations}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Removals: {totalRemovals}</span>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={movementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="installations"
                        name="Installations"
                        stroke="#10B981"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="removals"
                        name="Removals"
                        stroke="#EF4444"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Movement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium">Net Change</h4>
                  </div>
                  <p className="text-2xl font-bold">{netChange}</p>
                  <p className="text-sm text-muted-foreground">
                    {netChange > 0 ? 'More installations than removals' : 
                     netChange < 0 ? 'More removals than installations' : 
                     'Balanced activity'}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <h4 className="font-medium">Total Installations</h4>
                  </div>
                  <p className="text-2xl font-bold">{totalInstallations}</p>
                  <p className="text-sm text-muted-foreground">
                    {movementData.length > 0 ? 'Last ' + movementData.length + ' periods' : 'No data'}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <h4 className="font-medium">Total Removals</h4>
                  </div>
                  <p className="text-2xl font-bold">{totalRemovals}</p>
                  <p className="text-sm text-muted-foreground">
                    {movementData.length > 0 ? 'Last ' + movementData.length + ' periods' : 'No data'}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="mt-4">
            <div className="space-y-6">
              {/* Purchase Trends Chart */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Purchase Trends</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>Total: KSH {totalPurchaseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{totalPurchaseCount}</span>
                      <span className="text-muted-foreground">purchases</span>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={purchaseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'total' ? `KSH ${Number(value).toLocaleString()}` : value,
                          name === 'total' ? 'Amount' : 'Count'
                        ]}
                        labelFormatter={(value) => `Month: ${value}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Amount (KSH)"
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Purchase Count"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Purchase Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Purchase Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Spent</span>
                      <span className="font-medium">KSH {totalPurchaseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Purchases</span>
                      <span className="font-medium">{totalPurchaseCount}</span>
                    </div>
                    {totalPurchaseCount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Average per Purchase</span>
                        <span className="font-medium">KSH {(totalPurchaseAmount / totalPurchaseCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Recent Activity</h4>
                  {purchaseData.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Month</span>
                        <span className="font-medium">
                          KSH {purchaseData[purchaseData.length - 1]?.total.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Month-over-Month</span>
                        <span className={`text-sm font-medium ${
                          purchaseData.length > 1 && 
                          purchaseData[purchaseData.length - 1]?.total > purchaseData[purchaseData.length - 2]?.total 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {purchaseData.length > 1 ? (
                            purchaseData[purchaseData.length - 1]?.total > purchaseData[purchaseData.length - 2]?.total 
                              ? '▲ Increase' 
                              : '▼ Decrease'
                          ) : '—'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No purchase data available</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}