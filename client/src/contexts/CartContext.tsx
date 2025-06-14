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
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        try {
          setGuestCart(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error loading guest cart:', error);
          localStorage.removeItem('guestCart');
        }
      }
    }
  }, [isAuthenticated]);

  // Save guest cart to localStorage whenever it changes
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
    }
  }, [guestCart, isAuthenticated]);

  const { data: serverCartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  }) as { data: CartItem[]; isLoading: boolean };

  // Use server cart for authenticated users, guest cart for non-authenticated
  const cartItems = isAuthenticated ? serverCartItems : guestCart;

  const cartCount = cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  const addToCartMutation = useMutation({
    mutationFn: async ({ bookId, quantity = 1 }: { bookId: number; quantity?: number }) => {
      if (isAuthenticated) {
        await apiRequest("POST", "/api/cart", { bookId, quantity });
      } else {
        // Handle guest cart locally
        const response = await fetch(`/api/books/${bookId}`);
        const book = await response.json();
        
        setGuestCart(prevCart => {
          const existingItem = prevCart.find(item => item.bookId === bookId);
          if (existingItem) {
            return prevCart.map(item =>
              item.bookId === bookId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            const newItem: CartItem = {
              id: Date.now(),
              userId: 'guest',
              bookId,
              quantity,
              book,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            return [...prevCart, newItem];
          }
        });
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      if (isAuthenticated) {
        await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      } else {
        setGuestCart(prevCart =>
          prevCart.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        );
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      if (isAuthenticated) {
        await apiRequest("DELETE", `/api/cart/${id}`);
      } else {
        setGuestCart(prevCart => prevCart.filter(item => item.id !== id));
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        await Promise.all(cartItems.map((item: CartItem) => 
          apiRequest("DELETE", `/api/cart/${item.id}`)
        ));
      } else {
        setGuestCart([]);
        localStorage.removeItem('guestCart');
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
    },
  });

  const addToCart = async (bookId: number, quantity = 1) => {
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
