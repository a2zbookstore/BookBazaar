import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CartItem } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (bookId: number, quantity?: number) => Promise<void>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  }) as { data: CartItem[]; isLoading: boolean };

  const cartCount = cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  const addToCartMutation = useMutation({
    mutationFn: async ({ bookId, quantity = 1 }: { bookId: number; quantity?: number }) => {
      await apiRequest("POST", "/api/cart", { bookId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      // Clear all items one by one since we don't have a clear endpoint
      await Promise.all(cartItems.map((item: CartItem) => 
        apiRequest("DELETE", `/api/cart/${item.id}`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const addToCart = async (bookId: number, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error("Please log in to add items to cart");
    }
    await addToCartMutation.mutateAsync({ bookId, quantity });
  };

  const updateCartItem = async (id: number, quantity: number) => {
    await updateCartItemMutation.mutateAsync({ id, quantity });
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
