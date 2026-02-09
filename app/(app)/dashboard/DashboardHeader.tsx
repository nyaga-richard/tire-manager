import React, { useState }from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Download, 
  Filter,
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your tire management system
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <DatePicker
                date={dateRange.start ? new Date(dateRange.start) : undefined}
                onSelect={(date) => handleDateChange('start', date)}
              />
              <span>to</span>
              <DatePicker
                date={dateRange.end ? new Date(dateRange.end) : undefined}
                onSelect={(date) => handleDateChange('end', date)}
              />
            </div>
            
            <Select onValueChange={(value) => handleQuickRange(parseInt(value))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Quick Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}