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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Mail,
  Building,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Key,
  Activity,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import UserFormModal from "@/components/user-form-modal";
import ChangePasswordModal from "@/components/change-password-modal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Interfaces
interface UserData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department: string | null;
  role_name: string;
  role_id: number;
  is_active: number;
  last_login: string | null;
  created_at: string;
}

interface RoleOption {
  value: number;
  label: string;
  description: string | null;
  is_system_role: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState({
    users: true,
    roles: false,
    actions: false
  });
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
    sortBy: "created_at",
    sortOrder: "DESC"
  });
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Check permissions
  const canViewUsers = hasPermission("user.view");
  const canCreateUser = hasPermission("user.create");
  const canEditUser = hasPermission("user.edit");
  const canDeleteUser = hasPermission("user.delete");

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect if no permission
  useEffect(() => {
    if (!authLoading && isAuthenticated && !canViewUsers) {
      toast.error("Access Denied", {
        description: "You don't have permission to view users"
      });
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, canViewUsers, router]);

  // Fetch users and roles
  useEffect(() => {
    if (isAuthenticated && canViewUsers) {
      fetchUsers();
      fetchRoles();
    }
  }, [isAuthenticated, canViewUsers, filters, pagination.page]);

const fetchUsers = async () => {
  try {
    setLoading(prev => ({ ...prev, users: true }));
    setError(null);
    
    const apiRole = filters.role === "all" ? "" : filters.role;
    const apiStatus = filters.status === "all" ? "" : filters.status;
    
    const queryParams = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      search: filters.search,
      role: apiRole,
      status: apiStatus,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    });
    
    const response = await authFetch(`${API_BASE_URL}/api/users?${queryParams}`);
    const data = await response.json(); // Add this line
    
    if (data.success) {
      setUsers(data.users || []);
      setPagination(data.pagination || {
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
    setError(error.message || "Failed to load users");
    toast.error("Failed to load users", {
      description: error.message
    });
    setUsers([]);
  } finally {
    setLoading(prev => ({ ...prev, users: false }));
  }
};

  const fetchRoles = async () => {
    try {
      setLoading(prev => ({ ...prev, roles: true }));
      const response = await authFetch(`${API_BASE_URL}/api/users/roles/options`);
      const data = await response.json(); // Add this line
      
      if (data.success) {
        setRoles(data.roles || []);
      }
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles", {
        description: error.message
      });
      setRoles([]);
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(prev => ({ ...prev, actions: true }));
      const response = await authFetch(`${API_BASE_URL}/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json(); // Add this line

      if (data.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        throw new Error(data.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUserCreated = () => {
    fetchUsers();
    setIsUserFormModalOpen(false);
    toast.success("User created successfully");
  };

  const handleUserUpdated = () => {
    fetchUsers();
    toast.success("User updated successfully");
  };

  const handlePasswordChanged = () => {
    setIsChangePasswordModalOpen(false);
    setSelectedUser(null);
    toast.success("Password changed successfully");
  };

  const toggleUserStatus = async (user: UserData) => {
    if (!canEditUser) {
      toast.error("You don't have permission to edit users");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, actions: true }));
      const newStatus = user.is_active ? 0 : 1;
      
      const response = await authFetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          is_active: newStatus,
          updated_by: currentUser?.id 
        })
      });
      const data = await response.json(); // Add this line

      if (data.success) {
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        throw new Error(data.message || "Failed to update user status");
      }
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  const forceLogoutUser = async (userId: number) => {
    if (!canEditUser) {
      toast.error("You don't have permission to manage user sessions");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${userId}/sessions`, {
        method: "DELETE",
      });
      const data = await response.json(); 

      if (data.success) {
        toast.success("User logged out from all devices");
        fetchUsers();
      } else {
        throw new Error(data.message || "Failed to force logout");
      }
    } catch (error: any) {
      console.error("Error forcing logout:", error);
      toast.error("Failed to force logout", {
        description: error.message
      });
    }
  };

  const exportUsers = async () => {
    if (!hasPermission("user.export")) {
      toast.error("You don't have permission to export users");
      return;
    }

    try {
      const headers = [
        "ID",
        "Username",
        "Full Name",
        "Email",
        "Role",
        "Department",
        "Status",
        "Last Login",
        "Created At"
      ];

      const rows = users.map(user => [
        user.id,
        user.username,
        user.full_name,
        user.email,
        user.role_name,
        user.department || "",
        user.is_active ? "Active" : "Inactive",
        formatDate(user.last_login),
        formatDate(user.created_at)
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Users exported successfully");
    } catch (error) {
      console.error("Error exporting users:", error);
      toast.error("Failed to export users");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
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
      return "Invalid date";
    }
  };

  const getStatusColor = (isActive: number) => {
    return isActive 
      ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
      : "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
  };

  const getStatusIcon = (isActive: number) => {
    return isActive ? CheckCircle : XCircle;
  };

  const getFilterDisplayValue = () => {
    const roleName = roles.find(r => r.value.toString() === filters.role)?.label || "All roles";
    const statusName = filters.status === "active" ? "Active only" : 
                      filters.status === "inactive" ? "Inactive only" : "All statuses";
    const sortName = filters.sortBy === "created_at" ? "Created Date" :
                    filters.sortBy === "full_name" ? "Full Name" :
                    filters.sortBy === "username" ? "Username" :
                    filters.sortBy === "email" ? "Email" :
                    filters.sortBy === "last_login" ? "Last Login" : "Sort by";
    
    return { roleName, statusName, sortName };
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
  if (!canViewUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-center">
              You don't have permission to manage users.
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
  if (error && !loading.users) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={fetchUsers} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="user.view" action="view">
      <div className="space-y-6">
        {/* Modals */}
        <UserFormModal
          isOpen={isUserFormModalOpen}
          onClose={() => setIsUserFormModalOpen(false)}
          onSuccess={handleUserCreated}
          roles={roles}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => {
            setIsChangePasswordModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={handlePasswordChanged}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the user "{userToDelete?.full_name}" ({userToDelete?.username})?
                This action cannot be undone and will permanently remove the user account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={loading.actions}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                disabled={!userToDelete || loading.actions}
              >
                {loading.actions ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            </div>
            <p className="text-muted-foreground">
              Manage system users, roles, and permissions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchUsers} disabled={loading.users}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading.users ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <PermissionGuard permissionCode="user.view" fallback={null}>
              <Button variant="outline" onClick={exportUsers} disabled={users.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </PermissionGuard>
            <PermissionGuard permissionCode="user.create" action="create">
              <Button onClick={() => setIsUserFormModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter and search users by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="search"
                    placeholder="Search users..."
                    className="pl-8"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={filters.role}
                  onValueChange={(value) => handleFilterChange("role", value)}
                  disabled={loading.roles}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All roles">
                      {getFilterDisplayValue().roleName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value.toString()}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses">
                      {getFilterDisplayValue().statusName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="inactive">Inactive only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by">
                      {getFilterDisplayValue().sortName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="full_name">Full Name</SelectItem>
                    <SelectItem value="username">Username</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="last_login">Last Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  {pagination.total} user{pagination.total !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading.users ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground">
                  {filters.search || filters.role !== "all" || filters.status !== "all" 
                    ? "Try adjusting your filters" 
                    : "Create your first user"}
                </p>
                <PermissionGuard permissionCode="user.create" action="create">
                  {!filters.search && filters.role === "all" && filters.status === "all" && (
                    <Button 
                      onClick={() => setIsUserFormModalOpen(true)} 
                      className="mt-4"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  )}
                </PermissionGuard>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const StatusIcon = getStatusIcon(user.is_active);
                      return (
                        <TableRow key={user.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{user.full_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {user.username} • {user.email}
                                </div>
                                {user.department && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {user.department}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                              <Shield className="h-3 w-3 mr-1" />
                              {user.role_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${user.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                              <Badge 
                                variant="outline" 
                                className={getStatusColor(user.is_active)}
                              >
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(user.last_login)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
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
                                      asChild
                                    >
                                      <Link href={`/admin/users/${user.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View details</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {(canEditUser || user.id === currentUser?.id) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        asChild
                                      >
                                        <Link href={`/admin/users/${user.id}/edit`}>
                                          <Edit className="h-4 w-4" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit user</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              {canEditUser && user.id !== currentUser?.id && (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => {
                                            setSelectedUser(user);
                                            setIsChangePasswordModalOpen(true);
                                          }}
                                          disabled={loading.actions}
                                        >
                                          <Key className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Change password</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => toggleUserStatus(user)}
                                          disabled={loading.actions}
                                        >
                                          {user.is_active ? (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                          ) : (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{user.is_active ? 'Deactivate' : 'Activate'} user</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => forceLogoutUser(user.id)}
                                          disabled={loading.actions}
                                        >
                                          <LogOut className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Force logout</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              )}
                              
                              {canDeleteUser && user.id !== currentUser?.id && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleDeleteUser(user)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                        disabled={loading.actions}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete user</p>
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
          
          {/* Pagination */}
          {users.length > 0 && (
            <CardFooter className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1 || loading.users}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading.users}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading.users}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading.users}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.pages)}
                  disabled={pagination.page === pagination.pages || loading.users}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination.total}</div>
              <p className="text-xs text-muted-foreground">
                All system users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active accounts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role_name.toLowerCase().includes('admin')).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with admin roles
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active in last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          Logged in as: {currentUser?.full_name || currentUser?.username} • Role: {currentUser?.role}
        </div>
      </div>
    </PermissionGuard>
  );
}