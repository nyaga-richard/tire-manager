"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Save, X, Shield } from "lucide-react";

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

interface RoleOption {
  value: number;
  label: string;
  description: string | null;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: RoleOption[];
  user?: any; // For editing existing user
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  roles,
  user,
}: UserFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role_id: "",
    department: "",
    is_active: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initialize form for editing
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "", // Don't show existing password
        full_name: user.full_name || "",
        role_id: user.role_id?.toString() || "",
        department: user.department || "",
        is_active: user.is_active === 1
      });
      setConfirmPassword("");
    } else {
      // Reset for new user
      setFormData({
        username: "",
        email: "",
        password: "",
        full_name: "",
        role_id: "",
        department: "",
        is_active: true
      });
      setConfirmPassword("");
    }
    setShowPassword(false);
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username.trim()) {
      toast.error("Validation Error", {
        description: "Username is required"
      });
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("Validation Error", {
        description: "Email is required"
      });
      return;
    }
    
    if (!formData.full_name.trim()) {
      toast.error("Validation Error", {
        description: "Full name is required"
      });
      return;
    }
    
    if (!formData.role_id) {
      toast.error("Validation Error", {
        description: "Role is required"
      });
      return;
    }
    
    // For new users, password is required
    if (!user && !formData.password) {
      toast.error("Validation Error", {
        description: "Password is required for new users"
      });
      return;
    }
    
    // Password validation for new users
    if (!user && formData.password) {
      if (formData.password.length < 8) {
        toast.error("Validation Error", {
          description: "Password must be at least 8 characters long"
        });
        return;
      }
      
      if (formData.password !== confirmPassword) {
        toast.error("Validation Error", {
          description: "Passwords do not match"
        });
        return;
      }
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Validation Error", {
        description: "Invalid email format"
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      const url = user 
        ? `${API_BASE_URL}/api/users/${user.id}`
        : `${API_BASE_URL}/api/users`;
      
      const method = user ? "PUT" : "POST";

      const requestData: any = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role_id: parseInt(formData.role_id),
        department: formData.department || null,
        is_active: formData.is_active ? 1 : 0
      };

      // Only include password for new users or if changed
      if (!user || formData.password) {
        requestData.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save user");
      }

      toast.success(user ? "User updated successfully" : "User created successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {user ? "Edit User" : "Create New User"}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? "Update user information and permissions"
              : "Add a new user to the system"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_id">Role *</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value.toString()}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.label}
                        {role.description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({role.description})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
                disabled={loading}
              />
            </div>

            {!user && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    required={!user}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required={!user}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showPassword"
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                    disabled={loading}
                  />
                  <Label htmlFor="showPassword" className="text-sm">
                    Show passwords
                  </Label>
                </div>
              </>
            )}

            {user && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  disabled={loading}
                />
                <Label htmlFor="is_active" className="text-sm">
                  User is active
                </Label>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {user ? "Update User" : "Create User"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}