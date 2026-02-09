import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  Truck, 
  Users, 
  ShoppingCart,
  TrendingUp,
  DollarSign 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryData {
  total_tires: number;
  total_vehicles: number;
  total_suppliers: number;
  total_purchases: number;
  total_movements: number;
  total_inventory_value: number;
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
  trend: string;
  trendColor?: string;
  formatter?: (value: number) => string;
}

const statCards: StatCard[] = [
  {
    title: 'Total Tires',
    key: 'total_tires',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    trend: '+12%',
    trendColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Active Vehicles',
    key: 'total_vehicles',
    icon: Truck,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    trend: '+5%',
    trendColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Suppliers',
    key: 'total_suppliers',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    trend: '+8%',
    trendColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Inventory Value',
    key: 'total_inventory_value',
    icon: DollarSign,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    trend: '+15%',
    trendColor: 'text-green-600 dark:text-green-400',
    formatter: (value: number) => `KSH ${value.toLocaleString()}`,
  },
  {
    title: 'Monthly Movements',
    key: 'total_movements',
    icon: TrendingUp,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    trend: '+20%',
    trendColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Total Purchases',
    key: 'total_purchases',
    icon: ShoppingCart,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    trend: '+18%',
    trendColor: 'text-green-600 dark:text-green-400',
  },
];

// Skeleton loader component
const StatCardSkeleton = () => (
  <Card className="overflow-hidden animate-pulse">
    <CardContent className="p-6">
      <div className="flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </CardContent>
  </Card>
);

export default function StatsCards({ summary, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const rawValue = summary?.[stat.key] || 0;
        const displayValue = stat.formatter 
          ? stat.formatter(rawValue as number)
          : rawValue.toLocaleString();

        return (
          <Card 
            key={stat.key}
            className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-border/50"
          >
            <CardContent className="p-5 h-full">
              <div className="flex flex-col justify-between h-full">
                {/* Top section - Title and Icon */}
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <Icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                </div>

                {/* Middle section - Value */}
                <div className="mb-4">
                  <p className="text-2xl font-bold text-foreground">
                    {displayValue}
                  </p>
                </div>

                {/* Bottom section - Trend */}
                <div className="flex items-center gap-1">
                  <span className={cn("text-xs font-medium", stat.trendColor)}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    from last month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}