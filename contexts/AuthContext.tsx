// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
  department: string | null;
  last_login?: string;
  created_at?: string;
}

interface Permission {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

interface Permissions {
  [key: string]: Permission;
}

interface AuthContextType {
  user: User | null;
  permissions: Permissions;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permissionCode: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'approve') => boolean;
  checkPermission: (permissionCode: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'approve') => boolean;
  hasAnyPermission: (permissionCodes: string[], action?: 'view' | 'create' | 'edit' | 'delete' | 'approve') => boolean;
  hasAllPermissions: (permissionCodes: string[], action?: 'view' | 'create' | 'edit' | 'delete' | 'approve') => boolean;
  getToken: () => string | null;
  logout: (skipRedirect?: boolean) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth utilities
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
};

const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem("user_info") || sessionStorage.getItem("user_info");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const getPermissions = (): Permissions => {
  if (typeof window === 'undefined') return {};
  const permStr = localStorage.getItem("user_permissions") || sessionStorage.getItem("user_permissions");
  if (!permStr) return {};
  try {
    return JSON.parse(permStr);
  } catch {
    return {};
  }
};

const clearAuthData = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_info");
  localStorage.removeItem("user_permissions");
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("user_info");
  sessionStorage.removeItem("user_permissions");
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const storedUser = getUser();
      const storedPermissions = getPermissions();

      if (token && storedUser) {
        setUser(storedUser);
        setPermissions(storedPermissions);
        
        // Validate token with backend
        await validateToken();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async () => {
    try {
      const token = getToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.valid) {
        // Update permissions if they changed
        if (data.permissions) {
          setPermissions(data.permissions);
          // Update stored permissions
          const storage = localStorage.getItem("auth_token") ? localStorage : sessionStorage;
          storage.setItem("user_permissions", JSON.stringify(data.permissions));
        }
        return true;
      } else {
        // Token invalid
        clearAuthData();
        setUser(null);
        setPermissions({});
        router.push("/login");
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const refreshPermissions = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.permissions) {
        setPermissions(data.permissions);
        // Update stored permissions
        const storage = localStorage.getItem("auth_token") ? localStorage : sessionStorage;
        storage.setItem("user_permissions", JSON.stringify(data.permissions));
      }
    } catch (error) {
      console.error('Refresh permissions error:', error);
    }
  };

  type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';
  type PermissionKey = keyof Permission;

  const hasPermission = (
    permissionCode: string,
    action: PermissionAction = 'view'
  ): boolean => {
    const permission = permissions[permissionCode];
    if (!permission) return false;

    const actionMap: Record<PermissionAction, PermissionKey> = {
      view: 'can_view',
      create: 'can_create',
      edit: 'can_edit',
      delete: 'can_delete',
      approve: 'can_approve'
    };

    return permission[actionMap[action]] === true;
  };

  const hasAnyPermission = (
    permissionCodes: string[], 
    action: PermissionAction = 'view'
  ): boolean => {
    return permissionCodes.some(code => hasPermission(code, action));
  };

  const hasAllPermissions = (
    permissionCodes: string[], 
    action: PermissionAction = 'view'
  ): boolean => {
    return permissionCodes.every(code => hasPermission(code, action));
  };

  const logout = async (skipRedirect: boolean = false): Promise<void> => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      setUser(null);
      setPermissions({});
      
      if (!skipRedirect) {
        router.push("/login");
      }
      
      toast.success("Logged out successfully");
    }
  };

  const authFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      throw new Error("No authentication token");
    }

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - Token expired
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the request with new token
          const newToken = getToken();
          headers.set("Authorization", `Bearer ${newToken}`);
          
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (retryResponse.ok) {
            return retryResponse;
          }
        }
        
        // If refresh failed, logout
        clearAuthData();
        setUser(null);
        setPermissions({});
        router.push("/login");
        throw new Error("Session expired");
      }

      if (response.status === 403) {
        throw new Error("Permission denied");
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error");
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store new token
        const storage = localStorage.getItem("auth_token") ? localStorage : sessionStorage;
        storage.setItem("auth_token", data.token);
        
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
    return false;
  };

  const value = {
    user,
    permissions,
    isLoading,
    isAuthenticated: !!user,
    hasPermission,
    checkPermission: hasPermission, // Alias for backward compatibility
    hasAnyPermission,
    hasAllPermissions,
    getToken,
    logout,
    refreshPermissions,
    authFetch,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};