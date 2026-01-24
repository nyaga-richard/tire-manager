"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const navItems = [
  { name: "Vehicles", href: "/vehicles" },
  { name: "Inventory", href: "/inventory" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Purchases", href: "/purchases" },
];

export default function AppNavbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", {
      credentials: "include",
    })
      .then((res) => {
        setIsLoggedIn(res.ok);
      })
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
                  <Link href={item.href}>
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              ))}

            <NavigationMenuItem>
              {!isLoggedIn ? (
                <Button variant="ghost" onClick={() => router.push("/login")}>
                  Login
                </Button>
              ) : (
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
