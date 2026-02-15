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
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

  // Get currency settings
  const currency = systemSettings?.currency || 'KES';
  const currencySymbol = systemSettings?.currency_symbol || 'KSH';

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Will be redirected by middleware, but we'll handle it here too
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

  // Show auth loading state
  if (authLoading || settingsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
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
      <div className="container mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Company Info Header */}
      {systemSettings?.company_name && (
        <div className="text-xs text-muted-foreground mb-2">
          {systemSettings.company_name} • Currency: {currencySymbol} ({currency})
        </div>
      )}

      <DashboardHeader
        onDateRangeChange={handleDateRangeChange}
        onRefresh={fetchDashboardData}
      />

      <StatsCards summary={dashboardData?.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartsSection charts={dashboardData?.charts} />
          <KPIOverview kpis={kpiData ?? undefined} />

        </div>

        {/* Right sidebar - Alerts and Supplier Balances */}
        <div className="space-y-6">
          <AlertsSection alerts={alertsData?.alerts || []} />
          
          {/* Supplier Balances Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Supplier Balances
              </h3>
              {dashboardData?.supplier_stats?.top_suppliers?.length ? (
                dashboardData.supplier_stats.top_suppliers.map(
                  (supplier: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <span className="text-sm truncate">
                        {supplier.supplier}
                      </span>
                      <span className="text-sm font-medium">
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
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity
        <div className="lg:col-span-2">
          <RecentActivity activities={activityData?.activities || []} />
        </div>
        
        {/* Quick Actions 
        <div>
          <QuickActions />
        </div> */}
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground border-t pt-4">
        Logged in as: {user?.full_name || user?.username} • Role: {user?.role}
        {systemSettings?.company_name && ` • ${systemSettings.company_name}`}
      </div>
    </div>
  );
}