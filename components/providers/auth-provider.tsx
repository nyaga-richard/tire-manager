"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Permission {
  code: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
  department: string;
  last_login?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  permissions: Record<string, Permission>;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User, permissions: Record<string, Permission>, rememberMe: boolean) => void;
  logout: (immediate?: boolean) => Promise<void>;
  checkPermission: (permissionCode: string, action?: string) => boolean;
  hasAnyPermission: (permissionCodes: string[], action?: string) => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // API base URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Try localStorage first (remember me), then sessionStorage
        const storedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("user_info") || sessionStorage.getItem("user_info");
        const storedPermissions = localStorage.getItem("user_permissions") || sessionStorage.getItem("user_permissions");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          if (storedPermissions) {
            setPermissions(JSON.parse(storedPermissions));
          }

          // Validate token on mount (optional - can be done periodically)
          validateToken(storedToken);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear corrupted storage
        clearAuthStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Check for token expiration periodically
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      try {
        // Simple check: if token exists but user data doesn't, clear auth
        if (token && !user) {
          logout();
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, user]);

    // Client-side route protection
    useEffect(() => {
      if (isLoading) return; // Wait for auth initialization

      const protectedRoutes = [
        "/dashboard",
        "/vehicles",
        "/inventory",
        "/suppliers",
        "/purchases",
        "/grns",
      ];

      const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
      );

      // Redirect to login if accessing protected route without auth
      if (isProtectedRoute && !token && pathname !== "/login") {
        router.replace("/login");
      }

      // Redirect to inventory if trying to access login while authenticated
      if (pathname === "/login" && token) {
        router.replace("/inventory");
      }
    }, [isLoading, token, pathname, router]);

  // Validate token with backend
  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Token validation failed");
      }

      const data = await response.json();
      
      if (!data.success || !data.valid) {
        throw new Error("Invalid token");
      }

      // Update user data if needed
      if (data.user && user && data.user.id === user.id) {
        const newUserData = { ...user, ...data.user };
        setUser(newUserData);
        
        // Update storage
        const storage = localStorage.getItem("auth_token") ? localStorage : sessionStorage;
        storage.setItem("user_info", JSON.stringify(newUserData));
        
        if (data.permissions) {
          setPermissions(data.permissions);
          storage.setItem("user_permissions", JSON.stringify(data.permissions));
        }
      }

      return true;
    } catch (error) {
      console.error("Token validation error:", error);
      logout();
      return false;
    }
  };

  // Login function
  const login = useCallback((token: string, userData: User, permissionsData: Record<string, Permission>, rememberMe: boolean) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem("auth_token", token);
    storage.setItem("user_info", JSON.stringify(userData));
    storage.setItem("user_permissions", JSON.stringify(permissionsData));
    
    setToken(token);
    setUser(userData);
    setPermissions(permissionsData);

    // Set rememberMe flag in localStorage if needed
    if (rememberMe) {
      localStorage.setItem("remember_me", "true");
    } else {
      localStorage.removeItem("remember_me");
    }
  }, []);

  // Logout function
  const logout = useCallback(async (immediate: boolean = false) => {
    const currentToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

    // If immediate, clear client-side state synchronously so UI updates right away
    if (immediate) {
      clearAuthStorage();
      setUser(null);
      setPermissions({});
      setToken(null);
    }

    try {
      // Call backend logout endpoint if we have a token
      if (currentToken) {
        // Do not block UI when immediate; still await to surface errors if caller awaits
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentToken}`,
          },
          credentials: "include",
        }).catch(error => {
          console.error("Backend logout error:", error);
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Ensure client-side storage and state cleared
      clearAuthStorage();
      setUser(null);
      setPermissions({});
      setToken(null);

      // Show logout message
      toast.success("Logged out successfully");

      // Redirect to login page if not already there
      if (!pathname?.includes("/login")) {
        try {
          router.push("/login");
        } catch (err) {
          // ignore
        }
      }
    }
  }, [API_BASE_URL, pathname, router]);

  // Clear all auth storage
  const clearAuthStorage = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");
    localStorage.removeItem("user_permissions");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("remember_me");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("user_info");
    sessionStorage.removeItem("user_permissions");
  };

  // Check if user has specific permission
  const checkPermission = useCallback((permissionCode: string, action: string = 'view'): boolean => {
    const permission = permissions[permissionCode];
    
    if (!permission) return false;
    
    const actionMap: Record<string, keyof Permission> = {
      'view': 'can_view',
      'create': 'can_create',
      'edit': 'can_edit',
      'delete': 'can_delete',
      'approve': 'can_approve'
    };
    
    const actionField = actionMap[action];
    return !!(permission[actionField] || false);
  }, [permissions]);

  // Check if user has any of the permissions
  const hasAnyPermission = useCallback((permissionCodes: string[], action: string = 'view'): boolean => {
    return permissionCodes.some(code => checkPermission(code, action));
  }, [checkPermission]);

  // Refresh user data from backend
  const refreshUserData = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          const newUserData = { ...user, ...data.user };
          setUser(newUserData);
          
          const storage = localStorage.getItem("auth_token") ? localStorage : sessionStorage;
          storage.setItem("user_info", JSON.stringify(newUserData));
          
          if (data.user.permissions) {
            setPermissions(data.user.permissions);
            storage.setItem("user_permissions", JSON.stringify(data.user.permissions));
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [token, user, API_BASE_URL]);

  // Try to refresh token if expired
  const tryRefreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    const rememberMe = localStorage.getItem("remember_me") === "true";
    
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store new token
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("auth_token", data.token);
        setToken(data.token);
        
        return data.token;
      } else {
        logout();
        return null;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return null;
    }
  }, [API_BASE_URL, logout]);

  // Intercept fetch requests to add token and handle 401
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      let [resource, config = {} as RequestInit] = args;
      
      // Add authorization header if token exists
      const headers = typeof config.headers === 'object' ? config.headers : {};
      if (token && !('Authorization' in headers)) {
        config.headers = {
          ...headers,
          'Authorization': `Bearer ${token}`,
        };
      }
      
      const response = await originalFetch(resource, config);
      
      // Handle 401 Unauthorized (token expired)
      if (response.status === 401) {
        // Try to refresh token
        const newToken = await tryRefreshToken();
        
        if (newToken) {
          // Retry the original request with new token
          const retryHeaders = typeof config.headers === 'object' ? config.headers : {};
          config.headers = {
            ...retryHeaders,
            'Authorization': `Bearer ${newToken}`,
          };
          return originalFetch(resource, config);
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [token, tryRefreshToken]);

  const value: AuthContextType = {
    user,
    permissions,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    checkPermission,
    hasAnyPermission,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper hooks
export const usePermission = (permissionCode: string, action: string = 'view') => {
  const { checkPermission } = useAuth();
  return checkPermission(permissionCode, action);
};

export const useRequiredPermission = (permissionCode: string, action: string = 'view') => {
  const { checkPermission, isLoading } = useAuth();
  
  if (isLoading) return false;
  return checkPermission(permissionCode, action);
};