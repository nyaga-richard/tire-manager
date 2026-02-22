"use client";

import React, { useState } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Gauge,
  Target,
  Activity,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

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

const KPICardSkeleton = () => (
  <div className="flex flex-col p-3 sm:p-4 border rounded-lg">
    <div className="flex items-start justify-between mb-2 sm:mb-3">
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
    </div>
    <div className="space-y-2">
      <div className="h-6 sm:h-7 w-20 bg-muted rounded animate-pulse" />
      <div className="space-y-1">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-1.5 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  </div>
);

export default function KPIOverview({ kpis, loading = false }: KPIOverviewProps) {
  const { settings: systemSettings } = useSettings();
  const currencySymbol = systemSettings?.currency_symbol || "KSH";
  
  // Mobile collapsible state
  const [expandedSections, setExpandedSections] = useState({
    mainKPIs: true,
    additionalMetrics: true,
  });

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
      return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />;
    } else if (value >= target * 0.7) {
      return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />;
    }
    return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />;
  };

  // Calculate derived KPIs
  const calculateDerivedKPIs = () => {
    if (!kpis) return {};

    const savingsPerTire = kpis.new_tire_cost && kpis.retread_cost && kpis.retread_count
      ? (kpis.new_tire_cost - kpis.retread_cost) * kpis.retread_count
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
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Tires on vehicles',
      format: 'percent',
      target: 75,
      tooltip: 'Target: 75% or higher for optimal fleet utilization',
    },
    {
      title: 'Retread Rate',
      key: 'retread_rate',
      value: kpis?.retread_rate || 0,
      icon: Package,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Tires being retreaded',
      format: 'percent',
      target: 35,
      tooltip: 'Target: 35% retread rate for optimal cost savings',
    },
    {
      title: 'Inventory Turnover',
      key: 'monthly_turnover_rate',
      value: kpis?.monthly_turnover_rate || 0,
      icon: Gauge,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Monthly turnover rate',
      format: 'percent',
      target: 80,
      tooltip: 'Target: 80% turnover indicates healthy inventory movement',
    },
    {
      title: 'Annual Savings',
      key: 'annual_retread_savings',
      value: kpis?.annual_retread_savings || 0,
      icon: DollarSign,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      description: 'Savings from retreading',
      format: 'currency',
      target: 1000000,
      tooltip: 'Based on current retread rate vs new tire costs',
    },
    {
      title: 'Tires per Vehicle',
      key: 'avg_tires_per_vehicle',
      value: kpis?.avg_tires_per_vehicle || 0,
      icon: Activity,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Average tires per vehicle',
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
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      format: 'number' as const,
    },
    {
      title: 'Total Tires',
      value: kpis?.total_tires || 0,
      icon: Package,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      format: 'number' as const,
    },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="text-center py-6 sm:py-8 text-muted-foreground">
        <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
        <p className="text-sm sm:text-base">No KPI data available</p>
        <p className="text-xs sm:text-sm mt-1 sm:mt-2">
          Generate reports or collect data to view KPIs
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Efficiency Score */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {derived.efficiencyScore && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
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
        </div>

        {/* Main KPIs Section */}
        <Collapsible
          open={expandedSections.mainKPIs}
          onOpenChange={() => toggleSection('mainKPIs')}
          className="space-y-3 sm:space-y-4"
        >
          <div className="flex items-center justify-between sm:hidden">
            <h3 className="text-sm font-medium text-muted-foreground">Performance Metrics</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {expandedSections.mainKPIs ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="sm:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {kpiCards.map((kpi, index) => {
                const Icon = kpi.icon;
                const displayValue = formatValue(kpi.value, kpi.format);
                const statusColor = getStatusColor(kpi.value, kpi.target);
                const progressWidth = getProgressWidth(kpi.value, kpi.target);
                const TrendIcon = getTrendIcon(kpi.value, kpi.target);
                
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow cursor-help">
                        {/* Header with icon and trend */}
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", kpi.bgColor)}>
                            <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", kpi.color)} />
                          </div>
                          <div className="flex items-center gap-1">
                            {TrendIcon}
                            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/50" />
                          </div>
                        </div>
                        
                        {/* Value */}
                        <div className="space-y-1 sm:space-y-2">
                          <h3 className={cn("text-lg sm:text-xl lg:text-2xl font-bold truncate", statusColor)}>
                            {displayValue}
                            {kpi.unit && (
                              <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-1">
                                {kpi.unit}
                              </span>
                            )}
                          </h3>
                          
                          {/* Title and Description */}
                          <div>
                            <p className="text-xs sm:text-sm font-medium truncate">{kpi.title}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {kpi.description}
                            </p>
                          </div>
                          
                          {/* Progress bar */}
                          {kpi.target ? (
                            <div className="mt-1 sm:mt-2">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs mb-0.5">
                                <span className="text-muted-foreground">Target</span>
                                <span className={cn("font-medium", statusColor)}>
                                  {((kpi.value / kpi.target) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-1 sm:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full transition-all", statusColor.replace('text', 'bg'))}
                                  style={{ width: progressWidth }}
                                />
                              </div>
                            </div>
                          ) : (
                            // Spacer for consistency
                            <div className="h-[22px] sm:h-[26px]" />
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] sm:max-w-xs">
                      <p className="text-xs sm:text-sm">{kpi.tooltip}</p>
                      {kpi.target && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Target: {formatValue(kpi.target, kpi.format)}
                          {kpi.unit && ` ${kpi.unit}`}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Additional Metrics */}
        {(additionalMetrics.some(m => m.value > 0) || derived.savingsPerTire) && (
          <Collapsible
            open={expandedSections.additionalMetrics}
            onOpenChange={() => toggleSection('additionalMetrics')}
            className="pt-4 sm:pt-6 border-t"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Additional Metrics
              </h3>
              <CollapsibleTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {expandedSections.additionalMetrics ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="sm:block">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {additionalMetrics.map((metric, index) => (
                  metric.value > 0 && (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg"
                    >
                      <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", metric.bgColor)}>
                        <metric.icon className={cn("h-3 w-3 sm:h-4 sm:w-4", metric.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {metric.title}
                        </p>
                        <p className="text-sm sm:text-base font-bold truncate">
                          {metric.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                ))}
                
                {derived.savingsPerTire && (
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        Savings per Retread
                      </p>
                      <p className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400 truncate">
                        {currencySymbol} {derived.savingsPerTire.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </TooltipProvider>
  );
}