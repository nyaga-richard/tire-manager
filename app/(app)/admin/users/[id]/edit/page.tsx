"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Shield,
  Building,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Key,
  Activity,
  LogOut,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Fixed import
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import ChangePasswordModal from "@/components/change-password-modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Interfaces
interface UserData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department: string | null;
  role_name: string;
  role_id: number;
  is_active: number;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  role_description?: string | null;
  is_system_role?: number;
}

interface RoleOption {
  value: number;
  label: string;
  description: string | null;
  is_system_role: number;
}

interface Activity {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_values: string | null;
  new_values: string | null;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  performed_by_username: string;
}

interface Session {
  id: number;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity: string;
  is_active: number;
  username: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth(); // ✅ Use authFetch
  
  const [loading, setLoading] = useState({
    user: true,
    roles: false,
    activities: false,
    sessions: false,
    saving: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    role_id: "",
    department: "",
    is_active: true
  });
  
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: ""
  });

  // Check permissions
  const canViewUsers = hasPermission("user.view");
  const canEditUser = hasPermission("user.edit");
  const isSelfEdit = currentUser?.id === parseInt(userId);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect if no permission
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (!canViewUsers) {
        toast.error("Access Denied", {
          description: "You don't have permission to view users"
        });
        router.push("/dashboard");
      }
      
      // Check if user can edit (unless it's their own profile)
      if (!isSelfEdit && !canEditUser) {
        toast.error("Access Denied", {
          description: "You don't have permission to edit other users"
        });
        router.push("/admin/users");
      }
    }
  }, [authLoading, isAuthenticated, canViewUsers, canEditUser, isSelfEdit, router]);

  // Fetch user data
  useEffect(() => {
    if (isAuthenticated && userId && (canViewUsers || isSelfEdit)) {
      fetchUser();
      fetchRoles();
    }
  }, [isAuthenticated, userId, canViewUsers, isSelfEdit]);

  // Fetch data helper
  const fetchUser = async () => {
    try {
      setLoading(prev => ({ ...prev, user: true }));
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}?include_permissions=true`);
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setFormData({
          username: data.user.username || "",
          email: data.user.email || "",
          full_name: data.user.full_name || "",
          role_id: data.user.role_id?.toString() || "",
          department: data.user.department || "",
          is_active: data.user.is_active === 1
        });
      } else {
        throw new Error(data.message || "Failed to load user");
      }
    } catch (error: any) {
      console.error("Error fetching user:", error);
      setError(error.message || "Failed to load user");
      toast.error("Failed to load user", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(prev => ({ ...prev, roles: true }));
      const response = await authFetch(`${API_BASE_URL}/api/users/roles/options`);
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.roles || []);
      }
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(prev => ({ ...prev, activities: true }));
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/activity?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(prev => ({ ...prev, sessions: true }));
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/sessions`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  };

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
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Validation Error", {
        description: "Invalid email format"
      });
      return;
    }

    // Password validation if password field is shown
    if (showPasswordField) {
      if (!passwordData.password) {
        toast.error("Validation Error", {
          description: "Password is required"
        });
        return;
      }
      
      if (passwordData.password.length < 8) {
        toast.error("Validation Error", {
          description: "Password must be at least 8 characters long"
        });
        return;
      }
      
      if (passwordData.password !== passwordData.confirmPassword) {
        toast.error("Validation Error", {
          description: "Passwords do not match"
        });
        return;
      }
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const requestData: any = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role_id: parseInt(formData.role_id),
        department: formData.department || null,
        updated_by: currentUser?.id
      };

      // Only include is_active if editing another user
      if (!isSelfEdit) {
        requestData.is_active = formData.is_active ? 1 : 0;
      }

      // Include password if provided
      if (showPasswordField && passwordData.password) {
        requestData.password = passwordData.password;
      }

      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("User updated successfully");
        fetchUser();
        setShowPasswordField(false);
        setPasswordData({ password: "", confirmPassword: "" });
        
        // If password was changed, suggest logout
        if (showPasswordField) {
          toast.info("Security Notice", {
            description: "User will need to login with the new password",
            duration: 5000,
          });
        }
      } else {
        throw new Error(data.message || "Failed to update user");
      }
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleForceLogout = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/sessions`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("User logged out from all devices");
        fetchSessions();
      } else {
        throw new Error(data.message || "Failed to force logout");
      }
    } catch (error: any) {
      console.error("Error forcing logout:", error);
      toast.error("Failed to force logout", {
        description: error.message
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "activity") {
      fetchActivities();
    } else if (value === "sessions") {
      fetchSessions();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Invalid date";
    }
  };

  const getStatusBadge = (isActive: number) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const formatActivityAction = (action: string) => {
    const actions: Record<string, string> = {
      'LOGIN': 'Logged in',
      'LOGOUT': 'Logged out',
      'CREATE_USER': 'Created user',
      'UPDATE_USER': 'Updated user',
      'DELETE_USER': 'Deleted user',
      'CHANGE_PASSWORD': 'Changed password',
      'INVALIDATE_SESSIONS': 'Invalidated sessions'
    };
    return actions[action] || action.replace(/_/g, ' ');
  };

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied
  if (!canViewUsers && !isSelfEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-center">
              You don't have permission to view user details.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/users">Return to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading.user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              User Not Found
            </CardTitle>
            <CardDescription className="text-center">
              {error || "The user you're looking for doesn't exist or has been deleted."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/users">Return to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="user.view" action="view">
      <div className="space-y-6">
        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSuccess={() => {
            toast.success("Password changed successfully");
          }}
          user={user}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/admin/users")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
              <p className="text-muted-foreground">
                Update user information and permissions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/users")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading.saving}>
              {loading.saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* User Info Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold">{user.full_name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {user.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user.is_active)}
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role_name}
                    </Badge>
                  </div>
                </div>
                {user.department && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {user.department}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update user's personal information and role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      disabled={loading.saving}
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
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter full name"
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Enter department"
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role_id">Role *</Label>
                    <Select
                      value={formData.role_id}
                      onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                      disabled={loading.saving || loading.roles}
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

                  {!isSelfEdit && (
                    <div className="space-y-2">
                      <Label htmlFor="is_active">Account Status</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                          disabled={loading.saving}
                        />
                        <Label htmlFor="is_active" className="text-sm">
                          User is active
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.is_active 
                          ? "User can login and access the system"
                          : "User cannot login to the system"
                        }
                      </p>
                    </div>
                  )}
                </div>

                {isSelfEdit && (
                  <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 rounded-md p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Editing Your Own Profile
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          You cannot change your own account status. 
                          Contact an administrator if you need to deactivate your account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  System information about this user account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">User ID</Label>
                    <div className="font-medium">{user.id}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Account Created</Label>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Last Updated</Label>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.updated_at)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Last Login</Label>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(user.last_login)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password Management</CardTitle>
                <CardDescription>
                  Change user password or reset security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Password Change */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Set a new password for this user
                      </p>
                    </div>
                    <PermissionGuard permissionCode="user.edit" action="edit" fallback={null}>
                      <Button
                        variant="outline"
                        onClick={() => setIsChangePasswordModalOpen(true)}
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </Button>
                    </PermissionGuard>
                  </div>

                  <Separator />

                  {/* Optional: Set password in form */}
                  {canEditUser && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">Set New Password</h4>
                          <p className="text-sm text-muted-foreground">
                            Alternatively, set password directly in form
                          </p>
                        </div>
                        <Switch
                          checked={showPasswordField}
                          onCheckedChange={setShowPasswordField}
                          disabled={loading.saving}
                        />
                      </div>

                      {showPasswordField && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="password">New Password</Label>
                              <div className="relative">
                                <Input
                                  id="password"
                                  type="password"
                                  value={passwordData.password}
                                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                  placeholder="Enter new password"
                                  disabled={loading.saving}
                                  className="pr-10"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Password must be at least 8 characters long
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirm Password</Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                  placeholder="Confirm new password"
                                  disabled={loading.saving}
                                  className="pr-10"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                {/* Session Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Session Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Force logout from all devices
                      </p>
                    </div>
                    <PermissionGuard permissionCode="user.edit" action="edit" fallback={null}>
                      <Button
                        variant="outline"
                        onClick={handleForceLogout}
                        disabled={loading.sessions}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Force Logout
                      </Button>
                    </PermissionGuard>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 rounded-md p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Security Warning
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          Forcing logout will invalidate all active sessions for this user.
                          They will need to login again on all devices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Recent actions performed by or on this user account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.activities ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading activities...</p>
                    </div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No activity found</h3>
                    <p className="text-muted-foreground">
                      This user hasn't performed any actions yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="font-medium">{formatActivityAction(activity.action)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(activity.timestamp)}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Performed by: {activity.performed_by_username}
                          </div>
                          {activity.ip_address && (
                            <div className="text-xs text-muted-foreground mt-1">
                              IP: {activity.ip_address}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={fetchActivities} disabled={loading.activities}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading.activities ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Current login sessions for this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.sessions ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading sessions...</p>
                    </div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <LogOut className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No active sessions</h3>
                    <p className="text-muted-foreground">
                      This user is not currently logged in on any device
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-start gap-3 p-4 border rounded-lg">
                        <div className={`h-8 w-8 rounded-full ${session.is_active ? 'bg-green-100 dark:bg-green-950' : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center flex-shrink-0`}>
                          {session.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="font-medium">
                              {session.is_active ? 'Active Session' : 'Expired Session'}
                            </div>
                            <Badge variant={session.is_active ? "default" : "outline"}>
                              {session.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Created: {formatDate(session.created_at)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Last Activity: {formatDate(session.last_activity)}
                          </div>
                          {session.ip_address && (
                            <div className="text-xs text-muted-foreground mt-1">
                              IP Address: {session.ip_address}
                            </div>
                          )}
                          {session.user_agent && (
                            <div className="text-xs text-muted-foreground truncate" title={session.user_agent}>
                              Device: {session.user_agent}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {sessions.filter(s => s.is_active).length} active session(s)
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchSessions} disabled={loading.sessions}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading.sessions ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  {sessions.filter(s => s.is_active).length > 0 && (
                    <PermissionGuard permissionCode="user.edit" action="edit" fallback={null}>
                      <Button
                        variant="outline"
                        onClick={handleForceLogout}
                        disabled={loading.sessions}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Force Logout All
                      </Button>
                    </PermissionGuard>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/users")}
          >
            Back to Users
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFormData({
                  username: user.username || "",
                  email: user.email || "",
                  full_name: user.full_name || "",
                  role_id: user.role_id?.toString() || "",
                  department: user.department || "",
                  is_active: user.is_active === 1
                });
                setShowPasswordField(false);
                setPasswordData({ password: "", confirmPassword: "" });
                toast.info("Form reset", {
                  description: "All changes have been discarded"
                });
              }}
            >
              Reset
            </Button>
            <Button onClick={handleSubmit} disabled={loading.saving}>
              {loading.saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          Logged in as: {currentUser?.full_name || currentUser?.username} • Role: {currentUser?.role}
        </div>
      </div>
    </PermissionGuard>
  );
}