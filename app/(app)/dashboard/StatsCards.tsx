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

interface StatsCardsProps {
  summary?: {
    total_tires: number;
    total_vehicles: number;
    total_suppliers: number;
    total_purchases: number;
    total_movements: number;
    total_inventory_value: number;
  };
}

const statCards = [
  {
    title: 'Total Tires',
    value: (summary: any) => summary?.total_tires || 0,
    icon: Package,
    color: 'bg-blue-500',
    trend: '+12%',
  },
  {
    title: 'Active Vehicles',
    value: (summary: any) => summary?.total_vehicles || 0,
    icon: Truck,
    color: 'bg-green-500',
    trend: '+5%',
  },
  {
    title: 'Suppliers',
    value: (summary: any) => summary?.total_suppliers || 0,
    icon: Users,
    color: 'bg-purple-500',
    trend: '+8%',
  },
  {
    title: 'Inventory Value',
    value: (summary: any) => `$${(summary?.total_inventory_value || 0).toLocaleString()}`,
    icon: DollarSign,
    color: 'bg-amber-500',
    trend: '+15%',
  },
  {
    title: 'Monthly Movements',
    value: (summary: any) => summary?.total_movements || 0,
    icon: TrendingUp,
    color: 'bg-red-500',
    trend: '+20%',
  },
  {
    title: 'Total Purchases',
    value: (summary: any) => summary?.total_purchases || 0,
    icon: ShoppingCart,
    color: 'bg-indigo-500',
    trend: '+18%',
  },
];

export default function StatsCards({ summary }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {typeof stat.value === 'function' ? stat.value(summary) : stat.value}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {stat.trend} from last month
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", stat.color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}