import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  Package,
  Truck,
  ShoppingCart,
  RotateCw,
  FileText,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Add Tire',
      icon: Package,
      color: 'bg-blue-500',
      onClick: () => router.push('/tires/add'),
    },
    {
      title: 'Create PO',
      icon: ShoppingCart,
      color: 'bg-green-500',
      onClick: () => router.push('/purchase-orders/new'),
    },
    {
      title: 'Assign Tire',
      icon: Truck,
      color: 'bg-purple-500',
      onClick: () => router.push('/assignments/new'),
    },
    {
      title: 'Record Movement',
      icon: RotateCw,
      color: 'bg-amber-500',
      onClick: () => router.push('/movements/new'),
    },
    {
      title: 'Add Supplier',
      icon: UserPlus,
      color: 'bg-red-500',
      onClick: () => router.push('/suppliers/add'),
    },
    {
      title: 'Generate Report',
      icon: FileText,
      color: 'bg-indigo-500',
      onClick: () => router.push('/reports'),
    },
    {
      title: 'Receive Goods',
      icon: Plus,
      color: 'bg-emerald-500',
      onClick: () => router.push('/grn/new'),
    },
    {
      title: 'View Analytics',
      icon: BarChart3,
      color: 'bg-pink-500',
      onClick: () => router.push('/analytics'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="flex flex-col h-auto py-4 px-2"
                onClick={action.onClick}
              >
                <div className={`p-2 rounded-lg ${action.color} mb-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-medium">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}