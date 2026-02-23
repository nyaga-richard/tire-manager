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
import { useTheme } from "@/contexts/ThemeContext";

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
  const { resolvedTheme } = useTheme(); // Get current theme for any conditional styling if needed
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary dark:text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Tire Management System
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Error Alert */}
        {loginError && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300 bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30">
            <AlertCircle className="h-4 w-4 text-destructive dark:text-destructive-foreground" />
            <AlertDescription className="text-destructive dark:text-destructive-foreground">
              {loginError}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900 dark:text-gray-50">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-gray-600 dark:text-gray-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">
                  Username or Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username or email"
                    className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
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
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 dark:text-primary-foreground dark:hover:text-primary-foreground/80 underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
                  className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer select-none text-gray-600 dark:text-gray-400"
                >
                  Remember me for 7 days
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 mt-4">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-primary-foreground dark:text-primary dark:hover:bg-primary-foreground/90 transition-colors"
                disabled={loading || !formData.username.trim() || !formData.password.trim()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-primary hover:text-primary/80 dark:text-primary-foreground dark:hover:text-primary-foreground/80 underline-offset-4 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:text-primary/80 dark:text-primary-foreground dark:hover:text-primary-foreground/80 underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} Tire Management System. All rights
            reserved.
          </p>
          <p className="mt-1">
            Version 1.0.0 •{" "}
            <Link href="/support" className="hover:text-primary dark:hover:text-primary-foreground hover:underline transition-colors">
              Get Help
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}