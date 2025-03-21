import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Menu, Search, X } from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dasbor", href: "/admin" },
    { name: "Kelola Halaman", href: "/admin/pages" },
    { name: "Sistem Penilaian", href: "/admin/grades" },
    { name: "Tugas", href: "/admin/assignments" },
    { name: "Penghargaan", href: "/admin/awards" },
    { name: "Manajemen Pengguna", href: "/admin/users" },
    { name: "Pemantauan Pengguna", href: "/admin/monitoring" },
    { name: "Statistik", href: "/admin/statistics" },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <aside className="fixed inset-y-0 left-0 bg-white shadow-lg w-64 hidden md:block z-10">
        <div className="flex flex-col h-full">
          <div className="px-4 py-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800">
              Code<span className="text-primary">Stock</span>
            </h1>
            <p className="text-sm text-gray-600">Dasbor Admin</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md group ${
                  isActive(item.href)
                    ? "bg-blue-50 border-l-3 border-primary text-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="mr-3 text-gray-500">{/* Icon would go here */}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="text-sm font-bold">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full text-gray-600"
              onClick={() => logoutMutation.mutate()}
            >
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile navbar */}
      <nav className="md:hidden bg-white shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          Code<span className="text-primary">Stock</span>
        </h1>
        <button
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden">
          <div className="bg-white w-64 min-h-screen overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Menu Admin</h2>
              <button
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1 mb-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md ${
                    isActive(item.href)
                      ? "bg-blue-50 text-gray-800"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mr-3 text-gray-500">{/* Icon would go here */}</span>
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="pt-4 border-t">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-gray-600"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logoutMutation.mutate();
                }}
              >
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-64 min-h-screen pt-4 px-4 md:px-8">
        {/* Top Bar with User Info and Search */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Cari..." 
                className="w-64 pl-10" 
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
            </div>
            <div className="relative">
              <button className="relative p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:bg-gray-100">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        {children}
      </main>
    </div>
  );
}
