"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Package,
  Gauge,
  Target,
  Activity,
  BarChart3,
  Info
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface KPI {
  tire_utilization_rate: number;
  avg_tires_per_vehicle: number;
  retread_rate: number;
  monthly_turnover_rate: number;
  annual_retread_savings: number;
  active_vehicles?: number;
  total_tires?: number;
  retread_count?: number;
  new_tire_cost?: number;
  retread_cost?: number;
}

interface KPIOverviewProps {
  kpis?: KPI;
  loading?: boolean;
}

interface KPICard {
  title: string;
  key: keyof KPI;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  format: 'percent' | 'currency' | 'number' | 'decimal';
  target?: number;
  tooltip?: string;
  unit?: string;
}

export default function KPIOverview({ kpis, loading = false }: KPIOverviewProps) {
  const { settings: systemSettings } = useSettings();
  const currencySymbol = systemSettings?.currency_symbol || "KSH";

  const formatValue = (value: number, format: 'percent' | 'currency' | 'number' | 'decimal', unit?: string) => {
    switch (format) {
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `${currencySymbol} ${value.toLocaleString()}`;
      case 'decimal':
        return value.toFixed(1);
      case 'number':
      default:
        return value.toLocaleString();
    }
  };

  const getStatusColor = (value: number, target?: number) => {
    if (!target) return 'text-foreground';
    if (value >= target) return 'text-green-600 dark:text-green-400';
    if (value >= target * 0.7) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressWidth = (value: number, target?: number) => {
    if (!target) return '0%';
    const percentage = (value / target) * 100;
    return `${Math.min(percentage, 100)}%`;
  };

  const getTrendIcon = (value: number, target?: number) => {
    if (!target) return null;
    if (value >= target) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value >= target * 0.7) {
      return <TrendingDown className="h-4 w-4 text-amber-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Calculate derived KPIs
  const calculateDerivedKPIs = () => {
    if (!kpis) return {};

    const savingsPerTire = kpis.new_tire_cost && kpis.retread_cost 
      ? (kpis.new_tire_cost - kpis.retread_cost) * (kpis.retread_count || 0)
      : undefined;

    const efficiencyScore = kpis.tire_utilization_rate && kpis.retread_rate
      ? (kpis.tire_utilization_rate * 0.4 + kpis.retread_rate * 0.6)
      : undefined;

    return {
      savingsPerTire,
      efficiencyScore
    };
  };

  const derived = calculateDerivedKPIs();

  const kpiCards: KPICard[] = [
    {
      title: 'Tire Utilization',
      key: 'tire_utilization_rate',
      value: kpis?.tire_utilization_rate || 0,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Percentage of tires on vehicles',
      format: 'percent',
      target: 75,
      tooltip: 'Target: 75% or higher for optimal fleet utilization',
    },
    {
      title: 'Retread Rate',
      key: 'retread_rate',
      value: kpis?.retread_rate || 0,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Percentage of retreaded tires',
      format: 'percent',
      target: 35,
      tooltip: 'Target: 35% retread rate for optimal cost savings',
    },
    {
      title: 'Inventory Turnover',
      key: 'monthly_turnover_rate',
      value: kpis?.monthly_turnover_rate || 0,
      icon: Gauge,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Monthly inventory turnover rate',
      format: 'percent',
      target: 80,
      tooltip: 'Target: 80% turnover indicates healthy inventory movement',
    },
    {
      title: 'Annual Savings',
      key: 'annual_retread_savings',
      value: kpis?.annual_retread_savings || 0,
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      description: 'Estimated savings from retreading',
      format: 'currency',
      target: 1000000,
      tooltip: 'Based on current retread rate vs new tire costs',
    },
    {
      title: 'Tires per Vehicle',
      key: 'avg_tires_per_vehicle',
      value: kpis?.avg_tires_per_vehicle || 0,
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Average tires per active vehicle',
      format: 'decimal',
      target: 6,
      unit: 'tires',
      tooltip: 'Target: 6-8 tires per vehicle depending on configuration',
    },
  ];

  // Additional metrics
  const additionalMetrics = [
    {
      title: 'Active Vehicles',
      value: kpis?.active_vehicles || 0,
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      format: 'number',
    },
    {
      title: 'Total Tires',
      value: kpis?.total_tires || 0,
      icon: Package,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      format: 'number',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No KPI data available</p>
            <p className="text-sm mt-2">
              Generate reports or collect data to view KPIs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Key Performance Indicators</span>
            {derived.efficiencyScore && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Efficiency Score:</span>
                <span className={cn(
                  "font-bold px-2 py-1 rounded",
                  derived.efficiencyScore >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  derived.efficiencyScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                )}>
                  {derived.efficiencyScore.toFixed(1)}%
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Main KPIs */}
            {kpiCards.map((kpi, index) => {
              const Icon = kpi.icon;
              const displayValue = formatValue(kpi.value, kpi.format);
              const statusColor = getStatusColor(kpi.value, kpi.target);
              const progressWidth = getProgressWidth(kpi.value, kpi.target);
              const TrendIcon = getTrendIcon(kpi.value, kpi.target);
              
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow cursor-help">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                          <Icon className={cn("h-5 w-5", kpi.color)} />
                        </div>
                        {TrendIcon}
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className={cn("text-2xl font-bold", statusColor)}>
                          {displayValue}
                          {kpi.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{kpi.unit}</span>}
                        </h3>
                        
                        <div>
                          <p className="text-sm font-medium">{kpi.title}</p>
                          <p className="text-xs text-muted-foreground">{kpi.description}</p>
                        </div>
                        
                        {/* Progress bar (if target exists) */}
                        {kpi.target && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className={cn("font-medium", statusColor)}>
                                {((kpi.value / kpi.target) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full", statusColor.replace('text', 'bg'))}
                                style={{ width: progressWidth }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{kpi.tooltip}</p>
                    {kpi.target && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: {formatValue(kpi.target, kpi.format)}
                        {kpi.unit && ` ${kpi.unit}`}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Additional Metrics */}
          {(additionalMetrics.some(m => m.value > 0) || derived.savingsPerTire) && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {additionalMetrics.map((metric, index) => (
                  metric.value > 0 && (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                        <metric.icon className={cn("h-4 w-4", metric.color)} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{metric.title}</p>
                        <p className="text-lg font-bold">{metric.value.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                ))}
                
                {derived.savingsPerTire && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Savings per Retread</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {currencySymbol} {derived.savingsPerTire.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}