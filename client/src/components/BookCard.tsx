import React from "react";
import { Link } from "wouter";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/types";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addToCart(book.id);
      toast({
        title: "Added to cart",
        description: `${book.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "new":
        return "bg-green-100 text-green-800";
      case "like new":
        return "bg-blue-100 text-blue-800";
      case "very good":
        return "bg-yellow-100 text-yellow-800";
      case "good":
        return "bg-orange-100 text-orange-800";
      case "fair":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Link href={`/books/${book.id}`}>
      <div className="book-card group cursor-pointer">
        {/* Book Image */}
        <div className="aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-gray-100">
          {book.imageUrl ? (
            <img
              src={book.imageUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-2 bg-primary-aqua/10 rounded-full flex items-center justify-center">
                  <span className="text-primary-aqua font-bookerly text-lg">📚</span>
                </div>
                <p className="text-xs text-gray-500 font-medium">No Image</p>
              </div>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="space-y-2">
          <h3 className="font-bookerly font-semibold text-base-black line-clamp-2 group-hover:text-primary-aqua transition-colors">
            {book.title}
          </h3>
          <p className="text-secondary-black text-sm">{book.author}</p>
          
          {/* Condition Badge */}
          <Badge variant="secondary" className={`text-xs ${getConditionColor(book.condition)}`}>
            {book.condition}
          </Badge>

          {/* Rating (placeholder - you might want to add this to your schema) */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="text-xs text-secondary-black">(4.8)</span>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xl font-bold text-primary-aqua">
              ${parseFloat(book.price).toFixed(2)}
            </span>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-primary-aqua hover:bg-secondary-aqua text-white px-3 py-1 text-xs"
              disabled={book.stock === 0}
            >
              {book.stock === 0 ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>

          {book.stock > 0 && book.stock <= 5 && (
            <p className="text-xs text-abe-red">Only {book.stock} left in stock!</p>
          )}
        </div>
      </div>
    </Link>
  );
}
