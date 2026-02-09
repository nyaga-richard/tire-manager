import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Download, 
  RefreshCw 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface DashboardHeaderProps {
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onRefresh: () => void;
}

export default function DashboardHeader({ onDateRangeChange, onRefresh }: DashboardHeaderProps) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    const newRange = {
      ...dateRange,
      [type]: date ? date.toISOString().split('T')[0] : ''
    };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    const newRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    
    setDateRange(newRange);
    onDateRangeChange(newRange);
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
          </div>
          
          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Date Range Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Date Range:</span>
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
                
                <Select onValueChange={(value) => handleQuickRange(parseInt(value))}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Quick Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
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
                className="shrink-0"
                aria-label="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}