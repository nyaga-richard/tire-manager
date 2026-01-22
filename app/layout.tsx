import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/components/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tire Management System",
  description: "Comprehensive tire and fleet management system",
};

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Vehicles", href: "/vehicles" },
  { name: "Inventory", href: "/inventory" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Purchases", href: "/purchases" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLoginPage = false; // This should be determined dynamically

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>
          {isLoginPage ? (
            <main>{children}</main>
          ) : (
            <>
              <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                  <nav className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">T</span>
                      </div>
                      <span className="text-xl font-bold">TireSys</span>
                    </div>
                    <div className="flex items-center space-x-6">
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="text-sm font-medium hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">JD</span>
                        </div>
                      </div>
                    </div>
                  </nav>
                </div>
              </header>
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}