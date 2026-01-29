"use client";

import { useState } from "react";
import { Shield, Search, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Central permission registry (single source of truth)
const PERMISSIONS = {
  users: {
    label: "Users",
    permissions: [
      { key: "user.view", label: "View users" },
      { key: "user.create", label: "Create users" },
      { key: "user.update", label: "Update users" },
      { key: "user.delete", label: "Delete users" },
    ],
  },
  roles: {
    label: "Roles",
    permissions: [
      { key: "role.view", label: "View roles" },
      { key: "role.create", label: "Create roles" },
      { key: "role.update", label: "Update roles" },
      { key: "role.delete", label: "Delete roles" },
    ],
  },
  permissions: {
    label: "Permissions",
    permissions: [
      { key: "permission.view", label: "View permissions" },
      { key: "permission.manage", label: "Manage permissions" },
    ],
  },
};

export default function PermissionsPage() {
  const [search, setSearch] = useState("");

  const filteredModules = Object.entries(PERMISSIONS).filter(([_, module]) =>
    module.permissions.some(
      (p) =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.key.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Permissions</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Registry</CardTitle>
          <CardDescription>
            This is a read-only list of all system permissions. Permissions are assigned to roles, not directly to users.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {filteredModules.map(([key, module]) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">{module.label}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {module.permissions.map((permission) => (
                  <div
                    key={permission.key}
                    className="rounded-lg border p-3 text-sm flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{permission.label}</p>
                      <p className="text-muted-foreground text-xs">{permission.key}</p>
                    </div>
                    <Badge variant="secondary">System</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
