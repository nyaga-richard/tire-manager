import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Package,
  Gauge
} from 'lucide-react';

interface KPI {
  tire_utilization_rate: number;
  avg_tires_per_vehicle: number;
  retread_rate: number;
  monthly_turnover_rate: number;
  annual_retread_savings: number;
}

interface KPIOverviewProps {
  kpis?: KPI;
}

export default function KPIOverview({ kpis }: KPIOverviewProps) {
  const kpiCards = [
    {
      title: 'Tire Utilization Rate',
      value: kpis?.tire_utilization_rate ? `${kpis.tire_utilization_rate}%` : '0%',
      icon: Percent,
      color: 'bg-blue-500',
      description: 'Percentage of tires on vehicles',
      trend: kpis?.tire_utilization_rate && kpis.tire_utilization_rate > 70 ? 'good' : 'warning',
    },
    {
      title: 'Retread Rate',
      value: kpis?.retread_rate ? `${kpis.retread_rate}%` : '0%',
      icon: Package,
      color: 'bg-green-500',
      description: 'Percentage of retreaded tires',
      trend: kpis?.retread_rate && kpis.retread_rate > 30 ? 'good' : 'info',
    },
    {
      title: 'Inventory Turnover',
      value: kpis?.monthly_turnover_rate ? `${kpis.monthly_turnover_rate}%` : '0%',
      icon: Gauge,
      color: 'bg-purple-500',
      description: 'Monthly turnover rate',
      trend: kpis?.monthly_turnover_rate && kpis.monthly_turnover_rate > 80 ? 'good' : 'warning',
    },
    {
      title: 'Annual Retread Savings',
      value: kpis?.annual_retread_savings ? `KSH ${kpis.annual_retread_savings.toLocaleString()}` : 'KSH 0',
      icon: DollarSign,
      color: 'bg-amber-500',
      description: 'Estimated savings from retreading',
      trend: 'good',
    },
    {
      title: 'Tires per Vehicle',
      value: kpis?.avg_tires_per_vehicle ? kpis.avg_tires_per_vehicle.toFixed(1) : '0',
      icon: TrendingUp,
      color: 'bg-red-500',
      description: 'Average tires per active vehicle',
      trend: 'info',
    },
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'good') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'warning') {
      return <TrendingDown className="h-4 w-4 text-amber-500" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            const TrendIcon = getTrendIcon(kpi.trend);
            
            return (
              <div key={index} className="flex flex-col items-center text-center p-4 border rounded-lg">
                <div className={`p-3 rounded-full ${kpi.color} mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold">{kpi.value}</h3>
                <p className="text-sm font-medium mb-1">{kpi.title}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  {TrendIcon}
                  <span>{kpi.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}