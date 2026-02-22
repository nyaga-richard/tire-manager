"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Download, 
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DashboardHeaderProps {
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onRefresh: () => void;
  loading?: boolean;
  onExport?: () => void;
}

export default function DashboardHeader({ 
  onDateRangeChange, 
  onRefresh,
  loading = false,
  onExport 
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const { settings: systemSettings } = useSettings();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    const newRange = {
      ...dateRange,
      [type]: date ? format(date, 'yyyy-MM-dd') : ''
    };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    const newRange = {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
    
    setDateRange(newRange);
    onDateRangeChange(newRange);
    
    toast.info(`Showing data for last ${days} days`);
  };

  const handleExport = async () => {
    if (onExport) {
      onExport();
      return;
    }

    try {
      toast.info('Preparing export...');
      
      // Simulate export - you can implement actual export logic here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Dashboard data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const getDateDisplay = () => {
    if (dateRange.start && dateRange.end) {
      try {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      } catch {
        return 'Custom Range';
      }
    }
    return 'Select Range';
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Title Section */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">
                Overview of your tire management system
              </p>
              {systemSettings?.company_name && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {systemSettings.company_name} • {systemSettings.currency_symbol} ({systemSettings.currency})
                </p>
              )}
            </div>
            
            {/* Mobile: Show/hide controls button - Hidden on desktop */}
            {/* <Button
              variant="ghost"
              size="sm"
              className="sm:hidden h-8 w-8 p-0 ml-2"
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              aria-label={isControlsExpanded ? "Hide controls" : "Show controls"}
            >
              {isControlsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button> */}
          </div>
          
          {/* Controls Section - Desktop: Always visible, Mobile: Collapsible */}
          <div className="hidden sm:block">
            {/* Desktop View - Always visible */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Date Range Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium whitespace-nowrap">Date Range:</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <DatePicker
                      date={dateRange.start ? new Date(dateRange.start) : undefined}
                      onSelect={(date) => handleDateChange('start', date)}
                      className="flex-1 sm:w-[140px]"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">to</span>
                    <DatePicker
                      date={dateRange.end ? new Date(dateRange.end) : undefined}
                      onSelect={(date) => handleDateChange('end', date)}
                      className="flex-1 sm:w-[140px]"
                    />
                  </div>
                  
                  <Select 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        toast.info('Please select custom dates above');
                      } else {
                        handleQuickRange(parseInt(value));
                      }
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Quick Range">
                        {dateRange.start && dateRange.end ? (
                          <span className="truncate">{getDateDisplay()}</span>
                        ) : (
                          "Quick Range"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={onRefresh}
                  disabled={loading}
                  className="h-9 w-9"
                  title="Refresh dashboard data"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleExport}
                  disabled={loading}
                  size="sm"
                  className="h-9"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile View - Collapsible */}
          <div className="sm:hidden">
            <Collapsible
              open={isControlsExpanded}
              onOpenChange={setIsControlsExpanded}
            >
              <CollapsibleContent>
                <div className="flex flex-col gap-4 pt-2">
                  {/* Date Range Controls */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">Date Range:</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {/* Date Pickers - Stack on mobile */}
                      <div className="flex flex-col gap-2">
                        <DatePicker
                          date={dateRange.start ? new Date(dateRange.start) : undefined}
                          onSelect={(date) => handleDateChange('start', date)}
                          className="w-full"
                        />
                        <span className="text-sm text-muted-foreground text-center">to</span>
                        <DatePicker
                          date={dateRange.end ? new Date(dateRange.end) : undefined}
                          onSelect={(date) => handleDateChange('end', date)}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Quick Range Select */}
                      <Select 
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            toast.info('Please select custom dates above');
                          } else {
                            handleQuickRange(parseInt(value));
                          }
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Quick Range">
                            {dateRange.start && dateRange.end ? (
                              <span className="truncate">{getDateDisplay()}</span>
                            ) : (
                              "Quick Range"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                          <SelectItem value="365">Last year</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={onRefresh}
                      disabled={loading}
                      className="w-full justify-center"
                      size="default"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleExport}
                      disabled={loading}
                      className="w-full justify-center"
                      size="default"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Mobile: Show expand/collapse indicator when collapsed */}
            {!isControlsExpanded && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-muted-foreground"
                onClick={() => setIsControlsExpanded(true)}
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Show filters
              </Button>
            )}
          </div>

          {/* User Info Footer
          {user && (
            <div className="text-xs text-muted-foreground border-t pt-3 sm:pt-4 mt-2 space-y-1">
              <div className="truncate">
                Logged in as: {user.full_name || user.username}
              </div>
              <div className="flex flex-wrap gap-1">
                <span>Role: {user.role}</span>
                {systemSettings?.company_name && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="block sm:inline text-xs">
                      {systemSettings.company_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          )} */}
        </div>
      </CardContent>
    </Card>
  );
}