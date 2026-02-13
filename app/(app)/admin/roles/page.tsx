"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Eye, 
  Search, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Users, 
  Edit, 
  Trash2, 
  MoreVertical,
  Plus,
  RefreshCw,
  Filter,
  User,
  Key,
  CheckCircle,
  XCircle,
  Copy,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Fixed import
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import RoleFormModal from "@/components/role-form-modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Interfaces
interface Role {
  id: number;
  name: string;
  description: string | null;
  is_system_role: number;
  user_count: number;
  permission_count: number;
  created_at: string;
}

interface Permission {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string | null;
  assigned_role_count: number;
}

interface RoleDetail {
  id: number;
  name: string;
  description: string;
  is_system_role: number;
  sample_users: string;
  created_at: string;
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

export default function RolesPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth(); // ✅ Use authFetch
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState({
    roles: true,
    permissions: false,
    detail: false
  });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSystemRoles, setShowSystemRoles] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [isRoleFormModalOpen, setIsRoleFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  // Check permissions
  const canViewRoles = hasPermission("role.view");
  const canCreateRole = hasPermission("role.create");
  const canEditRole = hasPermission("role.edit");
  const canDeleteRole = hasPermission("role.delete");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect if no permission
  useEffect(() => {
    if (!authLoading && isAuthenticated && !canViewRoles) {
      toast.error("Access Denied", {
        description: "You don't have permission to view roles"
      });
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, canViewRoles, router]);

  // Fetch roles
  useEffect(() => {
    if (isAuthenticated && canViewRoles) {
      fetchRoles();
    }
  }, [isAuthenticated, canViewRoles, showSystemRoles]);

  // Fetch permissions for form
  useEffect(() => {
    if (isAuthenticated && canViewRoles && activeTab === "list") {
      fetchPermissions();
    }
  }, [isAuthenticated, canViewRoles, activeTab]);

  const fetchRoles = async () => {
    try {
      setLoading(prev => ({ ...prev, roles: true }));
      setError(null);
      
      const response = await authFetch(`${API_BASE_URL}/api/roles?include_system=${showSystemRoles}`);
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.roles || []);
      } else {
        throw new Error(data.message || "Failed to load roles");
      }
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      setError(error.message || "Failed to load roles");
      toast.error("Failed to load roles", {
        description: error.message
      });
      setRoles([]);
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  const fetchRoleDetail = async (roleId: number) => {
    try {
      setLoading(prev => ({ ...prev, detail: true }));
      const response = await authFetch(`${API_BASE_URL}/api/roles/${roleId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedRole(data.role);
        setActiveTab("detail");
      } else {
        throw new Error(data.message || "Failed to load role details");
      }
    } catch (error: any) {
      console.error("Error fetching role detail:", error);
      toast.error("Failed to load role details", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, detail: false }));
    }
  };

  const fetchPermissions = async () => {
    try {
      setLoading(prev => ({ ...prev, permissions: true }));
      const response = await authFetch(`${API_BASE_URL}/api/roles/permissions/all`);
      const data = await response.json();
      
      if (data.success) {
        setPermissions(data.permissions || {});
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

  const handleDeleteRole = async (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/api/roles/${roleToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Role deleted successfully");
        fetchRoles();
        if (selectedRole?.id === roleToDelete.id) {
          setSelectedRole(null);
          setActiveTab("list");
        }
      } else {
        throw new Error(data.message || "Failed to delete role");
      }
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role", {
        description: error.message
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleRoleCreated = () => {
    fetchRoles();
    setIsRoleFormModalOpen(false);
  };

  const handleRoleUpdated = () => {
    fetchRoles();
    if (selectedRole) {
      fetchRoleDetail(selectedRole.id);
    }
  };

  const copyRolePermissions = (role: Role) => {
    if (canCreateRole) {
      toast.info("Feature coming soon", {
        description: "Role copying feature will be available in the next update"
      });
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    (role.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const getRoleTypeColor = (isSystemRole: number) => {
    return isSystemRole
      ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
      : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
  };

  const getRoleTypeIcon = (isSystemRole: number) => {
    return isSystemRole ? ShieldCheck : Shield;
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

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied
  if (!canViewRoles) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-center">
              You don't have permission to manage roles.
              Please contact your administrator for access.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error && !loading.roles) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={fetchRoles} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="role.view" action="view">
      <div className="space-y-6">
        {/* Role Form Modal */}
        <RoleFormModal
          isOpen={isRoleFormModalOpen}
          onClose={() => setIsRoleFormModalOpen(false)}
          onSuccess={handleRoleCreated}
          permissions={permissions}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Role
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the role "{roleToDelete?.name}"? 
                This action cannot be undone.
                {roleToDelete && roleToDelete.user_count > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 rounded-md">
                    <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      This role has {roleToDelete.user_count} assigned user(s).
                      Deleting it will remove these users' permissions.
                    </p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteRole}
                disabled={!roleToDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            </div>
            <p className="text-muted-foreground">
              Manage user roles and permissions for the system
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchRoles} disabled={loading.roles}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading.roles ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <PermissionGuard permissionCode="role.create" action="create">
              <Button onClick={() => setIsRoleFormModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Role
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">
              <Shield className="mr-2 h-4 w-4" />
              All Roles
            </TabsTrigger>
            {selectedRole && (
              <TabsTrigger value="detail">
                <Eye className="mr-2 h-4 w-4" />
                {selectedRole.name}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Roles List Tab */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Roles</CardTitle>
                    <CardDescription>
                      Manage system roles and their permissions
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search roles..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show-system-roles"
                        checked={showSystemRoles}
                        onCheckedChange={setShowSystemRoles}
                      />
                      <Label htmlFor="show-system-roles" className="text-sm">
                        Show System Roles
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading.roles ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading roles...</p>
                    </div>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No roles found</h3>
                    <p className="text-muted-foreground">
                      {search ? "Try adjusting your search" : "Create your first role"}
                    </p>
                    <PermissionGuard permissionCode="role.create" action="create">
                      {!search && (
                        <Button 
                          onClick={() => setIsRoleFormModalOpen(true)} 
                          className="mt-4"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Role
                        </Button>
                      )}
                    </PermissionGuard>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Users</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRoles.map((role) => {
                          const RoleTypeIcon = getRoleTypeIcon(role.is_system_role);
                          return (
                            <TableRow key={role.id} className="group">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-md flex items-center justify-center ${getRoleTypeColor(role.is_system_role)}`}>
                                    <RoleTypeIcon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{role.name}</div>
                                    {role.description && (
                                      <div className="text-sm text-muted-foreground">
                                        {role.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={getRoleTypeColor(role.is_system_role)}
                                >
                                  {role.is_system_role ? "System" : "Custom"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{role.user_count}</span>
                                  <span className="text-sm text-muted-foreground">users</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Key className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{role.permission_count}</span>
                                  <span className="text-sm text-muted-foreground">permissions</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(role.created_at)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => fetchRoleDetail(role.id)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View details</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  {canEditRole && !role.is_system_role && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            asChild
                                          >
                                            <Link href={`/admin/roles/${role.id}/edit`}>
                                              <Edit className="h-4 w-4" />
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Edit role</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  
                                  {canCreateRole && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => copyRolePermissions(role)}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Copy role</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  
                                  {canDeleteRole && !role.is_system_role && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleDeleteRole(role)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Delete role</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              {!loading.roles && filteredRoles.length > 0 && (
                <CardFooter className="border-t px-6 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredRoles.length} of {roles.length} roles • 
                    {" "}{roles.filter(r => r.is_system_role).length} system roles • 
                    {" "}{roles.filter(r => !r.is_system_role).length} custom roles
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Role Detail Tab */}
          {selectedRole && (
            <TabsContent value="detail" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getRoleTypeColor(selectedRole.is_system_role)}`}>
                        {selectedRole.is_system_role ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <Shield className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{selectedRole.name}</CardTitle>
                        <CardDescription>
                          {selectedRole.description || "No description"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canEditRole && !selectedRole.is_system_role && (
                        <Button asChild>
                          <Link href={`/admin/roles/${selectedRole.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Role
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setActiveTab("list")}>
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Role Information */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Role Type</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge 
                          variant={selectedRole.is_system_role ? "default" : "secondary"}
                          className={selectedRole.is_system_role 
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" 
                            : ""
                          }
                        >
                          {selectedRole.is_system_role ? "System Role" : "Custom Role"}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedRole.users.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Currently assigned users
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedRole.permission_summary.total}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Permission entries
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Created</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm font-medium">
                          {formatDate(selectedRole.created_at)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Role creation date
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Permissions Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                    {loading.detail ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-muted-foreground">Loading permissions...</p>
                        </div>
                      </div>
                    ) : (
                      Object.entries(
                        selectedRole.permissions.reduce((acc, perm) => {
                          if (!acc[perm.category]) acc[perm.category] = [];
                          acc[perm.category].push(perm);
                          return acc;
                        }, {} as Record<string, typeof selectedRole.permissions>)
                      ).map(([category, categoryPerms]) => (
                        <Card key={category} className="mb-4">
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">{category}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2">
                              {categoryPerms.map((perm) => (
                                <div key={perm.id} className="flex items-center justify-between p-2 border rounded-md">
                                  <div>
                                    <div className="font-medium">{perm.name}</div>
                                    <div className="text-sm text-muted-foreground">{perm.code}</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1">
                                            {perm.can_view ? (
                                              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                            )}
                                            <span className="text-xs">View</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Can view</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1">
                                            {perm.can_create ? (
                                              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                            )}
                                            <span className="text-xs">Create</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Can create</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1">
                                            {perm.can_edit ? (
                                              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                            )}
                                            <span className="text-xs">Edit</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Can edit</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1">
                                            {perm.can_delete ? (
                                              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                            )}
                                            <span className="text-xs">Delete</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Can delete</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1">
                                            {perm.can_approve ? (
                                              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                            ) : (
                                              <XCircle className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                            )}
                                            <span className="text-xs">Approve</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Can approve</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Users Section */}
                  {selectedRole.users.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Assigned Users</h3>
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">
                            Users with this role ({selectedRole.users.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedRole.users.map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{user.full_name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Joined {formatDate(user.created_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="text-xs text-muted-foreground border-t pt-4">
          Logged in as: {currentUser?.full_name || currentUser?.username} • Role: {currentUser?.role}
        </div>
      </div>
    </PermissionGuard>
  );
}