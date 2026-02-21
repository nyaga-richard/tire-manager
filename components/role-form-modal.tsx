"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Save, X, Check, Shield } from "lucide-react";

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

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

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  permissions: Record<string, Permission[]>;
  role?: any; // For editing existing role
}

export default function RoleFormModal({
  isOpen,
  onClose,
  onSuccess,
  permissions,
  role,
}: RoleFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<number, PermissionSelection>
  >({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);

  // Initialize form for editing
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || "",
        description: role.description || "",
      });

      // Initialize permissions from role
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
    } else {
      // Reset for new role
      setFormData({ name: "", description: "" });
      setSelectedPermissions({});
    }
  }, [role, isOpen]);

  // Expand all categories by default
  useEffect(() => {
    if (permissions) {
      const expanded: Record<string, boolean> = {};
      Object.keys(permissions).forEach(category => {
        expanded[category] = true;
      });
      setExpandedCategories(expanded);
    }
  }, [permissions]);

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

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      const url = role 
        ? `${API_BASE_URL}/api/roles/${role.id}`
        : `${API_BASE_URL}/api/roles`;
      
      const method = role ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: permissionsArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save role");
      }

      toast.success(role ? "Role updated successfully" : "Role created successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast.error("Failed to save role", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionCount = () => {
    return Object.values(selectedPermissions).filter(perm => 
      perm.can_view || perm.can_create || perm.can_edit || perm.can_delete || perm.can_approve
    ).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {role ? "Edit Role" : "Create New Role"}
          </DialogTitle>
          <DialogDescription>
            {role 
              ? "Modify role details and permissions"
              : "Create a new role and assign permissions"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Fleet Manager, Inventory Clerk"
                    required
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Permissions</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    {getPermissionCount()} permissions selected
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllPermissions(!selectAll)}
                  >
                    {selectAll ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </div>

              {Object.keys(permissions).length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading permissions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(permissions).map(([category, categoryPerms]) => (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{category}</h4>
                          <Badge variant="secondary" className="ml-2">
                            {categoryPerms.length}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllInCategory(category, true);
                          }}
                        >
                          Select All
                        </Button>
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
                                      disabled={loading}
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
                                      disabled={loading}
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
                                      disabled={loading}
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
                                      disabled={loading}
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
                                      disabled={loading}
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

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {role ? "Update Role" : "Create Role"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}