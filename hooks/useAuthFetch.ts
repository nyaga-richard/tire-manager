// hooks/useAuthFetch.ts
"use client";

import { useAuth } from "@/contexts/AuthContext";

export function useAuthFetch() {
  const { authFetch } = useAuth();
  return authFetch;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}

export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}