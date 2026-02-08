"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Lock, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define environment variable for API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface ApiResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    role_id: number;
    department: string;
    last_login: string;
    created_at: string;
  };
  permissions?: Record<string, {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
  }>;
  session?: {
    id: number;
    expires_at: string;
  };
  error?: string;
  code?: string;
}

// Auth utility functions
const storeToken = (token: string, rememberMe: boolean = false): void => {
  if (rememberMe) {
    localStorage.setItem("auth_token", token);
  } else {
    sessionStorage.setItem("auth_token", token);
  }
};

const storeUser = (user: any, permissions: any, rememberMe: boolean = false): void => {
  const userData = JSON.stringify(user);
  const permData = JSON.stringify(permissions);
  
  if (rememberMe) {
    localStorage.setItem("user_info", userData);
    localStorage.setItem("user_permissions", permData);
  } else {
    sessionStorage.setItem("user_info", userData);
    sessionStorage.setItem("user_permissions", permData);
  }
};

// Check if user is already logged in (for redirection)
const isAuthenticated = (): boolean => {
  return !!(localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token"));
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [loginError, setLoginError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/inventory");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setLoginError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.token && data.user) {
        // Store token and user info
        storeToken(data.token, formData.rememberMe);
        storeUser(data.user, data.permissions || {}, formData.rememberMe);

        // If rememberMe is true and we have a refresh token, store it
        if (formData.rememberMe && data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
        }

        // Show success message
        toast.success("Login successful", {
          description: `Welcome back, ${data.user.full_name}!`,
          duration: 3000,
        });

        // IMPORTANT: Clear any previous states and force navigation
        setTimeout(() => {
          // Use window.location for a hard redirect
          window.location.href = "/inventory";
        }, 500);

      } else {
        // Handle specific error codes
        const errorCode = data.code || 'LOGIN_FAILED';
        const errorMessage = data.error || "Login failed";
        
        setLoginError(errorMessage);
        
        toast.error("Login failed", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = "Unable to connect to server. Please check your connection.";
      setLoginError(errorMessage);
      
      toast.error("Connection Error", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear error when user starts typing
    if (loginError) setLoginError(null);
  };

  const handleDemoLogin = async (username: string, password: string) => {
    setFormData({
      username,
      password,
      rememberMe: false,
    });
    
    // Auto-submit after a short delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(submitEvent);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Tire Management System</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Error Alert */}
        {loginError && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username or email"
                    className="pl-10"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      rememberMe: checked as boolean,
                    })
                  }
                  disabled={loading}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Remember me for 7 days
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !formData.username.trim() || !formData.password.trim()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
          <h3 className="font-medium mb-2">Demo Credentials:</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => handleDemoLogin("admin", "admin123")}
              disabled={loading}
            >
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">Super Admin</span>
                <span className="text-xs text-muted-foreground">admin / admin123</span>
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => handleDemoLogin("manager", "manager123")}
              disabled={loading}
            >
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">Fleet Manager</span>
                <span className="text-xs text-muted-foreground">manager / manager123</span>
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => handleDemoLogin("clerk", "clerk123")}
              disabled={loading}
            >
              <div className="flex flex-col items-start flex-1">
                <span className="font-medium">Inventory Clerk</span>
                <span className="text-xs text-muted-foreground">clerk / clerk123</span>
              </div>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Note: These are demo credentials. Change them in production.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Tire Management System. All rights
            reserved.
          </p>
          <p className="mt-1">
            Version 1.0.0 •{" "}
            <Link href="/support" className="hover:text-primary hover:underline">
              Get Help
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}