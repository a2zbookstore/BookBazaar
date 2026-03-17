import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
  const { data: admin, isLoading } = useQuery({
    queryKey: ["/api/admin/user"],
    retry: false,
    staleTime: 0,           // always re-validate on mount
    refetchOnWindowFocus: true,
  });

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin,
  };
}