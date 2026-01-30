import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Star, ShoppingCart, Truck, Shield, RotateCcw, BadgeDollarSign, Minus, Plus, Clock, Pen } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import SEO, { generateBookStructuredData } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useShipping } from "@/hooks/useShipping";
import { calculateDeliveryDate } from "@/lib/deliveryUtils";
import { Book } from "@/types";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useCurrency } from "@/hooks/useCurrency";

// Image helper function
const getImageSrc = (imageUrl: string | null | undefined): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/uploads/images/')) {
    return imageUrl;
  }
  const filename = imageUrl.split('/').pop() || imageUrl;
  return `/uploads/images/${filename}`;
};

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useGlobalContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { shippingRate, isLoading: isShippingLoading, shippingCost: shipCost } = useShipping();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [shippingCost, setShippingCost] = useState<string>("");
  const { userCurrency, convertPrice, formatAmount } = useCurrency();

  // Shipping cost logic from BookCard
  useEffect(() => {
    if (shipCost !== undefined) {
      if (shipCost === 0) {
        setShippingCost("Free Delivery");
      } else {
        setShippingCost(formatAmount(shipCost, "USD"));
      }
    }
  }, [shipCost, formatAmount]);

  const { data: book, isLoading } = useQuery<Book>({
    queryKey: [`/api/books/${id}`],
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!book) return;
    setIsAddingToCart(true);
    try {
      await addToCart(book.id, quantity);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
      setQuantity(1);

    }
  };

  const handleBuyNow = async () => {
    setLocation(`/checkout/buyNow/${id}/${quantity}`);
  }

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

  if (isLoading) {
    return (
      <>
        <div className="container-custom py-8">
          <Breadcrumb
            items={[
              { label: "Catalog", href: "/catalog" },
              { label: "Loading..." }
            ]}
            className="mt-6"
          />
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Book Image Skeleton */}
              <div className="aspect-[3/4] bg-gray-200 rounded-lg max-w-md mx-auto p-6"></div>
              {/* Book Details Skeleton */}
              <div className="space-y-6">
                {/* Title */}
                <div className="bg-gray-200 h-8 rounded w-3/4 mb-2"></div>
                {/* Author */}
                <div className="bg-gray-200 h-6 rounded w-1/2 mb-4"></div>
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-gray-200 h-4 w-4 rounded"></div>
                    ))}
                  </div>
                  <div className="bg-gray-200 h-4 w-16 rounded"></div>
                </div>
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-200 h-6 w-20 rounded"></div>
                  ))}
                </div>
                {/* Price and Stock */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-200 h-8 w-24 rounded"></div>
                    <div className="bg-gray-200 h-4 w-32 rounded"></div>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-200 h-4 w-8 rounded"></div>
                      <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-100 shadow-sm">
                        <div className="bg-gray-200 h-8 w-8 rounded"></div>
                        <div className="bg-gray-200 h-8 w-12 rounded"></div>
                        <div className="bg-gray-200 h-8 w-8 rounded"></div>
                      </div>
                    </div>
                    {/* Add to Cart Button */}
                    <div className="bg-gray-200 h-12 w-40 rounded-full"></div>
                  </div>
                </div>
                {/* Shipping Info Skeleton */}
                <div className="bg-blue-100 h-16 w-full rounded-lg mb-4"></div>
                {/* Trust Badges Skeleton */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 h-10 w-10 rounded-full"></div>
                    <div>
                      <div className="bg-gray-200 h-4 w-24 rounded mb-1"></div>
                      <div className="bg-gray-200 h-3 w-20 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 h-10 w-10 rounded-full"></div>
                    <div>
                      <div className="bg-gray-200 h-4 w-24 rounded mb-1"></div>
                      <div className="bg-gray-200 h-3 w-20 rounded"></div>
                    </div>
                  </div>
                </div>
                {/* Book Info Grid Skeleton */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  {[...Array(7)].map((_, i) => (
                    <div key={i}>
                      <div className="bg-gray-200 h-4 w-20 rounded mb-1"></div>
                      <div className="bg-gray-200 h-4 w-32 rounded"></div>
                    </div>
                  ))}
                </div>
                {/* Description Skeleton */}
                <div className="bg-gray-200 h-20 w-full rounded mb-4"></div>
                {/* Return Policy Skeleton */}
                <div className="bg-green-100 h-16 w-full rounded-lg mb-4"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <div className="container-custom py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bookerly font-bold text-base-black mb-4">Book Not Found</h2>
            <p className="text-secondary-black mb-6">The book you're looking for doesn't exist.</p>
            <Link href="/catalog">
              <Button className="bg-primary-aqua hover:bg-secondary-aqua">
                Browse Catalog
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${book.title} by ${book.author}`}
        description={book.description || `Buy ${book.title} by ${book.author}. ${book.condition} condition. Available now at A2Z BOOKSHOP with fast shipping.`}
        keywords={`${book.title}, ${book.author}, ${book.category?.name || 'books'}, buy books online, ${book.condition} books`}
        image={getImageSrc(book.imageUrl)}
        url={`https://a2zbookshop.com/book/${book.id}`}
        type="product"
        structuredData={generateBookStructuredData(book)}
      />
      <div className="container-custom py-8">
        <Breadcrumb
          items={[
            { label: "Catalog", href: "/catalog" },
            { label: book.title }
          ]}
          className="mt-6"
        />

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Book Image */}
          <div className="space-y-4">
            <div className=" border   aspect-[3/4] overflow-hidden rounded-lg bg-white max-w-md mx-auto p-6 sticky top-32">
              <img
                src={getImageSrc(book.imageUrl)}
                alt={book.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image') {
                    target.src = 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
                  }
                }}
              />
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bookerly font-bold text-base-black mb-2">
                {book.title}
              </h1>
              <p className="text-xl text-secondary-black mb-4">by {book.author}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-sm text-secondary-black">(4.8 out of 5)</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={getConditionColor(book.condition)}>
                  {book.condition}
                </Badge>
                {book.binding && (
                  <Badge className="bg-purple-100 text-purple-800">
                    {book.binding}
                  </Badge>
                )}
                {book.category && (
                  <Badge variant="outline">{book.category.name}</Badge>
                )}
                {book.featured && (
                  <Badge className="bg-abe-red text-white">Featured</Badge>
                )}
              </div>
            </div>

            {/* Price and Stock */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary-aqua">
                  ${parseFloat(book.price).toFixed(2)}
                </span>
                {book.stock > 0 && book.stock <= 5 && (
                  <span className="text-sm text-abe-red font-medium">
                    Only {book.stock} left in stock!
                  </span>
                )}
              </div>

              {book.stock === 0 ? (
                <div className="text-abe-red font-medium">Out of Stock</div>
              ) : (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3">
                    <label className="font-semibold text-base-black text-sm">Qty:</label>
                    <div className="flex items-center gap-1 border rounded-lg p-1 bg-white shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || isAddingToCart}
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!value) {
                            setQuantity(0);
                            return;
                          }

                          if (value > book.stock) {
                            setQuantity(book.stock);
                            toast({
                              title: "Stock limit reached",
                              description: `Only ${book.stock} items available in stock.`,
                              variant: "default",
                            });
                            return;
                          }
                          if (!isNaN(value) && value >= 1 && value <= book.stock) {
                            setQuantity(value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value > book.stock) {
                            setQuantity(book.stock);
                            toast({
                              title: "Quantity adjusted",
                              description: `Only ${book.stock} items available in stock.`,
                              variant: "default",
                            });
                          }
                        }}
                        className="w-12 text-center border-0 focus:outline-none text-base font-semibold bg-transparent"
                        disabled={isAddingToCart}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (quantity < book.stock) {
                            setQuantity(quantity + 1);
                          } else {
                            toast({
                              title: "Stock limit reached",
                              description: `Only ${book.stock} items available in stock.`,
                              variant: "default",
                            });
                          }
                        }}
                        disabled={quantity >= book.stock || isAddingToCart}
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || quantity < 1}
                    className="bg-primary-aqua hover:bg-secondary-aqua text-white px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-[180px] shadow-md hover:shadow-lg flex items-center justify-center transition-all"
                  >
                    <ShoppingCart className={`h-4 w-4 mr-2 ${isAddingToCart ? 'animate-cart-slide' : ''}`} />
                    <span className="whitespace-nowrap">
                      {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                    </span>
                  </Button>

                  <Button
                    onClick={handleBuyNow}
                    disabled={isAddingToCart}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-[180px] shadow-md hover:shadow-lg flex items-center justify-center transition-all" >
                    <BadgeDollarSign className={`h-4 w-4 animate-rotate-bounce`} />
                    Buy Now
                  </Button>
                </div>
              )}
            </div>

            {shippingRate && (
              <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">Expected Delivery</h3>
                    <p className="text-blue-800 text-sm">
                      {(() => {
                        const deliveryEstimate = calculateDeliveryDate(
                          shippingRate.minDeliveryDays,
                          shippingRate.maxDeliveryDays
                        );
                        return deliveryEstimate.deliveryText;
                      })()}
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      To {shippingRate.countryName} • Order today for fastest delivery
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-base-black text-sm">Quality Guaranteed</p>
                  <p className="text-xs text-secondary-black">Accurately described</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">

                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-base-black text-sm">Fast Shipping</p>
                  {shippingRate ? (
                    <p className="text-xs text-secondary-black">
                      {(() => {
                        const deliveryEstimate = calculateDeliveryDate(
                          shippingRate.minDeliveryDays,
                          shippingRate.maxDeliveryDays
                        );
                        return `Arrives ${deliveryEstimate.deliveryRange}`;
                      })()}
                    </p>
                  ) : (
                    <p className="flex items-center gap-[4px] text-xs text-secondary-black">
                      Arrives 5-7 days</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center ">
                  <Pen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-base-black text-sm mt-1">Personalised Gifts</p>
                  <p className="text-xs text-secondary-black">Engrave your name or message</p>
                </div>
              </div>
              <div className="flex gap-4 items-center ">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center ">
                  <Truck className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-base-black text-sm mt-1">Shipping Cost</p>
                  <p className="text-xs text-secondary-black">{shippingCost}</p>
                </div>
              </div>
            </div>
            <Separator />


            {/* Book Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {book.isbn && (
                <div>
                  <span className="font-semibold text-base-black">ISBN:</span>
                  <p className="text-secondary-black">{book.isbn}</p>
                </div>
              )}
              {book.publisher && (
                <div>
                  <span className="font-semibold text-base-black">Publisher:</span>
                  <p className="text-secondary-black">{book.publisher}</p>
                </div>
              )}
              {book.publishedYear && (
                <div>
                  <span className="font-semibold text-base-black">Published:</span>
                  <p className="text-secondary-black">{book.publishedYear}</p>
                </div>
              )}
              {book.pages && (
                <div>
                  <span className="font-semibold text-base-black">Pages:</span>
                  <p className="text-secondary-black">{book.pages}</p>
                </div>
              )}
              <div>
                <span className="font-semibold text-base-black">Condition:</span>
                <p className="text-secondary-black">{book.condition}</p>
              </div>
              {book.binding && (
                <div>
                  <span className="font-semibold text-base-black">Binding:</span>
                  <p className="text-secondary-black">{book.binding}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <span className="font-semibold text-base-black">Language:</span>
                  <p className="text-secondary-black">{book.language}</p>
                </div>
              )}
              {book.dimensions && (
                <div>
                  <span className="font-semibold text-base-black">Dimensions:</span>
                  <p className="text-secondary-black">{book.dimensions}</p>
                </div>
              )}
            </div>
            <Separator />

            {/* Description */}
            {book.description && (
              <div>
                <h3 className="font-bookerly font-semibold text-base-black mb-3">Description</h3>
                <p className="text-secondary-black leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}
            <Separator />


            {/* 30-Day Return Policy */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">30-Day Return Policy</h3>
                  <p className="text-sm text-green-700 leading-relaxed">
                    Not satisfied with your purchase? Return this book within <strong>30 days</strong> of delivery for a full refund.
                    Books must be in the same condition as when received. Return shipping is free for damaged or incorrectly described items.
                  </p>
                </div>
              </div>
            </div>


            {/* Delivery Information */}


            {/* Trust Badges */}

          </div>
        </div>
      </div>
    </ >
  );
}
