import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import AdminSidebar from "@/components/ui/AdminSidebar";
import { useLocation } from "wouter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const { setIsAuthTransitioning } = useGlobalContext();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ESC key closes sidebar */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleLogout = async () => {
    setIsAuthTransitioning(true);
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {
      // proceed to redirect even if the request fails
    }
    // Invalidate the cached admin session — AdminProtectedRoute will redirect
    // via setLocation without a full page reload
    await queryClient.invalidateQueries({ queryKey: ["/api/admin/user"] });
    setIsAuthTransitioning(false);
    setLocation("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-h-0 overflow-hidden mt-[calc(100px+38px)] sm:mt-[calc(70px+8px)]"
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        {/* Top Bar */}
        <header className="md:hidden flex-shrink-0 sticky top-0 z-30 bg-white border-b px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
          <button
            className="md:hidden p-1 hover:bg-gray-100 rounded"
            onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold truncate">Admin Dashboard</h1>
        </header>

        {/* Page Content */}
        <main 
          className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden " 
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {children}
        </main> 
      </div>
    </div>
  );
}
