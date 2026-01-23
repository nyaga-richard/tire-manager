import Link from "next/link";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Vehicles", href: "/vehicles" },
  { name: "Inventory", href: "/inventory" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Purchases", href: "/purchases" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b">
        <nav className="container mx-auto flex h-16 items-center justify-between">
          <span className="font-bold">TireSys</span>
          <div className="flex gap-6">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
