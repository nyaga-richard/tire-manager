// components/auth/withPermission.tsx
"use client";

import { ComponentType } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "./PermissionGuard";

interface WithPermissionOptions {
  permissionCode: string;
  action?: 'view' | 'create' | 'edit' | 'delete' | 'approve';
  fallback?: React.ReactNode;
}

export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPermissionOptions
) {
  const { permissionCode, action = 'view', fallback } = options;
  
  return function WithPermissionComponent(props: P) {
    const { hasPermission, isLoading } = useAuth();

    if (isLoading) {
      return <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
    }

    if (!hasPermission(permissionCode, action)) {
      return fallback || null;
    }

    return <WrappedComponent {...props} />;
  };
}