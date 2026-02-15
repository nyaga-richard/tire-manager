"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Download, 
  RefreshCw,
  Loader2
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          {/* Title Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your tire management system
            </p>
            {systemSettings?.company_name && (
              <p className="text-xs text-muted-foreground mt-1">
                {systemSettings.company_name} • Currency: {systemSettings.currency_symbol} ({systemSettings.currency})
              </p>
            )}
          </div>
          
          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Date Range Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <DatePicker
                    date={dateRange.start ? new Date(dateRange.start) : undefined}
                    onSelect={(date) => handleDateChange('start', date)}
                    className="w-full sm:w-[140px]"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <DatePicker
                    date={dateRange.end ? new Date(dateRange.end) : undefined}
                    onSelect={(date) => handleDateChange('end', date)}
                    className="w-full sm:w-[140px]"
                  />
                </div>
                
                <Select 
                  onValueChange={(value) => handleQuickRange(parseInt(value))}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Quick Range">
                      {dateRange.start && dateRange.end ? getDateDisplay() : "Quick Range"}
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
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onRefresh}
                disabled={loading}
                className="shrink-0"
                aria-label="Refresh data"
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
                className="shrink-0"
                title="Export dashboard data"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* User Info Footer (Optional) */}
          {user && (
            <div className="text-xs text-muted-foreground border-t pt-4 mt-2">
              Logged in as: {user.full_name || user.username} • Role: {user.role}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}