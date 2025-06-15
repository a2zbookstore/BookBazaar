import React, { createContext, useContext, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CartItem } from "@/types";

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (bookId: number, quantity?: number) => Promise<void>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
  isCartAnimating: boolean;
  triggerCartAnimation: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isCartAnimating, setIsCartAnimating] = useState(false);

  const triggerCartAnimation = useCallback(() => {
    setIsCartAnimating(true);
    setTimeout(() => {
      setIsCartAnimating(false);
    }, 600); // Animation lasts for 0.6 seconds
  }, []);

  // Always use server-side cart (supports both guest sessions and authenticated users)
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  }) as { data: CartItem[]; isLoading: boolean };

  const cartCount = cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  const addToCartMutation = useMutation({
    mutationFn: async ({ bookId, quantity }: { bookId: number; quantity: number }) => {
      return await apiRequest("POST", "/api/cart", { bookId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return await apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const addToCart = async (bookId: number, quantity: number = 1) => {
    await addToCartMutation.mutateAsync({ bookId, quantity });
    triggerCartAnimation(); // Trigger the animation when item is added
  };

  const updateCartItem = async (id: number, quantity: number) => {
    await updateCartMutation.mutateAsync({ id, quantity });
  };

  const removeFromCart = async (id: number) => {
    await removeFromCartMutation.mutateAsync(id);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        isLoading,
        isCartAnimating,
        triggerCartAnimation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}