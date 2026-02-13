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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Key, Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface UserData {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserData | null;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: ChangePasswordModalProps) {
  const { user: currentUser, authFetch } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.new_password) {
      toast.error("Validation Error", {
        description: "New password is required"
      });
      return;
    }

    if (formData.new_password.length < 8) {
      toast.error("Validation Error", {
        description: "Password must be at least 8 characters long"
      });
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      toast.error("Validation Error", {
        description: "New passwords do not match"
      });
      return;
    }

    setLoading(true);

    try {
      const url = user 
        ? `${API_BASE_URL}/api/users/${user.id}/password` 
        : `${API_BASE_URL}/api/auth/change-password`;      

      const requestBody = user 
        ? {
            newPassword: formData.new_password,
            confirmPassword: formData.confirm_password
          }
        : {
            currentPassword: formData.current_password,
            newPassword: formData.new_password,
            confirmPassword: formData.confirm_password
          };

      console.log("Sending request to:", url);
      console.log("Request body:", requestBody);

      // ✅ Use authFetch instead of fetch with manual token
      const response = await authFetch(url, {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to change password: ${response.status}`);
      }

      toast.success("Password Changed", {
        description: "Password has been updated successfully"
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error changing password:", error);
      
      // Specific error messages
      if (error.message.includes("Current password is incorrect")) {
        toast.error("Incorrect Password", {
          description: "The current password you entered is incorrect"
        });
      } else if (error.message.includes("same as current password")) {
        toast.error("Password Reuse", {
          description: "New password must be different from current password"
        });
      } else if (error.message.includes("recently used")) {
        toast.error("Password Reuse", {
          description: "Cannot reuse a recently used password"
        });
      } else if (error.message.includes("MISSING_PASSWORD_FIELDS")) {
        toast.error("Missing Fields", {
          description: "New password and confirmation are required"
        });
      } else {
        toast.error("Failed to Change Password", {
          description: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {user ? `Change Password for ${user.full_name}` : "Change Your Password"}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? "Set a new password for this user. The user will need to use this password on their next login."
              : "For security, choose a strong password that you haven't used before."
            }
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{user.full_name}</div>
              <div className="text-sm text-muted-foreground">
                {user.username} • {user.email}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="current_password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  placeholder="Enter your current password"
                  required={!user}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => togglePasswordVisibility("current")}
                  disabled={loading}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPasswords.new ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                placeholder="Enter new password"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => togglePasswordVisibility("new")}
                disabled={loading}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="Confirm new password"
                required
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => togglePasswordVisibility("confirm")}
                disabled={loading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="showAllPasswords"
              checked={Object.values(showPasswords).every(v => v)}
              onCheckedChange={(checked) => {
                setShowPasswords({
                  current: checked,
                  new: checked,
                  confirm: checked
                });
              }}
              disabled={loading}
            />
            <Label htmlFor="showAllPasswords" className="text-sm">
              Show all passwords
            </Label>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}