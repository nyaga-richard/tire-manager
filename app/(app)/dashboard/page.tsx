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

const API_BASE_URL = "http://localhost:5000/api";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const buildQuery = (params: Record<string, string>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value);
    });
    return query.toString();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsQuery = buildQuery(dateRange);

    const [
      dashboardRes,
      alertsRes,
      activityRes,
      kpiRes,
    ] = await Promise.all([
      fetch(`${API_BASE_URL}/dashboard/stats?${statsQuery}`, {
        credentials: "include", // << Add this
      }),
      fetch(`${API_BASE_URL}/dashboard/alerts`, {
        credentials: "include",
      }),
      fetch(`${API_BASE_URL}/dashboard/activity?limit=10`, {
        credentials: "include",
      }),
      fetch(`${API_BASE_URL}/dashboard/kpis`, {
        credentials: "include",
      }),
    ]);


      if (!dashboardRes.ok) throw new Error("Failed dashboard stats");
      if (!alertsRes.ok) throw new Error("Failed alerts");
      if (!activityRes.ok) throw new Error("Failed activity");
      if (!kpiRes.ok) throw new Error("Failed KPIs");

      const dashboardJson = await dashboardRes.json();
      const alertsJson = await alertsRes.json();
      const activityJson = await activityRes.json();
      const kpiJson = await kpiRes.json();

      setDashboardData(dashboardJson);
      setAlertsData(alertsJson);
      setActivityData(activityJson);
      setKpiData(kpiJson.kpis);

      toast.success("Dashboard data loaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const handleDateRangeChange = (range: { start: string; end: string }) => {
    setDateRange(range);
  };

  if (loading) {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DashboardHeader
        onDateRangeChange={handleDateRangeChange}
        onRefresh={fetchDashboardData}
      />

      <StatsCards summary={dashboardData?.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartsSection charts={dashboardData?.charts} />
          <KPIOverview kpis={kpiData} />
        </div>

        <div className="space-y-6">
          <AlertsSection alerts={alertsData?.alerts || []} />
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={activityData?.activities || []} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Supplier Balances
              </h3>
              {dashboardData?.supplier_stats?.top_suppliers?.map(
                (supplier: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <span className="text-sm truncate">
                      {supplier.supplier}
                    </span>
                    <span className="text-sm font-medium">
                      ${supplier.balance?.toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
