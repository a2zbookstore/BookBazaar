import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import Header from "./Header";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, isLoading: userLoading } = useAuth();
  const { admin, isLoading: adminLoading, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();

  const isLoading = userLoading || adminLoading;

  useEffect(() => {
    if (!isLoading) {
      // If user is not logged in at all, redirect to login page
      if (!user) {
        setLocation("/login");
        return;
      }
      
      // If user is logged in but doesn't have admin role, show access denied
      if (!isAuthenticated) {
        // Will show access denied message in the render below
        return;
      }
    }
  }, [isLoading, user, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-aqua"></div>
          <p className="mt-4 text-secondary-black">Loading admin...</p>
        </div>
      </div>
    );
  }

  // Not logged in - will redirect via useEffect
  if (!user) {
    return null;
  }

  // Logged in but not admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have administrator privileges to access this page.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="bg-primary-aqua hover:bg-primary-aqua/90 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* <div className="fixed top-0 left-0 right-0 z-40">
        <Header />
      </div> */}
      <AdminLayout>
        {children}
      </AdminLayout>
    </div>
  );
}