import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CartItem } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface GlobalContextType {
  cartItems: CartItem[];
  cartCount: number;
  wishlistCount: number;
  addToCart: (bookId: number, quantity?: number) => Promise<void>;
  updateCartItem: (id: number, quantity: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
  isCartAnimating: boolean;
  triggerCartAnimation: () => void;
  refreshGuestCartStock: () => Promise<void>;
  refreshWishlistCount: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {

  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Wishlist logic
  const { data: wishlistItems = [], refetch: refetchWishlist } = useQuery({
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
    refetchWishlist();
  };

  // Cart logic
  const GUEST_CART_KEY = 'guestCart';
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

  const triggerCartAnimation = useCallback(() => {
    setIsCartAnimating(true);
    setTimeout(() => {
      setIsCartAnimating(false);
    }, 600);
  }, []);

  const refreshGuestCartStock = useCallback(async () => {
    if (isAuthenticated || guestCart.length === 0) return;
    try {
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
            return item;
          }
        })
      );
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
      setGuestCart(updatedCart);
    } catch (error) {
      // handle error
    }
  }, [guestCart, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        try {
          const parsedCart = JSON.parse(stored);
          setGuestCart(parsedCart);
        } catch (error) {
          localStorage.removeItem(GUEST_CART_KEY);
        }
      }
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (isAuthenticated && guestCart.length > 0) {
      const migrateCart = async () => {
        try {
          for (const item of guestCart) {
            await apiRequest("POST", "/api/cart/add", {
              bookId: item.book.id,
              quantity: item.quantity
            });
          }
          localStorage.removeItem(GUEST_CART_KEY);
          setGuestCart([]);
          queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        } catch (error) {
          // handle error
        }
      };
      migrateCart();
    }
  }, [isAuthenticated, guestCart, queryClient]);

  const { data: serverCartItems = [], isLoading: serverLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  }) as { data: CartItem[]; isLoading: boolean };

  const cartItems = isAuthenticated ? serverCartItems : guestCart;
  const isLoading = authLoading || (isAuthenticated && serverLoading);
  const cartCount = cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);

  const saveGuestCart = (cart: CartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    setGuestCart(cart);
  };

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

  const addToCart = async (bookId: number, quantity: number = 1) => {
    if (isAuthenticated) {
      await addToCartMutation.mutateAsync({ bookId, quantity });
    } else {
      try {
        const response = await apiRequest("GET", `/api/books/${bookId}`);
        const book = await response.json();
        if (book.stock <= 0) return;
        const existingItem = guestCart.find(item => item.book.id === bookId);
        const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
        const newTotalQuantity = currentQuantityInCart + quantity;
        if (newTotalQuantity > book.stock) return;
        let newCart: CartItem[];
        if (existingItem) {
          newCart = guestCart.map(item =>
            item.book.id === bookId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const newItem: CartItem = {
            id: Date.now(),
            bookId: book.id,
            book: getEssentialBookData(book),
            quantity,
            userId: null,
            createdAt: new Date().toISOString(),
          };
          newCart = [...guestCart, newItem];
        }
        saveGuestCart(newCart);
      } catch (error) {
        throw error;
      }
    }
    triggerCartAnimation();
  };

  const updateCartItem = async (id: number, quantity: number) => {
    if (isAuthenticated) {
      await updateCartMutation.mutateAsync({ id, quantity });
    } else {
      const item = guestCart.find(item => item.id === id);
      if (!item) throw new Error('Item not found in cart');
      if (quantity > item.book.stock) throw new Error(`Only ${item.book.stock} items available in stock.`);
      const newCart = guestCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      saveGuestCart(newCart);
    }
  };

  const removeFromCart = async (id: number) => {
    if (isAuthenticated) {
      await removeFromCartMutation.mutateAsync(id);
    //   queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    } else {
      const newCart = guestCart.filter(item => item.id !== id);
      saveGuestCart(newCart);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await clearCartMutation.mutateAsync();
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      setGuestCart([]);
    }
  };

  return (
    <GlobalContext.Provider value={{
      cartItems,
      cartCount,
      wishlistCount,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      isLoading,
      isCartAnimating,
      triggerCartAnimation,
      refreshGuestCartStock,
      refreshWishlistCount,
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
}
