import Link from "next/link";
import AppNavbar from "@/components/app-navbar";



export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
        <AppNavbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
