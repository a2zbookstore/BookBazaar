import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, ArrowLeft, Check, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { apiRequest } from "@/lib/queryClient";
import type { GiftItem, GiftCategory } from "@/shared/schema";

export default function GiftItemsPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const { cartCount } = useCart();
  const queryClient = useQueryClient();

  const { data: giftCategories = [] } = useQuery<GiftCategory[]>({
    queryKey: ["/api/gift-categories"],
  });

  const { data: giftItems = [] } = useQuery<GiftItem[]>({
    queryKey: ["/api/gift-items"],
  });

  // Filter items by selected category
  const filteredItems = selectedCategory
    ? giftItems.filter(item => item.categoryId === selectedCategory)
    : giftItems;

  const selectedCategoryData = giftCategories.find(cat => cat.id === selectedCategory);

  // Add gift to cart mutation
  const addGiftMutation = useMutation({
    mutationFn: async (giftId: string) => {
      const response = await apiRequest("POST", "/api/cart/gift", {
        giftId: parseInt(giftId)
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "✅ Selected as your free gift!",
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

  const handleGiftSelect = (giftId: string) => {
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
        title="Free Gift Items"
        description="Choose a free gift with your book purchase at A2Z BOOKSHOP. Browse our selection of complimentary bookmarks, tote bags, and more."
        keywords="free gifts, book gifts, bookmarks, tote bags, reading accessories"
        url="https://a2zbookshop.com/gift-items"
        type="website"
      />
      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: "Gift Items" }]} />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="h-10 w-10 text-green-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gift Collection
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our curated selection of novels and premium notebooks - perfect free gifts with your book purchase
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
            >
              All Categories
            </Button>
            {giftCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {giftItems.filter(item => item.categoryId === category.id).length}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Category Display */}
        {selectedCategory && selectedCategoryData && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {selectedCategoryData.imageUrl && (
                      <img
                        src={selectedCategoryData.imageUrl}
                        alt={selectedCategoryData.name}
                        className="w-20 h-28 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedCategoryData.name}</h2>
                      <Badge className="bg-green-100 text-green-700">
                        {selectedCategoryData.type.charAt(0).toUpperCase() + selectedCategoryData.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-3">{selectedCategoryData.description}</p>
                    {selectedCategoryData.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-green-600">
                          Regular Price: ${selectedCategoryData.price}
                        </span>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          FREE with purchase!
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Display Gift Categories as Selectable Items */}
        {giftCategories.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No gift categories available
            </h3>
            <p className="text-gray-500 mb-6">
              Gift categories will appear here when added by the admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {giftCategories.map((category) => {
              const isSelected = selectedGift === category.id.toString();
              return (
                <div key={category.id} className="flex-none w-full">
                  <Card
                    className={`
                      group hover:shadow-lg transition-all duration-300 overflow-hidden h-full
                      ${isSelected
                        ? 'ring-4 ring-green-500 shadow-2xl bg-gradient-to-br from-green-50 to-blue-50 border-green-300'
                        : 'hover:shadow-xl border-gray-200 hover:border-gray-300'
                      }
                      ${!hasBookInCart || addGiftMutation.isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    onClick={() => !addGiftMutation.isPending && handleGiftSelect(category.id.toString())}
                  >
                    <CardContent className="p-0">
                      {/* Item Image */}
                      <div className="relative aspect-[2/3] overflow-hidden bg-white p-6">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Gift className="h-16 w-16 text-gray-400" />
                          </div>
                        )}

                        {/* Category Badge */}
                        {/* <div className="absolute top-3 left-3">
                        <Badge className={`
                          ${category.type === 'novel' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                        `}>
                          {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                        </Badge>
                      </div> */}

                        {/* FREE Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-green-500 text-white font-bold">
                            FREE
                          </Badge>
                        </div>

                        {/* Selection Check */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
                              <Check className="h-8 w-8" />
                            </div>
                          </div>
                        )}

                        {/* Disabled Overlay */}
                        {!hasBookInCart && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <div className="bg-white rounded-lg p-3 text-center">
                              <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                              <p className="text-xs text-gray-600 font-medium">Add books first</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-2 h-12">
                          {category.name}
                        </h3>
                        <Badge className={`
                          ${category.type === 'novel' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                        `}>
                          {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                        </Badge>

                        {category.description && (
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2 h-8 mt-2">
                            {category.description}
                          </p>
                        )}


                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-col">
                            {category.price && parseFloat(category.price) > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 line-through">
                                  ${parseFloat(category.price).toFixed(2)}
                                </span>
                                <span className="text-base font-bold text-green-600">
                                  FREE
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              with any book purchase
                            </span>
                          </div>

                          <div className="text-right">
                            {isSelected ? (
                              <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!hasBookInCart || addGiftMutation.isPending}
                                className="text-xs h-7 px-2"
                              >
                                {addGiftMutation.isPending ? "Adding..." : "Select"}
                              </Button>
                            )}
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-8">
              <Gift className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                How to Get Your Free Gift
              </h3>
              <div className="max-w-2xl mx-auto text-gray-700 mb-6">
                <ol className="text-left space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                    Add any book to your shopping cart
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                    Select one free gift from the available options above
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                    Complete your order and enjoy your free gift!
                  </li>
                </ol>
              </div>

              {hasBookInCart ? (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">Great! You have {cartCount} item(s) in your cart.</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    You can now select a free gift from the options above.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-yellow-700">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="font-semibold">Your cart is empty</span>
                  </div>
                  <p className="text-yellow-600 text-sm mt-1">
                    Add books to your cart first, then return here to select your free gift.
                  </p>
                </div>
              )}

              <Link href="/catalog">
                <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full">
                  {hasBookInCart ? "Continue Shopping" : "Start Shopping for Books"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}