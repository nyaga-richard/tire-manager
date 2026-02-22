"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Truck,
  Users,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  FileText,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

interface SummaryData {
  total_tires: number;
  total_vehicles: number;
  total_suppliers: number;
  total_purchases: number;
  total_movements: number;
  total_inventory_value: number;
  total_purchase_orders?: number;
  pending_orders?: number;
  total_grns?: number;
  total_retreads?: number;
  low_stock_count?: number;
}

interface StatsCardsProps {
  summary?: SummaryData;
  loading?: boolean;
}

interface StatCard {
  title: string;
  key: keyof SummaryData;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: string;
  trendColor?: string;
  formatter?: (value: number, currencySymbol?: string) => string;
  description?: string;
}

const statCards: StatCard[] = [
  {
    title: "Total Tires",
    key: "total_tires",
    icon: Package,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    trend: "+12%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Tires in inventory",
  },
  {
    title: "Active Vehicles",
    key: "total_vehicles",
    icon: Truck,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    trend: "+5%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Vehicles in fleet",
  },
  {
    title: "Suppliers",
    key: "total_suppliers",
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    trend: "+8%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Active suppliers",
  },
  {
    title: "Inventory Value",
    key: "total_inventory_value",
    icon: DollarSign,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    trend: "+15%",
    trendColor: "text-green-600 dark:text-green-400",
    formatter: (value: number, currencySymbol = "KSH") =>
      `${currencySymbol} ${value.toLocaleString()}`,
    description: "Total inventory value",
  },
  {
    title: "Monthly Movements",
    key: "total_movements",
    icon: TrendingUp,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    trend: "+20%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Tire movements this month",
  },
  {
    title: "Total Purchases",
    key: "total_purchases",
    icon: ShoppingCart,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    trend: "+18%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Purchase orders value",
    formatter: (value: number, currencySymbol = "KSH") =>
      `${currencySymbol} ${value.toLocaleString()}`,
  },
];

const optionalStatCards: StatCard[] = [
  {
    title: "Purchase Orders",
    key: "total_purchase_orders",
    icon: ShoppingCart,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    description: "Active purchase orders",
  },
  {
    title: "Pending Orders",
    key: "pending_orders",
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    description: "Awaiting delivery",
  },
  {
    title: "GRNs",
    key: "total_grns",
    icon: FileText,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    description: "Goods received notes",
  },
  {
    title: "Retreads",
    key: "total_retreads",
    icon: RefreshCw,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    description: "Tires in retread process",
  },
  {
    title: "Low Stock",
    key: "low_stock_count",
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    description: "Items below reorder point",
  },
];

const StatCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4 sm:p-5">
      <div className="space-y-3">
        {/* Header with icon skeleton */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-muted animate-pulse" />
        </div>
        {/* Value skeleton */}
        <div className="h-6 sm:h-7 w-24 bg-muted rounded animate-pulse mt-2" />
        {/* Trend skeleton */}
        <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
      </div>
    </CardContent>
  </Card>
);

export default function StatsCards({ summary, loading = false }: StatsCardsProps) {
  const { settings: systemSettings } = useSettings();
  const currencySymbol = systemSettings?.currency_symbol || "KSH";

  // Safe default object
  const safeSummary: SummaryData = summary ?? {
    total_tires: 0,
    total_vehicles: 0,
    total_suppliers: 0,
    total_purchases: 0,
    total_movements: 0,
    total_inventory_value: 0,
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cardsToShow = statCards.filter(
    (card) => safeSummary[card.key] !== undefined
  );

  const allCards = [
    ...cardsToShow,
    ...optionalStatCards.filter(
      (card) =>
        safeSummary[card.key] !== undefined &&
        (safeSummary[card.key] as number) > 0
    ),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {allCards.map((stat) => {
        const Icon = stat.icon;
        const rawValue = safeSummary[stat.key] ?? 0;

        const displayValue = stat.formatter
          ? stat.formatter(rawValue as number, currencySymbol)
          : Number(rawValue).toLocaleString();

        return (
          <Card 
            key={stat.key} 
            className="hover:shadow-lg transition-shadow overflow-hidden"
          >
            <CardContent className="p-4 sm:p-5">
              {/* Header with title and icon - consistent positioning */}
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  {stat.description && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70 truncate">
                      {stat.description}
                    </p>
                  )}
                </div>
                <div 
                  className={cn(
                    "p-1.5 sm:p-2 rounded-lg shrink-0",
                    stat.bgColor
                  )}
                >
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
                </div>
              </div>

              {/* Value - consistent sizing */}
              <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                {displayValue}
              </p>

              {/* Trend - consistent positioning */}
              {stat.trend && (
                <div className="flex items-center gap-1 mt-1 sm:mt-2">
                  <span className={cn(
                    "text-[10px] sm:text-xs font-medium",
                    stat.trendColor
                  )}>
                    {stat.trend}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground/70">
                    vs last month
                  </span>
                </div>
              )}

              {/* If no trend, add a spacer to maintain height consistency */}
              {!stat.trend && (
                <div className="h-[18px] sm:h-[22px] mt-1 sm:mt-2" />
              )}
            </CardContent>
          </Card>
        );
      })}

      {!summary && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">No summary data available</p>
        </div>
      )}
    </div>
  );
}