import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { User } from "@/types";

export function useAuth() {
  const [isChecked, setIsChecked] = useState(false);
  
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async (): Promise<User | null> => {
      const res = await fetch("/api/auth/user", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        setIsChecked(true);
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      const user = await res.json();
      setIsChecked(true);
      return user;
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !isChecked || !!userData,
  });

  return {
    user: userData || null,
    isLoading: isLoading && !isChecked,
    isAuthenticated: !!userData,
    error,
  };
}
