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
  X,
  ChevronDown,
  ChevronUp,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

const AlertSkeleton = () => (
  <div className="p-3 sm:p-4 border rounded-lg space-y-3">
    <div className="flex items-start gap-3">
      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
        <div className="flex justify-between mt-2">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

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
  const [expandedAlerts, setExpandedAlerts] = useState(false);
  
  const currencySymbol = systemSettings?.currency_symbol || "KSH";

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'info':
        return <Info className="h-3 w-3 sm:h-4 sm:w-4" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Bell className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-950/30';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-950/30';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-950/30';
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30 hover:bg-green-100 dark:hover:bg-green-950/30';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-800/30';
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
        return "outline";
      case "info":
        return "secondary";
      case "success":
        return "default";
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
        return 'Low Stock';
      case 'MAINTENANCE_DUE':
        return 'Maintenance Due';
      case 'OVERDUE_BALANCE':
        return 'Payment Due';
      case 'TIRE_AGING':
        return 'Tire Aging';
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
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg">Alerts & Notifications</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AlertSkeleton key={i} />
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
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-base sm:text-lg">Alerts & Notifications</span>
            </CardTitle>
            
            {/* Badges - Horizontal scroll on mobile if many */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="animate-pulse whitespace-nowrap">
                  {activeAlerts.length} Active
                </Badge>
              )}
              {resolvedAlerts.length > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 whitespace-nowrap">
                  {resolvedAlerts.length} Resolved
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <Collapsible
            open={expandedAlerts}
            onOpenChange={setExpandedAlerts}
            className="space-y-3"
          >
            {/* Mobile: Show first 2 alerts + expand button */}
            <div className="sm:hidden">
              {alerts.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No active alerts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All systems are operating normally
                  </p>
                </div>
              ) : (
                <>
                  {/* Show first 2 alerts */}
                  {alerts.slice(0, 2).map((alert, index) => (
                    <AlertItem
                      key={index}
                      alert={alert}
                      index={index}
                      onDismiss={onDismiss}
                      onAlertClick={handleAlertClick}
                      getSeverityColor={getSeverityColor}
                      getSeverityIcon={getSeverityIcon}
                      getAlertTypeIcon={getAlertTypeIcon}
                      getAlertTypeLabel={getAlertTypeLabel}
                      getSeverityBadgeVariant={getSeverityBadgeVariant}
                      currencySymbol={currencySymbol}
                    />
                  ))}
                  
                  {/* Collapsible remaining alerts */}
                  {alerts.length > 2 && (
                    <>
                      <CollapsibleContent className="space-y-3">
                        {alerts.slice(2).map((alert, index) => (
                          <AlertItem
                            key={index + 2}
                            alert={alert}
                            index={index + 2}
                            onDismiss={onDismiss}
                            onAlertClick={handleAlertClick}
                            getSeverityColor={getSeverityColor}
                            getSeverityIcon={getSeverityIcon}
                            getAlertTypeIcon={getAlertTypeIcon}
                            getAlertTypeLabel={getAlertTypeLabel}
                            getSeverityBadgeVariant={getSeverityBadgeVariant}
                            currencySymbol={currencySymbol}
                          />
                        ))}
                      </CollapsibleContent>
                      
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                          {expandedAlerts ? (
                            <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                          ) : (
                            <>Show {alerts.length - 2} more alerts <ChevronDown className="h-3 w-3 ml-1" /></>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Desktop: ScrollArea with all alerts */}
            <div className="hidden sm:block">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-base text-muted-foreground">No active alerts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All systems are operating normally
                  </p>
                </div>
              ) : (
                <ScrollArea className={cn(maxHeight, "pr-4")}>
                  <div className="space-y-3">
                    {alerts.map((alert, index) => (
                      <AlertItem
                        key={index}
                        alert={alert}
                        index={index}
                        onDismiss={onDismiss}
                        onAlertClick={handleAlertClick}
                        getSeverityColor={getSeverityColor}
                        getSeverityIcon={getSeverityIcon}
                        getAlertTypeIcon={getAlertTypeIcon}
                        getAlertTypeLabel={getAlertTypeLabel}
                        getSeverityBadgeVariant={getSeverityBadgeVariant}
                        currencySymbol={currencySymbol}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </Collapsible>
          
          {alerts.length > 0 && (
            <div className="mt-4 pt-3 sm:pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full text-xs sm:text-sm h-8 sm:h-9"
                onClick={onViewAll}
              >
                View All Alerts
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Details Dialog - Mobile optimized */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              Alert Details
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedAlert && getAlertTypeLabel(selectedAlert.alert_type)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-3 sm:space-y-4">
              <div className={cn(
                "p-3 sm:p-4 rounded-lg border",
                getSeverityColor(selectedAlert.severity)
              )}>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5">
                    {getSeverityIcon(selectedAlert.severity)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">{selectedAlert.message}</p>
                    <Badge variant={getSeverityBadgeVariant(selectedAlert.severity)} className="text-[10px] sm:text-xs">
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {selectedAlert.serial_number && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Serial Number</p>
                    <p className="font-mono text-xs sm:text-sm truncate">{selectedAlert.serial_number}</p>
                  </div>
                )}
                {selectedAlert.supplier_name && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Supplier</p>
                    <p className="text-xs sm:text-sm truncate">{selectedAlert.supplier_name}</p>
                  </div>
                )}
                {selectedAlert.vehicle_number && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Vehicle</p>
                    <p className="text-xs sm:text-sm truncate">{selectedAlert.vehicle_number}</p>
                  </div>
                )}
                {selectedAlert.current_stock !== undefined && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Current Stock</p>
                    <p className="text-xs sm:text-sm">{selectedAlert.current_stock}</p>
                  </div>
                )}
                {selectedAlert.min_stock !== undefined && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Minimum Stock</p>
                    <p className="text-xs sm:text-sm">{selectedAlert.min_stock}</p>
                  </div>
                )}
                {selectedAlert.amount !== undefined && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Amount</p>
                    <p className="text-xs sm:text-sm font-medium">
                      {currencySymbol} {selectedAlert.amount.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedAlert.due_date && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Due Date</p>
                    <p className="text-xs sm:text-sm">
                      {new Date(selectedAlert.due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedAlert.days_until_due !== undefined && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Days Left</p>
                    <p className={cn(
                      "text-xs sm:text-sm font-medium",
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
              <div className="flex flex-col-reverse xs:flex-row gap-2 pt-3 sm:pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Close
                </Button>
                {getAlertAction(selectedAlert) !== '#' && (
                  <Button 
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    asChild
                  >
                    <Link href={getAlertAction(selectedAlert)}>
                      Take Action
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* User info */}
              <div className="text-[10px] sm:text-xs text-muted-foreground border-t pt-3 sm:pt-4">
                Alert for: {user?.full_name || user?.username}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Extracted Alert Item component for reusability
interface AlertItemProps {
  alert: Alert;
  index: number;
  onDismiss?: (index: number, e: React.MouseEvent) => void;
  onAlertClick: (alert: Alert) => void;
  getSeverityColor: (severity: string) => string;
  getSeverityIcon: (severity: string) => React.ReactNode;
  getAlertTypeIcon: (type: string) => React.ElementType;
  getAlertTypeLabel: (type: string) => string;
  getSeverityBadgeVariant: (severity: string) => "default" | "destructive" | "secondary" | "outline";
  currencySymbol: string;
}

function AlertItem({
  alert,
  index,
  onDismiss,
  onAlertClick,
  getSeverityColor,
  getSeverityIcon,
  getAlertTypeIcon,
  getAlertTypeLabel,
  getSeverityBadgeVariant,
  currencySymbol,
}: AlertItemProps) {
  const AlertTypeIcon = getAlertTypeIcon(alert.alert_type);
  const actionUrl = getAlertAction(alert);
  
  return (
    <div
      className={cn(
        "p-3 sm:p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer group relative",
        getSeverityColor(alert.severity)
      )}
      onClick={() => onAlertClick(alert)}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={(e) => onDismiss(index, e)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      )}
      
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Icon */}
        <div className={cn(
          "mt-0.5 p-1.5 rounded-full shrink-0",
          getSeverityColor(alert.severity).replace('text', 'bg').replace('border', '')
        )}>
          {getSeverityIcon(alert.severity)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 min-w-0">
              <AlertTypeIcon className="h-3 w-3 shrink-0" />
              <span className="font-medium text-xs sm:text-sm truncate">
                {getAlertTypeLabel(alert.alert_type)}
              </span>
            </div>
            <Badge 
              variant={getSeverityBadgeVariant(alert.severity)}
              className="text-[10px] sm:text-xs shrink-0 ml-1"
            >
              {alert.severity}
            </Badge>
          </div>
          
          {/* Message */}
          <p className="text-xs sm:text-sm mb-2 line-clamp-2 break-words">
            {alert.message}
          </p>
          
          {/* Footer */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              {alert.serial_number && (
                <span className="font-mono truncate max-w-[100px] sm:max-w-[150px]">
                  {alert.serial_number}
                </span>
              )}
              {alert.supplier_name && (
                <span className="truncate max-w-[100px] sm:max-w-[150px]">
                  {alert.supplier_name}
                </span>
              )}
              {alert.vehicle_number && (
                <span className="truncate max-w-[100px] sm:max-w-[150px]">
                  {alert.vehicle_number}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {alert.current_stock !== undefined && (
                <span className="whitespace-nowrap">
                  Stock: {alert.current_stock}
                  {alert.min_stock && `/${alert.min_stock}`}
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
                    ? `${Math.abs(alert.days_until_due)}d overdue`
                    : `${alert.days_until_due}d left`
                  }
                </span>
              )}
            </div>
          </div>
          
          {/* Quick action link */}
          {actionUrl !== '#' && (
            <Link 
              href={actionUrl}
              className="mt-2 text-[10px] sm:text-xs text-primary hover:underline inline-flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              Take action
              <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function (moved outside component)
function getAlertAction(alert: Alert): string {
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
}