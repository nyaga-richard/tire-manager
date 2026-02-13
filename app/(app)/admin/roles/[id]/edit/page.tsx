"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Copy,
  ChevronRight,
  RefreshCw,
  User,
  Building,
  Mail,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Fixed import
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Interfaces
interface Permission {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string | null;
}

interface PermissionSelection {
  permission_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
}

interface RoleDetail {
  id: number;
  name: string;
  description: string;
  is_system_role: number;
  created_at: string;
  updated_at: string;
  permissions: Array<{
    id: number;
    code: string;
    name: string;
    category: string;
    description: string | null;
    can_view: number;
    can_create: number;
    can_edit: number;
    can_delete: number;
    can_approve: number;
  }>;
  permission_summary: {
    total: number;
    can_view: number;
    can_create: number;
    can_edit: number;
    can_delete: number;
    can_approve: number;
  };
  users: Array<{
    id: number;
    username: string;
    email: string;
    full_name: string;
    department: string | null;
    is_active: number;
    created_at: string;
  }>;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department: string | null;
  is_active: number;
  created_at: string;
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const { user: currentUser, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth(); // ✅ Use authFetch
  
  const [loading, setLoading] = useState({
    role: true,
    permissions: false,
    users: false,
    saving: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("permissions");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<number, PermissionSelection>
  >({});
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [userPagination, setUserPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // Check permissions
  const canViewRoles = hasPermission("role.view");
  const canEditRole = hasPermission("role.edit");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect if no permission
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (!canViewRoles) {
        toast.error("Access Denied", {
          description: "You don't have permission to view roles"
        });
        router.push("/admin/roles");
      }
      
      if (!canEditRole) {
        toast.error("Access Denied", {
          description: "You don't have permission to edit roles"
        });
        router.push("/admin/roles");
      }
    }
  }, [authLoading, isAuthenticated, canViewRoles, canEditRole, router]);

  // Fetch role data
  useEffect(() => {
    if (isAuthenticated && roleId && canViewRoles && canEditRole) {
      fetchRole();
      fetchAllPermissions();
      fetchUsers();
    }
  }, [isAuthenticated, roleId, canViewRoles, canEditRole]);

  const fetchRole = async () => {
    try {
      setLoading(prev => ({ ...prev, role: true }));
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/roles/${roleId}`);
      const data = await response.json();
      
      if (data.success) {
        setRole(data.role);
        setFormData({
          name: data.role.name || "",
          description: data.role.description || "",
        });
        
        // Initialize permissions from role
        const initialPermissions: Record<number, PermissionSelection> = {};
        if (data.role.permissions) {
          data.role.permissions.forEach((perm: any) => {
            initialPermissions[perm.id] = {
              permission_id: perm.id,
              can_view: perm.can_view === 1,
              can_create: perm.can_create === 1,
              can_edit: perm.can_edit === 1,
              can_delete: perm.can_delete === 1,
              can_approve: perm.can_approve === 1,
            };
          });
        }
        setSelectedPermissions(initialPermissions);
      } else {
        throw new Error(data.message || "Failed to load role");
      }
    } catch (error: any) {
      console.error("Error fetching role:", error);
      setError(error.message || "Failed to load role");
      toast.error("Failed to load role", {
        description: error.message
      });
      router.push("/admin/roles");
    } finally {
      setLoading(prev => ({ ...prev, role: false }));
    }
  };

  const fetchAllPermissions = async () => {
    try {
      setLoading(prev => ({ ...prev, permissions: true }));
      const response = await authFetch(`${API_BASE_URL}/api/roles/permissions/all`);
      const data = await response.json();
      
      if (data.success) {
        setPermissions(data.permissions || {});
        
        // Expand all categories by default
        const expanded: Record<string, boolean> = {};
        Object.keys(data.permissions || {}).forEach(category => {
          expanded[category] = true;
        });
        setExpandedCategories(expanded);
      } else {
        throw new Error(data.message || "Failed to load permissions");
      }
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions", {
        description: error.message
      });
      setPermissions({});
    } finally {
      setLoading(prev => ({ ...prev, permissions: false }));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const response = await authFetch(`${API_BASE_URL}/api/roles/${roleId}/users?page=${userPagination.page}&limit=${userPagination.limit}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setUserPagination(data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1
        });
      } else {
        throw new Error(data.message || "Failed to load users");
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users", {
        description: error.message
      });
      setUsers([]);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const handlePermissionChange = (
    permissionId: number,
    field: keyof PermissionSelection,
    value: boolean
  ) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionId]: {
        ...prev[permissionId],
        permission_id: permissionId,
        [field]: value,
      },
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const selectAllInCategory = (category: string, select: boolean) => {
    const categoryPermissions = permissions[category] || [];
    const updatedPermissions = { ...selectedPermissions };

    categoryPermissions.forEach(perm => {
      updatedPermissions[perm.id] = {
        permission_id: perm.id,
        can_view: select,
        can_create: select,
        can_edit: select,
        can_delete: select,
        can_approve: select,
      };
    });

    setSelectedPermissions(updatedPermissions);
  };

  const selectAllPermissions = (select: boolean) => {
    const updatedPermissions: Record<number, PermissionSelection> = {};
    
    Object.values(permissions).forEach(categoryPerms => {
      categoryPerms.forEach(perm => {
        updatedPermissions[perm.id] = {
          permission_id: perm.id,
          can_view: select,
          can_create: select,
          can_edit: select,
          can_delete: select,
          can_approve: select,
        };
      });
    });

    setSelectedPermissions(updatedPermissions);
    setSelectAll(select);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Validation Error", {
        description: "Role name is required"
      });
      return;
    }

    // Convert selectedPermissions to array
    const permissionsArray = Object.values(selectedPermissions);
    
    if (permissionsArray.length === 0) {
      toast.error("Validation Error", {
        description: "At least one permission is required"
      });
      return;
    }

    // Check if role is a system role
    if (role?.is_system_role) {
      toast.error("Cannot Edit System Role", {
        description: "System roles cannot be modified"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/roles/${roleId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: permissionsArray,
          updated_by: currentUser?.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Role updated successfully");
        fetchRole(); // Refresh role data
        fetchUsers(); // Refresh user data
      } else {
        throw new Error(data.message || "Failed to update role");
      }
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const getPermissionCount = () => {
    return Object.values(selectedPermissions).filter(perm => 
      perm.can_view || perm.can_create || perm.can_edit || perm.can_delete || perm.can_approve
    ).length;
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getRoleTypeColor = (isSystemRole: number) => {
    return isSystemRole
      ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
      : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
  };

  const handleUserPageChange = (page: number) => {
    setUserPagination(prev => ({ ...prev, page }));
  };

  useEffect(() => {
    if (activeTab === "users" && role) {
      fetchUsers();
    }
  }, [userPagination.page, activeTab]);

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
  if (!canViewRoles || !canEditRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-center">
              You don't have permission to edit roles.
              Please contact your administrator for access.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/roles">Return to Roles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading.role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading role data...</p>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              Role Not Found
            </CardTitle>
            <CardDescription className="text-center">
              {error || "The role you're looking for doesn't exist or has been deleted."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/roles">Return to Roles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSystemRole = role.is_system_role === 1;

  return (
    <PermissionGuard permissionCode="role.edit" action="edit">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/admin/roles")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
              <p className="text-muted-foreground">
                Update role information and permissions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/roles")}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading.saving || isSystemRole}>
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

        {/* Role Info Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`h-16 w-16 rounded-lg flex items-center justify-center ${getRoleTypeColor(role.is_system_role)}`}>
                {isSystemRole ? (
                  <ShieldCheck className="h-8 w-8" />
                ) : (
                  <Shield className="h-8 w-8" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold">{role.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="text-sm text-muted-foreground">
                        {role.description || "No description"}
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge 
                        variant="outline" 
                        className={getRoleTypeColor(role.is_system_role)}
                      >
                        {isSystemRole ? "System Role" : "Custom Role"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{role.users.length}</div>
                      <div className="text-sm text-muted-foreground">Users</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{role.permission_summary.total}</div>
                      <div className="text-sm text-muted-foreground">Permissions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSystemRole && (
          <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  System Role - Read Only
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  This is a system role and cannot be modified. System roles are required for core system functionality.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="permissions">
              <Key className="mr-2 h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users ({role.users.length})
            </TabsTrigger>
            <TabsTrigger value="info">
              <Shield className="mr-2 h-4 w-4" />
              Role Info
            </TabsTrigger>
          </TabsList>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>
                  Select the permissions for this role. Users with this role will have these permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Role Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Fleet Manager, Inventory Clerk"
                          required
                          disabled={loading.saving || isSystemRole}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe the role's purpose and responsibilities"
                          rows={3}
                          disabled={loading.saving || isSystemRole}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Permissions Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Permissions</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {getPermissionCount()} permissions selected
                        </div>
                        {!isSystemRole && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllPermissions(!selectAll)}
                            disabled={loading.saving}
                          >
                            {selectAll ? "Deselect All" : "Select All"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {loading.permissions ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-muted-foreground">Loading permissions...</p>
                        </div>
                      </div>
                    ) : Object.keys(permissions).length === 0 ? (
                      <div className="text-center py-8">
                        <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No permissions found</h3>
                        <p className="text-muted-foreground">
                          There are no permissions configured in the system
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(permissions).map(([category, categoryPerms]) => (
                          <div key={category} className="border rounded-lg overflow-hidden">
                            <div 
                              className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted"
                              onClick={() => !isSystemRole && toggleCategory(category)}
                            >
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{category}</h4>
                                <Badge variant="secondary" className="ml-2">
                                  {categoryPerms.length}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isSystemRole && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectAllInCategory(category, true);
                                    }}
                                    disabled={loading.saving}
                                  >
                                    Select All
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCategory(category)}
                                >
                                  {expandedCategories[category] ? "Collapse" : "Expand"}
                                </Button>
                              </div>
                            </div>
                            
                            {expandedCategories[category] && (
                              <div className="p-4 space-y-2">
                                {categoryPerms.map((perm) => {
                                  const isSelected = selectedPermissions[perm.id];
                                  return (
                                    <div key={perm.id} className="flex items-center justify-between p-3 border rounded-md">
                                      <div className="flex-1">
                                        <div className="font-medium">{perm.name}</div>
                                        <div className="text-sm text-muted-foreground">{perm.code}</div>
                                        {perm.description && (
                                          <div className="text-sm text-muted-foreground mt-1">
                                            {perm.description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 ml-4">
                                        <div className="flex flex-col items-center gap-1">
                                          <Checkbox
                                            id={`${perm.id}-view`}
                                            checked={isSelected?.can_view || false}
                                            onCheckedChange={(checked) =>
                                              handlePermissionChange(perm.id, "can_view", checked as boolean)
                                            }
                                            disabled={loading.saving || isSystemRole}
                                          />
                                          <Label htmlFor={`${perm.id}-view`} className="text-xs">
                                            View
                                          </Label>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                          <Checkbox
                                            id={`${perm.id}-create`}
                                            checked={isSelected?.can_create || false}
                                            onCheckedChange={(checked) =>
                                              handlePermissionChange(perm.id, "can_create", checked as boolean)
                                            }
                                            disabled={loading.saving || isSystemRole}
                                          />
                                          <Label htmlFor={`${perm.id}-create`} className="text-xs">
                                            Create
                                          </Label>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                          <Checkbox
                                            id={`${perm.id}-edit`}
                                            checked={isSelected?.can_edit || false}
                                            onCheckedChange={(checked) =>
                                              handlePermissionChange(perm.id, "can_edit", checked as boolean)
                                            }
                                            disabled={loading.saving || isSystemRole}
                                          />
                                          <Label htmlFor={`${perm.id}-edit`} className="text-xs">
                                            Edit
                                          </Label>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                          <Checkbox
                                            id={`${perm.id}-delete`}
                                            checked={isSelected?.can_delete || false}
                                            onCheckedChange={(checked) =>
                                              handlePermissionChange(perm.id, "can_delete", checked as boolean)
                                            }
                                            disabled={loading.saving || isSystemRole}
                                          />
                                          <Label htmlFor={`${perm.id}-delete`} className="text-xs">
                                            Delete
                                          </Label>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                          <Checkbox
                                            id={`${perm.id}-approve`}
                                            checked={isSelected?.can_approve || false}
                                            onCheckedChange={(checked) =>
                                              handlePermissionChange(perm.id, "can_approve", checked as boolean)
                                            }
                                            disabled={loading.saving || isSystemRole}
                                          />
                                          <Label htmlFor={`${perm.id}-approve`} className="text-xs">
                                            Approve
                                          </Label>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <div className="w-full flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {getPermissionCount()} of {Object.values(permissions).flat().length} permissions selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          name: role.name || "",
                          description: role.description || "",
                        });
                        const initialPermissions: Record<number, PermissionSelection> = {};
                        if (role.permissions) {
                          role.permissions.forEach((perm: any) => {
                            initialPermissions[perm.id] = {
                              permission_id: perm.id,
                              can_view: perm.can_view === 1,
                              can_create: perm.can_create === 1,
                              can_edit: perm.can_edit === 1,
                              can_delete: perm.can_delete === 1,
                              can_approve: perm.can_approve === 1,
                            };
                          });
                        }
                        setSelectedPermissions(initialPermissions);
                        toast.info("Form reset", {
                          description: "All changes have been discarded"
                        });
                      }}
                      disabled={loading.saving || isSystemRole}
                    >
                      Reset
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading.saving || isSystemRole}
                    >
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
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Users</CardTitle>
                <CardDescription>
                  Users currently assigned to this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.users ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading users...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No users assigned</h3>
                    <p className="text-muted-foreground">
                      No users are currently assigned to this role
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{user.full_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {user.username} • {user.email}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {user.department || "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(user.is_active)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(user.created_at)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <PermissionGuard permissionCode="user.edit" action="edit" fallback={null}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                  >
                                    <Link href={`/admin/users/${user.id}/edit`}>
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </Link>
                                  </Button>
                                </PermissionGuard>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    {userPagination.pages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {(userPagination.page - 1) * userPagination.limit + 1} to{" "}
                          {Math.min(userPagination.page * userPagination.limit, userPagination.total)} of{" "}
                          {userPagination.total} users
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserPageChange(1)}
                            disabled={userPagination.page === 1}
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserPageChange(userPagination.page - 1)}
                            disabled={userPagination.page === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm px-2">
                            Page {userPagination.page} of {userPagination.pages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserPageChange(userPagination.page + 1)}
                            disabled={userPagination.page === userPagination.pages}
                          >
                            Next
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserPageChange(userPagination.pages)}
                            disabled={userPagination.page === userPagination.pages}
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={fetchUsers}
                  disabled={loading.users}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading.users ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Information</CardTitle>
                <CardDescription>
                  System information about this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Role Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Role Details</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Role ID</Label>
                        <div className="font-medium">{role.id}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Role Type</Label>
                        <div>
                          <Badge 
                            variant={isSystemRole ? "default" : "secondary"}
                            className={isSystemRole ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" : ""}
                          >
                            {isSystemRole ? "System Role" : "Custom Role"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Created</Label>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(role.created_at)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Last Updated</Label>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {role.updated_at ? formatDate(role.updated_at) : "Never"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Permission Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Permission Summary</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{role.permission_summary.total}</div>
                          <p className="text-xs text-muted-foreground">
                            Permission entries
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">View Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{role.permission_summary.can_view}</div>
                          <p className="text-xs text-muted-foreground">
                            Can view permissions
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Create Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{role.permission_summary.can_create}</div>
                          <p className="text-xs text-muted-foreground">
                            Can create permissions
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Edit Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{role.permission_summary.can_edit}</div>
                          <p className="text-xs text-muted-foreground">
                            Can edit permissions
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Delete Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{role.permission_summary.can_delete}</div>
                          <p className="text-xs text-muted-foreground">
                            Can delete permissions
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Approve Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{role.permission_summary.can_approve}</div>
                          <p className="text-xs text-muted-foreground">
                            Can approve permissions
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* User Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">User Summary</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{role.users.length}</div>
                          <p className="text-xs text-muted-foreground">
                            Users with this role
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {role.users.filter(u => u.is_active === 1).length}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Currently active users
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {role.users.filter(u => u.is_active === 0).length}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Currently inactive users
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/roles")}
          >
            Back to Roles
          </Button>
          <div className="flex gap-2">
            {!isSystemRole && (
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    name: role.name || "",
                    description: role.description || "",
                  });
                  const initialPermissions: Record<number, PermissionSelection> = {};
                  if (role.permissions) {
                    role.permissions.forEach((perm: any) => {
                      initialPermissions[perm.id] = {
                        permission_id: perm.id,
                        can_view: perm.can_view === 1,
                        can_create: perm.can_create === 1,
                        can_edit: perm.can_edit === 1,
                        can_delete: perm.can_delete === 1,
                        can_approve: perm.can_approve === 1,
                      };
                    });
                  }
                  setSelectedPermissions(initialPermissions);
                  setActiveTab("permissions");
                  toast.info("Form reset", {
                    description: "All changes have been discarded"
                  });
                }}
              >
                Reset Changes
              </Button>
            )}
            <Button 
              onClick={handleSubmit} 
              disabled={loading.saving || isSystemRole}
            >
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