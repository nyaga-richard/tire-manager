"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Info, 
  Bell, 
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Package,
  Truck,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Alert {
  alert_type: string;
  severity: string;
  message: string;
  serial_number?: string;
  supplier_name?: string;
  vehicle_number?: string;
  tire_id?: number;
  vehicle_id?: number;
  supplier_id?: number;
  current_stock?: number;
  min_stock?: number;
  days_until_due?: number;
  amount?: number;
  due_date?: string;
  action_url?: string;
  [key: string]: any;
}

interface AlertsSectionProps {
  alerts: Alert[];
  loading?: boolean;
  onDismiss?: (alertIndex: number) => void;
  onViewAll?: () => void;
  maxHeight?: string;
}

export default function AlertsSection({ 
  alerts, 
  loading = false,
  onDismiss,
  onViewAll,
  maxHeight = "h-72"
}: AlertsSectionProps) {
  const { settings: systemSettings } = useSettings();
  const { user } = useAuth();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const currencySymbol = systemSettings?.currency_symbol || "KSH";

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/50';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700/50';
    }
  };

  const getSeverityBadgeVariant = (
    severity: string
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity.toLowerCase()) {
      case "error":
      case "critical":
        return "destructive";

      case "warning":
        return "outline"; // styled via className

      case "info":
        return "secondary";

      case "success":
        return "default"; // styled via className

      default:
        return "outline";
    }
  };


  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return Package;
      case 'MAINTENANCE_DUE':
        return Clock;
      case 'OVERDUE_BALANCE':
        return DollarSign;
      case 'TIRE_AGING':
        return Clock;
      case 'VEHICLE_SERVICE':
        return Truck;
      default:
        return Bell;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'Low Stock Alert';
      case 'MAINTENANCE_DUE':
        return 'Maintenance Due';
      case 'OVERDUE_BALANCE':
        return 'Payment Due';
      case 'TIRE_AGING':
        return 'Tire Aging Alert';
      case 'VEHICLE_SERVICE':
        return 'Vehicle Service';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getAlertAction = (alert: Alert) => {
    switch (alert.alert_type) {
      case 'LOW_STOCK':
        return `/inventory?size=${alert.serial_number}`;
      case 'MAINTENANCE_DUE':
        return `/vehicles/${alert.vehicle_id}/service`;
      case 'OVERDUE_BALANCE':
        return `/suppliers/${alert.supplier_id}/payment`;
      case 'TIRE_AGING':
        return `/inventory/${alert.tire_id}`;
      default:
        return alert.action_url || '#';
    }
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsDialogOpen(true);
  };

  const handleDismiss = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(index);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts & Notifications
          </CardTitle>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  const activeAlerts = alerts.filter(a => a.severity !== 'success');
  const resolvedAlerts = alerts.filter(a => a.severity === 'success');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts & Notifications
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {activeAlerts.length} Active
              </Badge>
            )}
            {resolvedAlerts.length > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {resolvedAlerts.length} Resolved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className={cn(maxHeight, "pr-4")}>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No active alerts</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All systems are operating normally
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, index) => {
                  const AlertTypeIcon = getAlertTypeIcon(alert.alert_type);
                  const actionUrl = getAlertAction(alert);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer group relative",
                        getSeverityColor(alert.severity)
                      )}
                      onClick={() => handleAlertClick(alert)}
                    >
                      {/* Dismiss button */}
                      {onDismiss && (
                        <button
                          onClick={(e) => handleDismiss(index, e)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Dismiss alert"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 p-1.5 rounded-full",
                          getSeverityColor(alert.severity).replace('text', 'bg').replace('border', '')
                        )}>
                          {getSeverityIcon(alert.severity)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <AlertTypeIcon className="h-3 w-3" />
                              <span className="font-medium text-sm">
                                {getAlertTypeLabel(alert.alert_type)}
                              </span>
                            </div>
                            <Badge 
                              variant={getSeverityBadgeVariant(alert.severity)}
                              className="text-xs"
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          
                          <p className="text-sm mb-2 line-clamp-2">{alert.message}</p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2 truncate">
                              {alert.serial_number && (
                                <span className="font-mono truncate">{alert.serial_number}</span>
                              )}
                              {alert.supplier_name && (
                                <span className="truncate">{alert.supplier_name}</span>
                              )}
                              {alert.vehicle_number && (
                                <span className="truncate">{alert.vehicle_number}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {alert.current_stock !== undefined && (
                                <span className="whitespace-nowrap">
                                  Stock: {alert.current_stock}
                                  {alert.min_stock && ` / ${alert.min_stock}`}
                                </span>
                              )}
                              {alert.amount !== undefined && (
                                <span className="whitespace-nowrap">
                                  {currencySymbol} {alert.amount.toLocaleString()}
                                </span>
                              )}
                              {alert.days_until_due !== undefined && (
                                <span className={cn(
                                  "whitespace-nowrap",
                                  alert.days_until_due < 0 ? 'text-red-600' : 
                                  alert.days_until_due < 7 ? 'text-amber-600' : ''
                                )}>
                                  {alert.days_until_due < 0 
                                    ? `${Math.abs(alert.days_until_due)} days overdue`
                                    : `${alert.days_until_due} days left`
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Quick action link */}
                          {actionUrl !== '#' && (
                            <Link 
                              href={actionUrl}
                              className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Take action
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {alerts.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onViewAll}
              >
                View All Alerts
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Details
            </DialogTitle>
            <DialogDescription>
              {selectedAlert && getAlertTypeLabel(selectedAlert.alert_type)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className={cn(
                "p-4 rounded-lg border",
                getSeverityColor(selectedAlert.severity)
              )}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getSeverityIcon(selectedAlert.severity)}
                  </div>
                  <div>
                    <p className="font-medium mb-1">{selectedAlert.message}</p>
                    <Badge variant={getSeverityBadgeVariant(selectedAlert.severity)}>
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedAlert.serial_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Serial Number</p>
                    <p className="font-mono text-sm">{selectedAlert.serial_number}</p>
                  </div>
                )}
                {selectedAlert.supplier_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="text-sm">{selectedAlert.supplier_name}</p>
                  </div>
                )}
                {selectedAlert.vehicle_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-sm">{selectedAlert.vehicle_number}</p>
                  </div>
                )}
                {selectedAlert.current_stock !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Current Stock</p>
                    <p className="text-sm">{selectedAlert.current_stock}</p>
                  </div>
                )}
                {selectedAlert.min_stock !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Minimum Stock</p>
                    <p className="text-sm">{selectedAlert.min_stock}</p>
                  </div>
                )}
                {selectedAlert.amount !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-sm">{currencySymbol} {selectedAlert.amount.toLocaleString()}</p>
                  </div>
                )}
                {selectedAlert.due_date && (
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm">{new Date(selectedAlert.due_date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedAlert.days_until_due !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Days Left</p>
                    <p className={cn(
                      "text-sm font-medium",
                      selectedAlert.days_until_due < 0 ? 'text-red-600' : 
                      selectedAlert.days_until_due < 7 ? 'text-amber-600' : ''
                    )}>
                      {selectedAlert.days_until_due < 0 
                        ? `${Math.abs(selectedAlert.days_until_due)} days overdue`
                        : `${selectedAlert.days_until_due} days`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
                {getAlertAction(selectedAlert) !== '#' && (
                  <Button 
                    className="flex-1"
                    asChild
                  >
                    <Link href={getAlertAction(selectedAlert)}>
                      Take Action
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* User info */}
              <div className="text-xs text-muted-foreground border-t pt-4">
                Alert generated for: {user?.full_name || user?.username}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


