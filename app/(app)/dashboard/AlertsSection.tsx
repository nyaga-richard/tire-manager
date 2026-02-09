import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Info, 
  Bell, 
  CheckCircle,
  ChevronRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Alert {
  alert_type: string;
  severity: string;
  message: string;
  [key: string]: any;
}

interface AlertsSectionProps {
  alerts: Alert[];
}

export default function AlertsSection({ alerts }: AlertsSectionProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'MAINTENANCE_DUE':
        return 'Maintenance';
      case 'OVERDUE_BALANCE':
        return 'Payment';
      case 'TIRE_AGING':
        return 'Tire Aging';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alerts & Notifications
        </CardTitle>
        <Badge variant="secondary">
          {alerts.length} Active
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alert.message}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{alert.serial_number || alert.supplier_name || alert.vehicle_number}</span>
                        {alert.current_stock && (
                          <span>Stock: {alert.current_stock}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              View All Alerts
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}