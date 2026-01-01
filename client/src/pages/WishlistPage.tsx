import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/contexts/WishlistContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { refreshWishlistCount } = useWishlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated,
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: (bookId: number) => apiRequest("DELETE", `/api/wishlist/${bookId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      refreshWishlistCount();
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

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bookerly font-semibold text-base-black mb-2">
              Login to View Your Wishlist
            </h2>
            <p className="text-secondary-black mb-6">
              Create an account or sign in to save your favorite books.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="My Wishlist"
        description="Save your favorite books to your wishlist. Keep track of books you want to buy later at A2Z BOOKSHOP."
        keywords="book wishlist, saved books, favorite books, book list"
        url="https://a2zbookshop.com/wishlist"
        type="website"
      />
      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: "Wishlist" }]} />

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bookerly font-bold text-base-black">
            My Wishlist
          </h1>
          <span className="text-secondary-black">({wishlistItems.length} books)</span>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bookerly font-semibold text-base-black mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-secondary-black mb-6">
              Start adding books you love by clicking the heart icon on any book.
            </p>
            <Link href="/catalog">
              <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Books
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 book-grid">
              {wishlistItems.map((item: any) => (
                <div key={item.id} className="relative">
                  <BookCard book={item.book} />
                  
                  {/* Remove Button */}
                  <div className="absolute top-2 left-2 z-20">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFromWishlistMutation.mutate(item.book.id)}
                      disabled={removeFromWishlistMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 p-0 shadow-lg"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-12 text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/catalog">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Continue Shopping
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button className="bg-primary-aqua hover:bg-secondary-aqua w-full sm:w-auto">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    View Cart
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}