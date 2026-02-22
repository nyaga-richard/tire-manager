"use client";

import React, { useState } from "react";
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
  ChevronDown,
  ChevronUp,
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
import { useSettings } from "@/hooks/useSettings";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

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

// Custom tooltip component for better formatting
const CustomTooltip = ({ active, payload, label, currencySymbol }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-2 sm:p-3 max-w-[200px] sm:max-w-none">
        <p className="font-medium mb-1 sm:mb-2 text-xs sm:text-sm truncate">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
            <span style={{ color: entry.color }} className="truncate max-w-[100px]">{entry.name}:</span>
            <span className="font-mono font-medium whitespace-nowrap">
              {entry.name.toLowerCase().includes('amount') || entry.dataKey === 'total'
                ? `${currencySymbol} ${Number(entry.value).toLocaleString()}`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartsSection({ 
  charts, 
  loading = false 
}: ChartsSectionProps) {
  const { settings: systemSettings } = useSettings();
  const currencySymbol = systemSettings?.currency_symbol || "KSH";
  
  // Mobile collapsible state
  const [expandedSections, setExpandedSections] = useState({
    statusSummary: true,
    typesSummary: true,
    movementSummary: true,
    purchaseSummary: true,
  });

  const statusData = charts?.tire_status_distribution ?? [];
  const typeData = charts?.tire_type_distribution ?? [];
  const movementData = charts?.movement_trends ?? [];
  const purchaseData = charts?.purchase_trends ?? [];

  // Calculate summary metrics from existing data
  const totalTires = statusData.reduce((sum, item) => sum + item.count, 0);
  const criticalTires = statusData.find(h => 
    h.status.toLowerCase().includes('critical') || 
    h.status.toLowerCase().includes('bad') ||
    h.status.toLowerCase().includes('disposed')
  )?.count || 0;
  
  const installedTires = statusData.find(h => 
    h.status.toLowerCase().includes('installed') || 
    h.status.toLowerCase().includes('active') ||
    h.status.toLowerCase().includes('on_vehicle')
  )?.count || 0;
  
  const inStockTires = statusData.find(h => 
    h.status.toLowerCase().includes('stock') || 
    h.status.toLowerCase().includes('available') ||
    h.status.toLowerCase().includes('in_store')
  )?.count || 0;
  
  const awaitingRetread = statusData.find(h => 
    h.status.toLowerCase().includes('awaiting') || 
    h.status.toLowerCase().includes('retread')
  )?.count || 0;
  
  // Calculate totals from movements
  const totalInstallations = movementData.reduce((sum, item) => sum + item.installations, 0);
  const totalRemovals = movementData.reduce((sum, item) => sum + item.removals, 0);
  const netChange = totalInstallations - totalRemovals;
  
  // Calculate purchase totals
  const totalPurchaseAmount = purchaseData.reduce((sum, item) => sum + item.total, 0);
  const totalPurchaseCount = purchaseData.reduce((sum, item) => sum + item.count, 0);
  const averagePurchase = totalPurchaseCount > 0 ? totalPurchaseAmount / totalPurchaseCount : 0;

  // Calculate trends
  const getTrend = (data: PurchaseTrend[]) => {
    if (data.length < 2) return null;
    const last = data[data.length - 1]?.total || 0;
    const prev = data[data.length - 2]?.total || 0;
    const change = last - prev;
    const percentChange = prev !== 0 ? (change / prev) * 100 : 0;
    return { change, percentChange };
  };

  const purchaseTrend = getTrend(purchaseData);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-lg sm:text-xl">Tire Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 animate-pulse bg-muted rounded-lg" />
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
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-lg sm:text-xl">Tire Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-center p-4 sm:p-6">
            <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No Analytics Data Available</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select a date range or generate reports to view analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-lg sm:text-xl">Tire Analytics</span>
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Overview of tire status, movements, and purchases
            </p>
          </div>
          
          {/* Quick Stats Summary - Horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex items-center gap-2 min-w-max">
              {criticalTires > 0 && (
                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 sm:px-3 py-1 rounded-md">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-xs sm:text-sm">{criticalTires}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm hidden xs:inline">Critical</span>
                </div>
              )}
              {awaitingRetread > 0 && (
                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 sm:px-3 py-1 rounded-md">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-xs sm:text-sm">{awaitingRetread}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm hidden xs:inline">Retread</span>
                </div>
              )}
              {totalPurchaseAmount > 0 && (
                <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 sm:px-3 py-1 rounded-md">
                  <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                    {currencySymbol} {(totalPurchaseAmount/1000).toFixed(0)}K
                  </span>
                  <span className="text-muted-foreground text-xs sm:text-sm hidden xs:inline">Spent</span>
                </div>
              )}
              {netChange !== 0 && (
                <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md ${
                  netChange > 0 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    netChange > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                  <span className="font-medium text-xs sm:text-sm">{Math.abs(netChange)}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm hidden xs:inline">Net</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-3 sm:mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Movements</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Purchases</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-2 sm:mt-4">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Tire Status Distribution */}
              <Collapsible
                open={expandedSections.statusSummary}
                onOpenChange={() => toggleSection('statusSummary')}
                className="border rounded-lg lg:border-0 lg:rounded-none"
              >
                <div className="flex items-center justify-between p-3 lg:hidden">
                  <h3 className="font-medium text-sm">Tire Status</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      {expandedSections.statusSummary ? (
                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="lg:block">
                  <div className="p-3 lg:p-0">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="font-medium text-sm hidden lg:block">Tire Status</h3>
                      <span className="text-xs sm:text-sm text-muted-foreground">{totalTires} total</span>
                    </div>
                    <div className="h-48 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                            innerRadius="40%"
                            paddingAngle={2}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [value, name]}
                            labelFormatter={(label) => `Status: ${label}`}
                          />
                          <Legend 
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                            wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Status Summary - Scrollable on mobile */}
                    <div className="grid grid-cols-2 gap-1 sm:gap-2 mt-3 sm:mt-4">
                      {statusData.slice(0, 4).map((status, index) => (
                        <div key={index} className="flex items-center justify-between p-1.5 sm:p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <div 
                              className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0" 
                              style={{ backgroundColor: status.color }}
                            />
                            <span className="text-xs truncate max-w-[60px] sm:max-w-none">
                              {status.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-medium ml-1">{status.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Tire Types Distribution */}
              <Collapsible
                open={expandedSections.typesSummary}
                onOpenChange={() => toggleSection('typesSummary')}
                className="border rounded-lg lg:border-0 lg:rounded-none"
              >
                <div className="flex items-center justify-between p-3 lg:hidden">
                  <h3 className="font-medium text-sm">Tire Types</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      {expandedSections.typesSummary ? (
                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="lg:block">
                  <div className="p-3 lg:p-0">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="font-medium text-sm hidden lg:block">Tire Types</h3>
                      <span className="text-xs sm:text-sm text-muted-foreground">{typeData.length} types</span>
                    </div>
                    <div className="h-48 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={typeData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="type" 
                            angle={-45}
                            textAnchor="end"
                            height={50}
                            fontSize={10}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis fontSize={10} width={30} />
                          <Tooltip formatter={(value) => [value, "Count"]} />
                          <Bar 
                            dataKey="count" 
                            name="Count" 
                            radius={[4, 4, 0, 0]}
                            barSize={20}
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
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="font-medium">Most Common Type</span>
                          <span className="font-bold truncate max-w-[150px]">
                            {typeData.reduce((max, current) => current.count > max.count ? current : max).type}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="mt-2 sm:mt-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Movement Trends Chart */}
              <div>
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-2 sm:mb-3">
                  <h3 className="font-medium text-sm">Movement Trends</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
                      <span className="whitespace-nowrap">Installs: {totalInstallations}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500" />
                      <span className="whitespace-nowrap">Removals: {totalRemovals}</span>
                    </div>
                  </div>
                </div>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={movementData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" fontSize={10} tick={{ fontSize: 10 }} />
                      <YAxis fontSize={10} width={30} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="installations"
                        name="Installations"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="removals"
                        name="Removals"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Movement Summary - Collapsible on mobile */}
              <Collapsible
                open={expandedSections.movementSummary}
                onOpenChange={() => toggleSection('movementSummary')}
                className="border rounded-lg"
              >
                <div className="flex items-center justify-between p-3">
                  <h4 className="font-medium text-sm">Movement Summary</h4>
                  <CollapsibleTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      {expandedSections.movementSummary ? (
                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-medium text-xs sm:text-sm">Net Change</h4>
                        </div>
                        <p className={`text-lg sm:text-xl font-bold ${
                          netChange > 0 ? 'text-green-600' : 
                          netChange < 0 ? 'text-red-600' : ''
                        }`}>
                          {netChange > 0 ? '+' : ''}{netChange}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {netChange > 0 ? 'More installations' : 
                           netChange < 0 ? 'More removals' : 
                           'Balanced'}
                        </p>
                      </div>
                      
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
                          <h4 className="font-medium text-xs sm:text-sm">Installations</h4>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                          {totalInstallations}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last {movementData.length} periods
                        </p>
                      </div>
                      
                      <div className="p-3 border rounded-lg bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500" />
                          <h4 className="font-medium text-xs sm:text-sm">Removals</h4>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                          {totalRemovals}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last {movementData.length} periods
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="mt-2 sm:mt-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Purchase Trends Chart */}
              <div>
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-2 sm:mb-3">
                  <h3 className="font-medium text-sm">Purchase Trends</h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <div className="whitespace-nowrap">
                      <span>Total: {currencySymbol} {(totalPurchaseAmount/1000).toFixed(1)}K</span>
                    </div>
                    <div className="whitespace-nowrap">
                      <span className="font-medium">{totalPurchaseCount}</span>
                      <span className="text-muted-foreground ml-1">orders</span>
                    </div>
                  </div>
                </div>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={purchaseData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={10} tick={{ fontSize: 10 }} />
                      <YAxis 
                        yAxisId="left"
                        fontSize={10}
                        width={35}
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        fontSize={10}
                        width={30}
                      />
                      <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="total"
                        name={`Amount (${currencySymbol})`}
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        name="Order Count"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Purchase Summary - Collapsible on mobile */}
              <Collapsible
                open={expandedSections.purchaseSummary}
                onOpenChange={() => toggleSection('purchaseSummary')}
                className="border rounded-lg"
              >
                <div className="flex items-center justify-between p-3">
                  <h4 className="font-medium text-sm">Purchase Summary</h4>
                  <CollapsibleTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      {expandedSections.purchaseSummary ? (
                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium text-xs sm:text-sm mb-2">Purchase Summary</h4>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-muted-foreground">Total Spent</span>
                            <span className="font-medium whitespace-nowrap ml-2">
                              {currencySymbol} {totalPurchaseAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-muted-foreground">Total Orders</span>
                            <span className="font-medium">{totalPurchaseCount}</span>
                          </div>
                          {totalPurchaseCount > 0 && (
                            <>
                              <div className="flex justify-between items-center text-xs sm:text-sm">
                                <span className="text-muted-foreground">Average per Order</span>
                                <span className="font-medium whitespace-nowrap ml-2">
                                  {currencySymbol} {averagePurchase.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="pt-1.5 mt-1.5 border-t">
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                  <span className="text-muted-foreground">Items per Order</span>
                                  <span className="font-medium">
                                    {(totalPurchaseCount > 0 ? (totalPurchaseCount / purchaseData.length).toFixed(1) : 0)}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium text-xs sm:text-sm mb-2">Recent Activity</h4>
                        {purchaseData.length > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-muted-foreground">Last Month</span>
                              <span className="font-medium whitespace-nowrap ml-2">
                                {currencySymbol} {purchaseData[purchaseData.length - 1]?.total.toLocaleString() || 0}
                              </span>
                            </div>
                            {purchaseTrend && (
                              <>
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                  <span className="text-muted-foreground">Month-over-Month</span>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-xs sm:text-sm font-medium ${
                                      purchaseTrend.change > 0 ? 'text-green-600' : 
                                      purchaseTrend.change < 0 ? 'text-red-600' : ''
                                    }`}>
                                      {purchaseTrend.change > 0 ? '▲' : purchaseTrend.change < 0 ? '▼' : '•'}
                                    </span>
                                    <span className="font-medium whitespace-nowrap">
                                      {currencySymbol} {Math.abs(purchaseTrend.change).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                  <span className="text-muted-foreground">Change %</span>
                                  <span className={`text-xs sm:text-sm font-medium ${
                                    purchaseTrend.percentChange > 0 ? 'text-green-600' : 
                                    purchaseTrend.percentChange < 0 ? 'text-red-600' : ''
                                  }`}>
                                    {purchaseTrend.percentChange > 0 ? '+' : ''}
                                    {purchaseTrend.percentChange.toFixed(1)}%
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No purchase data available</p>
                        )}
                      </div>
                    </div>

                    {/* Monthly Breakdown - Scrollable on mobile */}
                    {purchaseData.length > 0 && (
                      <div className="mt-3 border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-3 py-1.5 font-medium text-xs">
                          Monthly Breakdown
                        </div>
                        <div className="max-h-40 overflow-y-auto divide-y">
                          {purchaseData.slice(-5).reverse().map((item, index) => (
                            <div key={index} className="flex items-center justify-between px-3 py-1.5 text-xs">
                              <span className="text-muted-foreground">{item.month}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono">{item.count} orders</span>
                                <span className="font-medium min-w-[80px] text-right">
                                  {currencySymbol} {item.total.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}