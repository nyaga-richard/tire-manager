"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";

// ----------------------
// Schema
// ----------------------
const createRoleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type CreateRoleForm = z.infer<typeof createRoleSchema>;

// Mock permissions grouped by module (replace with API later)
const permissionGroups: Record<
  string,
  { key: string; label: string }[]
> = {
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

export default function CreateRolePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const selectedPermissions = watch("permissions");

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

  const onSubmit = async (data: CreateRoleForm) => {
    // TODO: Replace with API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("Create role payload:", data);

    router.push("/dashboard/roles");
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create Role</h1>
          <p className="text-sm text-muted-foreground">
            Define a role and assign permissions
          </p>
        </div>
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
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
            </div>
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
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Role
          </Button>
        </div>
      </form>
    </div>
  );
}
