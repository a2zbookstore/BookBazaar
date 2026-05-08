import { useState, useRef } from "react";
import { Link } from "wouter";
import { Eye, ShoppingCart, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Book } from "@/types";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { generateBookSlug } from "@/lib/slugUtils";
import WishlistHeart from "@/components/WishlistHeart";

// ─── single card ─────────────────────────────────────────────────────────────
function TrendingCard({ book }: { book: Book }) {
  const { addToCart } = useGlobalContext();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [adding, setAdding] = useState(false);

  const price = parseFloat(book.price);
  // Simulate a "was" price for books that are bestsellers/featured (10–30% markup)
  const hasDiscount = book.bestseller || book.featured || book.trending;
  const discountPct = hasDiscount
    ? Math.floor(10 + ((book.id * 7) % 21)) // 10-30 %
    : 0;
  const originalPrice = hasDiscount ? price / (1 - discountPct / 100) : null;

  const slug = generateBookSlug(book);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addToCart(book.id, 1);
      toast({ title: "Added to cart", description: book.title });
    } catch {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex-none w-56 md:w-64 group">
      {/* Image box */}
      <Link href={`/books/${slug}`}>
        <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-[3/4] mb-3 cursor-pointer">
          {/* Discount badge */}
          {hasDiscount && discountPct > 0 && (
            <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discountPct}%
            </div>
          )}

          {/* Book cover */}
          <img
            src={book.imageUrl || "https://via.placeholder.com/300x400/f0f0f0/999?text=No+Image"}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
          />

          {/* Hover action bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 py-3 bg-white/80 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            {/* View */}
            <Link href={`/books/${slug}`}>
              <button
                className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors"
                title="View"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-4 h-4 text-gray-700" />
              </button>
            </Link>

            {/* Add to cart */}
            <button
              className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Add to cart"
              onClick={handleAddToCart}
              disabled={adding}
            >
              <ShoppingCart className="w-4 h-4 text-gray-700" />
            </button>

            {/* Wishlist */}
            <div className="p-1 rounded-full bg-white shadow" title="Wishlist">
              <WishlistHeart bookId={book.id} iconSize={16} className="text-gray-700" />
            </div>
          </div>
        </div>
      </Link>

      {/* Info */}
      <Link href={`/books/${slug}`}>
        <div className="cursor-pointer">
          <p className="text-sm md:text-base font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-primary-aqua transition-colors">
            {book.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 mb-1">{book.author}</p>
          <div className="flex items-center gap-2 mt-1">
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
            <span className={`text-sm font-bold ${hasDiscount ? "text-orange-500" : "text-gray-900"}`}>
              ${price.toFixed(2)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── section ─────────────────────────────────────────────────────────────────
interface TrendingProductsSectionProps {
  books: Book[];
  isLoading?: boolean;
  viewAllHref?: string;
}

export default function TrendingProductsSection({
  books,
  isLoading = false,
  viewAllHref = "/catalog?trending=true",
}: TrendingProductsSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const SCROLL_PX = 280;

  function scrollLeft() {
    trackRef.current?.scrollBy({ left: -SCROLL_PX, behavior: "smooth" });
  }

  function scrollRight() {
    trackRef.current?.scrollBy({ left: SCROLL_PX, behavior: "smooth" });
  }

  if (!isLoading && books.length === 0) return null;

  // Skeleton
  if (isLoading) {
    return (
      <section className="w-full mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-none w-56 md:w-64 animate-pulse">
              <div className="bg-gray-200 rounded-xl aspect-[3/4] mb-3" />
              <div className="h-4 bg-gray-200 rounded w-4/5 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Products</h2>
        <Link href={viewAllHref}>
          <span className="text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-primary-aqua transition-colors cursor-pointer">
            See all products
          </span>
        </Link>
      </div>

      {/* Carousel wrapper */}
      <div className="relative group/carousel">
        {/* Left arrow */}
        <button
          onClick={scrollLeft}
          className="absolute -left-5 top-1/2 -translate-y-8 z-10
            w-10 h-10 rounded-full bg-white border border-gray-200 shadow
            flex items-center justify-center
            opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200
            hover:bg-gray-50 focus:outline-none"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Scrollable track */}
        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-2 scroll-smooth
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {books.map((book) => (
            <TrendingCard key={book.id} book={book} />
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={scrollRight}
          className="absolute -right-5 top-1/2 -translate-y-8 z-10
            w-10 h-10 rounded-full bg-white border border-gray-200 shadow
            flex items-center justify-center
            opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200
            hover:bg-gray-50 focus:outline-none"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </section>
  );
}
