import { useAuth } from "./useAuth";

export function useAdminAuth() {
  const { user, isLoading } = useAuth();
  
  // User must be logged in AND have admin role
  const isAdmin = user?.role === "admin";

  return {
    admin: isAdmin ? user : null,
    isLoading,
    isAuthenticated: isAdmin,
  };
}