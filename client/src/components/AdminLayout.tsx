import React from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  BookOpen,
  ShoppingCart,
  TrendingUp,
  Users,
  Settings,
  Menu,
  LogOut,
  Truck,
  User,
  RotateCcw,
  Mail,
  Gift,
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
  { href: "/admin/gift-management", icon: Gift, label: "Gift Management" },
  { href: "/admin/welcome-email", icon: Mail, label: "Welcome Email" },
  { href: "/admin/shipping", icon: Truck, label: "Shipping" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/account", icon: User, label: "Account" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location === href;
    }
    return location.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-700">
        <div className="p-6 bg-slate-900">
          <Link href="/" className="flex items-center mb-8">
            <h2 className="text-xl font-bookerly font-bold text-white">A2Z BOOKSHOP</h2>
          </Link>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Admin Dashboard</h3>
            <p className="text-sm text-slate-300 bg-slate-700 px-3 py-1 rounded-full inline-block">Welcome back, {user?.firstName || 'Admin'}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 bg-slate-900">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-4 rounded-xl transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-sm",
                      isActive(item.href, item.exact)
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg border-l-4 border-blue-300 font-semibold"
                        : "text-slate-200 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:text-white hover:shadow-md font-medium border-l-4 border-transparent hover:border-gray-400"
                    )}
                    onClick={() => {
                      console.log("Navigating to:", item.href);
                      setLocation(item.href);
                    }}
                  >
                    <Icon className={cn(
                      "h-6 w-6 mr-4 transition-colors duration-300",
                      isActive(item.href, item.exact)
                        ? "text-blue-100"
                        : "text-slate-300 hover:text-white"
                    )} />
                    <span className="text-sm tracking-wide">{item.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-slate-200 hover:text-white hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 transition-all duration-300 font-medium px-4 py-3 rounded-xl transform hover:scale-105">
              <LogOut className="h-6 w-6 mr-4 text-slate-300 hover:text-white transition-colors duration-300" />
              Back to Store
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bookerly font-bold text-base-black">
              Admin Dashboard
            </h1>
            <Button
              onClick={() => window.location.href = "/api/logout"}
              variant="outline"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
