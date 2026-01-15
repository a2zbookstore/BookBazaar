import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CartItem } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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
  refreshGuestCartStock: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'guestCart';

// Helper to extract only essential book data for localStorage
const getEssentialBookData = (book: any) => ({
  id: book.id,
  title: book.title,
  author: book.author,
  imageUrl: book.imageUrl,
  price: book.price,
  stock: book.stock,
  condition: book.condition,
  featured: book.featured,
  bestseller: book.bestseller,
  createdAt: book.createdAt,
  updatedAt: book.updatedAt,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);

  const triggerCartAnimation = useCallback(() => {
    setIsCartAnimating(true);
    setTimeout(() => {
      setIsCartAnimating(false);
    }, 600); // Animation lasts for 0.6 seconds
  }, []);

  // Manual stock refresh for guest cart
  const refreshGuestCartStock = useCallback(async () => {
    if (isAuthenticated || guestCart.length === 0) return;

    try {
      console.log('Refreshing stock data for', guestCart.length, 'guest cart items');

      const updatedCart = await Promise.all(
        guestCart.map(async (item) => {
          try {
            const response = await apiRequest("GET", `/api/books/${item.bookId}`);
            const freshBook = await response.json();

            return {
              ...item,
              book: getEssentialBookData(freshBook),
            };
          } catch (error) {
            console.error(`Failed to refresh stock for book ${item.bookId}:`, error);
            return item; // Keep old data if refresh fails
          }
        })
      );

      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
      setGuestCart(updatedCart);
      console.log('Guest cart stock refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh guest cart stock:', error);
    }
  }, [guestCart, isAuthenticated]);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        try {
          const parsedCart = JSON.parse(stored);
          console.log('Guest cart loaded from localStorage:', parsedCart.length, 'items');
          setGuestCart(parsedCart);
        } catch (error) {
          console.error('Failed to parse guest cart:', error);
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }
    }
  }, [isAuthenticated, authLoading]);

  // Sync guest cart to server when user logs in
  useEffect(() => {
    if (isAuthenticated && guestCart.length > 0) {
      // Migrate guest cart to server
      const migrateCart = async () => {
        try {
          for (const item of guestCart) {
            await apiRequest("POST", "/api/cart/add", {
              bookId: item.book.id,
              quantity: item.quantity
            });
          }
          // Clear guest cart after migration
          localStorage.removeItem(GUEST_CART_KEY);
          setGuestCart([]);
          queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        } catch (error) {
          console.error('Failed to migrate guest cart:', error);
        }
      };
      migrateCart();
    }
  }, [isAuthenticated, guestCart, queryClient]);

  // Server-side cart for authenticated users
  const { data: serverCartItems = [], isLoading: serverLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  }) as { data: CartItem[]; isLoading: boolean };

  // Determine which cart to use
  const cartItems = isAuthenticated ? serverCartItems : guestCart;
  const isLoading = authLoading || (isAuthenticated && serverLoading);

  const cartCount = cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  // Helper to save guest cart to localStorage
  const saveGuestCart = (cart: CartItem[]) => {
    console.log('Saving guest cart to localStorage:', cart.length, 'items');
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    setGuestCart(cart);

  };

  // Server-side mutations (only for authenticated users)
  const addToCartMutation = useMutation({
    mutationFn: async ({ bookId, quantity }: { bookId: number; quantity: number }) => {
      return await apiRequest("POST", "/api/cart/add", { bookId, quantity });
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

  // Add to cart (localStorage for guests, API for authenticated)
  const addToCart = async (bookId: number, quantity: number = 1) => {
    if (isAuthenticated) {
      await addToCartMutation.mutateAsync({ bookId, quantity });
    } else {
      // For guests, fetch book details and add to localStorage
      try {
        const response = await apiRequest("GET", `/api/books/${bookId}`);
        const book = await response.json();

        // Check stock availability
        if (book.stock <= 0) {
          toast({
            title: "Error",
            description: "This book is out of stock.",
            variant: "destructive"
          });
          return;
        }

        const existingItem = guestCart.find(item => item.book.id === bookId);
        const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
        const newTotalQuantity = currentQuantityInCart + quantity;

        // Validate total quantity doesn't exceed stock
        console.log("newTotalQuantity", newTotalQuantity);

        if (newTotalQuantity > book.stock) {
          toast({
            title: "Exceeded Stock",
            description: `Only ${book.stock} items available in stock. You already have ${currentQuantityInCart} in your cart.`,
            variant: "destructive"
          });
          return
        }

        let newCart: CartItem[];
        if (existingItem) {
          // Update quantity if item already exists
          newCart = guestCart.map(item =>
            item.book.id === bookId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item with essential book data only
          const newItem: CartItem = {
            id: Date.now(), // Temporary ID for guest cart
            bookId: book.id,
            book: getEssentialBookData(book),
            quantity,
            userId: null,
            createdAt: new Date().toISOString(),
          };
          newCart = [...guestCart, newItem];
        }
        toast({
          title: "✓ Added to cart",
          description: `${quantity > 1 ? `${quantity} copies of ` : ''}${book.title.length > 60 ? book.title.substring(0, 60) + '...' : book.title}`,
        });
        saveGuestCart(newCart);

      } catch (error) {
        console.error('Failed to add book to guest cart:', error);
        throw error;
      }
    }
    triggerCartAnimation();
  };

  // Update cart item (localStorage for guests, API for authenticated)
  const updateCartItem = async (id: number, quantity: number) => {
    if (isAuthenticated) {
      await updateCartMutation.mutateAsync({ id, quantity });
    } else {
      // For guests, validate stock before updating
      const item = guestCart.find(item => item.id === id);
      if (!item) {
        throw new Error('Item not found in cart');
      }

      const existingItem = guestCart.find(item => item.id === id);
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      // Check if new quantity exceeds stock
      if (quantity > item.book.stock) {
        throw new Error(`Only ${item.book.stock} items available in stock. You already have ${currentQuantityInCart} in your cart.`);
      }

      const newCart = guestCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      toast({
        title: "✓ Added to cart",
        description: `${quantity > 1 ? `${quantity} copies of ` : ''}${item.book.title.length > 60 ? item.book.title.substring(0, 60) + '...' : item.book.title}`,
      });
      saveGuestCart(newCart);
    }
  };

  // Remove from cart (localStorage for guests, API for authenticated)
  const removeFromCart = async (id: number) => {
    if (isAuthenticated) {
      await removeFromCartMutation.mutateAsync(id);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    } else {
      const newCart = guestCart.filter(item => item.id !== id);
      saveGuestCart(newCart);
    }
  };

  // Clear cart (localStorage for guests, API for authenticated)
  const clearCart = async () => {
    if (isAuthenticated) {
      await clearCartMutation.mutateAsync();
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      setGuestCart([]);
    }
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
        refreshGuestCartStock,
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