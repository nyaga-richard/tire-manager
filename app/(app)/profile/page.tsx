"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User,
  Mail,
  Shield,
  Building,
  Calendar,
  Clock,
  Key,
  Save,
  LogOut,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Settings,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Interfaces
interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department: string | null;
  last_login: string;
  created_at: string;
  updated_at: string;
  role_name: string;
  role_description: string | null;
  is_system_role: number;
  permissions: Record<string, {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
  }>;
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
}

export default function MyProfilePage() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  
  const [loading, setLoading] = useState({
    profile: true,
    activities: false,
    sessions: false,
    saving: false,
    changingPassword: false
  });
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Fetch profile data
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Fetch data helper
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error("No authentication token");
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        toast.error("Session Expired", {
          description: "Please login again"
        });
        logout();
        throw new Error("Authentication required");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return response.json();
  };

  const fetchProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      const data = await fetchWithAuth("/api/auth/profile");
      if (data.success) {
        setProfile(data.user);
        setFormData({
          full_name: data.user.full_name || "",
          email: data.user.email || "",
          department: data.user.department || "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(prev => ({ ...prev, activities: true }));
      const data = await fetchWithAuth(`/api/users/${user?.id}/activity?limit=20`);
      if (data.success) {
        setActivities(data.activities);
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
      const data = await fetchWithAuth(`/api/users/${user?.id}/sessions`);
      if (data.success) {
        setSessions(data.sessions);
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.full_name.trim()) {
      toast.error("Validation Error", {
        description: "Full name is required"
      });
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("Validation Error", {
        description: "Email is required"
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

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await fetchWithAuth("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          department: formData.department || null,
        }),
      });

      if (response.success) {
        toast.success("Profile updated successfully");
        fetchProfile();
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordData.current_password) {
      toast.error("Validation Error", {
        description: "Current password is required"
      });
      return;
    }
    
    if (!passwordData.new_password) {
      toast.error("Validation Error", {
        description: "New password is required"
      });
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error("Validation Error", {
        description: "Password must be at least 8 characters long"
      });
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Validation Error", {
        description: "New passwords do not match"
      });
      return;
    }

    setLoading(prev => ({ ...prev, changingPassword: true }));

    try {
      const response = await fetchWithAuth("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.current_password,
          newPassword: passwordData.new_password,
          confirmPassword: passwordData.confirm_password,
        }),
      });

      if (response.success) {
        toast.success("Password changed successfully", {
          description: "You will be logged out of all other devices"
        });
        
        // Reset password form
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setIsPasswordDialogOpen(false);
        
        // Suggest logout
        toast.info("Security Notice", {
          description: "For security, please login again with your new password",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      
      // Specific error messages
      if (error.message.includes("Current password is incorrect")) {
        toast.error("Incorrect Password", {
          description: "The current password you entered is incorrect"
        });
      } else if (error.message.includes("weak")) {
        toast.error("Weak Password", {
          description: error.message
        });
      } else {
        toast.error("Failed to Change Password", {
          description: error.message
        });
      }
    } finally {
      setLoading(prev => ({ ...prev, changingPassword: false }));
    }
  };

  const handleForceLogoutAll = async () => {
    try {
      const response = await fetchWithAuth(`/api/users/${user?.id}/sessions`, {
        method: "DELETE",
      });

      if (response.success) {
        toast.success("Logged out from all devices");
        fetchSessions();
      }
    } catch (error: any) {
      console.error("Error forcing logout:", error);
      toast.error("Failed to force logout", {
        description: error.message
      });
    }
  };

  const handleForceLogoutSingle = async (sessionId: string) => {
    try {
      const response = await fetchWithAuth(`/api/users/${user?.id}/sessions`, {
        method: "DELETE",
        body: JSON.stringify({
          except_session_token: sessionId
        }),
      });

      if (response.success) {
        toast.success("Logged out from other devices");
        fetchSessions();
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
    } else if (value === "security") {
      fetchSessions();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatActivityAction = (action: string) => {
    const actions: Record<string, string> = {
      'LOGIN': 'Logged in',
      'LOGOUT': 'Logged out',
      'LOGIN_FAILED': 'Failed login',
      'LOGIN_SUCCESS': 'Successful login',
      'UPDATE_PROFILE': 'Updated profile',
      'CHANGE_PASSWORD': 'Changed password',
      'CREATE_USER': 'Created user',
      'UPDATE_USER': 'Updated user',
      'DELETE_USER': 'Deleted user'
    };
    return actions[action] || action.replace('_', ' ');
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const activeSessions = sessions.filter(s => s.is_active === 1);
  const inactiveSessions = sessions.filter(s => s.is_active === 0);

  if (loading.profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              Profile Not Found
            </CardTitle>
            <CardDescription className="text-center">
              Unable to load your profile. Please try logging in again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              For security, choose a strong password that you haven't used before.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="Enter your current password"
                  required
                  disabled={loading.changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => togglePasswordVisibility("current")}
                  disabled={loading.changingPassword}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Enter new password"
                  required
                  disabled={loading.changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => togglePasswordVisibility("new")}
                  disabled={loading.changingPassword}
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
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Confirm new password"
                  required
                  disabled={loading.changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => togglePasswordVisibility("confirm")}
                  disabled={loading.changingPassword}
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
                disabled={loading.changingPassword}
              />
              <Label htmlFor="showAllPasswords" className="text-sm">
                Show all passwords
              </Label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
              <div className="text-sm text-yellow-800">
                <strong className="font-medium">Security Notice:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Password must be at least 8 characters long</li>
                  <li>You'll be logged out of all other devices</li>
                  <li>Consider using a password manager</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={loading.changingPassword}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading.changingPassword}
                className="min-w-[120px]"
              >
                {loading.changingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and security
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold">{profile.full_name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {profile.email}
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {profile.username}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">
                    <Shield className="h-3 w-3 mr-1" />
                    {profile.role_name}
                  </Badge>
                </div>
              </div>
              {profile.department && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {profile.department}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Key className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Your department"
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={profile.username}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Username cannot be changed
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading.saving}>
                    {loading.saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                System information about your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">User ID</Label>
                  <div className="font-medium">{profile.id}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Account Created</Label>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(profile.created_at)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Last Updated</Label>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(profile.updated_at)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Last Login</Label>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(profile.last_login)}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <div className="font-medium">
                    {profile.role_name}
                    {profile.role_description && (
                      <p className="text-sm text-muted-foreground">
                        {profile.role_description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Role Type</Label>
                  <div>
                    <Badge variant={profile.is_system_role ? "default" : "secondary"}>
                      {profile.is_system_role ? "System Role" : "Custom Role"}
                    </Badge>
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
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password Change */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Update your password regularly for security
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
                <Separator />
              </div>

              {/* Session Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Active Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage your login sessions across devices
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={fetchSessions}
                      disabled={loading.sessions}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading.sessions ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    {activeSessions.length > 1 && (
                      <Button
                        variant="outline"
                        onClick={handleForceLogoutAll}
                        disabled={loading.sessions}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout All Others
                      </Button>
                    )}
                  </div>
                </div>

                {loading.sessions ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading sessions...</p>
                    </div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No sessions found</h3>
                    <p className="text-muted-foreground">
                      You are not currently logged in on any device
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Sessions */}
                    {activeSessions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">
                          Active Sessions ({activeSessions.length})
                        </h5>
                        {activeSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium">Active Session</div>
                                <div className="text-sm text-muted-foreground">
                                  Last activity: {formatDate(session.last_activity)}
                                </div>
                                {session.ip_address && (
                                  <div className="text-xs text-muted-foreground">
                                    IP: {session.ip_address}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(session.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inactive Sessions */}
                    {showAllSessions && inactiveSessions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium">
                            Inactive Sessions ({inactiveSessions.length})
                          </h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAllSessions(false)}
                          >
                            Hide
                          </Button>
                        </div>
                        {inactiveSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium">Inactive Session</div>
                                <div className="text-sm text-muted-foreground">
                                  Expired: {formatDate(session.last_activity)}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(session.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!showAllSessions && inactiveSessions.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAllSessions(true)}
                      >
                        Show {inactiveSessions.length} inactive session(s)
                      </Button>
                    )}
                  </div>
                )}

                {activeSessions.length > 1 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Multiple Active Sessions
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          You are currently logged in on {activeSessions.length} devices.
                          If you see unfamiliar sessions, logout from all devices.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t">
              <div className="text-sm text-muted-foreground">
                Last password change recommended: Every 90 days
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your recent actions and system activities
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchActivities}
                  disabled={loading.activities}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading.activities ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
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
                    You haven't performed any actions yet
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
                        {activity.performed_by_username && activity.performed_by_username !== profile.username && (
                          <div className="text-sm text-muted-foreground mt-1">
                            By: {activity.performed_by_username}
                          </div>
                        )}
                        {activity.ip_address && (
                          <div className="text-xs text-muted-foreground mt-1">
                            IP: {activity.ip_address}
                          </div>
                        )}
                        {activity.user_agent && (
                          <div className="text-xs text-muted-foreground truncate" title={activity.user_agent}>
                            Device: {activity.user_agent}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Showing {activities.length} most recent activities
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Permissions</CardTitle>
              <CardDescription>
                Permissions assigned to your role: {profile.role_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(profile.permissions).length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No permissions found</h3>
                  <p className="text-muted-foreground">
                    You don't have any specific permissions assigned
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group permissions by category */}
                  {(() => {
                    const groupedPermissions: Record<string, Array<[string, any]>> = {};
                    
                    // Group by first part of permission code (before the first dot)
                    Object.entries(profile.permissions).forEach(([code, perms]) => {
                      const category = code.split('.')[0];
                      if (!groupedPermissions[category]) {
                        groupedPermissions[category] = [];
                      }
                      groupedPermissions[category].push([code, perms]);
                    });
                    
                    return Object.entries(groupedPermissions).map(([category, perms]) => (
                      <Card key={category} className="overflow-hidden">
                        <CardHeader className="py-3 bg-muted/50">
                          <CardTitle className="text-sm font-medium capitalize">
                            {category.replace(/_/g, ' ')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/3">Permission</TableHead>
                                <TableHead className="text-center">View</TableHead>
                                <TableHead className="text-center">Create</TableHead>
                                <TableHead className="text-center">Edit</TableHead>
                                <TableHead className="text-center">Delete</TableHead>
                                <TableHead className="text-center">Approve</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {perms.map(([code, perm]) => (
                                <TableRow key={code}>
                                  <TableCell>
                                    <div className="font-medium">{code}</div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {perm.can_view ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {perm.can_create ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {perm.can_edit ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {perm.can_delete ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {perm.can_approve ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ));
                  })()}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                Total permissions: {Object.keys(profile.permissions).length}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          User ID: {profile.id} • Role: {profile.role_name}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFormData({
                full_name: profile.full_name || "",
                email: profile.email || "",
                department: profile.department || "",
              });
              setActiveTab("profile");
              toast.info("Form reset", {
                description: "All changes have been discarded"
              });
            }}
          >
            Reset Changes
          </Button>
          <Button onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}