import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Gift, ArrowLeft } from "lucide-react";
import type { GiftItem, GiftCategory } from "@/shared/schema";

export default function GiftItemsPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

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

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-secondary-black">
            <Link href="/" className="hover:text-primary-aqua">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Gift Items</span>
          </div>
        </nav>

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
                        {selectedCategoryData.type === 'novel' ? '📚 Novel' : '📓 Notebook'}
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

        {/* Gift Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {selectedCategory ? 'No items in this category' : 'No gift items available'}
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedCategory 
                ? 'Try selecting a different category or view all items.' 
                : 'Gift items will appear here when added by the admin.'}
            </p>
            {selectedCategory && (
              <Button onClick={() => setSelectedCategory(null)}>
                View All Categories
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* Item Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Gift className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className={`
                        ${item.type === 'novel' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                      `}>
                        {item.type === 'novel' ? '📚 Novel' : '📓 Notebook'}
                      </Badge>
                    </div>

                    {/* FREE Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500 text-white font-bold">
                        FREE
                      </Badge>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {item.price && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 line-through">
                              ${item.price}
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              FREE
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500">
                          with any book purchase
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Gift className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    Select one free gift from the available options
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                    Complete your order and enjoy your free gift!
                  </li>
                </ol>
              </div>
              <Link href="/catalog">
                <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full">
                  Start Shopping for Books
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}