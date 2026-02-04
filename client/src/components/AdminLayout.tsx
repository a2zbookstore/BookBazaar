import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  BookOpen,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  LogOut,
  Truck,
  User,
  RotateCcw,
  Mail,
  Gift,
  Percent,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { href: "/admin", icon: BarChart3, label: "Dashboard", exact: true },
  { href: "/admin/inventory", icon: BookOpen, label: "Inventory" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
  { href: "/admin/messages", icon: Mail, label: "Messages" },
  { href: "/admin/returns", icon: RotateCcw, label: "Returns" },
  { href: "/admin/coupons", icon: Percent, label: "Coupons" },
  { href: "/admin/gift-categories", icon: Gift, label: "Gift Categories" },
  { href: "/admin/gift-management", icon: Gift, label: "Gift Management" },
  { href: "/admin/welcome-email", icon: Mail, label: "Welcome Email" },
  { href: "/admin/shipping", icon: Truck, label: "Shipping" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/account", icon: User, label: "Account" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? location === href : location.startsWith(href);

  /* ESC key closes sidebar */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white",
          "transform transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:z-auto"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-wide">A2Z BOOKSHOP</h2>
            <p className="text-sm text-slate-300 mt-1">
              {user?.firstName || "Admin"}
            </p>
          </div>
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700">
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Back to Store
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col"
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/api/logout")}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
