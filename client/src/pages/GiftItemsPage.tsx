import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, BookOpen, PartyPopper, ArrowLeft, Check, ShoppingCart, ShoppingBag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { apiRequest } from "@/lib/queryClient";
import { GiftItem, GiftCategory } from "@/shared/schema";
import { useEffect } from "react";

export default function GiftItemsPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedGift, setSelectedGift] = useState<null | number>(null);
  const queryClient = useQueryClient();

  const { data: giftCategories = [], isLoading: isCategoriesLoading } = useQuery<GiftCategory[]>({
    queryKey: ["/api/gift-categories"],
  });
  const { cartItems, isLoading: isCartLoading, cartCount } = useGlobalContext();

  const { data: giftItems = [], isLoading: isItemsLoading } = useQuery<GiftItem[]>({
    queryKey: ["/api/gift-items"],
  });

  useEffect(() => {
    // Reset selected gift if cart becomes empty
    if (cartCount === 0) {
      setSelectedGift(null);
    }
    const giftBookId = cartItems.find(item => item?.isGift)?.book?.id ?? null;    // setSelectedGift(cartItems.find(item => item.book)?.giftCategoryId?.toString() || null);
    setSelectedGift(giftBookId);

  }, [cartItems]);

  const giftTypes = Array.from(new Set(giftCategories.map(gift => gift.type)));
  const filteredGifts = selectedCategory
    ? giftCategories.filter(gift => gift.type === selectedCategory)
    : giftCategories;

  const isLoading = isCategoriesLoading || isItemsLoading;

  // Filter items by selected category
  const filteredItems = selectedCategory
    ? giftItems.filter(item => item.categoryId === selectedCategory)
    : giftItems;

  const selectedCategoryData = giftCategories.find(cat => cat.id === selectedCategory);

  // Add gift to cart mutation
  const addGiftMutation = useMutation({
    mutationFn: async (giftId: number) => {
      const response = await apiRequest("POST", "/api/cart/gift", {
        giftId: giftId,
        giftCategoryId: giftId
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Selected as your free gift!",
        description: "Your free gift has been added to cart",

      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add gift to cart",
        variant: "destructive",
      });
    },
  });

  const handleGiftSelect = (giftId: number) => {
    // Prevent multiple clicks while mutation is pending
    if (addGiftMutation.isPending) {
      return;
    }

    if (cartCount === 0) {
      toast({
        title: "Add Books First",
        description: "Please add books to your cart before selecting a gift",
        variant: "destructive",
      });
      return;
    }

    if (selectedGift === giftId) {
      setSelectedGift(null);
      return;
    }

    setSelectedGift(giftId);
    addGiftMutation.mutate(giftId);
  };

  // Check if user has books in cart (excluding gifts)
  const hasBookInCart = cartCount > 0;

  return (
    <Layout>
      <SEO
        title="Choose Your Free Gift! | A2Z BOOKSHOP"
        description="Select a wonderful free gift with your book purchase at A2Z BOOKSHOP. Browse our exciting collection of complimentary items and make your order extra special!"
        keywords="free gifts, book gifts, bookmarks, tote bags, reading accessories"
        url="https://a2zbookshop.com/gift-items"
        type="website"
      />


      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: "Free Gifts" }]} />

        {/* Status Banner - Show if user has items in cart */}
        {hasBookInCart ? (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="rounded-xl bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 mb-1">
                        Yay! You're eligible for a FREE gift!
                      </h3>
                      <p className="text-green-700">
                        You have <span className="font-bold">{cartCount} item(s)</span> in your cart. Pick any gift below - it's on us!
                      </p>
                    </div>
                  </div>
                  <Link href="/cart">
                    <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Cart
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="bg-yellow-400 text-white rounded-full p-3 w-14 h-14 mx-auto mb-4 shadow-lg flex items-center justify-center">
                    <ShoppingCart className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-yellow-900 mb-2">
                    Your cart is waiting for some books! 📚
                  </h3>
                  <p className="text-yellow-800 mb-4">
                    Add any book to your cart and unlock a FREE gift of your choice!
                  </p>
                  <Link href="/catalog">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg">
                      Start Shopping for Books
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full shadow-md hover:shadow-lg transition-all ${selectedCategory === null
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                : 'hover:border-purple-400'
                }`}
            >
              View All Gifts
            </Button>
            {giftTypes.map((type) => (
              <Button
                key={type}
                variant={selectedCategory === type ? "default" : "outline"}
                onClick={() => setSelectedCategory(type)}
                className={`rounded-full shadow-md hover:shadow-lg transition-all ${selectedCategory === type
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  : 'hover:border-blue-400'
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                <Badge variant="secondary" className="ml-2 bg-white/90 text-gray-700">
                  {giftCategories.filter(gift => gift.type === type).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Category Display */}
        {selectedCategory && selectedCategoryData && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-shrink-0">
                    {selectedCategoryData.imageUrl && (
                      <img
                        src={selectedCategoryData.imageUrl}
                        alt={selectedCategoryData.name}
                        className="w-24 h-32 object-cover rounded-lg shadow-lg border-2 border-white"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {selectedCategoryData.name}
                      </h2>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                        {selectedCategoryData.type.charAt(0).toUpperCase() + selectedCategoryData.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-3 text-lg">{selectedCategoryData.description}</p>
                    {selectedCategoryData.price && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-semibold text-pink-600">
                          Worth: ${selectedCategoryData.price}
                        </span>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md animate-pulse">
                          🎁 100% FREE with purchase!
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 border-2 border-purple-300 hover:bg-purple-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Loading Amazing Gifts... ✨
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="group relative bg-white shadow-md overflow-hidden border rounded-[5px] animate-pulse"
                >
                  {/* Skeleton Image */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 relative p-4">
                    <div className="w-full h-full bg-gray-300/50 rounded flex items-center justify-center">
                      <Gift className="h-16 w-16 text-gray-400" />
                    </div>

                    {/* Skeleton Badges */}
                    <div className="absolute top-2 left-2 w-16 h-6 bg-gray-300 rounded"></div>
                    <div className="absolute top-8 left-2 w-20 h-6 bg-gray-300 rounded"></div>
                  </div>

                  {/* Skeleton Details */}
                  <div className="p-4">
                    {/* Title skeleton */}
                    <div className="h-10 mb-1">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>

                    {/* Description skeleton */}
                    <div className="mb-2">
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>

                    {/* Price skeleton */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col gap-1">
                        <div className="h-6 bg-gray-300 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>

                  {/* Button skeleton */}
                  <div className="px-4 pb-4">
                    <div className="w-full h-8 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : giftCategories.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Gift className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-600 mb-3">
              No gifts available right now
            </h3>
            <p className="text-gray-500 mb-6 text-lg">
              Check back soon for amazing free gifts with your purchase!
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Pick Your Perfect Gift! 🎁✨
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredGifts.map((category) => {
                const isSelected = selectedGift === category.id;
                return (
                  <div
                    key={category.id}
                    className={`
                      group relative bg-white shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border rounded-[5px]
                      ${isSelected ? 'ring-2 ring-pink-500 shadow-xl' : ''}
                      ${!hasBookInCart || addGiftMutation.isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    onClick={() => !addGiftMutation.isPending && handleGiftSelect(category.id.toString())}
                  >
                    {/* Selection indicator - top right */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10 bg-pink-500 text-white rounded-full p-1 shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    )}

                    {/* Item Image */}
                    <div className="aspect-[3/4] overflow-hidden bg-white relative p-4">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded">
                          <Gift className="h-16 w-16 text-gray-400" />
                        </div>
                      )}

                      {/* FREE Badge */}
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white font-bold">
                        FREE
                      </Badge>

                      {/* Category Type Badge */}
                      {category.type && (
                        <Badge className={`absolute top-8 left-2 ${category.type === 'novel'
                          ? 'bg-blue-500 text-white'
                          : 'bg-purple-500 text-white'
                          }`}>
                          {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                        </Badge>
                      )}

                      {/* Disabled Overlay */}
                      {!hasBookInCart && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="bg-white rounded-lg p-3 text-center shadow-xl">
                            <ShoppingCart className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                            <p className="text-xs text-gray-800 font-medium">Add books first</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm h-10">
                        {category.name}
                      </h3>

                      {category.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          {category.price && parseFloat(category.price) > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 line-through">
                                ${parseFloat(category.price).toFixed(2)}
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                FREE
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-green-600">
                              FREE
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            with purchase
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Select Button */}
                    <div className="px-4 pb-4">
                      <Button
                        disabled={!hasBookInCart || addGiftMutation.isPending}
                        className={`
                          w-full text-sm py-2 rounded-full shadow-md hover:shadow-lg transition-shadow
                          ${isSelected
                            ? 'bg-pink-500 hover:bg-pink-600 text-white'
                            : 'bg-primary-aqua hover:bg-secondary-aqua text-white'
                          }
                        `}
                        size="sm"
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Selected
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            {addGiftMutation.isPending ? 'Selecting...' : 'Select Gift'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Compact How it Works */}
        <div className="mt-12">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">How to Get Your FREE Gift</h3>
              </div>

              {/* Compact Steps - Horizontal on desktop */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1"><BookOpen className="inline-block h-4 w-4 mr-1 text-purple-600" /> Shop Books</h4>
                    <p className="text-xs text-gray-600">Add any book to your cart</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm ">
                  <div className="flex-shrink-0 bg-gradient-to-br from-pink-500 to-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1"><Gift className="inline-block h-4 w-4 mr-1 text-pink-600" />  Pick Gift</h4>
                    <p className="text-xs text-gray-600">Choose any gift above - 100% FREE!</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex-shrink-0 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1"><PartyPopper className="inline-block h-4 w-4 mr-1 text-pink-600" /> Enjoy!</h4>
                    <p className="text-xs text-gray-600">Gift ships with your books</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons - More compact */}
              <div className="flex flex-wrap gap-3 justify-center items-center">
                {hasBookInCart ? (
                  <>
                    <Link href="/cart">
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full shadow-md">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Go to Checkout
                      </Button>
                    </Link>
                    <Link href="/catalog">
                      <Button variant="outline" className="border-purple-300 hover:bg-purple-50 text-purple-700 rounded-full">
                        Add More Books
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/catalog">
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-md">
                      <ShoppingBag className="inline-block h-4 w-4 mr-2" /> Start Shopping
                    </Button>
                  </Link>
                )}
                <p className="text-xs text-gray-600 w-full sm:w-auto text-center">
                  <span className="font-semibold text-purple-700"> Limited time!</span> While supplies last.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}