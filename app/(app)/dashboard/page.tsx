"use client";

import React, { useState, useEffect } from "react";
import DashboardHeader from "./DashboardHeader";
import StatsCards from "./StatsCards";
import ChartsSection from "./ChartsSection";
import AlertsSection from "./AlertsSection";
import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";
import KPIOverview from "./KPIOverview";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface DashboardData {
  summary: any;
  charts: any;
  supplier_stats?: {
    top_suppliers: Array<{
      supplier: string;
      balance: number;
    }>;
  };
}

interface KPI {
  tire_utilization_rate: number;
  avg_tires_per_vehicle: number;
  retread_rate: number;
  monthly_turnover_rate: number;
  annual_retread_savings: number;
}

interface AlertsData {
  alerts: any[];
}

interface ActivityData {
  activities: any[];
}

interface KPIData {
  kpis: any;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, authFetch } = useAuth();
  const { settings: systemSettings, loading: settingsLoading } = useSettings();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [kpiData, setKpiData] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // Mobile collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    supplierBalances: true,
    alerts: true,
    kpis: true,
    charts: true
  });

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const buildQuery = (params: Record<string, string>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
    return query.toString();
  };

  const fetchDashboardData = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);

      const statsQuery = buildQuery(dateRange);

      const [
        dashboardRes,
        alertsRes,
        activityRes,
        kpiRes,
      ] = await Promise.allSettled([
        authFetch(`${API_BASE_URL}/api/dashboard/stats?${statsQuery}`),
        authFetch(`${API_BASE_URL}/api/dashboard/alerts`),
        authFetch(`${API_BASE_URL}/api/dashboard/activity?limit=10`),
        authFetch(`${API_BASE_URL}/api/dashboard/kpis`),
      ]);

      // Process dashboard stats
      if (dashboardRes.status === 'fulfilled') {
        const dashboardJson = await dashboardRes.value.json();
        if (dashboardJson.success) {
          setDashboardData(dashboardJson);
        } else {
          throw new Error(dashboardJson.message || "Failed to load dashboard stats");
        }
      } else {
        throw new Error(dashboardRes.reason?.message || "Failed to load dashboard stats");
      }

      // Process alerts
      if (alertsRes.status === 'fulfilled') {
        const alertsJson = await alertsRes.value.json();
        setAlertsData(alertsJson);
      }

      // Process activity
      if (activityRes.status === 'fulfilled') {
        const activityJson = await activityRes.value.json();
        setActivityData(activityJson);
      }

      // Process KPIs
      if (kpiRes.status === 'fulfilled') {
        const kpiJson = await kpiRes.value.json();
        setKpiData(kpiJson.kpis);
      }

      toast.success("Dashboard data loaded");
    } catch (error: any) {
      console.error("Dashboard error:", error);
      setError(error.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, dateRange]);

  const handleDateRangeChange = (range: { start: string; end: string }) => {
    setDateRange(range);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-10 sm:h-12 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="h-80 sm:h-96" />
          <Skeleton className="h-80 sm:h-96" />
        </div>
      </div>
    );
  }

  // Show not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} variant="outline" size="sm" className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Company Info Header - Mobile optimized */}
      {systemSettings?.company_name && (
        <div className="text-xs text-muted-foreground mb-1 sm:mb-2 truncate">
          {systemSettings.company_name} • {currencySymbol} ({currency})
        </div>
      )}

      {/* Dashboard Header - Already mobile friendly from its own component */}
      <DashboardHeader
        onDateRangeChange={handleDateRangeChange}
        onRefresh={fetchDashboardData}
      />

      {/* Stats Cards - Grid adapts to screen size */}
      <StatsCards summary={dashboardData?.summary} />

      {/* Main Content - Stack vertically on mobile */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column - Charts and KPIs */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Charts Section - Collapsible on mobile */}
          <Collapsible
            open={expandedSections.charts}
            onOpenChange={() => toggleSection('charts')}
            className="border rounded-lg sm:border-0 sm:rounded-none"
          >
            <div className="flex items-center justify-between p-4 sm:hidden">
              <h2 className="text-lg font-semibold">Analytics</h2>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedSections.charts ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="sm:block">
              <div className="p-4 sm:p-0">
                <ChartsSection charts={dashboardData?.charts} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* KPIs Section - Collapsible on mobile */}
          <Collapsible
            open={expandedSections.kpis}
            onOpenChange={() => toggleSection('kpis')}
            className="border rounded-lg sm:border-0 sm:rounded-none overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 sm:hidden bg-card">
              <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedSections.kpis ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="sm:block">
              <div className="p-4 sm:p-0">
                <KPIOverview kpis={kpiData ?? undefined} loading={loading} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Right column - Alerts and Supplier Balances */}
        <div className="space-y-4 sm:space-y-6">
          {/* Alerts Section - Already has its own mobile handling */}
          <AlertsSection alerts={alertsData?.alerts || []} />
          
          {/* Supplier Balances Card - Mobile optimized */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Supplier Balances
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 sm:hidden"
                  onClick={() => toggleSection('supplierBalances')}
                >
                  {expandedSections.supplierBalances ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Mobile: Show limited items with scroll if many */}
              {(expandedSections.supplierBalances || window.innerWidth >= 640) && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {dashboardData?.supplier_stats?.top_suppliers?.length ? (
                    dashboardData.supplier_stats.top_suppliers.map(
                      (supplier: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b last:border-0"
                        >
                          <span className="text-sm truncate max-w-[60%]" title={supplier.supplier}>
                            {supplier.supplier}
                          </span>
                          <span className="text-sm font-medium whitespace-nowrap ml-2">
                            {currencySymbol} {supplier.balance?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No supplier data available
                    </p>
                  )}
                </div>
              )}
              
              {/* Show count if collapsed on mobile */}
              {!expandedSections.supplierBalances && window.innerWidth < 640 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {dashboardData?.supplier_stats?.top_suppliers?.length || 0} suppliers
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity and Quick Actions - Hidden in your code but will be added when ready */}
      {/* Add these sections when you uncomment them */}

      {/* Footer - Mobile optimized */}
      <div className="text-xs text-muted-foreground border-t pt-4 mt-4 space-y-1">
        <div className="truncate">
          Logged in as: {user?.full_name || user?.username}
        </div>
        <div className="flex flex-wrap gap-1">
          <span>Role: {user?.role}</span>
          {systemSettings?.company_name && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="block sm:inline">{systemSettings.company_name}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}