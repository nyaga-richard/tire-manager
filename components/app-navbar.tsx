"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LayoutDashboard, LogOut } from "lucide-react";

const navItems = [
  { name: "Vehicles", href: "/vehicles" },
  { name: "Inventory", href: "/inventory" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Purchases", href: "/purchases" },
];

export default function AppNavbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", {
      credentials: "include",
    })
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const logout = async () => {
    await fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setIsLoggedIn(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <span className="font-bold text-lg">TireSys</span>

        <NavigationMenu>
          <NavigationMenuList>
            {isLoggedIn &&
              navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link href={item.href}>{item.name}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}

            <NavigationMenuItem>
              {!isLoggedIn ? (
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Login
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard")}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
