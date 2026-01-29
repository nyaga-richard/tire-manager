"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

// ----------------------
// Schema
// ----------------------
const updateUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
  active: z.boolean(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

// Mock roles (replace with API later)
const roles = [
  { id: "admin", name: "Admin", description: "Full system access" },
  { id: "manager", name: "Manager", description: "Manage users and data" },
  { id: "viewer", name: "Viewer", description: "Read-only access" },
];

// Mock fetch user
const fetchUserById = async (id: string) => {
  await new Promise((r) => setTimeout(r, 600));
  return {
    id,
    name: "John Doe",
    email: "john@example.com",
    roles: ["admin"],
    active: true,
    createdAt: "2025-01-10",
  };
};

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      roles: [],
      active: true,
    },
  });

  const selectedRoles = watch("roles");

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const user = await fetchUserById(params.id);
      reset({
        name: user.name,
        email: user.email,
        roles: user.roles,
        active: user.active,
      });
      setLoading(false);
    };

    loadUser();
  }, [params.id, reset]);

  const onSubmit = async (data: UpdateUserForm) => {
    // TODO: Replace with API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("Update user payload:", { id: params.id, ...data });

    router.push("/dashboard/users");
  };

  const onDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    // TODO: Replace with API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/dashboard/users");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit User</h1>
            <p className="text-sm text-muted-foreground">
              Update user details and roles
            </p>
          </div>
        </div>

        <Button variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Active User</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive users cannot sign in
                </p>
              </div>
              <Switch
                checked={watch("active")}
                onCheckedChange={(value) => setValue("active", value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assigned Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-start gap-3 rounded-lg border p-4"
              >
                <Checkbox
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setValue("roles", [...selectedRoles, role.id]);
                    } else {
                      setValue(
                        "roles",
                        selectedRoles.filter((r) => r !== role.id)
                      );
                    }
                  }}
                />
                <div>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}

            {errors.roles && (
              <p className="text-sm text-red-500">{errors.roles.message}</p>
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
