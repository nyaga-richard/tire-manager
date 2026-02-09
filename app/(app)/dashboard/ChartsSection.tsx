"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp,
} from "lucide-react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
} from "recharts";

interface ChartsSectionProps {
  charts?: {
    tire_status_distribution: Array<{
      status: string;
      count: number;
      color: string;
    }>;
    tire_type_distribution: Array<{
      type: string;
      count: number;
      color: string;
    }>;
    movement_trends: Array<{
      date: string;
      installations: number;
      removals: number;
    }>;
    purchase_trends: Array<{
      month: string;
      total: number;
      count: number;
    }>;
  };
}

export default function ChartsSection({ charts }: ChartsSectionProps) {
  const statusData = charts?.tire_status_distribution ?? [];
  const typeData = charts?.tire_type_distribution ?? [];
  const movementData = charts?.movement_trends ?? [];
  const purchaseData = charts?.purchase_trends ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Analytics Overview
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Tire Status
            </TabsTrigger>

            <TabsTrigger value="types" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tire Types
            </TabsTrigger>

            <TabsTrigger value="movements" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Movements
            </TabsTrigger>

            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Purchases
            </TabsTrigger>
          </TabsList>

          {/* Tire Status */}
          <TabsContent value="status" className="pt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ payload, percent = 0 }) =>
                    `${payload?.status}: ${(percent * 100).toFixed(0)}%`
                    }
>
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Tire Types */}
          <TabsContent value="types" className="pt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Tire Count" radius={[4, 4, 0, 0]}>
                    {typeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Movements */}
          <TabsContent value="movements" className="pt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="installations"
                    stroke="#4CAF50"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="removals"
                    stroke="#F44336"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Purchases */}
          <TabsContent value="purchases" className="pt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={purchaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                    <Tooltip
                    formatter={(value = 0) => [`$${value.toLocaleString()}`, "Amount"]}
                    />

                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2196F3"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
