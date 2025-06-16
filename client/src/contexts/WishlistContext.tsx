import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface WishlistContextType {
  wishlistCount: number;
  refreshWishlistCount: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [wishlistCount, setWishlistCount] = useState(0);

  const { data: wishlistItems = [], refetch } = useQuery({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated && Array.isArray(wishlistItems)) {
      setWishlistCount(wishlistItems.length);
    } else {
      setWishlistCount(0);
    }
  }, [wishlistItems, isAuthenticated]);

  const refreshWishlistCount = () => {
    refetch();
  };

  return (
    <WishlistContext.Provider value={{ wishlistCount, refreshWishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}