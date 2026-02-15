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
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    trend: "+12%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Tires in inventory",
  },
  {
    title: "Active Vehicles",
    key: "total_vehicles",
    icon: Truck,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    trend: "+5%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Vehicles in fleet",
  },
  {
    title: "Suppliers",
    key: "total_suppliers",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    trend: "+8%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Active suppliers",
  },
  {
    title: "Inventory Value",
    key: "total_inventory_value",
    icon: DollarSign,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
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
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    trend: "+20%",
    trendColor: "text-green-600 dark:text-green-400",
    description: "Tire movements this month",
  },
  {
    title: "Total Purchases",
    key: "total_purchases",
    icon: ShoppingCart,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
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
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    description: "Active purchase orders",
  },
  {
    title: "Pending Orders",
    key: "pending_orders",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    description: "Awaiting delivery",
  },
  {
    title: "GRNs",
    key: "total_grns",
    icon: FileText,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
    description: "Goods received notes",
  },
  {
    title: "Retreads",
    key: "total_retreads",
    icon: RefreshCw,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    description: "Tires in retread process",
  },
  {
    title: "Low Stock",
    key: "low_stock_count",
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    description: "Items below reorder point",
  },
];

const StatCardSkeleton = () => (
  <Card className="overflow-hidden animate-pulse">
    <CardContent className="p-5">
      <div className="h-20 bg-muted rounded" />
    </CardContent>
  </Card>
);

export default function StatsCards({ summary, loading = false }: StatsCardsProps) {
  const { settings: systemSettings } = useSettings();
  const currencySymbol = systemSettings?.currency_symbol || "KSH";

  // ✅ SAFE DEFAULT OBJECT (fixes undefined errors everywhere)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {allCards.map((stat) => {
        const Icon = stat.icon;
        const rawValue = safeSummary[stat.key] ?? 0;

        const displayValue = stat.formatter
          ? stat.formatter(rawValue as number, currencySymbol)
          : Number(rawValue).toLocaleString();

        return (
          <Card key={stat.key} className="hover:shadow-lg transition">
            <CardContent className="p-5">
              <div className="flex justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    {stat.title}
                  </p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  )}
                </div>
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>

              <p className="text-2xl font-bold">{displayValue}</p>

              {stat.trend && (
                <p className={cn("text-xs mt-1", stat.trendColor)}>
                  {stat.trend} vs last month
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!summary && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No summary data available</p>
        </div>
      )}
    </div>
  );
}
