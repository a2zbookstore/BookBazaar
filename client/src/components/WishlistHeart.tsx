import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WishlistHeartProps {
  bookId: number;
  className?: string;
  size?: number;
}

export default function WishlistHeart({ bookId, className = "", size = 20 }: WishlistHeartProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if book is in wishlist
  const { data: wishlistStatus } = useQuery({
    queryKey: ['/api/wishlist/check', bookId],
    enabled: isAuthenticated,
  });

  const isInWishlist = wishlistStatus?.inWishlist || false;

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wishlist", { bookId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist/check', bookId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Added to wishlist",
        description: "Book has been added to your wishlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlist",
        variant: "destructive",
      });
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/wishlist/${bookId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist/check', bookId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Removed from wishlist",
        description: "Book has been removed from your wishlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from wishlist",
        variant: "destructive",
      });
    },
  });

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to add books to your wishlist",
        variant: "destructive",
      });
      return;
    }

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    if (isInWishlist) {
      removeFromWishlistMutation.mutate();
    } else {
      addToWishlistMutation.mutate();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative transition-all duration-200 hover:scale-110 touch-target ${className}`}
      disabled={addToWishlistMutation.isPending || removeFromWishlistMutation.isPending}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={size}
        className={`transition-all duration-300 ${
          isInWishlist
            ? "fill-red-500 text-red-500"
            : "text-gray-400 hover:text-red-400"
        } ${isAnimating ? "heart-beat-animation" : ""}`}
      />
      
      {/* Animation particles */}
      {isAnimating && !isInWishlist && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            <div className="heart-particle heart-particle-1"></div>
            <div className="heart-particle heart-particle-2"></div>
            <div className="heart-particle heart-particle-3"></div>
            <div className="heart-particle heart-particle-4"></div>
          </div>
        </>
      )}
    </button>
  );
}