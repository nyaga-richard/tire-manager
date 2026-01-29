"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Search, Shield } from "lucide-react";

// Mock data (replace with API later)
const roles = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access",
    usersCount: 3,
    permissionsCount: 18,
    system: true,
  },
  {
    id: "manager",
    name: "Manager",
    description: "Manage users and operations",
    usersCount: 5,
    permissionsCount: 10,
    system: false,
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access",
    usersCount: 12,
    permissionsCount: 3,
    system: false,
  },
];

export default function RolesPage() {
  const [search, setSearch] = useState("");

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>

        <Button asChild>
          <Link href="/dashboard/roles/create">
            <Plus className="mr-2 h-4 w-4" />
            New Role
          </Link>
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Roles</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No roles found
                  </TableCell>
                </TableRow>
              )}

              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {role.name}
                    {role.system && (
                      <Badge variant="outline" className="ml-2">
                        System
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description}
                  </TableCell>
                  <TableCell>{role.usersCount}</TableCell>
                  <TableCell>{role.permissionsCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/roles/${role.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        {!role.system && (
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
