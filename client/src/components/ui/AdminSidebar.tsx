import React from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  BookOpen,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Truck,
  User,
  RotateCcw,
  Mail,
  Gift,
  Percent,
  X,
  FileText,
  TrendingUp,
  Store,
  BarChart2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user?: {
    firstName?: string;
  } | null;
  onLogout?: () => void;
}

const menuSections = [
  {
    title: "Overview",
    items: [
      { href: "/admin", icon: BarChart3, label: "Dashboard", exact: true },
      { href: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
      { href: "/admin/sales", icon: BarChart2, label: "Sales Reports" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/admin/inventory", icon: BookOpen, label: "Inventory" },
      { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
      { href: "/admin/book-requests", icon: ClipboardList, label: "Book Requests" },
      { href: "/admin/customers", icon: Users, label: "Customers" },
      { href: "/admin/returns", icon: RotateCcw, label: "Returns" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/coupons", icon: Percent, label: "Coupons" },
      { href: "/admin/gift-categories", icon: Gift, label: "Gift Categories" },
      { href: "/admin/messages", icon: Mail, label: "Messages" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/audit-trail", icon: FileText, label: "Audit Trail" },
      { href: "/admin/shipping", icon: Truck, label: "Shipping" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
      { href: "/admin/account", icon: User, label: "Account" },
    ],
  },
];

function AdminSidebar({ sidebarOpen, setSidebarOpen, user, onLogout }: AdminSidebarProps) {
  const [location] = useLocation();

  const isActive = (href: string, exact = false) =>
    exact ? location === href : location.startsWith(href);

  // Get user initials
  const getUserInitials = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return "A";
  };

  return (
    <aside
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950",
        "transform transition-all duration-300 ease-in-out shadow-2xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:static md:z-auto",
        "flex flex-col h-screen md:h-screen"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* User Avatar Circle */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-blue-400/30">
              {getUserInitials()}
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Welcome back</p>
              <p className="text-base font-semibold text-white">
                {user?.firstName || "Admin"}
              </p>
            </div>
          </div>
          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Brand */}
        <div className="flex items-center gap-2 px-2">
          <Store className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold tracking-wide bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            A2Z BOOKSHOP
          </h2>
        </div>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent" 
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            {/* Section Title */}
            <h3 className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {section.title}
            </h3>
            
            {/* Section Items */}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);

                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <a
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          "group relative overflow-hidden",
                          active
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                        )}
                      >
                        {/* Active indicator */}
                        {active && (
                          <span className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                        )}
                        
                        <Icon 
                          className={cn(
                            "h-5 w-5 transition-transform duration-200",
                            active ? "scale-110" : "group-hover:scale-110"
                          )} 
                        />
                        <span className={cn(
                          "flex-1",
                          active && "font-semibold"
                        )}>
                          {item.label}
                        </span>
                        
                        {/* Hover effect */}
                        {!active && (
                          <span className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-purple-600/5 rounded-lg transition-all duration-200" />
                        )}
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm space-y-2">
        <Link href="/">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-slate-300 hover:text-white",
              "hover:bg-slate-700/50 transition-all duration-200",
              "group relative overflow-hidden"
            )}
          >
            <Store className="h-4 w-4 mr-3 transition-transform group-hover:-translate-x-0.5" />
            Back to Store
            <span className="absolute inset-0 bg-gradient-to-r from-slate-700/0 to-slate-700/0 group-hover:from-slate-700/30 group-hover:to-slate-600/30 rounded transition-all duration-200" />
          </Button>
        </Link>
        {onLogout && (
          <Button
            variant="ghost"
            onClick={onLogout}
            className={cn(
              "w-full justify-start text-red-400 hover:text-red-300",
              "hover:bg-red-900/30 transition-all duration-200",
              "group relative overflow-hidden"
            )}
          >
            <LogOut className="h-4 w-4 mr-3 transition-transform group-hover:-translate-x-0.5" />
            Logout
            <span className="absolute inset-0 bg-gradient-to-r from-red-900/0 to-red-900/0 group-hover:from-red-900/20 group-hover:to-red-800/20 rounded transition-all duration-200" />
          </Button>
        )}
      </div>
    </aside>
  );
}

export default AdminSidebar;