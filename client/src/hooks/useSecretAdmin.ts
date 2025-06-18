import { useQuery } from "@tanstack/react-query";

export function useSecretAdmin() {
  const { data: admin, isLoading } = useQuery({
    queryKey: ["/api/admin/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    admin,
    isLoading,
    isSecretAdmin: !!admin,
  };
}