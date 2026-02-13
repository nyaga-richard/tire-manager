// components/auth/PermissionGuard.tsx
"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PermissionGuardProps {
  children: ReactNode;
  permissionCode: string;
  action?: 'view' | 'create' | 'edit' | 'delete' | 'approve';
  fallback?: ReactNode;
  showMessage?: boolean;
}

interface AnyPermissionGuardProps {
  children: ReactNode;
  permissionCodes: string[];
  action?: 'view' | 'create' | 'edit' | 'delete' | 'approve';
  fallback?: ReactNode;
  showMessage?: boolean;
}

interface AllPermissionsGuardProps {
  children: ReactNode;
  permissionCodes: string[];
  action?: 'view' | 'create' | 'edit' | 'delete' | 'approve';
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({ 
  children, 
  permissionCode, 
  action = 'view',
  fallback,
  showMessage = true 
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!hasPermission(permissionCode, action)) {
    if (fallback) return <>{fallback}</>;
    
    if (showMessage) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this resource. 
            Required: {permissionCode}.{action}
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}

export function AnyPermissionGuard({ 
  children, 
  permissionCodes, 
  action = 'view',
  fallback,
  showMessage = true 
}: AnyPermissionGuardProps) {
  const { hasAnyPermission, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!hasAnyPermission(permissionCodes, action)) {
    if (fallback) return <>{fallback}</>;
    
    if (showMessage) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this resource. 
            Required any of: {permissionCodes.join(', ')}.{action}
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}

export function AllPermissionsGuard({ 
  children, 
  permissionCodes, 
  action = 'view',
  fallback,
  showMessage = true 
}: AllPermissionsGuardProps) {
  const { hasAllPermissions, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!hasAllPermissions(permissionCodes, action)) {
    if (fallback) return <>{fallback}</>;
    
    if (showMessage) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have all required permissions. 
            Required all of: {permissionCodes.join(', ')}.{action}
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}