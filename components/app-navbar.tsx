// components/app-navbar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  User, 
  LayoutDashboard, 
  LogOut, 
  Settings,
  Shield,
  Package,
  Truck,
  FileText,
  BarChart3,
  Menu,
  Repeat,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // Fixed import path
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// Navigation items with icons and permissions
const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    permission: "dashboard.view"
  },
  { 
    name: "Inventory", 
    href: "/inventory", 
    icon: Package,
    permission: "inventory.view"
  },
  { 
    name: "Vehicles", 
    href: "/vehicles", 
    icon: Truck,
    permission: "vehicle.view"
  },
  { 
    name: "Purchases", 
    href: "/purchases", 
    icon: ShoppingCart,
    permission: "po.view"
  },
  {
    name: "Retreads",
    href: "/retreads",
    icon: Repeat,
    permission: "tire.retread"
  },
  { 
    name: "Suppliers", 
    href: "/suppliers", 
    icon: FileText,
    permission: "supplier.view"
  },
];

// Admin navigation items
const adminNavItems = [
  { 
    name: "Users", 
    href: "/admin/users", 
    icon: User,
    permission: "user.view"
  },
  { 
    name: "Roles", 
    href: "/admin/roles", 
    icon: Shield,
    permission: "role.view"
  },
  { 
    name: "Reports", 
    href: "/admin/reports", 
    icon: BarChart3,
    permission: "reports.view"
  },
  { 
    name: "Settings", 
    href: "/admin/settings", 
    icon: Settings,
    permission: "settings.view"
  },
];

export default function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout, checkPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === "Super Administrator" || user?.role === "Administrator";

  // Filter navigation items based on permissions
  const getFilteredNavItems = () => {
    return navItems.filter(item => 
      !item.permission || checkPermission(item.permission, "view")
    );
  };

  const filteredNavItems = getFilteredNavItems();
  const filteredAdminNavItems = isAdmin ? adminNavItems.filter(item => 
    !item.permission || checkPermission(item.permission, "view")
  ) : [];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout(true); // Pass true to skip redirect
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed", { description: "Please try again" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Don't show navbar on login page
  if (pathname === "/login" || pathname === "/register" || pathname?.startsWith("/forgot-password")) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Tire Management System</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">
            Tire Management System
          </span>
          <span className="font-bold text-lg sm:hidden">TMS</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <NavigationMenu>
                <NavigationMenuList className="gap-1">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              pathname === item.href || pathname?.startsWith(item.href + '/')
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}

                  {/* Admin dropdown */}
                  {filteredAdminNavItems.length > 0 && (
                    <NavigationMenuItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="gap-2 data-[state=open]:bg-primary/10"
                          >
                            <Shield className="h-4 w-4" />
                            Admin
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Administration</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {filteredAdminNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <DropdownMenuItem key={item.href} asChild>
                                <Link
                                  href={item.href}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Icon className="h-4 w-4" />
                                  {item.name}
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </NavigationMenuItem>
                  )}
                </NavigationMenuList>
              </NavigationMenu>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user?.role}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-xs font-medium text-primary">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          {isAuthenticated ? (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0">
                <div className="flex flex-col h-full">
                  {/* User info */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user?.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation items */}
                  <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Main
                    </p>
                    {filteredNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              pathname === item.href || pathname?.startsWith(item.href + '/')
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        </SheetClose>
                      );
                    })}

                    {/* Admin section */}
                    {filteredAdminNavItems.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">
                          Administration
                        </p>
                        {filteredAdminNavItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <SheetClose asChild key={item.href}>
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                  pathname === item.href || pathname?.startsWith(item.href + '/')
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {item.name}
                              </Link>
                            </SheetClose>
                          );
                        })}
                      </>
                    )}
                  </nav>

                  {/* Footer actions */}
                  <div className="p-4 border-t space-y-2">
                    <SheetClose asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </SheetClose>
                    <Button
                      variant="destructive"
                      className="w-full mt-4"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? "Logging out..." : "Log out"}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Active page indicator */}
      {isAuthenticated && (
        <div className="container mx-auto px-4">
          <div className="h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
        </div>
      )}
    </header>
  );
}