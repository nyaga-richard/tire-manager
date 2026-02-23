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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Info,
  Globe,
  Smartphone,
  Laptop,
  Moon,
  Sun,
  Monitor,
  Palette,
  Bell,
  Languages,
  Volume2,
  Eye as EyeIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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

// New interface for user preferences
interface UserPreferences {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  reducedMotion: boolean;
  highContrast: boolean;
  compactView: boolean;
  autoSave: boolean;
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, logout, authFetch } = useAuth();
  const { theme: currentTheme, setTheme, resolvedTheme } = useTheme();
  
  const [loading, setLoading] = useState({
    profile: true,
    activities: false,
    sessions: false,
    saving: false,
    changingPassword: false,
    savingPreferences: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "system",
    emailNotifications: true,
    pushNotifications: false,
    language: "en",
    reducedMotion: false,
    highContrast: false,
    compactView: false,
    autoSave: true,
  });
  
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

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem("userPreferences");
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(prev => ({
          ...prev,
          ...parsed,
          theme: currentTheme // Keep theme in sync with context
        }));
      } catch (e) {
        console.error("Failed to parse saved preferences");
      }
    } else {
      // Initialize with current theme
      setPreferences(prev => ({ ...prev, theme: currentTheme }));
    }
  }, [currentTheme]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
  }, [preferences]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch profile data
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/auth/profile`);
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.user);
        setFormData({
          full_name: data.user.full_name || "",
          email: data.user.email || "",
          department: data.user.department || "",
        });
      } else {
        if (currentUser) {
          setProfile({
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            full_name: currentUser.full_name || currentUser.username,
            department: null,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role_name: currentUser.role_name || 'User',
            role_description: null,
            is_system_role: 1,
            permissions: {}
          });
          setFormData({
            full_name: currentUser.full_name || currentUser.username,
            email: currentUser.email,
            department: "",
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      if (currentUser) {
        setProfile({
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          full_name: currentUser.full_name || currentUser.username,
          department: null,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role_name: currentUser.role_name || 'User',
          role_description: null,
          is_system_role: 1,
          permissions: {}
        });
        setFormData({
          full_name: currentUser.full_name || currentUser.username,
          email: currentUser.email,
          department: "",
        });
      }
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const fetchActivities = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(prev => ({ ...prev, activities: true }));
      const response = await authFetch(`${API_BASE_URL}/api/users/${currentUser.id}/activity?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error: any) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  };

  const fetchSessions = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(prev => ({ ...prev, sessions: true }));
      const response = await authFetch(`${API_BASE_URL}/api/users/${currentUser.id}/sessions`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          department: formData.department || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile updated successfully");
        fetchProfile();
      } else {
        toast.error("Unable to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Network error");
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.current_password) {
      toast.error("Current password is required");
      return;
    }
    
    if (!passwordData.new_password) {
      toast.error("New password is required");
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(prev => ({ ...prev, changingPassword: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.current_password,
          newPassword: passwordData.new_password,
          confirmPassword: passwordData.confirm_password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password changed successfully");
        
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setIsPasswordDialogOpen(false);
      } else {
        if (data.message?.includes("Current password is incorrect")) {
          toast.error("Incorrect current password");
        } else if (data.message?.includes("weak")) {
          toast.error("Password is too weak");
        } else {
          toast.error("Unable to change password");
        }
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Network error");
    } finally {
      setLoading(prev => ({ ...prev, changingPassword: false }));
    }
  };

  const handleForceLogoutAll = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${currentUser.id}/sessions`, {
        method: "DELETE",
      });
      
      const data = await response.json();

      if (data.success) {
        toast.success("Logged out from all other devices");
        fetchSessions();
      }
    } catch (error: any) {
      console.error("Error forcing logout:", error);
      toast.error("Unable to logout other devices");
    }
  };

  const handlePreferencesSave = () => {
    setLoading(prev => ({ ...prev, savingPreferences: true }));
    
    // Apply theme
    setTheme(preferences.theme);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Preferences saved", {
        description: "Your settings have been updated"
      });
      setLoading(prev => ({ ...prev, savingPreferences: false }));
    }, 500);
  };

  const formatDate = (dateString: string) => {
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
      return "Date unavailable";
    }
  };

  const formatActivityAction = (action: string) => {
    const actions: Record<string, string> = {
      'LOGIN': 'Logged in',
      'LOGOUT': 'Logged out',
      'LOGIN_FAILED': 'Failed login attempt',
      'LOGIN_SUCCESS': 'Successful login',
      'UPDATE_PROFILE': 'Updated profile',
      'CHANGE_PASSWORD': 'Changed password',
    };
    return actions[action] || action.replace(/_/g, ' ').toLowerCase();
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;
    if (userAgent.toLowerCase().includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (userAgent.toLowerCase().includes('tablet')) return <Smartphone className="h-4 w-4" />;
    return <Laptop className="h-4 w-4" />;
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
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

  if (loading.profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your profile...</p>
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
              Profile Unavailable
            </CardTitle>
            <CardDescription className="text-center">
              Unable to load your profile at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.is_active === 1);
  const hasPermissions = profile.permissions && Object.keys(profile.permissions).length > 0;

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
              Choose a strong password that you haven't used before.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="Enter current password"
                  disabled={loading.changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => togglePasswordVisibility("current")}
                  disabled={loading.changingPassword}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  disabled={loading.changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => togglePasswordVisibility("new")}
                  disabled={loading.changingPassword}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  disabled={loading.changingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => togglePasswordVisibility("confirm")}
                  disabled={loading.changingPassword}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={loading.changingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading.changingPassword}>
                {loading.changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
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
            Welcome back, {profile.full_name.split(' ')[0] || 'User'}!
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {/* Profile Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {profile.email}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      @{profile.username}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/5">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role_name}
                </Badge>
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

      {/* Tabs - Added Preferences tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="flex-1 sm:flex-none">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none">
            <Key className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1 sm:flex-none">
            <Palette className="mr-2 h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 sm:flex-none">
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
          {hasPermissions && (
            <TabsTrigger value="permissions" className="flex-1 sm:flex-none">
              <Shield className="mr-2 h-4 w-4" />
              Permissions
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Your full name"
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Your department (optional)"
                      disabled={loading.saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={profile.username} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading.saving}>
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
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">User ID</Label>
                  <div className="font-medium">{profile.id}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Member Since</Label>
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
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Change Password</h4>
                  <p className="text-sm text-muted-foreground">
                    Update your password regularly
                  </p>
                </div>
                <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                  <Key className="mr-2 h-4 w-4" />
                  Change
                </Button>
              </div>

              <Separator />

              {sessions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Active Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        {activeSessions.length} active session(s)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchSessions}
                        disabled={loading.sessions}
                      >
                        <RefreshCw className={`h-4 w-4 ${loading.sessions ? "animate-spin" : ""}`} />
                      </Button>
                      {activeSessions.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleForceLogoutAll}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout Others
                        </Button>
                      )}
                    </div>
                  </div>

                  {loading.sessions ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                              {getDeviceIcon(session.user_agent)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">Current Session</div>
                              <div className="text-xs text-muted-foreground">
                                {session.ip_address || 'IP unavailable'} • Last active: {formatDate(session.last_activity)}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                            Active
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-4">
                <Label>Theme</Label>
                <RadioGroup
                  value={preferences.theme}
                  onValueChange={(value: "light" | "dark" | "system") => 
                    setPreferences({ ...preferences, theme: value })
                  }
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="light"
                      id="theme-light"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="theme-light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Sun className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">Light</span>
                      {preferences.theme === "light" && (
                        <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="dark"
                      id="theme-dark"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="theme-dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Moon className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">Dark</span>
                      {preferences.theme === "dark" && (
                        <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="system"
                      id="theme-system"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="theme-system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Monitor className="mb-3 h-6 w-6" />
                      <span className="text-sm font-medium">System</span>
                      {preferences.theme === "system" && (
                        <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                  Current theme: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                </p>
              </div>

              <Separator />

              {/* Language Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="language">Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred language
                    </p>
                  </div>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Accessibility Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Accessibility</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduced-motion">Reduced Motion</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations throughout the app
                      </p>
                    </div>
                    <Switch
                      id="reduced-motion"
                      checked={preferences.reducedMotion}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, reducedMotion: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">High Contrast</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase color contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={preferences.highContrast}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, highContrast: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Preferences */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive browser notifications
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, pushNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Display Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Display Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compact-view">Compact View</Label>
                      <p className="text-sm text-muted-foreground">
                        Show more content with reduced spacing
                      </p>
                    </div>
                    <Switch
                      id="compact-view"
                      checked={preferences.compactView}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, compactView: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-save">Auto-save Forms</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically save form data as you type
                      </p>
                    </div>
                    <Switch
                      id="auto-save"
                      checked={preferences.autoSave}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, autoSave: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset to saved preferences
                  const savedPrefs = localStorage.getItem("userPreferences");
                  if (savedPrefs) {
                    setPreferences(JSON.parse(savedPrefs));
                  }
                  toast.info("Preferences reset");
                }}
              >
                Reset
              </Button>
              <Button 
                onClick={handlePreferencesSave}
                disabled={loading.savingPreferences}
              >
                {loading.savingPreferences ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
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
                    Your recent actions on the platform
                  </CardDescription>
                </div>
                {activities.length > 0 && (
                  <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading.activities}>
                    <RefreshCw className={`h-4 w-4 ${loading.activities ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading.activities ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No activity yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your recent actions will appear here
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
                        <div className="flex justify-between items-start gap-2">
                          <div className="font-medium text-sm">
                            {formatActivityAction(activity.action)}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(activity.timestamp)}
                          </div>
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
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        {hasPermissions && (
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Permissions</CardTitle>
                <CardDescription>
                  Based on your role: {profile.role_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(profile.permissions).map(([code, perm]) => (
                    <div key={code} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium">{code}</span>
                      <div className="flex gap-2">
                        {perm.can_view && <Badge variant="outline" className="bg-green-50 dark:bg-green-950">View</Badge>}
                        {perm.can_create && <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">Create</Badge>}
                        {perm.can_edit && <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950">Edit</Badge>}
                        {perm.can_delete && <Badge variant="outline" className="bg-red-50 dark:bg-red-950">Delete</Badge>}
                        {perm.can_approve && <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950">Approve</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          Logged in as {profile.username}
        </div>
        <Button variant="outline" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}