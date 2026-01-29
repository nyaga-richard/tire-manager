"use client";

import { Users, Shield, Lock, UserPlus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
  {
    label: "Total Users",
    value: 128,
    icon: Users,
    href: "/dashboard/users",
  },
  {
    label: "Roles",
    value: 6,
    icon: Shield,
    href: "/dashboard/roles",
  },
  {
    label: "Permissions",
    value: 24,
    icon: Lock,
    href: "/dashboard/permissions",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your user access system</p>
        </div>

        <Link href="/dashboard/users/create">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            New User
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription className="mt-1">View details</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/users/create" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UserPlus className="h-4 w-4" />
                Create a new user
              </Button>
            </Link>
            <Link href="/dashboard/roles/create" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Shield className="h-4 w-4" />
                Create a new role
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RBAC Overview</CardTitle>
            <CardDescription>How access control works</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Users are assigned one or more roles</p>
            <p>• Roles define permissions</p>
            <p>• Permissions control system actions</p>
            <p>• Permissions are enforced across the application</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
