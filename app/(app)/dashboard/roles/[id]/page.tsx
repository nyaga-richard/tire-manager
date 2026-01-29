"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

// ----------------------
// Schema
// ----------------------
const updateRoleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type UpdateRoleForm = z.infer<typeof updateRoleSchema>;

// Mock permissions (replace with API later)
const permissionGroups: Record<string, { key: string; label: string }[]> = {
  Users: [
    { key: "user.create", label: "Create user" },
    { key: "user.edit", label: "Edit user" },
    { key: "user.delete", label: "Delete user" },
    { key: "user.view", label: "View users" },
  ],
  Roles: [
    { key: "role.create", label: "Create role" },
    { key: "role.edit", label: "Edit role" },
    { key: "role.delete", label: "Delete role" },
  ],
  Reports: [{ key: "report.view", label: "View reports" }],
};

// Mock fetch role by ID
const fetchRoleById = async (id: string) => {
  await new Promise((r) => setTimeout(r, 700));
  return {
    id,
    name: "Manager",
    description: "Manage users and operations",
    permissions: ["user.view", "user.edit", "report.view"],
    system: false,
    usersCount: 5,
  };
};

export default function RoleDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSystemRole, setIsSystemRole] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRoleForm>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const selectedPermissions = watch("permissions");

  useEffect(() => {
    const loadRole = async () => {
      setLoading(true);
      const role = await fetchRoleById(params.id);
      reset({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
      setIsSystemRole(role.system);
      setLoading(false);
    };

    loadRole();
  }, [params.id, reset]);

  const togglePermission = (permission: string, checked: boolean) => {
    if (checked) {
      setValue("permissions", [...selectedPermissions, permission]);
    } else {
      setValue(
        "permissions",
        selectedPermissions.filter((p) => p !== permission)
      );
    }
  };

  const toggleGroup = (group: string, checked: boolean) => {
    const groupPermissions = permissionGroups[group].map((p) => p.key);

    if (checked) {
      setValue(
        "permissions",
        Array.from(new Set([...selectedPermissions, ...groupPermissions]))
      );
    } else {
      setValue(
        "permissions",
        selectedPermissions.filter((p) => !groupPermissions.includes(p))
      );
    }
  };

  const onSubmit = async (data: UpdateRoleForm) => {
    // TODO: Replace with API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("Update role payload:", { id: params.id, ...data });

    router.push("/dashboard/roles");
  };

  const onDelete = async () => {
    if (isSystemRole) return;
    if (!confirm("Are you sure you want to delete this role?")) return;

    // TODO: Replace with API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/dashboard/roles");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/roles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Role</h1>
            <p className="text-sm text-muted-foreground">
              Manage role details and permissions
            </p>
          </div>
        </div>

        {!isSystemRole && (
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Role
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input id="name" {...register("name")} disabled={isSystemRole} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                disabled={isSystemRole}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Users assigned to this role: <strong>5</strong>
            </p>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(permissionGroups).map(([group, perms]) => {
              const groupKeys = perms.map((p) => p.key);
              const allSelected = groupKeys.every((p) =>
                selectedPermissions.includes(p)
              );

              return (
                <div key={group} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      disabled={isSystemRole}
                      onCheckedChange={(checked) =>
                        toggleGroup(group, Boolean(checked))
                      }
                    />
                    <p className="font-medium">{group}</p>
                  </div>

                  <div className="grid gap-2 pl-6 sm:grid-cols-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.key}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={selectedPermissions.includes(permission.key)}
                          disabled={isSystemRole}
                          onCheckedChange={(checked) =>
                            togglePermission(permission.key, Boolean(checked))
                          }
                        />
                        <span className="text-sm">
                          {permission.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {errors.permissions && (
              <p className="text-sm text-red-500">
                {errors.permissions.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {!isSystemRole && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
