"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// ----------------------
// Schema
// ----------------------
const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).min(1, "Select at least one role"),
  active: z.boolean(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

// Mock roles (replace with API later)
const roles = [
  { id: "admin", name: "Admin", description: "Full system access" },
  { id: "manager", name: "Manager", description: "Manage users and data" },
  { id: "viewer", name: "Viewer", description: "Read-only access" },
];

export default function CreateUserPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      roles: [],
      active: true,
    },
  });

  const selectedRoles = watch("roles");

  const onSubmit = async (data: CreateUserForm) => {
    // TODO: Replace with API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("Create user payload:", data);

    router.push("/dashboard/users");
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create User</h1>
          <p className="text-sm text-muted-foreground">
            Add a new user and assign roles
          </p>
        </div>
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
            <CardTitle className="text-base">Assign Roles</CardTitle>
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
            Create User
          </Button>
        </div>
      </form>
    </div>
  );
}
